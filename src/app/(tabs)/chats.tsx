import { router } from "expo-router";

import { Screen } from "@/components/layout/screen";
import { EmptyState } from "@/components/ui/empty-state";

// TODO (T-12, T-16): fila de nuevos matches y lista de conversaciones.
export default function ChatsScreen() {
  return (
    <Screen title="Chats">
      <EmptyState
        icon={{
          ios: "bubble.left.and.bubble.right",
          android: "forum",
          web: "forum",
        }}
        title="Aún no tienes matches"
        message="¡Sigue explorando perfiles en tu campus! Cuando alguien también te dé “Me interesa”, podrán chatear aquí."
        action={{ title: "Descubrir conexiones", onPress: () => router.navigate("/") }}
      />
    </Screen>
  );
}
