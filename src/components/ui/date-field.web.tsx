import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ActiveThemeMode, FontFamily, FontSize, MinTouchSize, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

import { toIsoDate, type DateFieldProps } from "./date-field.types";

export type { DateFieldProps } from "./date-field.types";

/**
 * Campo de fecha en web: el `DateTimePicker` de `@expo/ui` no se dibuja en web, así que se usa el
 * `<input type="date">` del navegador (calendario nativo, teclado y lectores de pantalla incluidos).
 */
export function DateField({
  label,
  value,
  onChange,
  hint,
  error,
  minimumDate,
  maximumDate,
}: DateFieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      <ThemedText type="small" style={styles.label}>
        {label}
      </ThemedText>
      <View
        style={[
          styles.field,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: error ? theme.danger : focused ? theme.accent : theme.border,
          },
        ]}
      >
        <SymbolView
          name={{ ios: "calendar", android: "calendar_month", web: "calendar_month" }}
          size={18}
          tintColor={focused ? theme.accent : theme.placeholder}
        />
        <input
          type="date"
          aria-label={label}
          aria-invalid={error ? true : undefined}
          value={value}
          min={minimumDate ? toIsoDate(minimumDate) : undefined}
          max={maximumDate ? toIsoDate(maximumDate) : undefined}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            height: "100%",
            minWidth: 0,
            border: "none",
            outline: "none",
            background: "transparent",
            color: value ? theme.text : theme.placeholder,
            fontFamily: FontFamily.regular,
            fontSize: FontSize.small,
            // Calendario e ícono del navegador con el mismo modo (oscuro o claro) que la app.
            colorScheme: ActiveThemeMode,
            accentColor: theme.accent,
          }}
        />
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
});
