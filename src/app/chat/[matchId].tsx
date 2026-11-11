import { Redirect, router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useCallback, useEffect } from "react";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ChatComposer } from "@/components/chat/chat-composer";
import { MessageBubble } from "@/components/chat/message-bubble";
import { Avatar } from "@/components/matches/avatar";
import { ThemedText } from "@/components/themed-text";
import { EmptyState } from "@/components/ui/empty-state";
import { MaxContentWidth, MinTouchSize, Radius, Spacing } from "@/constants/theme";
import {
  loadConversation,
  loadOlderMessages,
  markConversationRead,
  receiveChatMessage,
  retryChatMessage,
  sendChatMessage,
  useConversation,
} from "@/hooks/use-chat";
import { loadMatches, useMatches } from "@/hooks/use-matches";
import { useSession } from "@/hooks/use-session";
import { useTheme } from "@/hooks/use-theme";
import { isRealtimeEnabled, listenToChat } from "@/services/realtime";
import type { ChatMessage } from "@/types/chat";

/** Sin Reverb configurado, la conversación abierta se actualiza cada 8 s. */
const PollMs = 8_000;

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace("/chats");
}

/** "Hoy", "Ayer" o la fecha ("lunes 9 de noviembre"). */
function dayLabel(createdAt: string | null) {
  if (!createdAt) return "";
  const date = new Date(createdAt);
  const today = new Date();
  const days = Math.round(
    (new Date(today.toDateString()).getTime() - new Date(date.toDateString()).getTime()) / 86_400_000,
  );
  if (days <= 0) return "Hoy";
  if (days === 1) return "Ayer";
  return date.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
}

function sameDay(a: string | null, b: string | null) {
  return !!a && !!b && new Date(a).toDateString() === new Date(b).toDateString();
}

/**
 * Conversación con un match (T-16, RF-08): historial paginado, envío al instante con reintento y
 * mensajes nuevos en tiempo real por el canal privado `chat.{matchId}` (T-13 y T-14).
 */
export default function ChatScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ matchId: string }>();
  const matchId = Number(params.matchId);
  const { isSignedIn, user } = useSession();
  const myId = user?.id ?? 0;
  const { matches, status: matchesStatus } = useMatches();
  const match = matches.find((item) => item.id === matchId) ?? null;
  const conversation = useConversation(matchId);
  const { messages, status, error, errorStatus, hasMore, loadingMore } = conversation;

  // Si se abre directo (recarga en web), primero hay que traer el match para el encabezado.
  useEffect(() => {
    if (!match && matchesStatus === "idle") void loadMatches();
  }, [match, matchesStatus]);

  useFocusEffect(
    useCallback(() => {
      if (!isSignedIn || !Number.isInteger(matchId) || matchId <= 0) return;
      void loadConversation(matchId).then(() => markConversationRead(matchId, myId));

      const stopListening = listenToChat(matchId, (message) => {
        // Los propios ya llegan con la respuesta de la API.
        if (message.sender_id === myId) return;
        receiveChatMessage(message);
        void markConversationRead(matchId, myId);
      });

      const poll = isRealtimeEnabled()
        ? null
        : setInterval(() => {
            void loadConversation(matchId).then(() => markConversationRead(matchId, myId));
          }, PollMs);

      return () => {
        stopListening();
        if (poll) clearInterval(poll);
      };
    }, [isSignedIn, matchId, myId]),
  );

  // La sesión vive en memoria: al recargar la página en web hay que volver a iniciar sesión.
  if (!isSignedIn) return <Redirect href="/auth/login" />;

  const name = match?.user.name ?? "Conversación";
  const firstName = name.split(" ")[0];
  const lastMineId = messages.find((message) => message.sender_id === myId)?.id;
  const unavailable = status === "error" && (errorStatus === 404 || errorStatus === 403);

  function renderItem({ item, index }: { item: ChatMessage; index: number }) {
    const older = messages[index + 1];
    const showDay = older ? !sameDay(item.created_at, older.created_at) : !hasMore;

    return (
      <View style={styles.item}>
        {showDay && (
          <ThemedText type="caption" themeColor="textSecondary" style={styles.day}>
            {dayLabel(item.created_at)}
          </ThemedText>
        )}
        <MessageBubble
          message={item}
          mine={item.sender_id === myId}
          showStatus={item.id === lastMineId}
          onRetry={() => retryChatMessage(matchId, item.id)}
        />
      </View>
    );
  }

  let content;
  if (unavailable) {
    content = (
      <EmptyState
        icon={{ ios: "bubble.left.and.exclamationmark.bubble.right", android: "speaker_notes_off", web: "speaker_notes_off" }}
        title="Esta conversación ya no está disponible"
        message="Puede que el match ya no exista o que alguno de los dos haya bloqueado al otro."
        action={{ title: "Volver a Chats", onPress: () => router.replace("/chats") }}
      />
    );
  } else if (status === "error") {
    content = (
      <EmptyState
        icon={{ ios: "wifi.exclamationmark", android: "wifi_off", web: "wifi_off" }}
        title="No pudimos cargar los mensajes"
        message={error ?? "Revisa tu conexión e intenta de nuevo."}
        action={{ title: "Reintentar", onPress: () => void loadConversation(matchId) }}
      />
    );
  } else if (status === "loading" || status === "idle") {
    content = (
      <View style={styles.center}>
        <ActivityIndicator color={theme.accent} size="large" />
      </View>
    );
  } else {
    content = (
      <FlatList
        inverted
        data={messages}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, messages.length === 0 && styles.listEmpty]}
        onEndReached={() => void loadOlderMessages(matchId)}
        onEndReachedThreshold={0.3}
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={
          loadingMore ? <ActivityIndicator color={theme.accent} style={styles.older} /> : undefined
        }
        ListEmptyComponent={
          // FlatList ya voltea este contenido junto con la lista invertida.
          <View style={styles.emptyChat}>
            {match && <Avatar uri={match.user.photo_url} name={match.user.name} size={88} ring />}
            <ThemedText type="heading" style={styles.centerText}>
              ¡Hicieron match!
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
              Rompe el hielo y escríbele a {firstName}.
            </ThemedText>
          </View>
        }
      />
    );
  }

  return (
    <SafeAreaView edges={["top", "left", "right", "bottom"]} style={[styles.flex, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Pressable
            onPress={goBack}
            accessibilityRole="button"
            accessibilityLabel="Regresar a Chats"
            hitSlop={Spacing.two}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}
          >
            <SymbolView
              name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }}
              size={22}
              tintColor={theme.text}
            />
          </Pressable>
          {match && <Avatar uri={match.user.photo_url} name={match.user.name} size={40} />}
          <View style={styles.flex}>
            <ThemedText type="smallBold" numberOfLines={1} accessibilityRole="header">
              {name}
            </ThemedText>
            {match?.user.university && (
              <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
                {match.user.university.short_name}
              </ThemedText>
            )}
          </View>
        </View>

        <View style={styles.body}>{content}</View>

        {error && status === "ready" && (
          <ThemedText
            type="caption"
            themeColor="danger"
            accessibilityRole="alert"
            style={[styles.banner, { backgroundColor: theme.backgroundElement }]}
          >
            {error}
          </ThemedText>
        )}

        {!unavailable && (
          <View style={styles.composer}>
            <ChatComposer
              disabled={status !== "ready" || !user}
              onSend={(body) => sendChatMessage(matchId, myId, body)}
            />
          </View>
        )}
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
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  back: {
    width: MinTouchSize,
    height: MinTouchSize,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.6,
  },
  body: {
    flex: 1,
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: "center",
  },
  item: {
    gap: Spacing.two,
  },
  day: {
    alignSelf: "center",
    paddingVertical: Spacing.two,
    textTransform: "capitalize",
  },
  older: {
    paddingVertical: Spacing.three,
  },
  emptyChat: {
    alignItems: "center",
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  centerText: {
    textAlign: "center",
  },
  banner: {
    alignSelf: "center",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.full,
    marginBottom: Spacing.one,
  },
  composer: {
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
  },
});
