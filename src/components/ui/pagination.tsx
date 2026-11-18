import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { FontFamily, MinTouchSize, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type PaginationProps = {
  page: number;
  lastPage: number;
  onChange: (page: number) => void;
};

/** Páginas a mostrar: la primera, la última y dos alrededor de la actual; `null` es "…". */
function pageList(page: number, lastPage: number): (number | null)[] {
  const pages = new Set([1, lastPage, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= lastPage).sort((a, b) => a - b);
  const result: (number | null)[] = [];
  sorted.forEach((p, index) => {
    if (index > 0 && p - sorted[index - 1] > 1) result.push(null);
    result.push(p);
  });
  return result;
}

/** Paginación numerada de las tablas del panel (respuestas paginadas de Laravel). */
export function Pagination({ page, lastPage, onChange }: PaginationProps) {
  const theme = useTheme();
  if (lastPage <= 1) return null;

  const arrow = (direction: "prev" | "next") => {
    const target = direction === "prev" ? page - 1 : page + 1;
    const disabled = target < 1 || target > lastPage;
    return (
      <Pressable
        onPress={() => onChange(target)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={direction === "prev" ? "Página anterior" : "Página siguiente"}
        style={({ pressed }) => [
          styles.item,
          { borderColor: theme.border },
          pressed && { backgroundColor: theme.backgroundSelected },
          disabled && styles.disabled,
        ]}
      >
        <SymbolView
          name={
            direction === "prev"
              ? { ios: "chevron.left", android: "chevron_left", web: "chevron_left" }
              : { ios: "chevron.right", android: "chevron_right", web: "chevron_right" }
          }
          size={18}
          tintColor={theme.text}
        />
      </Pressable>
    );
  };

  return (
    <View style={styles.row} accessibilityRole="toolbar" accessibilityLabel="Paginación">
      {arrow("prev")}
      <View style={styles.pages}>
        {pageList(page, lastPage).map((p, index) =>
          p === null ? (
            <Text key={`gap-${index}`} style={[styles.gap, { color: theme.textSecondary }]}>
              …
            </Text>
          ) : (
            <Pressable
              key={p}
              onPress={() => onChange(p)}
              accessibilityRole="button"
              accessibilityLabel={`Página ${p}`}
              accessibilityState={{ selected: p === page }}
              style={({ pressed }) => [
                styles.item,
                styles.pageItem,
                p === page && { backgroundColor: theme.backgroundSelected },
                pressed && { backgroundColor: theme.backgroundSelected },
              ]}
            >
              <Text style={[styles.label, { color: p === page ? theme.text : theme.textSecondary }]}>{p}</Text>
            </Pressable>
          ),
        )}
      </View>
      {arrow("next")}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.two,
  },
  pages: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
  },
  item: {
    minWidth: MinTouchSize - 4,
    height: MinTouchSize - 4,
    borderRadius: Radius.small,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pageItem: {
    borderWidth: 0,
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
  },
  gap: {
    paddingHorizontal: Spacing.one,
  },
});
