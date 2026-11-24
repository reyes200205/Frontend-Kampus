import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { GroupAvatar } from "@/components/groups/group-avatar";
import { ThemedText } from "@/components/themed-text";
import { MinTouchSize, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { Group } from "@/types/groups";

type Props = {
  group: Group;
  /** Línea de abajo (p. ej. "2 actividades próximas" o "Académico · 34 integrantes"). */
  subtitle: string;
  /** Punto de color antes del subtítulo, como "hay algo nuevo" en Facebook. */
  highlight?: boolean;
  onPress: () => void;
  /** Acción a la derecha (p. ej. "Unirme" o descartar). */
  trailing?: ReactNode;
};

/** Fila compacta de un grupo: imagen cuadrada, nombre y una línea de contexto (lista "Tus grupos"). */
export function GroupRow({ group, subtitle, highlight, onPress, trailing }: Props) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={`${group.name}. ${subtitle}`}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.backgroundSelected }]}
    >
      <GroupAvatar group={group} size={56} />
      <View style={styles.info}>
        <ThemedText style={styles.name} numberOfLines={2}>
          {group.name}
        </ThemedText>
        <View style={styles.subtitle}>
          {highlight && <View style={[styles.dot, { backgroundColor: theme.accent }]} />}
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={styles.flex}>
            {subtitle}
          </ThemedText>
        </View>
      </View>
      {trailing}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: MinTouchSize + 28,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    marginHorizontal: -Spacing.two,
    borderRadius: 12,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
  },
  subtitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one + 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  flex: {
    flex: 1,
  },
});
