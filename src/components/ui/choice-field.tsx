import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Chip } from "@/components/ui/chip";
import { FontFamily, Spacing } from "@/constants/theme";

export type ChoiceFieldProps<T extends string | number> = {
  label: string;
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
  hint?: string;
  error?: string;
};

/** Campo de opción única con chips (categoría, rol, universidad). */
export function ChoiceField<T extends string | number>({
  label,
  options,
  value,
  onChange,
  hint,
  error,
}: ChoiceFieldProps<T>) {
  return (
    <View style={styles.field}>
      <ThemedText type="small" style={styles.label}>
        {label}
      </ThemedText>
      <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {options.map((option) => (
          <Chip
            key={String(option.value)}
            label={option.label}
            selected={option.value === value}
            onPress={() => onChange(option.value)}
          />
        ))}
      </View>
      {(error || hint) && (
        <ThemedText type="caption" themeColor={error ? "danger" : "textSecondary"}>
          {error ?? hint}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.two,
  },
  label: {
    fontFamily: FontFamily.medium,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
});
