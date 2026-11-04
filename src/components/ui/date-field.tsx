import { DateTimePicker } from "@expo/ui/community/datetime-picker";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { ActiveThemeMode, FontFamily, MinTouchSize, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

import { formatLongDate, fromIsoDate, toIsoDate, type DateFieldProps } from "./date-field.types";

export type { DateFieldProps } from "./date-field.types";

/**
 * Campo de fecha con el selector nativo de `@expo/ui`: en Android abre el diálogo de Material 3
 * y en iOS muestra el calendario debajo del campo. En web se usa `date-field.web.tsx`.
 */
export function DateField({
  label,
  value,
  onChange,
  placeholder = "Elige una fecha",
  hint,
  error,
  minimumDate,
  maximumDate,
}: DateFieldProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const formatted = formatLongDate(value);
  // Sin fecha, el selector abre en el máximo permitido (o hoy) para no empezar en 1970.
  const pickerValue = fromIsoDate(value) ?? maximumDate ?? new Date();

  function handlePick(date: Date) {
    onChange(toIsoDate(date));
    // En Android el diálogo se cierra al confirmar; en iOS el calendario sigue abierto hasta "Listo".
    if (Platform.OS === "android") setOpen(false);
  }

  return (
    <View style={styles.container}>
      <ThemedText type="small" style={styles.label}>
        {label}
      </ThemedText>
      <Pressable
        onPress={() => setOpen(!open)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${formatted ?? placeholder}`}
        accessibilityHint={error ?? hint}
        style={[
          styles.field,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: error ? theme.danger : open ? theme.accent : theme.border,
          },
        ]}
      >
        <SymbolView
          name={{ ios: "calendar", android: "calendar_month", web: "calendar_month" }}
          size={18}
          tintColor={open ? theme.accent : theme.placeholder}
        />
        <ThemedText
          type="small"
          themeColor={formatted ? "text" : "placeholder"}
          style={styles.value}
        >
          {formatted ?? placeholder}
        </ThemedText>
        {formatted && (
          <Pressable
            onPress={() => onChange("")}
            hitSlop={(MinTouchSize - 18) / 2}
            accessibilityRole="button"
            accessibilityLabel={`Borrar ${label.toLowerCase()}`}
          >
            <SymbolView
              name={{ ios: "xmark.circle.fill", android: "cancel", web: "cancel" }}
              size={18}
              tintColor={theme.placeholder}
            />
          </Pressable>
        )}
      </Pressable>

      {open && Platform.OS === "android" && (
        <DateTimePicker
          value={pickerValue}
          onValueChange={(_, date) => handlePick(date)}
          onDismiss={() => setOpen(false)}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          accentColor={theme.accent}
          themeVariant={ActiveThemeMode}
          positiveButton={{ label: "Aceptar" }}
          negativeButton={{ label: "Cancelar" }}
        />
      )}

      {open && Platform.OS === "ios" && (
        <View style={[styles.inline, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <DateTimePicker
            value={pickerValue}
            onValueChange={(_, date) => handlePick(date)}
            display="inline"
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            accentColor={theme.accent}
            themeVariant={ActiveThemeMode}
            locale="es_MX"
          />
          <Button title="Listo" variant="ghost" onPress={() => setOpen(false)} />
        </View>
      )}

      {(error || hint) && (
        <ThemedText type="caption" themeColor={error ? "danger" : "textSecondary"}>
          {error ?? hint}
        </ThemedText>
      )}
    </View>
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
  },
  inline: {
    borderRadius: Radius.medium,
    borderWidth: 1,
    padding: Spacing.two,
  },
});
