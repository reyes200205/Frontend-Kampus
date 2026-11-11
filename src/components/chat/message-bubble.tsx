import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { ChatMessage } from "@/types/chat";

export type MessageBubbleProps = {
  message: ChatMessage;
  mine: boolean;
  /** Muestra "Enviado" o "Visto" debajo; solo en el último mensaje propio. */
  showStatus?: boolean;
  onRetry?: () => void;
};

/** Hora corta del mensaje ("14:05"). */
export function messageTime(createdAt: string | null) {
  if (!createdAt) return "";
  return new Date(createdAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

/** Burbuja de un mensaje: a la derecha con el color de marca si es propio, a la izquierda si no. */
export function MessageBubble({ message, mine, showStatus, onRetry }: MessageBubbleProps) {
  const theme = useTheme();
  const failed = message.pending === "failed";
  const status = failed
    ? "No se envió · Toca para reintentar"
    : message.pending === "sending"
      ? "Enviando…"
      : message.read_at
        ? "Visto"
        : "Enviado";

  // Las imágenes llegan con T-15; mientras, se avisa en lugar de dejar la burbuja vacía.
  const body = message.type === "text" ? message.body : "Imagen (todavía no se puede ver en la app)";

  return (
    <View style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}>
      <Pressable
        disabled={!failed}
        onPress={onRetry}
        accessibilityRole={failed ? "button" : undefined}
        accessibilityLabel={`${mine ? "Tú" : "Mensaje"}: ${body ?? ""}. ${messageTime(message.created_at)}${
          mine && showStatus ? `. ${status}` : ""
        }`}
        style={[
          styles.bubble,
          mine
            ? { backgroundColor: theme.accent, borderBottomRightRadius: Radius.small / 2 }
            : {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
                borderWidth: StyleSheet.hairlineWidth,
                borderBottomLeftRadius: Radius.small / 2,
              },
          message.pending === "sending" && styles.sending,
          failed && { borderColor: theme.danger, borderWidth: 1 },
        ]}
      >
        <ThemedText
          type="small"
          selectable
          style={[mine && { color: theme.onAccent }, message.type !== "text" && styles.italic]}
        >
          {body}
        </ThemedText>
        <ThemedText type="caption" style={[styles.time, { color: mine ? theme.onAccent : theme.textSecondary }]}>
          {messageTime(message.created_at)}
        </ThemedText>
      </Pressable>
      {mine && (showStatus || failed) && (
        <ThemedText type="caption" themeColor={failed ? "danger" : "textSecondary"} style={styles.status}>
          {status}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    maxWidth: "80%",
    gap: Spacing.half,
  },
  rowMine: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  rowTheirs: {
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },
  bubble: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.large / 1.5,
    gap: Spacing.half,
  },
  sending: {
    opacity: 0.6,
  },
  italic: {
    fontStyle: "italic",
  },
  time: {
    alignSelf: "flex-end",
    opacity: 0.8,
  },
  status: {
    paddingHorizontal: Spacing.one,
  },
});
