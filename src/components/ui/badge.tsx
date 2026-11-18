import { StyleSheet, Text, View } from "react-native";

import { FontFamily, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type BadgeTone = "neutral" | "accent" | "success" | "danger";

export type BadgeProps = {
  label: string;
  tone?: BadgeTone;
  /** Punto de color antes del texto, para estados (Activa, En revisión). */
  dot?: boolean;
};

/** Etiqueta pequeña de estado o rol para tablas y listas (p. ej. "Administrador", "Desactivada"). */
export function Badge({ label, tone = "neutral", dot }: BadgeProps) {
  const theme = useTheme();
  const color = {
    neutral: theme.textSecondary,
    accent: theme.accentText,
    success: theme.success,
    danger: theme.danger,
  }[tone];

  return (
    <View
      style={[
        styles.badge,
        // Fondo y borde con el mismo color en transparencia (12 % y 30 %).
        { backgroundColor: `${color}1F`, borderColor: `${color}4D` },
      ]}
    >
      {dot && <View style={[styles.dot, { backgroundColor: color }]} />}
      <Text style={[styles.label, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: Spacing.one + 2,
    height: 24,
    paddingHorizontal: Spacing.two + 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
});
