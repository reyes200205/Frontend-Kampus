import { SymbolView } from "expo-symbols";
import { useEffect, useRef, type ComponentRef, type ReactNode } from "react";
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

/**
 * En web, al abrir el teclado del celular solo queda a la vista el espacio de arriba y el navegador no siempre
 * desplaza el área con scroll del diálogo hasta el campo enfocado (en iPhone se quedaba tapado). Cuando el teclado
 * termina de abrir, se lleva el campo enfocado a la vista dentro del diálogo.
 */
function useRevealFocusedField(visible: boolean) {
  const panelRef = useRef<ComponentRef<typeof View>>(null);

  useEffect(() => {
    if (Platform.OS !== "web" || !visible) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const reveal = () => {
      const panel = panelRef.current as unknown as HTMLElement | null;
      const field = document.activeElement;
      if (panel && field instanceof HTMLElement && panel.contains(field)) {
        field.scrollIntoView({ block: "nearest" });
      }
    };
    // El teclado tarda en abrir; antes de eso el campo todavía está a la vista.
    const onFocusIn = () => {
      clearTimeout(timer);
      timer = setTimeout(reveal, 350);
    };
    document.addEventListener("focusin", onFocusIn);
    window.visualViewport?.addEventListener("resize", reveal);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("focusin", onFocusIn);
      window.visualViewport?.removeEventListener("resize", reveal);
    };
  }, [visible]);

  return panelRef;
}

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
  const panelRef = useRevealFocusedField(visible);
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
            ref={panelRef}
            accessibilityViewIsModal
            style={[
              styles.panel,
              { maxWidth, backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          >
            {/* Título, descripción y campos van juntos en el área con scroll; los botones quedan fijos abajo.
                Así, con el teclado abierto y poco espacio, el campo no queda escondido detrás del encabezado. */}
            <ScrollView
              style={styles.body}
              contentContainerStyle={[styles.bodyContent, !children && styles.bodyContentEmpty]}
              keyboardShouldPersistTaps="handled"
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

              {children && <View style={styles.content}>{children}</View>}
            </ScrollView>

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
    paddingTop: Spacing.four,
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
    flexShrink: 1,
  },
  bodyContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  bodyContentEmpty: {
    paddingBottom: 0,
  },
  content: {
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
