import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { TextField } from "@/components/ui/text-field";
import { Spacing } from "@/constants/theme";
import { Universities } from "@/constants/universities";
import { EmptyFilters } from "@/services/discovery";
import type { DiscoveryFilters } from "@/types/discovery";
import type { Interest } from "@/types/profile";

/** Máximo de intereses que acepta la API en el filtro. */
const MaxInterests = 20;

export type FiltersPanelProps = {
  /** Filtros guardados; el panel trabaja sobre una copia hasta que se aplican. */
  value: DiscoveryFilters;
  interests: Interest[];
  saving: boolean;
  error: string | null;
  onApply: (filters: DiscoveryFilters) => void;
};

/** Filtros de Descubrir: universidades, carrera e intereses (RF-06). */
export function FiltersPanel({ value, interests, saving, error, onApply }: FiltersPanelProps) {
  const [draft, setDraft] = useState(value);

  function toggle(list: number[], id: number) {
    return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
  }

  return (
    <View style={styles.container}>
      <Section title="Universidades" hint="Sin selección: todas.">
        <View style={styles.chips}>
          {Universities.map((university) => (
            <Chip
              key={university.id}
              label={university.shortName}
              selected={draft.universities.includes(university.id)}
              onPress={() =>
                setDraft({ ...draft, universities: toggle(draft.universities, university.id) })
              }
            />
          ))}
        </View>
      </Section>

      <TextField
        label="Carrera"
        icon={{ ios: "graduationcap", android: "school", web: "school" }}
        placeholder="Todas las carreras"
        value={draft.career ?? ""}
        onChangeText={(career) => setDraft({ ...draft, career: career === "" ? null : career })}
        maxLength={120}
        autoCapitalize="words"
        hint="Basta con una parte del nombre, p. ej. “Software”."
      />

      <Section
        title="Intereses"
        hint={
          draft.interests.length >= MaxInterests
            ? `Puedes elegir hasta ${MaxInterests}.`
            : "Se muestran perfiles con al menos uno de ellos."
        }
      >
        <View style={styles.chips}>
          {interests.map((interest) => {
            const selected = draft.interests.includes(interest.id);
            const blocked = !selected && draft.interests.length >= MaxInterests;
            return (
              <Chip
                key={interest.id}
                label={interest.name}
                selected={selected}
                onPress={
                  blocked
                    ? undefined
                    : () => setDraft({ ...draft, interests: toggle(draft.interests, interest.id) })
                }
              />
            );
          })}
        </View>
      </Section>

      <ThemedText type="caption" themeColor="textSecondary">
        Los filtros se guardan entre sesiones.
      </ThemedText>

      {error && (
        <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
          {error}
        </ThemedText>
      )}

      <View style={styles.actions}>
        <Button
          title="Aplicar filtros"
          loading={saving}
          onPress={() => onApply({ ...draft, career: draft.career?.trim() || null })}
        />
        <Button
          title="Limpiar filtros"
          variant="ghost"
          disabled={saving}
          onPress={() => {
            setDraft(EmptyFilters);
            onApply(EmptyFilters);
          }}
        />
      </View>
    </View>
  );
}

function Section({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold">{title}</ThemedText>
      {children}
      <ThemedText type="caption" themeColor="textSecondary">
        {hint}
      </ThemedText>
    </View>
  );
}

/** Cuántos filtros hay activos, para el indicador del botón. */
export function countActiveFilters(filters: DiscoveryFilters) {
  return filters.universities.length + filters.interests.length + (filters.career ? 1 : 0);
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.four,
  },
  section: {
    gap: Spacing.two,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  actions: {
    gap: Spacing.two,
  },
});
