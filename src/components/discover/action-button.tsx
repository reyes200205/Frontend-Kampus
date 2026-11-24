import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { Platform, Pressable, StyleSheet } from "react-native";

import { Radius } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type ActionButtonProps = {
  label: string;
  icon: SymbolViewProps["name"];
  /**
   * - `pass`: "Pasar", con la X en rojo.
   * - `info`: acción secundaria (p. ej. "Ver perfil"), más chica.
   * - `like` (o `primary`): "Me interesa", la más grande y con el color de marca.
   */
  tone?: "pass" | "info" | "like";
  /** Igual que `tone="like"`; se conserva para el perfil expandido. */
  primary?: boolean;
  onPress: () => void;
};

/** Ícono de "Like" (pulgar arriba) en lugar del corazón: botones, sello de la tarjeta y pantalla de match. */
export const LikeIcon = { ios: "hand.thumbsup.fill", android: "thumb_up", web: "thumb_up" } as const;

const Sizes = { pass: 62, info: 50, like: 70 } as const;

/** Botón redondo de "Pasar", "Ver perfil" o "Me interesa", debajo del mazo y en el perfil expandido. */
export function ActionButton({ label, icon, tone, primary, onPress }: ActionButtonProps) {
  const theme = useTheme();
  const kind = tone ?? (primary ? "like" : "pass");
  const size = Sizes[kind];
  const like = kind === "like";
  const tint = like ? theme.onAccent : kind === "pass" ? theme.danger : theme.text;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.action,
        { width: size, height: size },
        like
          ? { backgroundColor: theme.accent }
          : { backgroundColor: theme.backgroundElement, borderColor: theme.border, borderWidth: 1.5 },
        pressed && styles.pressed,
      ]}
    >
      <SymbolView name={icon} size={Math.round(size * 0.42)} tintColor={tint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  action: {
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    // Sombra para que se distingan al montarse sobre la tarjeta.
    ...Platform.select({
      web: { boxShadow: "0 6px 18px rgba(0, 0, 0, 0.35)" } as object,
      default: {
        shadowColor: "#000000",
        shadowOpacity: 0.35,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
      },
    }),
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.94 }],
  },
});
