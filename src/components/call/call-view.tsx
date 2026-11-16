/**
 * Videollamada en iOS y Android nativos (T-20). El SDK de LiveKit para React Native necesita WebRTC nativo,
 * que Expo Go no incluye; por ahora la videollamada se hace desde el navegador (`call-view.web.tsx`).
 * Al contestar desde aquí, la llamada se rechaza para que quien llama no se quede esperando.
 */

import { useEffect } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/ui/empty-state";
import { useTheme } from "@/hooks/use-theme";
import { endCall } from "@/services/video-call";
import type { CallType } from "@/types/call";
import type { Match } from "@/types/discovery";

export type CallViewProps = {
  matchId: number;
  /** `start` para llamar; `answer` para contestar una llamada entrante. */
  mode: "start" | "answer";
  /** `video` para videollamada; `audio` para llamada de voz. */
  type: CallType;
  /** La otra persona del match, si ya se conoce. */
  peer: Match["user"] | null;
  /** Cierra la pantalla de llamada. */
  onClose: () => void;
};

export function CallView({ matchId, mode, onClose }: CallViewProps) {
  const theme = useTheme();

  useEffect(() => {
    if (mode === "answer") void endCall(matchId).catch(() => undefined);
  }, [matchId, mode]);

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]}>
      <EmptyState
        icon={{ ios: "video.slash.fill", android: "videocam_off", web: "videocam_off" }}
        title="Llamadas desde el navegador"
        message="Por ahora las llamadas y videollamadas funcionan en la versión web de Kampus: ábrela en Chrome o Safari para llamar y contestar."
        action={{ title: "Volver al chat", onPress: onClose }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
