import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { Children, Fragment, isValidElement, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { MinTouchSize, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/** Ícono de las filas; el separador se alinea con el texto a partir de este ancho. */
const IconSize = 24;
const PaddingX = Spacing.three + 4;

export type MenuGroupProps = {
  children: ReactNode;
  /** Título gris encima de la tarjeta. */
  title?: string;
  /** Nota gris debajo de la tarjeta. */
  footer?: string;
  /** `false` si las filas no llevan ícono: el separador empieza desde el borde del texto. */
  withIcons?: boolean;
};

/**
 * Lista agrupada estilo ajustes (como los menús de WhatsApp): tarjeta redondeada sin borde y
 * separadores que empiezan donde empieza el texto, no bajo el ícono.
 */
export function MenuGroup({ children, title, footer, withIcons = true }: MenuGroupProps) {
  const theme = useTheme();
  const rows = Children.toArray(children).filter(isValidElement);

  return (
    <View style={styles.group}>
      {title && (
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.note}>
          {title}
        </ThemedText>
      )}
      <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
        {rows.map((row, index) => (
          <Fragment key={row.key ?? index}>
            {index > 0 && (
              <View
                style={[
                  styles.divider,
                  { backgroundColor: theme.border, marginLeft: withIcons ? PaddingX + IconSize + Spacing.three : PaddingX },
                ]}
              />
            )}
            {row}
          </Fragment>
        ))}
      </View>
      {footer && (
        <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
          {footer}
        </ThemedText>
      )}
    </View>
  );
}

export type MenuRowProps = {
  label: string;
  onPress: () => void;
  icon?: SymbolViewProps["name"];
  /** Dato corto debajo del texto (p. ej. la zona elegida). */
  value?: string;
  /** Algo a la izquierda de la flecha (p. ej. una miniatura). */
  trailing?: ReactNode;
  /** Acción que saca al usuario (cerrar sesión): en rojo y sin flecha. */
  destructive?: boolean;
};

export function MenuRow({ label, onPress, icon, value, trailing, destructive }: MenuRowProps) {
  const theme = useTheme();
  const tint = destructive ? theme.danger : theme.text;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={destructive ? "button" : "link"}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.backgroundSelected }]}
    >
      {icon && <SymbolView name={icon} size={IconSize} tintColor={tint} />}
      <View style={styles.flex}>
        <ThemedText style={[styles.label, { color: tint }]}>{label}</ThemedText>
        {value && (
          <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
            {value}
          </ThemedText>
        )}
      </View>
      {trailing}
      {!destructive && (
        <SymbolView
          name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }}
          size={18}
          tintColor={theme.textSecondary}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  group: {
    gap: Spacing.two,
  },
  note: {
    paddingHorizontal: PaddingX,
  },
  card: {
    borderRadius: Radius.large,
    overflow: "hidden",
  },
  row: {
    minHeight: MinTouchSize + 12,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    paddingHorizontal: PaddingX,
    paddingVertical: Spacing.two + 4,
  },
  label: {
    fontSize: 17,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginRight: PaddingX,
  },
});
