import { StyleSheet, Text, View } from "react-native";

import { FontFamily } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type KampusLogoProps = {
  /** Tamaño del pin en px; el texto escala con él. */
  size?: number;
  /** `stacked`: pin arriba del nombre (pantallas de acceso). `inline`: pin a la izquierda (barra lateral). */
  layout?: "stacked" | "inline";
};

export function KampusLogo({ size = 56, layout = "stacked" }: KampusLogoProps) {
  const theme = useTheme();
  const inline = layout === "inline";

  return (
    <View
      style={[styles.container, inline && styles.inline, { gap: size * (inline ? 0.35 : 0.25) }]}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Kampus"
    >
      <View
        style={[
          styles.pin,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderBottomRightRadius: size * 0.12,
            backgroundColor: theme.text,
          },
        ]}
      >
        <Text
          style={[
            styles.pinLetter,
            { fontSize: size * 0.5, lineHeight: size * 0.62, color: theme.background },
          ]}
        >
          K
        </Text>
      </View>

      <Text
        style={[
          styles.wordmark,
          { fontSize: size * (inline ? 0.6 : 0.5), color: theme.text },
        ]}
      >
        <Text style={{ color: theme.accent }}>Kam</Text>pus
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  inline: {
    flexDirection: "row",
  },
  // Círculo con una esquina en punta, rotado 45° para que parezca un pin de mapa
  pin: {
    transform: [{ rotate: "45deg" }],
    alignItems: "center",
    justifyContent: "center",
  },
  pinLetter: {
    transform: [{ rotate: "-45deg" }],
    fontFamily: FontFamily.bold,
  },
  wordmark: {
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.5,
  },
});
