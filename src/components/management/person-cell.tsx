import { StyleSheet, View } from "react-native";

import { Avatar } from "@/components/matches/avatar";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";

export type PersonCellProps = {
  name: string;
  email: string;
  /** Texto pequeño junto al nombre, p. ej. "(tú)". */
  suffix?: string;
  /** Atenúa la fila (cuenta desactivada). */
  muted?: boolean;
};

/** Celda de persona en una tabla: avatar con iniciales, nombre y correo. */
export function PersonCell({ name, email, suffix, muted }: PersonCellProps) {
  return (
    <View style={[styles.row, muted && styles.muted]}>
      <Avatar uri={null} name={name} size={40} />
      <View style={styles.texts}>
        <ThemedText type="smallBold" numberOfLines={1}>
          {name}
          {suffix && (
            <ThemedText type="small" themeColor="textSecondary">
              {` ${suffix}`}
            </ThemedText>
          )}
        </ThemedText>
        <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
          {email}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
  texts: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  muted: {
    opacity: 0.6,
  },
});
