import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Chip } from "@/components/ui/chip";
import { interestCategoryLabel, MaxInterests, MinInterests } from "@/constants/profile";
import { Spacing } from "@/constants/theme";
import type { Interest } from "@/types/profile";

export type InterestPickerProps = {
  interests: Interest[];
  selected: number[];
  onChange: (ids: number[]) => void;
  error?: string;
};

/** Intereses del catálogo agrupados por categoría; se eligen entre 3 y 20 (RF-03). */
export function InterestPicker({ interests, selected, onChange, error }: InterestPickerProps) {
  const byCategory = new Map<string, Interest[]>();
  for (const interest of interests) {
    byCategory.set(interest.category, [...(byCategory.get(interest.category) ?? []), interest]);
  }
  const full = selected.length >= MaxInterests;

  function toggle(id: number) {
    if (selected.includes(id)) onChange(selected.filter((current) => current !== id));
    else if (!full) onChange([...selected, id]);
  }

  return (
    <View style={styles.container}>
      <ThemedText type="caption" themeColor={error ? "danger" : "textSecondary"}>
        {error ??
          `${selected.length} seleccionados · elige de ${MinInterests} a ${MaxInterests}.`}
      </ThemedText>

      {[...byCategory.entries()].map(([category, items]) => (
        <View key={category} style={styles.group}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            {interestCategoryLabel(category)}
          </ThemedText>
          <View style={styles.chips}>
            {items.map((interest) => {
              const isSelected = selected.includes(interest.id);
              return (
                <Chip
                  key={interest.id}
                  label={interest.name}
                  selected={isSelected}
                  // Al llegar al máximo solo se pueden quitar intereses.
                  onPress={isSelected || !full ? () => toggle(interest.id) : undefined}
                />
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
  group: {
    gap: Spacing.two,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
});
