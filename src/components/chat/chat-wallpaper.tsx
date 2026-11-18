import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View, type ColorValue, type StyleProp, type ViewStyle } from "react-native";

import { bubbleColors, wallpaperColors } from "@/constants/chat-style";
import { Radius } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/** Fondo de la conversación: color sólido o degradado. Ocupa todo su contenedor. */
export function ChatWallpaper({ id, style }: { id: string; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  const colors = wallpaperColors(id, theme);

  if (colors.length < 2) {
    return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors[0] }, style]} />;
  }

  return (
    <LinearGradient
      pointerEvents="none"
      colors={colors as unknown as readonly [ColorValue, ColorValue, ...ColorValue[]]}
      style={[StyleSheet.absoluteFill, style]}
    />
  );
}

export type ChatStylePreviewProps = {
  wallpaper: string;
  bubble: string;
  /** Ancho de la miniatura; el alto sigue la proporción de un celular. */
  width?: number;
  style?: StyleProp<ViewStyle>;
};

/** Miniatura de un chat (fondo + una burbuja ajena y una propia), para elegir el estilo. */
export function ChatStylePreview({ wallpaper, bubble, width = 120, style }: ChatStylePreviewProps) {
  const theme = useTheme();
  const mine = bubbleColors(bubble, theme);
  const scale = width / 120;

  return (
    <View style={[styles.preview, { width, height: width * 1.75, borderRadius: 18 * scale }, style]}>
      <ChatWallpaper id={wallpaper} />
      <View
        style={[
          styles.bubble,
          {
            width: 64 * scale,
            height: 26 * scale,
            borderRadius: 13 * scale,
            borderBottomLeftRadius: 4 * scale,
            top: 52 * scale,
            left: 14 * scale,
            backgroundColor: theme.backgroundSelected,
          },
        ]}
      />
      <View
        style={[
          styles.bubble,
          {
            width: 72 * scale,
            height: 26 * scale,
            borderRadius: 13 * scale,
            borderBottomRightRadius: 4 * scale,
            top: 94 * scale,
            right: 14 * scale,
            backgroundColor: mine.background,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  preview: {
    overflow: "hidden",
    borderRadius: Radius.medium,
  },
  bubble: {
    position: "absolute",
  },
});
