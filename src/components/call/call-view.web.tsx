/**
 * Videollamada 1 a 1 en el navegador con el SDK de LiveKit (`livekit-client`) (T-20, RF-10).
 * Funciona en Chrome (escritorio y Android) y Safari de iOS.
 *
 * 1. Primero se piden la cámara y el micrófono; si el navegador los bloquea se muestra la guía de permisos y
 *    a la otra persona no le llega nada.
 * 2. Con los permisos, la API entrega el token (`POST /call` al llamar, `POST /call/token` al contestar).
 * 3. Se entra a la sala del match y se publican la cámara y el micrófono.
 * 4. Al colgar se llama a `DELETE /call`, que cierra la sala para los dos y le avisa a la otra persona.
 *
 * `livekit-client` se carga hasta que se necesita: así no corre durante el render estático de la web.
 */

import type { LocalTrack, LocalVideoTrack, RemoteTrack, Room } from "livekit-client";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PermissionGuide, type BrowserKind, type PermissionProblem } from "@/components/call/permission-guide";
import { Avatar } from "@/components/matches/avatar";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Radius, Spacing } from "@/constants/theme";
import { onCallEnded, RingTimeoutMs, setActiveCall } from "@/hooks/use-video-call";
import { useTheme } from "@/hooks/use-theme";
import { ApiError } from "@/services/api";
import { endCall, getCallToken, startCall } from "@/services/video-call";

import type { CallViewProps } from "./call-view";

type Phase =
  | { name: "checking" }
  /** Antes de pedir permisos: explica para qué se usan la cámara y el micrófono. */
  | { name: "intro" }
  | { name: "requesting" }
  | { name: "blocked"; problem: PermissionProblem }
  | { name: "connecting" }
  /** Dentro de la sala, esperando a la otra persona. */
  | { name: "ringing" }
  | { name: "active"; since: number }
  | { name: "ended"; title: string; message: string };

const CallRed = "#EF4444";

function browserKind(): BrowserKind {
  const ua = navigator.userAgent;
  // El iPad con iPadOS se presenta como Mac, pero con pantalla táctil.
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
}

/** Estado de los permisos sin pedirlos. `unknown` si el navegador no deja consultarlo. */
async function permissionState(): Promise<"granted" | "denied" | "unknown"> {
  try {
    const [camera, mic] = await Promise.all(
      (["camera", "microphone"] as const).map((name) =>
        navigator.permissions.query({ name: name as PermissionName }),
      ),
    );
    if (camera.state === "granted" && mic.state === "granted") return "granted";
    if (camera.state === "denied" || mic.state === "denied") return "denied";
  } catch {
    // Firefox no deja consultar la cámara y Safari antiguo no tiene `navigator.permissions`.
  }
  return "unknown";
}

function formatDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function CallView({ matchId, mode, peer, onClose }: CallViewProps) {
  const theme = useTheme();
  const firstName = peer?.name.split(" ")[0] ?? "Tu match";
  const [phase, setPhase] = useState<Phase>({ name: "checking" });
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [remoteVideo, setRemoteVideo] = useState(false);
  const [needsAudioTap, setNeedsAudioTap] = useState(false);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [now, setNow] = useState(() => Date.now());

  const roomRef = useRef<Room | null>(null);
  const tracksRef = useRef<LocalTrack[]>([]);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const audioBoxRef = useRef<HTMLDivElement | null>(null);
  /** Cada intento tiene su número; si cambia (se salió o colgó) el intento en curso se detiene. */
  const attemptRef = useRef(0);
  /** Ya se avisó a la API que la llamada terminó (o la otra persona la terminó). */
  const closedRef = useRef(false);
  const [browser, setBrowser] = useState<BrowserKind>("desktop");
  const phaseRef = useRef(phase);
  /** El nombre puede llegar después (si se abrió directo); `begin` lo lee de aquí para no reiniciarse. */
  const firstNameRef = useRef(firstName);

  useEffect(() => {
    phaseRef.current = phase;
    firstNameRef.current = firstName;
  }, [firstName, phase]);

  /** Suelta la sala, la cámara y el micrófono. */
  const release = useCallback(() => {
    attemptRef.current += 1;
    const room = roomRef.current;
    roomRef.current = null;
    room?.removeAllListeners();
    void room?.disconnect();
    tracksRef.current.forEach((track) => track.stop());
    tracksRef.current = [];
    audioBoxRef.current?.replaceChildren();
  }, []);

  /** Termina la llamada en pantalla. Con `notify`, también la cierra en la API y le avisa a la otra persona. */
  const finish = useCallback(
    (title: string, message: string, notify: boolean) => {
      release();
      if (notify && !closedRef.current) void endCall(matchId).catch(() => undefined);
      closedRef.current = true;
      setPhase({ name: "ended", title, message });
    },
    [matchId, release],
  );

  const begin = useCallback(async () => {
    const attempt = ++attemptRef.current;
    const stale = () => attemptRef.current !== attempt;
    closedRef.current = false;

    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setPhase({ name: "blocked", problem: "insecure" });
      return;
    }

    setPhase({ name: "requesting" });
    const lk = await import("livekit-client");
    if (stale()) return;

    // 1. Cámara y micrófono. Si fallan, la otra persona no se entera de nada.
    let tracks: LocalTrack[];
    try {
      tracks = await lk.createLocalTracks({
        audio: { echoCancellation: true, noiseSuppression: true },
        video: { facingMode: "user", resolution: lk.VideoPresets.h540.resolution },
      });
    } catch (error) {
      if (stale()) return;
      const failure = lk.MediaDeviceFailure.getFailure(error);
      const problem: PermissionProblem =
        failure === lk.MediaDeviceFailure.NotFound
          ? "no-device"
          : failure === lk.MediaDeviceFailure.DeviceInUse
            ? "in-use"
            : "denied";
      setPhase({ name: "blocked", problem });
      return;
    }
    if (stale()) {
      tracks.forEach((track) => track.stop());
      return;
    }
    tracksRef.current = tracks;
    setMicOn(true);
    setCamOn(true);
    setFacing("user");

    // 2. Token de la API. Al llamar, la API también le avisa a la otra persona.
    setPhase({ name: "connecting" });
    let access;
    try {
      access = mode === "answer" ? await getCallToken(matchId) : await startCall(matchId);
    } catch (error) {
      if (stale()) return;
      release();
      closedRef.current = true;
      const unavailable = error instanceof ApiError && error.code === "video_unavailable";
      const gone = error instanceof ApiError && (error.status === 404 || error.status === 403);
      setPhase({
        name: "ended",
        title: unavailable
          ? "La videollamada no está disponible"
          : gone
            ? "Ya no puedes llamar a esta persona"
            : "No pudimos iniciar la llamada",
        message: gone
          ? "Puede que el match ya no exista o que alguno de los dos haya bloqueado al otro."
          : error instanceof ApiError
            ? error.message
            : "Revisa tu conexión e intenta de nuevo.",
      });
      return;
    }
    if (stale()) {
      if (mode === "start") void endCall(matchId).catch(() => undefined);
      return;
    }

    // 3. Entrar a la sala y publicar cámara y micrófono.
    const room = new lk.Room({ adaptiveStream: true, dynacast: true });
    roomRef.current = room;

    room
      .on(lk.RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
        if (track.kind === lk.Track.Kind.Video && remoteVideoRef.current) {
          track.attach(remoteVideoRef.current);
          setRemoteVideo(!track.isMuted);
        } else if (track.kind === lk.Track.Kind.Audio) {
          const element = track.attach();
          audioBoxRef.current?.appendChild(element);
        }
      })
      .on(lk.RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
        track.detach().forEach((element) => {
          if (element instanceof HTMLAudioElement) element.remove();
        });
        if (track.kind === lk.Track.Kind.Video) setRemoteVideo(false);
      })
      .on(lk.RoomEvent.TrackMuted, (publication, participant) => {
        if (publication.kind === lk.Track.Kind.Video && !participant.isLocal) setRemoteVideo(false);
      })
      .on(lk.RoomEvent.TrackUnmuted, (publication, participant) => {
        if (publication.kind === lk.Track.Kind.Video && !participant.isLocal) setRemoteVideo(true);
      })
      .on(lk.RoomEvent.ParticipantConnected, () => {
        setPhase((current) => (current.name === "active" ? current : { name: "active", since: Date.now() }));
      })
      .on(lk.RoomEvent.ParticipantDisconnected, () => {
        finish("Llamada terminada", `${firstNameRef.current} salió de la llamada.`, true);
      })
      .on(lk.RoomEvent.Disconnected, () => {
        if (roomRef.current !== room) return;
        finish("Llamada terminada", "Se perdió la conexión con la llamada.", true);
      })
      .on(lk.RoomEvent.AudioPlaybackStatusChanged, () => setNeedsAudioTap(!room.canPlaybackAudio));

    try {
      await room.connect(access.url, access.token);
      if (stale()) return;
      await Promise.all(tracks.map((track) => room.localParticipant.publishTrack(track)));
    } catch {
      if (stale()) return;
      finish("No pudimos conectar la llamada", "Revisa tu conexión e intenta de nuevo.", true);
      return;
    }
    if (stale()) return;

    setNeedsAudioTap(!room.canPlaybackAudio);
    setPhase(room.remoteParticipants.size > 0 ? { name: "active", since: Date.now() } : { name: "ringing" });
  }, [finish, matchId, mode, release]);

  // Al abrir: si los permisos ya estaban dados, la llamada empieza sola; si no, primero se explica.
  useEffect(() => {
    let cancelled = false;
    void permissionState().then((state) => {
      if (cancelled) return;
      setBrowser(browserKind());
      if (state === "granted") void begin();
      else if (state === "denied") setPhase({ name: "blocked", problem: "denied" });
      else setPhase({ name: "intro" });
    });
    return () => {
      cancelled = true;
    };
  }, [begin]);

  // Mientras la pantalla está abierta se rechazan otras llamadas; al salir se cuelga.
  useEffect(() => {
    setActiveCall(matchId);
    return () => {
      setActiveCall(null);
      const open = roomRef.current !== null || tracksRef.current.length > 0;
      release();
      if (open && !closedRef.current) void endCall(matchId).catch(() => undefined);
      closedRef.current = true;
    };
  }, [matchId, release]);

  // La otra persona colgó o rechazó.
  useEffect(
    () =>
      onCallEnded((call) => {
        if (call.match_id !== matchId || closedRef.current) return;
        closedRef.current = true;
        const wasActive = phaseRef.current.name === "active";
        release();
        setPhase(
          wasActive
            ? { name: "ended", title: "Llamada terminada", message: `${firstName} colgó.` }
            : { name: "ended", title: "Llamada rechazada", message: `${firstName} no puede contestar ahora.` },
        );
      }),
    [firstName, matchId, release],
  );

  // Nadie contestó.
  useEffect(() => {
    if (phase.name !== "ringing") return;
    const timer = setTimeout(
      () => finish("Sin respuesta", `${firstName} no contestó. Inténtalo más tarde o escríbele.`, true),
      RingTimeoutMs,
    );
    return () => clearTimeout(timer);
  }, [finish, firstName, phase.name]);

  // Duración de la llamada.
  useEffect(() => {
    if (phase.name !== "active") return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [phase.name]);

  const inCall = phase.name === "connecting" || phase.name === "ringing" || phase.name === "active";
  const isMobile = browser !== "desktop";

  // Tu cámara se muestra cuando ya está en pantalla la vista de la llamada.
  useEffect(() => {
    if (!inCall) return;
    const video = tracksRef.current.find((track) => track.kind === "video");
    if (video && localVideoRef.current) video.attach(localVideoRef.current);
  }, [inCall]);

  function hangUp() {
    finish("Llamada terminada", "", true);
    onClose();
  }

  /** Antes de entrar a la sala: al contestar, salir es rechazar; al llamar, todavía no se avisó a nadie. */
  function cancel() {
    release();
    if (mode === "answer" && !closedRef.current) void endCall(matchId).catch(() => undefined);
    closedRef.current = true;
    onClose();
  }

  async function toggleMic() {
    const track = tracksRef.current.find((item) => item.kind === "audio");
    if (!track) return;
    if (micOn) await track.mute();
    else await track.unmute();
    setMicOn(!micOn);
  }

  async function toggleCamera() {
    const track = tracksRef.current.find((item) => item.kind === "video");
    if (!track) return;
    if (camOn) await track.mute();
    else await track.unmute();
    setCamOn(!camOn);
  }

  async function flipCamera() {
    const track = tracksRef.current.find((item) => item.kind === "video") as LocalVideoTrack | undefined;
    if (!track) return;
    const next = facing === "user" ? "environment" : "user";
    try {
      await track.restartTrack({ facingMode: next });
      setFacing(next);
    } catch {
      // El dispositivo no tiene otra cámara: se queda con la que estaba.
    }
  }

  if (phase.name === "blocked") {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]}>
        <PermissionGuide problem={phase.problem} browser={browser} onRetry={() => void begin()} onCancel={cancel} />
      </SafeAreaView>
    );
  }

  if (phase.name === "ended") {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]}>
        <EmptyState
          icon={{ ios: "phone.down.fill", android: "call_end", web: "call_end" }}
          title={phase.title}
          message={phase.message || "La videollamada terminó."}
          action={{ title: "Volver al chat", onPress: onClose }}
        />
      </SafeAreaView>
    );
  }

  if (phase.name === "checking" || phase.name === "intro" || phase.name === "requesting") {
    return (
      <SafeAreaView style={[styles.flex, styles.center, { backgroundColor: theme.background }]}>
        <View style={styles.intro}>
          {peer && <Avatar uri={peer.photo_url} name={peer.name} size={96} ring />}
          <ThemedText type="heading" style={styles.centerText}>
            {mode === "answer" ? `Contestar a ${firstName}` : `Videollamada con ${firstName}`}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
            Para la videollamada, Kampus necesita tu cámara y tu micrófono. Tu navegador te va a pedir permiso:
            elige «Permitir». Solo se usan durante la llamada.
          </ThemedText>
          {phase.name === "checking" ? (
            <ActivityIndicator color={theme.accent} />
          ) : (
            <Button
              title={mode === "answer" ? "Permitir y contestar" : "Permitir y llamar"}
              icon={{ ios: "video.fill", android: "videocam", web: "videocam" }}
              loading={phase.name === "requesting"}
              onPress={() => void begin()}
            />
          )}
          <Button title={mode === "answer" ? "Rechazar" : "Cancelar"} variant="ghost" onPress={cancel} />
        </View>
      </SafeAreaView>
    );
  }

  const status =
    phase.name === "connecting"
      ? "Conectando…"
      : phase.name === "ringing"
        ? "Llamando…"
        : formatDuration(now - phase.since);

  return (
    <View style={[styles.flex, styles.stage]}>
      {/* Video de la otra persona: llena la pantalla. Su audio va aparte en `audioBox`. */}
      <video ref={remoteVideoRef} autoPlay playsInline muted style={{ ...videoFill, opacity: remoteVideo ? 1 : 0 }} />
      <div ref={audioBoxRef} style={{ display: "none" }} />

      {!remoteVideo && (
        <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
          {peer && <Avatar uri={peer.photo_url} name={peer.name} size={120} ring />}
        </View>
      )}

      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={styles.top} pointerEvents="none">
          <ThemedText type="subtitle" style={styles.light} numberOfLines={1}>
            {peer?.name ?? "Videollamada"}
          </ThemedText>
          <ThemedText type="small" style={styles.lightSoft} accessibilityLiveRegion="polite">
            {status}
          </ThemedText>
        </View>

        {/* Tu cámara, en una esquina. La frontal se ve como espejo. */}
        <View style={[styles.selfView, { borderColor: theme.border }]}>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{ ...videoFill, transform: facing === "user" ? "scaleX(-1)" : undefined, opacity: camOn ? 1 : 0 }}
          />
          {!camOn && (
            <View style={[StyleSheet.absoluteFill, styles.center]}>
              <SymbolView name={{ ios: "video.slash.fill", android: "videocam_off", web: "videocam_off" }} size={24} tintColor="#FFFFFF" />
            </View>
          )}
        </View>

        <View style={styles.bottom}>
          {needsAudioTap && (
            <Button
              title="Toca para escuchar"
              icon={{ ios: "speaker.wave.2.fill", android: "volume_up", web: "volume_up" }}
              onPress={() => void roomRef.current?.startAudio()}
            />
          )}
          <View style={styles.controls}>
            <ControlButton
              label={micOn ? "Silenciar micrófono" : "Activar micrófono"}
              icon={micOn ? { ios: "mic.fill", android: "mic", web: "mic" } : { ios: "mic.slash.fill", android: "mic_off", web: "mic_off" }}
              active={!micOn}
              disabled={!inCall}
              onPress={() => void toggleMic()}
            />
            <ControlButton
              label={camOn ? "Apagar cámara" : "Encender cámara"}
              icon={
                camOn
                  ? { ios: "video.fill", android: "videocam", web: "videocam" }
                  : { ios: "video.slash.fill", android: "videocam_off", web: "videocam_off" }
              }
              active={!camOn}
              disabled={!inCall}
              onPress={() => void toggleCamera()}
            />
            {isMobile && (
              <ControlButton
                label="Cambiar de cámara"
                icon={{ ios: "arrow.triangle.2.circlepath.camera.fill", android: "cameraswitch", web: "cameraswitch" }}
                disabled={!inCall || !camOn}
                onPress={() => void flipCamera()}
              />
            )}
            <ControlButton
              label="Colgar"
              icon={{ ios: "phone.down.fill", android: "call_end", web: "call_end" }}
              color={CallRed}
              onPress={hangUp}
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

type ControlButtonProps = {
  label: string;
  icon: SymbolViewProps["name"];
  onPress: () => void;
  /** Resaltado (micrófono silenciado, cámara apagada). */
  active?: boolean;
  disabled?: boolean;
  color?: string;
};

function ControlButton({ label, icon, onPress, active, disabled, color }: ControlButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled, selected: !!active }}
      style={({ pressed }) => [
        styles.control,
        { backgroundColor: color ?? (active ? "#FFFFFF" : "rgba(255, 255, 255, 0.18)") },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <SymbolView name={icon} size={26} tintColor={active && !color ? "#121215" : "#FFFFFF"} />
    </Pressable>
  );
}

const videoFill = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  objectFit: "cover",
  backgroundColor: "#000000",
} as const;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  centerText: {
    textAlign: "center",
  },
  intro: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  stage: {
    backgroundColor: "#000000",
    overflow: "hidden",
  },
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: "space-between",
  },
  top: {
    alignItems: "center",
    gap: Spacing.half,
    paddingTop: Spacing.four,
    paddingHorizontal: Spacing.three,
  },
  light: {
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.6)",
    textShadowRadius: 6,
  },
  lightSoft: {
    color: "rgba(255, 255, 255, 0.85)",
    textShadowColor: "rgba(0, 0, 0, 0.6)",
    textShadowRadius: 6,
  },
  selfView: {
    position: "absolute",
    top: 96,
    right: Spacing.three,
    width: 108,
    height: 152,
    borderRadius: Radius.medium,
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: "#1A1A1E",
  },
  bottom: {
    alignItems: "center",
    gap: Spacing.three,
    paddingBottom: Spacing.five,
    paddingHorizontal: Spacing.three,
  },
  controls: {
    flexDirection: "row",
    gap: Spacing.three,
  },
  control: {
    width: 60,
    height: 60,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  disabled: {
    opacity: 0.4,
  },
});
