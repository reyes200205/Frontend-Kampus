import type { ReactNode } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { EmptyState, type EmptyStateProps } from "@/components/ui/empty-state";
import { FontFamily, Radius, Spacing } from "@/constants/theme";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useTheme } from "@/hooks/use-theme";

export type Column<T> = {
  key: string;
  title: string;
  /** Proporción del ancho en la tabla (por defecto 1). */
  flex?: number;
  /** Ancho fijo en px; gana sobre `flex`. */
  width?: number;
  align?: "left" | "right";
  render: (item: T) => ReactNode;
  /**
   * - `primary`: en celular es el encabezado de la tarjeta (p. ej. nombre y correo).
   * - `actions`: en celular va al pie de la tarjeta, sin etiqueta.
   */
  role?: "primary" | "actions";
};

export type DataTableProps<T> = {
  columns: Column<T>[];
  items: T[];
  keyExtractor: (item: T) => string | number;
  status: "loading" | "ready" | "error";
  error?: string | null;
  onRetry?: () => void;
  empty: EmptyStateProps;
  /** Debajo de las filas (p. ej. la paginación). */
  footer?: ReactNode;
};

/**
 * Tabla del panel de gestión (T-44). Desde tableta es una tabla con encabezado y filas; en celular
 * cada fila se vuelve una tarjeta con la columna `primary` arriba y el resto como "etiqueta: valor".
 */
export function DataTable<T>({
  columns,
  items,
  keyExtractor,
  status,
  error,
  onRetry,
  empty,
  footer,
}: DataTableProps<T>) {
  const theme = useTheme();
  const { isTablet } = useBreakpoint();

  const cellStyle = (column: Column<T>) => [
    column.width ? { width: column.width } : { flex: column.flex ?? 1 },
    column.align === "right" && styles.alignRight,
  ];

  let body: ReactNode;
  if (status === "loading" && items.length === 0) {
    body = (
      <View style={styles.state}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  } else if (status === "error" && items.length === 0) {
    body = (
      <View style={styles.state}>
        <ThemedText type="small" themeColor="danger" style={styles.center}>
          {error}
        </ThemedText>
        {onRetry && <Button title="Reintentar" variant="secondary" onPress={onRetry} />}
      </View>
    );
  } else if (items.length === 0) {
    body = <EmptyState {...empty} />;
  } else if (isTablet) {
    body = items.map((item, index) => (
      <View
        key={keyExtractor(item)}
        style={[styles.row, index > 0 && { borderTopWidth: 1, borderColor: theme.border }]}
      >
        {columns.map((column) => (
          <View key={column.key} style={[styles.cell, ...cellStyle(column)]}>
            {/* Envuelto para que los elementos con `alignSelf` propio (p. ej. `Badge`) respeten la alineación. */}
            <View style={column.align === "right" ? styles.endContent : styles.startContent}>{column.render(item)}</View>
          </View>
        ))}
      </View>
    ));
  } else {
    const primary = columns.find((column) => column.role === "primary");
    const actions = columns.find((column) => column.role === "actions");
    const details = columns.filter((column) => !column.role);
    body = items.map((item, index) => (
      <View
        key={keyExtractor(item)}
        style={[styles.card, index > 0 && { borderTopWidth: 1, borderColor: theme.border }]}
      >
        {primary?.render(item)}
        {details.map((column) => (
          <View key={column.key} style={styles.detail}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>{column.title}</Text>
            <View style={styles.detailValue}>{column.render(item)}</View>
          </View>
        ))}
        {actions && <View style={styles.cardActions}>{actions.render(item)}</View>}
      </View>
    ));
  }

  return (
    <View style={styles.wrapper}>
      <View style={[styles.table, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        {isTablet && (
          <View style={[styles.headerRow, { backgroundColor: theme.background, borderColor: theme.border }]}>
            {columns.map((column) => (
              <View key={column.key} style={[styles.cell, ...cellStyle(column)]}>
                <Text style={[styles.headerText, { color: theme.textSecondary }]}>{column.title}</Text>
              </View>
            ))}
          </View>
        )}
        {/* Al cambiar de página se quedan las filas anteriores, atenuadas, hasta que llegan las nuevas. */}
        <View style={status === "loading" && items.length > 0 && styles.reloading}>{body}</View>
      </View>
      {status === "error" && items.length > 0 && (
        <ThemedText type="small" themeColor="danger">
          {error}
        </ThemedText>
      )}
      {footer}
    </View>
  );
}

export type TableToolbarProps = {
  title: string;
  /** Total de registros (p. ej. `meta.total`). */
  count?: number;
  /** Buscador, filtros y botones a la derecha. */
  children?: ReactNode;
};

/** Barra encima de una tabla: título con el total y, a la derecha, buscador y filtros. */
export function TableToolbar({ title, count, children }: TableToolbarProps) {
  const theme = useTheme();
  const { isTablet } = useBreakpoint();

  return (
    <View style={[styles.toolbar, !isTablet && styles.toolbarStacked]}>
      <Text style={[styles.toolbarTitle, { color: theme.text }]}>
        {title}
        {count !== undefined && <Text style={{ color: theme.textSecondary }}>{`  ${count}`}</Text>}
      </Text>
      {children && <View style={[styles.toolbarActions, !isTablet && styles.toolbarActionsStacked]}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.three,
  },
  table: {
    borderWidth: 1,
    borderRadius: Radius.large,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
    borderBottomWidth: 1,
    gap: Spacing.three,
  },
  headerText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.three,
  },
  cell: {
    minWidth: 0,
  },
  alignRight: {
    alignItems: "flex-end",
  },
  startContent: {
    alignSelf: "stretch",
  },
  endContent: {
    alignSelf: "flex-end",
  },
  card: {
    padding: Spacing.three,
    gap: Spacing.two + 2,
  },
  detail: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.three,
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
  detailValue: {
    flexShrink: 1,
    alignItems: "flex-end",
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: Spacing.one,
  },
  state: {
    alignItems: "center",
    gap: Spacing.three,
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.three,
  },
  center: {
    textAlign: "center",
  },
  reloading: {
    opacity: 0.5,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.three,
  },
  toolbarStacked: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  toolbarTitle: {
    fontSize: 18,
    fontFamily: FontFamily.semibold,
  },
  toolbarActions: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  toolbarActionsStacked: {
    alignItems: "stretch",
  },
});
