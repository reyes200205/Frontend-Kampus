import { router, type Href } from "expo-router";
import { SymbolView } from "expo-symbols";
import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { MaxFormWidth, MinTouchSize, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type FormScreenProps = {
  title: string;
  /** A dónde ir al cerrar si no hay historial (p. ej. al recargar la página en web). */
  fallback: Href;
  submitLabel: string;
  onSubmit: () => void;
  /** El botón queda gris hasta que los campos obligatorios están llenos, como en Facebook. */
  canSubmit: boolean;
  loading?: boolean;
  children: ReactNode;
};

/**
 * Formulario a pantalla completa (como "Crear grupo" en Facebook): X para cerrar, título centrado, campos con
 * scroll y la acción principal fija abajo a lo ancho.
 */
export function FormScreen({ title, fallback, submitLabel, onSubmit, canSubmit, loading, children }: FormScreenProps) {
  const theme = useTheme();

  function close() {
    if (loading) return;
    if (router.canGoBack()) router.back();
    else router.replace(fallback);
  }

  return (
    <SafeAreaView edges={["top", "left", "right", "bottom"]} style={[styles.flex, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderColor: theme.border }]}>
        <Pressable
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
          hitSlop={Spacing.one}
          style={({ pressed }) => [styles.close, pressed && { backgroundColor: theme.backgroundSelected }]}
        >
          <SymbolView name={{ ios: "xmark", android: "close", web: "close" }} size={22} tintColor={theme.text} />
        </Pressable>
        <ThemedText type="heading" numberOfLines={1} accessibilityRole="header" style={styles.title}>
          {title}
        </ThemedText>
        {/* Mismo ancho que la X para que el título quede centrado. */}
        <View style={styles.close} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.inner}>{children}</View>
        </ScrollView>

        <View style={[styles.footer, { borderColor: theme.border }]}>
          <View style={styles.inner}>
            <Button title={submitLabel} onPress={onSubmit} loading={loading} disabled={!canSubmit || loading} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  close: {
    width: MinTouchSize,
    height: MinTouchSize,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    textAlign: "center",
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.five,
  },
  inner: {
    width: "100%",
    maxWidth: MaxFormWidth,
    alignSelf: "center",
    gap: Spacing.four,
  },
  footer: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
