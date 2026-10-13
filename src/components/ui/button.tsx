import { SymbolView, type SymbolViewProps } from "expo-symbols";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { FontFamily, FontSize, MinTouchSize, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type ButtonVariant = "primary" | "secondary" | "ghost";

export type ButtonProps = Omit<PressableProps, "style"> & {
  title: string;
  /**
   * - `primary`: acción principal de la pantalla (relleno amarillo). Una por pantalla.
   * - `secondary`: acción alternativa (borde, sin relleno).
   * - `ghost`: acción de menor peso (solo texto).
   */
  variant?: ButtonVariant;
  /** Ícono a la izquierda del texto. */
  icon?: SymbolViewProps["name"];
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  title,
  variant = "primary",
  icon,
  loading,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const variantStyle: ViewStyle = {
    primary: { backgroundColor: theme.accent, shadowColor: theme.accent },
    secondary: { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.backgroundElement },
    ghost: {},
  }[variant];
  const contentColor = variant === "primary" ? theme.onAccent : theme.text;

  return (
    <Pressable
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      style={({ pressed }) => [
        styles.button,
        variant === "primary" && styles.primaryShadow,
        variantStyle,
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={contentColor} />
      ) : (
        <>
          {icon && <SymbolView name={icon} size={18} tintColor={contentColor} />}
          <Text style={[styles.title, { color: contentColor }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: MinTouchSize + 8,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.full,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
  },
  primaryShadow: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
  title: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.semibold,
  },
});
