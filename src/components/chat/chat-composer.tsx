import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { FontFamily, FontSize, MinTouchSize, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { LocalChatImage } from "@/types/chat";

/** Límite de la API (`StoreMessageRequest`). */
const MaxLength = 5000;
/** Peso máximo de una imagen del chat que acepta la API (5 MB). */
const MaxImageBytes = 5 * 1024 * 1024;
/** La API solo acepta JPG y PNG en el chat (`mimes:jpg,jpeg,png`). */
const AcceptedTypes = ["image/jpeg", "image/jpg", "image/png"];
/** Tamaño de la miniatura de la imagen elegida. */
const ThumbSize = 72;

export type ChatComposerProps = {
  onSend: (body: string, image?: LocalChatImage) => void;
  disabled?: boolean;
};

/** Campo para escribir, botón para adjuntar una imagen y botón de enviar, abajo de la conversación. */
export function ChatComposer({ onSend, disabled }: ChatComposerProps) {
  const theme = useTheme();
  const [text, setText] = useState("");
  const [image, setImage] = useState<LocalChatImage>();
  const [error, setError] = useState<string>();
  const body = text.trim();
  const canSend = (body !== "" || !!image) && !disabled;

  function send() {
    if (!canSend) return;
    onSend(body, image);
    setText("");
    setImage(undefined);
    setError(undefined);
  }

  async function pickImage() {
    setError(undefined);
    // En web el selector se abre solo como respuesta directa a un toque, por eso va aquí.
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      // En iOS las fotos suelen ser HEIC, que la API no acepta: así se entregan como JPEG.
      preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const type = asset.mimeType ?? asset.file?.type ?? "image/jpeg";
    if (!AcceptedTypes.includes(type)) {
      setError("Solo puedes enviar imágenes JPG o PNG.");
      return;
    }
    const size = asset.fileSize ?? asset.file?.size;
    if (size && size > MaxImageBytes) {
      setError("La imagen pesa más de 5 MB. Elige una más ligera.");
      return;
    }

    setImage({
      file: asset.file ?? {
        uri: asset.uri,
        name: asset.fileName ?? `imagen.${type === "image/png" ? "png" : "jpg"}`,
        type,
      },
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
    });
  }

  return (
    <View style={[styles.container, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
      {image && (
        <View style={styles.attachment}>
          <View style={[styles.thumb, { backgroundColor: theme.backgroundSelected }]}>
            <Image
              source={{ uri: image.uri }}
              style={styles.thumbImage}
              contentFit="cover"
              accessibilityLabel="Imagen para enviar"
            />
          </View>
          <Pressable
            onPress={() => setImage(undefined)}
            accessibilityRole="button"
            accessibilityLabel="Quitar imagen"
            hitSlop={(MinTouchSize - 24) / 2}
            style={[styles.remove, { backgroundColor: theme.text }]}
          >
            <SymbolView
              name={{ ios: "xmark", android: "close", web: "close" }}
              size={12}
              tintColor={theme.background}
            />
          </Pressable>
        </View>
      )}
      {error && (
        <ThemedText type="caption" themeColor="danger" accessibilityRole="alert">
          {error}
        </ThemedText>
      )}
      <View style={styles.bar}>
        <Pressable
          onPress={pickImage}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel="Adjuntar imagen"
          accessibilityState={{ disabled: !!disabled }}
          style={({ pressed }) => [styles.attach, pressed && styles.pressed]}
        >
          <SymbolView
            name={{ ios: "photo.on.rectangle", android: "image", web: "image" }}
            size={22}
            tintColor={disabled ? theme.placeholder : theme.textSecondary}
          />
        </Pressable>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={image ? "Agrega un texto (opcional)" : "Escribe un mensaje"}
          placeholderTextColor={theme.placeholder}
          selectionColor={theme.accent}
          cursorColor={theme.accent}
          accessibilityLabel="Mensaje"
          multiline
          maxLength={MaxLength}
          editable={!disabled}
          // En web, Enter envía y Shift+Enter hace un salto de línea.
          onKeyPress={(e) => {
            const event = e.nativeEvent as { key: string; shiftKey?: boolean };
            if (event.key === "Enter" && !event.shiftKey && "preventDefault" in e) {
              (e as unknown as { preventDefault: () => void }).preventDefault();
              send();
            }
          }}
          style={[
            styles.input,
            { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}
        />
        <Pressable
          onPress={send}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="Enviar mensaje"
          accessibilityState={{ disabled: !canSend }}
          style={({ pressed }) => [
            styles.send,
            { backgroundColor: canSend ? theme.accent : theme.backgroundSelected },
            pressed && styles.pressed,
          ]}
        >
          <SymbolView
            name={{ ios: "paperplane.fill", android: "send", web: "send" }}
            size={20}
            tintColor={canSend ? theme.onAccent : theme.placeholder}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  bar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.two,
  },
  attachment: {
    alignSelf: "flex-start",
    // Deja lugar al botón de quitar, que sobresale de la esquina.
    paddingTop: Spacing.two,
    paddingRight: Spacing.two,
  },
  thumb: {
    width: ThumbSize,
    height: ThumbSize,
    borderRadius: Radius.medium,
    overflow: "hidden",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  remove: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  attach: {
    width: MinTouchSize - Spacing.two,
    height: MinTouchSize,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    minHeight: MinTouchSize,
    maxHeight: 140,
    paddingHorizontal: Spacing.three,
    paddingTop: 12,
    paddingBottom: 12,
    borderRadius: Radius.large,
    borderWidth: 1,
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    // En web el navegador dibuja su propio contorno al enfocar.
    outlineWidth: 0,
  },
  send: {
    width: MinTouchSize,
    height: MinTouchSize,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.7,
  },
});
