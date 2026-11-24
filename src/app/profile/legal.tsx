import { router } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { StackHeader } from "@/components/layout/stack-header";
import { MenuGroup, MenuRow } from "@/components/ui/menu-list";
import { MaxFormWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/**
 * Privacidad y normas (Perfil → Privacidad y normas): junta en una sola entrada del perfil los documentos
 * que se aceptan al registrarse (T-23, RF-04). Cada documento sigue abriendo su propia pantalla.
 */
export default function LegalScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView edges={["top", "left", "right", "bottom"]} style={[styles.flex, { backgroundColor: theme.background }]}>
      <StackHeader title="Privacidad y normas" fallback="/profile" />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.inner}>
          <MenuGroup footer="Son los documentos que aceptaste al crear tu cuenta.">
            <MenuRow
              icon={{ ios: "lock.shield", android: "shield", web: "shield" }}
              label="Aviso de privacidad"
              onPress={() => router.push("/legal/privacy")}
            />
            <MenuRow
              icon={{ ios: "person.2", android: "diversity_3", web: "diversity_3" }}
              label="Normas de comunidad"
              onPress={() => router.push("/legal/guidelines")}
            />
          </MenuGroup>
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
});
