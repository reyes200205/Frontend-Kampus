import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MaxFormWidth, Radius, Spacing } from "@/constants/theme";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useTheme } from "@/hooks/use-theme";

/**
 * Contenedor de las pantallas de acceso: fondo con brillo de marca, safe area, teclado y scroll.
 * En celular el formulario ocupa la pantalla; desde tablet se muestra como tarjeta centrada.
 */
export function AuthScreen({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const { isTablet } = useBreakpoint();

  return (
    <LinearGradient
      colors={[theme.glow, theme.background]}
      locations={[0, isTablet ? 0.45 : 0.25]}
      style={[styles.flex, { backgroundColor: theme.background }]}
    >
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={[styles.scroll, isTablet && styles.scrollCentered]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[
                styles.content,
                isTablet && [
                  styles.card,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                ],
              ]}
            >
              {children}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.three,
  },
  scrollCentered: {
    justifyContent: "center",
    paddingVertical: Spacing.five,
  },
  content: {
    flexGrow: 1,
    width: "100%",
    maxWidth: MaxFormWidth,
    alignSelf: "center",
    gap: Spacing.five,
  },
  card: {
    flexGrow: 0,
    padding: Spacing.five,
    borderRadius: Radius.large,
    borderWidth: 1,
  },
});
