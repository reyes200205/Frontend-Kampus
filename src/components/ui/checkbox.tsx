import { Link, type Href } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { FontFamily, MinTouchSize, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type CheckboxProps = {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  /** Texto enlazado al final de la etiqueta, p. ej. "Acepto el" + "Aviso de privacidad". */
  link?: { text: string; href: Href };
};

export function Checkbox({ label, value, onValueChange, link }: CheckboxProps) {
  const theme = useTheme();

  return (
    <Pressable
      style={styles.row}
      onPress={() => onValueChange(!value)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}
      accessibilityLabel={link ? `${label} ${link.text}` : label}
    >
      <View
        style={[
          styles.box,
          value
            ? { backgroundColor: theme.accent, borderColor: theme.accent }
            : { borderColor: theme.placeholder },
        ]}
      >
        {value && (
          <SymbolView
            name={{ ios: "checkmark", android: "check", web: "check" }}
            size={12}
            tintColor={theme.onAccent}
          />
        )}
      </View>
      <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
        {label}
        {link && (
          <>
            {" "}
            <Link
              href={link.href}
              // En web el clic subiría al Pressable y marcaría la casilla.
              onPress={(event) => event.stopPropagation()}
              style={[styles.link, { color: theme.accentText }]}
            >
              {link.text}
            </Link>
          </>
        )}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // La fila completa es tocable y mide al menos 44 px de alto (RNF-10).
  row: {
    minHeight: MinTouchSize,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two + 2,
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    flex: 1,
  },
  link: {
    fontFamily: FontFamily.semibold,
    textDecorationLine: "underline",
  },
});
