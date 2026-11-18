import { SymbolView } from "expo-symbols";
import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { MinTouchSize, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type DialogProps = {
  visible: boolean;
  title: string;
  description?: string;
  /** Cierra con el fondo, la X o el botón atrás de Android. No se llama mientras `busy`. */
  onClose: () => void;
  children?: ReactNode;
  /** Botones de abajo a la derecha (p. ej. Cancelar y la acción principal). */
  footer?: ReactNode;
  /** Mientras se guarda, el diálogo no se puede cerrar. */
  busy?: boolean;
  /** Ancho máximo; los formularios largos usan más. */
  maxWidth?: number;
};

/** Ventana encima de la pantalla para confirmar una acción o llenar un formulario corto. */
export function Dialog({
  visible,
  title,
  description,
  onClose,
  children,
  footer,
  busy,
  maxWidth = 480,
}: DialogProps) {
  const theme = useTheme();
  const close = () => {
    if (!busy) onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close} statusBarTranslucent>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.center}>
          <Pressable
            style={[StyleSheet.absoluteFill, styles.backdrop]}
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
          />
          <View
            accessibilityViewIsModal
            style={[
              styles.panel,
              { maxWidth, backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          >
            <View style={styles.header}>
              <View style={styles.flex}>
                <ThemedText type="heading" accessibilityRole="header">
                  {title}
                </ThemedText>
                {description && (
                  <ThemedText type="small" themeColor="textSecondary">
                    {description}
                  </ThemedText>
                )}
              </View>
              <Pressable
                onPress={close}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
                hitSlop={Spacing.two}
                style={({ pressed }) => [styles.close, pressed && { backgroundColor: theme.backgroundSelected }]}
              >
                <SymbolView
                  name={{ ios: "xmark", android: "close", web: "close" }}
                  size={20}
                  tintColor={theme.textSecondary}
                />
              </Pressable>
            </View>

            {children && (
              <ScrollView
                style={styles.body}
                contentContainerStyle={styles.bodyContent}
                keyboardShouldPersistTaps="handled"
              >
                {children}
              </ScrollView>
            )}

            {footer && <View style={[styles.footer, { borderColor: theme.border }]}>{footer}</View>}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.three,
  },
  backdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  panel: {
    width: "100%",
    maxHeight: "90%",
    borderRadius: Radius.large,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.three,
    padding: Spacing.four,
    paddingBottom: Spacing.three,
  },
  close: {
    width: MinTouchSize - 8,
    height: MinTouchSize - 8,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flexGrow: 0,
  },
  bodyContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    gap: Spacing.four,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderTopWidth: 1,
  },
});
