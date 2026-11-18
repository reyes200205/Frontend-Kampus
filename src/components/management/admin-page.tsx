import { SymbolView } from "expo-symbols";
import { Fragment, type ReactNode } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useTheme } from "@/hooks/use-theme";

/** Ancho máximo del contenido del panel: más que las pantallas del estudiante, por las tablas. */
const MaxPanelWidth = 1200;

export type AdminPageProps = {
  /** Ruta de migas encima del título, p. ej. `["Moderación", "Grupos"]`. */
  breadcrumb: string[];
  title: string;
  description?: string;
  /** Acciones a la derecha del título (p. ej. "Dar de alta"). */
  actions?: ReactNode;
  children: ReactNode;
};

/** Página del panel de gestión (T-44): migas, título, descripción, acciones y contenido ancho. */
export function AdminPage({ breadcrumb, title, description, actions, children }: AdminPageProps) {
  const theme = useTheme();
  const { isDesktop, isTablet } = useBreakpoint();

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingHorizontal: isDesktop ? Spacing.six - Spacing.four : isTablet ? Spacing.four : Spacing.three },
        ]}
      >
        <View style={styles.inner}>
          <View style={styles.breadcrumb} accessibilityRole="text">
            <SymbolView name={{ ios: "house", android: "home", web: "home" }} size={16} tintColor={theme.textSecondary} />
            {breadcrumb.map((crumb, index) => (
              <Fragment key={crumb}>
                <SymbolView
                  name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }}
                  size={14}
                  tintColor={theme.placeholder}
                />
                <ThemedText
                  type={index === breadcrumb.length - 1 ? "smallBold" : "small"}
                  themeColor={index === breadcrumb.length - 1 ? "text" : "textSecondary"}
                >
                  {crumb}
                </ThemedText>
              </Fragment>
            ))}
          </View>

          <View style={[styles.header, !isTablet && styles.headerStacked]}>
            <View style={styles.titles}>
              <ThemedText type="title" accessibilityRole="header">
                {title}
              </ThemedText>
              {description && (
                <ThemedText type="small" themeColor="textSecondary">
                  {description}
                </ThemedText>
              )}
            </View>
            {actions && <View style={styles.actions}>{actions}</View>}
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
    paddingBottom: (Platform.OS === "web" ? 0 : BottomTabInset) + Spacing.five,
  },
  inner: {
    flexGrow: 1,
    width: "100%",
    maxWidth: MaxPanelWidth,
    alignSelf: "center",
    gap: Spacing.four,
  },
  breadcrumb: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: Spacing.three,
  },
  headerStacked: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  titles: {
    flexShrink: 1,
    gap: Spacing.one,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
});
