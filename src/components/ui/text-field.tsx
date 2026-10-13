import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { FontFamily, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type TextFieldProps = TextInputProps & {
  label: string;
  /** Ícono a la izquierda del campo. */
  icon?: SymbolViewProps["name"];
  /** Muestra un botón de ojo para ver/ocultar el texto (para contraseñas). */
  password?: boolean;
  /** Texto de ayuda debajo del campo. */
  hint?: string;
  /** Mensaje de error; si existe, reemplaza al hint y pinta el borde de rojo. */
  error?: string;
};

export function TextField({
  label,
  icon,
  password,
  hint,
  error,
  style,
  onFocus,
  onBlur,
  ...rest
}: TextFieldProps) {
  const theme = useTheme();
  const [hidden, setHidden] = useState(true);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <View
        style={[
          styles.field,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: error ? theme.danger : focused ? theme.accent : theme.border,
          },
        ]}
      >
        {icon && (
          <SymbolView
            name={icon}
            size={18}
            tintColor={focused ? theme.accent : theme.placeholder}
          />
        )}
        <TextInput
          placeholderTextColor={theme.placeholder}
          selectionColor={theme.accent}
          cursorColor={theme.accent}
          secureTextEntry={password && hidden}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, { color: theme.text }, style]}
          {...rest}
        />
        {password && (
          <Pressable onPress={() => setHidden(!hidden)} hitSlop={Spacing.two}>
            <SymbolView
              size={18}
              tintColor={theme.placeholder}
              name={
                hidden
                  ? { ios: "eye.slash", android: "visibility_off", web: "visibility_off" }
                  : { ios: "eye", android: "visibility", web: "visibility" }
              }
            />
          </Pressable>
        )}
      </View>
      {(error || hint) && (
        <ThemedText
          type="small"
          themeColor={error ? "danger" : "textSecondary"}
          style={styles.helper}
        >
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
    fontSize: 13,
    lineHeight: 18,
  },
  field: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    borderRadius: Radius.medium,
    borderWidth: 1,
    gap: 10,
  },
  helper: {
    fontSize: 12,
    lineHeight: 16,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 14,
    fontFamily: FontFamily.regular,
  },
});
