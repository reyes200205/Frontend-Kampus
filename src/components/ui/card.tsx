import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type CardProps = {
  children: ReactNode;
  /** Si existe, la tarjeta completa es tocable (p. ej. una tarjeta de grupo). */
  onPress?: () => void;
  /** Texto para lectores de pantalla cuando la tarjeta es tocable. */
  accessibilityLabel?: string;
  /** Resalta la tarjeta con el borde de marca (p. ej. el grupo o match destacado). */
  highlighted?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Contenedor con fondo elevado, borde y esquinas redondeadas para agrupar contenido. */
export function Card({ children, onPress, accessibilityLabel, highlighted, style }: CardProps) {
  const theme = useTheme();
  const cardStyle = [
    styles.card,
    {
      backgroundColor: theme.backgroundElement,
      borderColor: highlighted ? theme.accent : theme.border,
    },
    style,
  ];

  if (!onPress) return <View style={cardStyle}>{children}</View>;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [cardStyle, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    borderRadius: Radius.large,
    borderWidth: 1,
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.85,
  },
});
