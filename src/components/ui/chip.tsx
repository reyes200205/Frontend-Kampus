import { Pressable, StyleSheet, Text } from "react-native";

import { FontFamily, FontSize, MinTouchSize, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type ChipProps = {
  label: string;
  selected?: boolean;
  /** Si no existe, el chip solo se muestra (p. ej. intereses en una tarjeta). */
  onPress?: () => void;
};

/** Etiqueta redondeada para intereses, filtros y categorías. */
export function Chip({ label, selected = false, onPress }: ChipProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : "text"}
      accessibilityState={onPress ? { selected } : undefined}
      hitSlop={onPress ? (MinTouchSize - 32) / 2 : undefined}
      style={({ pressed }) => [
        styles.chip,
        selected
          ? { backgroundColor: theme.accent, borderColor: theme.accent }
          : { backgroundColor: theme.backgroundSelected, borderColor: theme.border },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.label, { color: selected ? theme.onAccent : theme.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 32,
    paddingHorizontal: Spacing.three - 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  pressed: {
    opacity: 0.8,
  },
  label: {
    fontSize: FontSize.small - 1,
    fontFamily: FontFamily.medium,
  },
});
