import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { FontFamily, FontSize, MinTouchSize, Radius, Spacing } from "@/constants/theme";
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
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
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
          <Pressable
            onPress={() => setHidden(!hidden)}
            hitSlop={(MinTouchSize - 18) / 2}
            accessibilityRole="button"
            accessibilityLabel={hidden ? "Mostrar contraseña" : "Ocultar contraseña"}
          >
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
  input: {
    flex: 1,
    height: "100%",
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
  },
});
