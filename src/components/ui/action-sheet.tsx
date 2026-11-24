import { SymbolView, type SymbolViewProps } from "expo-symbols";
import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { MaxFormWidth, MinTouchSize, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type ActionSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Título opcional arriba de las opciones. */
  title?: string;
  children: ReactNode;
};

/**
 * Hoja que sube desde abajo con opciones (como el "+" de Grupos en Facebook). En escritorio queda centrada
 * con el ancho de un formulario.
 */
export function ActionSheet({ visible, onClose, title, children }: ActionSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.flex}>
        <Pressable style={[StyleSheet.absoluteFill, styles.backdrop]} onPress={onClose} accessibilityLabel="Cerrar" />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
              paddingBottom: Math.max(insets.bottom, Spacing.three),
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
          {title && (
            <ThemedText type="smallBold" style={styles.title}>
              {title}
            </ThemedText>
          )}
          {children}
        </View>
      </View>
    </Modal>
  );
}

export type ActionSheetItemProps = {
  icon: SymbolViewProps["name"];
  title: string;
  description?: string;
  onPress: () => void;
  disabled?: boolean;
};

/** Opción de la hoja: ícono en círculo, título y una línea que explica qué hace. */
export function ActionSheetItem({ icon, title, description, onPress, disabled }: ActionSheetItemProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.item,
        pressed && { backgroundColor: theme.backgroundSelected },
        disabled && styles.disabled,
      ]}
    >
      <View style={[styles.icon, { backgroundColor: theme.backgroundSelected }]}>
        <SymbolView name={icon} size={20} tintColor={theme.text} />
      </View>
      <View style={styles.flex}>
        <ThemedText style={styles.itemTitle}>{title}</ThemedText>
        {description && (
          <ThemedText type="small" themeColor="textSecondary">
            {description}
          </ThemedText>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  backdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    maxWidth: MaxFormWidth,
    alignSelf: "center",
    paddingTop: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderTopLeftRadius: Radius.large,
    borderTopRightRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
    gap: Spacing.one,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: Spacing.two,
  },
  title: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.one,
  },
  item: {
    minHeight: MinTouchSize + 8,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.medium,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  itemTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.45,
  },
});
