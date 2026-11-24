import { SymbolView } from "expo-symbols";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Dialog } from "@/components/ui/dialog";
import { SearchField } from "@/components/ui/search-field";
import { TextField } from "@/components/ui/text-field";
import { careersFor } from "@/constants/careers";
import { MaxCareerLength } from "@/constants/profile";
import { FontFamily, FontSize, MinTouchSize, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type Props = {
  value: string;
  onChange: (career: string) => void;
  /** Universidad del estudiante: define qué carreras se ofrecen. */
  universityId: number | null | undefined;
  error?: string;
};

/**
 * Carrera elegida de una lista (la de la universidad del estudiante) en lugar de escrita a mano. Si la suya no
 * está, "Otra carrera" cambia a un campo de texto. Una carrera guardada que no está en la lista abre ese campo.
 */
export function CareerField({ value, onChange, universityId, error }: Props) {
  const theme = useTheme();
  const careers = useMemo(() => careersFor(universityId), [universityId]);
  // Hasta que el estudiante elige, se deduce del valor (puede llegar después, al cargar el perfil).
  const [forcedCustom, setCustom] = useState<boolean | null>(null);
  const custom = forcedCustom ?? (value.trim() !== "" && !careers.includes(value));
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const needle = query.trim().toLocaleLowerCase("es");
  const filtered = needle ? careers.filter((career) => career.toLocaleLowerCase("es").includes(needle)) : careers;

  function choose(career: string) {
    onChange(career);
    setCustom(false);
    setOpen(false);
    setQuery("");
  }

  function chooseOther() {
    setOpen(false);
    setQuery("");
    setCustom(true);
    // Si venía de la lista, empieza vacío para escribir la suya.
    if (careers.includes(value)) onChange("");
  }

  if (custom) {
    return (
      <View style={styles.container}>
        <TextField
          label="Carrera"
          icon={{ ios: "graduationcap", android: "school", web: "school" }}
          placeholder="Escribe el nombre completo de tu carrera"
          value={value}
          onChangeText={onChange}
          error={error}
          autoCapitalize="sentences"
          maxLength={MaxCareerLength}
        />
        <Pressable onPress={() => setOpen(true)} accessibilityRole="button" hitSlop={8} style={styles.switch}>
          <ThemedText type="link">Elegir de la lista</ThemedText>
        </Pressable>
        <CareerDialog
          open={open}
          careers={filtered}
          value={value}
          query={query}
          onQuery={setQuery}
          onChoose={choose}
          onOther={chooseOther}
          onClose={() => setOpen(false)}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ThemedText type="small" style={styles.label}>
        Carrera
      </ThemedText>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={value ? `Carrera: ${value}. Cambiar` : "Elegir carrera"}
        style={({ pressed }) => [
          styles.field,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: error ? theme.danger : open ? theme.accent : theme.border,
          },
          pressed && { backgroundColor: theme.backgroundSelected },
        ]}
      >
        <SymbolView name={{ ios: "graduationcap", android: "school", web: "school" }} size={18} tintColor={theme.placeholder} />
        <ThemedText numberOfLines={1} style={[styles.value, { color: value ? theme.text : theme.placeholder }]}>
          {value || "Elige tu carrera"}
        </ThemedText>
        <SymbolView name={{ ios: "chevron.down", android: "expand_more", web: "expand_more" }} size={18} tintColor={theme.placeholder} />
      </Pressable>
      {error && (
        <ThemedText type="caption" themeColor="danger">
          {error}
        </ThemedText>
      )}
      <CareerDialog
        open={open}
        careers={filtered}
        value={value}
        query={query}
        onQuery={setQuery}
        onChoose={choose}
        onOther={chooseOther}
        onClose={() => setOpen(false)}
      />
    </View>
  );
}

type DialogProps = {
  open: boolean;
  careers: string[];
  value: string;
  query: string;
  onQuery: (query: string) => void;
  onChoose: (career: string) => void;
  onOther: () => void;
  onClose: () => void;
};

/** Lista de carreras con búsqueda; la última opción es "Otra carrera". */
function CareerDialog({ open, careers, value, query, onQuery, onChoose, onOther, onClose }: DialogProps) {
  const theme = useTheme();

  return (
    <Dialog visible={open} title="Elige tu carrera" onClose={onClose}>
      <SearchField value={query} onChangeText={onQuery} placeholder="Buscar carrera" />
      <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
        {careers.length === 0 && (
          <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
            No está en la lista. Elige “Otra carrera” para escribirla.
          </ThemedText>
        )}
        {careers.map((career) => {
          const selected = career === value;
          return (
            <Pressable
              key={career}
              onPress={() => onChoose(career)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={({ pressed }) => [styles.option, pressed && { backgroundColor: theme.backgroundSelected }]}
            >
              <ThemedText style={[styles.optionText, selected && styles.optionSelected]}>{career}</ThemedText>
              {selected && (
                <SymbolView name={{ ios: "checkmark", android: "check", web: "check" }} size={18} tintColor={theme.accentText} />
              )}
            </Pressable>
          );
        })}
        <Pressable
          onPress={onOther}
          accessibilityRole="button"
          style={({ pressed }) => [styles.option, pressed && { backgroundColor: theme.backgroundSelected }]}
        >
          <SymbolView name={{ ios: "pencil", android: "edit", web: "edit" }} size={18} tintColor={theme.textSecondary} />
          <ThemedText style={styles.optionText} themeColor="textSecondary">
            Otra carrera…
          </ThemedText>
        </Pressable>
      </ScrollView>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  label: {
    fontFamily: FontFamily.medium,
  },
  field: {
    height: MinTouchSize + 6,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    borderRadius: Radius.medium,
    borderWidth: 1,
    gap: 10,
  },
  value: {
    flex: 1,
    fontSize: FontSize.small,
  },
  switch: {
    alignSelf: "flex-start",
  },
  list: {
    maxHeight: 360,
  },
  empty: {
    paddingVertical: Spacing.three,
  },
  option: {
    minHeight: MinTouchSize,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    borderRadius: Radius.small,
  },
  optionText: {
    flex: 1,
    fontSize: FontSize.small,
  },
  optionSelected: {
    fontFamily: FontFamily.semibold,
  },
});
