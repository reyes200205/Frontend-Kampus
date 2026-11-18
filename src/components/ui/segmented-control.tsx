import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { FontFamily, MinTouchSize, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  /** Número junto al texto (p. ej. grupos en revisión). */
  count?: number;
};

export type SegmentedControlProps<T extends string> = {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
};

/** Filtro de una sola opción con aspecto de pestañas (p. ej. En revisión / Aprobados / Rechazados). */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  const theme = useTheme();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
      <View
        accessibilityRole="tablist"
        accessibilityLabel={accessibilityLabel}
        style={[styles.track, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
      >
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              style={({ pressed }) => [
                styles.segment,
                selected && { backgroundColor: theme.backgroundSelected },
                pressed && !selected && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.label,
                  { color: selected ? theme.text : theme.textSecondary },
                  selected && styles.labelSelected,
                ]}
              >
                {option.label}
              </Text>
              {option.count !== undefined && option.count > 0 && (
                <View style={[styles.count, { backgroundColor: selected ? theme.accent : theme.backgroundSelected }]}>
                  <Text style={[styles.countText, { color: selected ? theme.onAccent : theme.textSecondary }]}>
                    {option.count > 99 ? "99+" : option.count}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  track: {
    flexDirection: "row",
    padding: Spacing.one,
    gap: Spacing.one,
    borderRadius: Radius.medium,
    borderWidth: 1,
  },
  segment: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    minHeight: MinTouchSize - 8,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.small,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
  },
  labelSelected: {
    fontFamily: FontFamily.semibold,
  },
  count: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  countText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
  },
});
