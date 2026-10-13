import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import type { LegalDocument } from "@/constants/legal";
import { MaxContentWidth, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/** Pantalla de lectura para un documento legal: encabezado con botón de cerrar y secciones. */
export function LegalDocumentView({ document }: { document: LegalDocument }) {
  const theme = useTheme();

  function handleClose() {
    // Si se abrió el enlace directo (web), no hay pantalla a la cual regresar.
    if (router.canGoBack()) router.back();
    else router.replace("/auth/register");
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <ThemedText type="smallBold" style={styles.headerTitle} numberOfLines={1}>
          {document.title}
        </ThemedText>
        <Pressable
          onPress={handleClose}
          hitSlop={Spacing.two}
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
          style={[styles.close, { backgroundColor: theme.backgroundElement }]}
        >
          <SymbolView
            name={{ ios: "xmark", android: "close", web: "close" }}
            size={16}
            tintColor={theme.text}
          />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inner}>
          <ThemedText type="subtitle" style={styles.title}>
            {document.title}
          </ThemedText>
          <ThemedText type="small" themeColor="placeholder">
            Última actualización: {document.updatedAt}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.paragraph}>
            {document.intro}
          </ThemedText>

          {document.sections.map((section) => (
            <View key={section.title} style={styles.section}>
              <ThemedText type="smallBold" style={styles.sectionTitle}>
                {section.title}
              </ThemedText>
              {section.paragraphs?.map((paragraph) => (
                <ThemedText
                  key={paragraph}
                  type="small"
                  themeColor="textSecondary"
                  style={styles.paragraph}
                >
                  {paragraph}
                </ThemedText>
              ))}
              {section.bullets?.map((bullet) => (
                <View key={bullet} style={styles.bullet}>
                  <View style={[styles.dot, { backgroundColor: theme.accent }]} />
                  <ThemedText
                    type="small"
                    themeColor="textSecondary"
                    style={[styles.paragraph, styles.flex]}
                  >
                    {bullet}
                  </ThemedText>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
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
    justifyContent: "space-between",
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    flex: 1,
  },
  close: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.six,
  },
  inner: {
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
    gap: Spacing.two,
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
  },
  section: {
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  sectionTitle: {
    fontSize: 15,
  },
  paragraph: {
    lineHeight: 22,
  },
  bullet: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.two,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: Radius.full,
    marginTop: 9,
  },
});
