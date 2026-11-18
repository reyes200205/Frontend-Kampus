import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ImageViewer } from "@/components/chat/image-viewer";
import { ThemedText } from "@/components/themed-text";
import { bubbleColors } from "@/constants/chat-style";
import { Radius, Spacing } from "@/constants/theme";
import { useChatStyle } from "@/hooks/use-chat-style";
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

/** Ancho de las imágenes dentro de la burbuja; el alto sigue la proporción de la foto, con tope. */
const ImageWidth = 232;
const MinImageHeight = 120;
const MaxImageHeight = 300;

function imageHeight(aspect: number) {
  return Math.min(MaxImageHeight, Math.max(MinImageHeight, ImageWidth / aspect));
}

/** Burbuja de un mensaje: a la derecha con el color de marca si es propio, a la izquierda si no. */
export function MessageBubble({ message, mine, showStatus, onRetry }: MessageBubbleProps) {
  const theme = useTheme();
  // Color elegido en Perfil → Apariencia → Estilo predeterminado del chat.
  const own = bubbleColors(useChatStyle().bubble, theme);
  const [viewing, setViewing] = useState(false);
  const [imageError, setImageError] = useState(false);
  const failed = message.pending === "failed";
  const local = message.local_image;
  const imageUri = local?.uri ?? message.image_url ?? null;
  // La URL firmada cambia cada vez que se piden los mensajes: con el id se reutiliza la descarga.
  const cacheKey = local || message.id < 0 ? undefined : `chat-image-${message.id}`;
  const [aspect, setAspect] = useState(() =>
    local && local.width > 0 && local.height > 0 ? local.width / local.height : 4 / 3,
  );
  const isImage = message.type === "image";
  const status = failed
    ? "No se envió · Toca para reintentar"
    : message.pending === "sending"
      ? "Enviando…"
      : message.read_at
        ? "Visto"
        : "Enviado";

  const body = message.body;
  const label = isImage ? `Imagen${body ? `: ${body}` : ""}` : (body ?? "");

  return (
    <View style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}>
      <Pressable
        disabled={!failed}
        onPress={onRetry}
        accessibilityRole={failed ? "button" : undefined}
        accessibilityLabel={`${mine ? "Tú" : "Mensaje"}: ${label}. ${messageTime(message.created_at)}${
          mine && showStatus ? `. ${status}` : ""
        }`}
        style={[
          styles.bubble,
          mine
            ? { backgroundColor: own.background, borderBottomRightRadius: Radius.small / 2 }
            : {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
                borderWidth: StyleSheet.hairlineWidth,
                borderBottomLeftRadius: Radius.small / 2,
              },
          isImage && styles.imageBubble,
          message.pending === "sending" && styles.sending,
          failed && { borderColor: theme.danger, borderWidth: 1 },
        ]}
      >
        {isImage && (
          <Pressable
            onPress={() => setViewing(true)}
            disabled={!imageUri || imageError || failed}
            accessibilityRole="imagebutton"
            accessibilityLabel="Ver imagen completa"
            style={[
              styles.image,
              { height: imageHeight(aspect), backgroundColor: theme.backgroundSelected },
            ]}
          >
            {imageUri && !imageError ? (
              <Image
                source={{ uri: imageUri, cacheKey }}
                style={styles.fill}
                contentFit="cover"
                transition={150}
                onLoad={(e) => {
                  const { width, height } = e.source;
                  if (!local && width > 0 && height > 0) setAspect(width / height);
                }}
                onError={() => setImageError(true)}
              />
            ) : (
              <View style={styles.imageFallback}>
                <SymbolView
                  name={{ ios: "photo", android: "image", web: "image" }}
                  size={28}
                  tintColor={theme.textSecondary}
                />
                <ThemedText type="caption" themeColor="textSecondary" style={styles.centerText}>
                  {imageError ? "No se pudo cargar la imagen" : "Imagen"}
                </ThemedText>
              </View>
            )}
          </Pressable>
        )}
        {body ? (
          <ThemedText
            type="small"
            selectable
            style={[
              mine && { color: own.text },
              isImage && styles.caption,
              // Mensajes del sistema (p. ej. llamadas) en cursiva; el pie de una imagen no.
              message.type !== "text" && !isImage && styles.italic,
            ]}
          >
            {body}
          </ThemedText>
        ) : null}
        <ThemedText
          type="caption"
          style={[styles.time, isImage && styles.caption, { color: mine ? own.text : theme.textSecondary }]}
        >
          {messageTime(message.created_at)}
        </ThemedText>
      </Pressable>
      {mine && (showStatus || failed) && (
        <ThemedText type="caption" themeColor={failed ? "danger" : "textSecondary"} style={styles.status}>
          {status}
        </ThemedText>
      )}
      {isImage && (
        <ImageViewer
          uri={viewing ? imageUri : null}
          cacheKey={cacheKey}
          caption={body}
          onClose={() => setViewing(false)}
        />
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
  imageBubble: {
    // La imagen llega casi al borde de la burbuja; el texto y la hora conservan su margen.
    paddingHorizontal: Spacing.one,
    paddingTop: Spacing.one,
  },
  image: {
    width: ImageWidth,
    maxWidth: "100%",
    borderRadius: Radius.medium,
    overflow: "hidden",
  },
  fill: {
    width: "100%",
    height: "100%",
  },
  imageFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.one,
    padding: Spacing.two,
  },
  centerText: {
    textAlign: "center",
  },
  caption: {
    paddingHorizontal: Spacing.two,
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
