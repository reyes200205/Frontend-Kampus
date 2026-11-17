/**
 * Estado compartido de la videollamada (T-20, RF-10): la llamada entrante que se muestra encima de
 * cualquier pantalla, la llamada en curso y el aviso de que la otra persona colgó.
 * Los avisos llegan por el canal propio `user.{id}` de Reverb (`call.started` y `call.ended`).
 */

import { useEffect, useSyncExternalStore } from "react";

import { listenToCalls } from "@/services/realtime";
import { endCall } from "@/services/video-call";
import type { EndedCall, IncomingCall } from "@/types/call";

/** Cuánto suena una llamada antes de darla por no contestada (de los dos lados). */
export const RingTimeoutMs = 45_000;

type CallState = {
  /** Llamada entrante sin contestar; `null` si no hay. */
  incoming: IncomingCall | null;
  /** Match de la llamada abierta en pantalla; `null` si no hay. */
  activeMatchId: number | null;
};

let state: CallState = { incoming: null, activeMatchId: null };
let ringTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();
const endedListeners = new Set<(call: EndedCall) => void>();

function setState(next: Partial<CallState>) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function clearRingTimer() {
  if (ringTimer) clearTimeout(ringTimer);
  ringTimer = null;
}

function receiveIncoming(call: IncomingCall) {
  // Ya hay una llamada abierta: la nueva se rechaza para que quien llama no se quede esperando.
  if (state.activeMatchId !== null) {
    if (state.activeMatchId !== call.match_id) void endCall(call.match_id).catch(() => undefined);
    return;
  }
  clearRingTimer();
  setState({ incoming: call });
  // Quien llama cuelga solo a los 45 s; por si ese aviso no llega, la llamada entrante también se quita.
  ringTimer = setTimeout(() => {
    if (state.incoming === call) setState({ incoming: null });
  }, RingTimeoutMs);
}

function receiveEnded(call: EndedCall) {
  if (state.incoming?.match_id === call.match_id) {
    clearRingTimer();
    setState({ incoming: null });
  }
  endedListeners.forEach((listener) => listener(call));
}

/** Quita la llamada entrante de la pantalla (al contestar o rechazar). */
export function dismissIncomingCall() {
  clearRingTimer();
  setState({ incoming: null });
}

/** La pantalla de llamada avisa que está abierta (o que se cerró, con `null`). */
export function setActiveCall(matchId: number | null) {
  setState({ activeMatchId: matchId });
}

/** Avisa cuando la otra persona cuelga o rechaza. Devuelve la función para dejar de escuchar. */
export function onCallEnded(listener: (call: EndedCall) => void) {
  endedListeners.add(listener);
  return () => {
    endedListeners.delete(listener);
  };
}

export function useVideoCall() {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

/**
 * Escucha las llamadas mientras la sesión está abierta. Se monta una sola vez en el layout raíz,
 * así la llamada entrante aparece en cualquier pantalla.
 */
export function useCallRealtime(myId: number | null) {
  useEffect(() => {
    if (!myId) return;
    const stop = listenToCalls(myId, { onStarted: receiveIncoming, onEnded: receiveEnded });
    return () => {
      stop();
      dismissIncomingCall();
    };
  }, [myId]);
}
