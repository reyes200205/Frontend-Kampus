import { router } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ChatStylePreview } from "@/components/chat/chat-wallpaper";
import { StackHeader } from "@/components/layout/stack-header";
import { MenuGroup, MenuRow } from "@/components/ui/menu-list";
import { MaxFormWidth, Radius, Spacing } from "@/constants/theme";
import { useChatStyle } from "@/hooks/use-chat-style";
import { useTheme } from "@/hooks/use-theme";

/**
 * Apariencia (Perfil → Apariencia): por ahora solo el estilo predeterminado del chat. Cada ajuste
 * nuevo va en su propio `MenuGroup`.
 */
export default function AppearanceScreen() {
  const theme = useTheme();
  const chatStyle = useChatStyle();

  return (
    <SafeAreaView edges={["top", "left", "right", "bottom"]} style={[styles.flex, { backgroundColor: theme.background }]}>
      <StackHeader title="Apariencia" fallback="/profile" />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.inner}>
          <MenuGroup
            withIcons={false}
            footer="Elige el color de tus mensajes y el fondo de tus conversaciones."
          >
            <MenuRow
              label="Estilo predeterminado del chat"
              onPress={() => router.push("/profile/chat-style")}
              trailing={
                <ChatStylePreview
                  wallpaper={chatStyle.wallpaper}
                  bubble={chatStyle.bubble}
                  width={24}
                  style={[styles.thumb, { borderColor: theme.border }]}
                />
              }
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
  thumb: {
    borderRadius: Radius.small / 2,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
