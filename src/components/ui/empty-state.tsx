import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type EmptyStateProps = {
  icon: SymbolViewProps["name"];
  title: string;
  /** Texto que orienta a la siguiente acción (anteproyecto 15.1, UX writing). */
  message: string;
  action?: { title: string; onPress: () => void };
};

/** Mensaje para listas vacías: ícono, título, explicación y una acción opcional. */
export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <SymbolView name={icon} size={32} tintColor={theme.accent} />
      </View>
      <View style={styles.texts}>
        <ThemedText type="heading" style={styles.center}>
          {title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
          {message}
        </ThemedText>
      </View>
      {action && <Button title={action.title} onPress={action.onPress} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.four,
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.three,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  texts: {
    maxWidth: 360,
    gap: Spacing.two,
  },
  center: {
    textAlign: "center",
  },
});
