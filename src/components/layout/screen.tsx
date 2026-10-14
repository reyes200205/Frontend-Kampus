import type { ReactNode } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useTheme } from "@/hooks/use-theme";

export type ScreenProps = {
  title: string;
  subtitle?: string;
  /** Acción a la derecha del título (p. ej. botón de filtros o "Crear grupo"). */
  action?: ReactNode;
  children: ReactNode;
};

/**
 * Layout base de las pantallas con pestañas: safe area, encabezado, scroll y
 * contenido centrado con ancho máximo para que no se estire en escritorio (RNF-01).
 */
export function Screen({ title, subtitle, action, children }: ScreenProps) {
  const theme = useTheme();
  const { isDesktop } = useBreakpoint();

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingHorizontal: isDesktop ? Spacing.five : Spacing.three },
        ]}
      >
        <View style={styles.inner}>
          <View style={styles.header}>
            <View style={styles.flex}>
              <ThemedText type="title" accessibilityRole="header">
                {title}
              </ThemedText>
              {subtitle && (
                <ThemedText type="small" themeColor="textSecondary">
                  {subtitle}
                </ThemedText>
              )}
            </View>
            {action}
          </View>
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingTop: Spacing.four,
    // En iOS y Android la barra de pestañas nativa queda encima del contenido.
    paddingBottom: (Platform.OS === "web" ? 0 : BottomTabInset) + Spacing.four,
  },
  inner: {
    flexGrow: 1,
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
    gap: Spacing.four,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
});
