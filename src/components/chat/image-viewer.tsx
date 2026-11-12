import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { MinTouchSize, Radius, Spacing } from "@/constants/theme";

export type ImageViewerProps = {
  /** Imagen a mostrar; `null` cierra el visor. */
  uri: string | null;
  /** Clave de caché para que la URL firmada nueva no vuelva a descargar la misma imagen. */
  cacheKey?: string;
  caption?: string | null;
  onClose: () => void;
};

/** Imagen del chat a pantalla completa, sobre fondo negro. Se cierra con la X o con el botón atrás. */
export function ImageViewer({ uri, cacheKey, caption, onClose }: ImageViewerProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={uri !== null}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.backdrop,
          { paddingTop: insets.top, paddingBottom: insets.bottom + Spacing.three },
        ]}
      >
        {uri && (
          <Image
            source={{ uri, cacheKey }}
            style={styles.image}
            contentFit="contain"
            accessibilityLabel={caption ? `Imagen: ${caption}` : "Imagen"}
          />
        )}
        {caption ? (
          <ThemedText type="small" selectable style={styles.caption}>
            {caption}
          </ThemedText>
        ) : null}
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Cerrar imagen"
          style={({ pressed }) => [
            styles.close,
            { top: insets.top + Spacing.two },
            pressed && styles.pressed,
          ]}
        >
          <SymbolView
            name={{ ios: "xmark", android: "close", web: "close" }}
            size={20}
            tintColor="#FFFFFF"
          />
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.94)",
    gap: Spacing.three,
  },
  image: {
    flex: 1,
    width: "100%",
  },
  caption: {
    color: "#FFFFFF",
    textAlign: "center",
    paddingHorizontal: Spacing.four,
  },
  close: {
    position: "absolute",
    right: Spacing.three,
    width: MinTouchSize,
    height: MinTouchSize,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.16)",
  },
  pressed: {
    opacity: 0.7,
  },
});
