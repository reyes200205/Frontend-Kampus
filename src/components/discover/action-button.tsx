import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { Pressable, StyleSheet } from "react-native";

import { Radius } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type ActionButtonProps = {
  label: string;
  icon: SymbolViewProps["name"];
  /** "Me interesa": más grande y con el color de marca. */
  primary?: boolean;
  onPress: () => void;
};

/** Botón redondo de "Pasar" o "Me interesa", debajo del mazo y en el perfil expandido. */
export function ActionButton({ label, icon, primary, onPress }: ActionButtonProps) {
  const theme = useTheme();
  const size = primary ? 68 : 60;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.action,
        { width: size, height: size },
        primary
          ? { backgroundColor: theme.accent }
          : { backgroundColor: theme.backgroundElement, borderColor: theme.border, borderWidth: 1.5 },
        pressed && styles.pressed,
      ]}
    >
      <SymbolView name={icon} size={primary ? 30 : 26} tintColor={primary ? theme.onAccent : theme.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  action: {
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.94 }],
  },
});
