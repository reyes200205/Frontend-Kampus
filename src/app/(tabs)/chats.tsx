import { router, useFocusEffect } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useCallback } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { Screen } from "@/components/layout/screen";
import { Avatar } from "@/components/matches/avatar";
import { ThemedText } from "@/components/themed-text";
import { EmptyState } from "@/components/ui/empty-state";
import { Radius, Spacing } from "@/constants/theme";
import { isUnread, lastMessage, useConversations } from "@/hooks/use-chat";
import { loadMatches, loadMoreMatches, useMatches } from "@/hooks/use-matches";
import { useSession } from "@/hooks/use-session";
import { useTheme } from "@/hooks/use-theme";
import type { ChatMessage } from "@/types/chat";
import type { Match } from "@/types/discovery";

/** Un match de las últimas 24 horas se marca como nuevo. */
const NewMatchMs = 24 * 60 * 60 * 1000;

/**
 * Chats (T-12 y T-16): arriba, los matches con los que todavía no hay mensajes; abajo, las
 * conversaciones ordenadas por el último mensaje, con una vista previa y la marca de no leído.
 */
export default function ChatsScreen() {
  const theme = useTheme();
  const { user } = useSession();
  const myId = user?.id ?? 0;
  const { matches, status, error, hasMore, loadingMore } = useMatches();
  const conversations = useConversations();

  // Al entrar a la pestaña: aparecen los matches que creó la otra persona y se renuevan las fotos.
  useFocusEffect(
    useCallback(() => {
      void loadMatches();
    }, []),
  );

  // Las vistas previas y los mensajes en tiempo real los mantiene `useChatRealtime` (en las pestañas).

  if (status === "loading" || (status === "idle" && matches.length === 0)) {
    return (
      <Screen title="Chats">
        <View style={styles.center}>
          <ActivityIndicator color={theme.accent} size="large" />
        </View>
      </Screen>
    );
  }

  if (status === "error") {
    return (
      <Screen title="Chats">
        <EmptyState
          icon={{ ios: "wifi.exclamationmark", android: "wifi_off", web: "wifi_off" }}
          title="No pudimos cargar tus matches"
          message={error ?? "Revisa tu conexión e intenta de nuevo."}
          action={{ title: "Reintentar", onPress: () => void loadMatches() }}
        />
      </Screen>
    );
  }

  if (matches.length === 0) {
    return (
      <Screen title="Chats">
        <EmptyState
          icon={{ ios: "bubble.left.and.bubble.right", android: "forum", web: "forum" }}
          title="Aún no tienes matches"
          message="¡Sigue explorando perfiles en tu campus! Cuando alguien también te dé “Me interesa”, podrán chatear aquí."
          action={{ title: "Descubrir conexiones", onPress: () => router.navigate("/") }}
        />
      </Screen>
    );
  }

  const withLast = matches.map((match) => ({ match, last: lastMessage(conversations[match.id]) }));
  // Sin mensajes: van en la fila de nuevos matches. Mientras llega la vista previa, se quedan abajo
  // como "Hicieron match" para que no salten de un lado a otro.
  const fresh = withLast.filter((item) => item.last === null);
  const chats = withLast
    .filter((item) => item.last !== null)
    .sort((a, b) => activity(b.match, b.last) - activity(a.match, a.last));
  const unreadCount = chats.filter((item) => isUnread(item.last, myId)).length;

  return (
    <Screen
      title="Chats"
      subtitle={
        unreadCount > 0
          ? `${unreadCount} ${unreadCount === 1 ? "conversación sin leer" : "conversaciones sin leer"}`
          : `${matches.length}${hasMore ? "+" : ""} ${matches.length === 1 && !hasMore ? "match" : "matches"}`
      }
    >
      {(fresh.length > 0 || hasMore) && (
        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary" accessibilityRole="header">
            Nuevos matches
          </ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bubbles}>
            {fresh.map(({ match }) => (
              <MatchBubble key={match.id} match={match} />
            ))}
            {hasMore && <MoreBubble loading={loadingMore} onPress={() => void loadMoreMatches()} />}
          </ScrollView>
        </View>
      )}

      <View style={styles.section}>
        <ThemedText type="smallBold" themeColor="textSecondary" accessibilityRole="header">
          Conversaciones
        </ThemedText>
        {chats.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            Todavía no hay mensajes. Toca a uno de tus matches para escribirle.
          </ThemedText>
        ) : (
          chats.map(({ match, last }) => <ConversationRow key={match.id} match={match} last={last} myId={myId} />)
        )}
      </View>

      {error && (
        <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
          {error}
        </ThemedText>
      )}
    </Screen>
  );
}

function openChat(match: Match) {
  router.push({ pathname: "/chat/[matchId]", params: { matchId: String(match.id) } });
}

function isNew(match: Match) {
  return match.matched_at !== null && Date.now() - new Date(match.matched_at).getTime() < NewMatchMs;
}

/** Momento de la última actividad: el último mensaje o, si no se conoce, cuándo hicieron match. */
function activity(match: Match, last: ChatMessage | null | undefined) {
  const date = last?.created_at ?? match.matched_at;
  return date ? new Date(date).getTime() : 0;
}

/** "14:05" si es de hoy, "Ayer" o la fecha corta ("2 nov"). */
function timeLabel(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const today = new Date();
  const days = Math.round(
    (new Date(today.toDateString()).getTime() - new Date(date.toDateString()).getTime()) / 86_400_000,
  );
  if (days <= 0) return date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  if (days === 1) return "Ayer";
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

function MatchBubble({ match }: { match: Match }) {
  const firstName = match.user.name.split(" ")[0];

  return (
    <Pressable
      onPress={() => openChat(match)}
      accessibilityRole="button"
      accessibilityLabel={`Escribirle a ${match.user.name}`}
      style={({ pressed }) => [styles.bubble, pressed && styles.pressed]}
    >
      <Avatar uri={match.user.photo_url} name={match.user.name} size={64} ring={isNew(match)} />
      <ThemedText type="caption" numberOfLines={1} style={styles.bubbleName}>
        {firstName}
      </ThemedText>
    </Pressable>
  );
}

function MoreBubble({ loading, onPress }: { loading: boolean; onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel="Ver más matches"
      style={styles.bubble}
    >
      <View style={[styles.more, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
        {loading ? (
          <ActivityIndicator color={theme.accent} />
        ) : (
          <SymbolView name={{ ios: "ellipsis", android: "more_horiz", web: "more_horiz" }} size={22} tintColor={theme.text} />
        )}
      </View>
      <ThemedText type="caption" themeColor="textSecondary">
        Ver más
      </ThemedText>
    </Pressable>
  );
}

function ConversationRow({ match, last, myId }: { match: Match; last: ChatMessage | null | undefined; myId: number }) {
  const theme = useTheme();
  const { user } = match;
  const unread = isUnread(last, myId);
  const mine = last?.sender_id === myId;
  const preview = !last
    ? `${user.university?.short_name ?? "Kampus"} · Hicieron match`
    : last.type === "text"
      ? `${mine ? "Tú: " : ""}${last.body ?? ""}`
      : `${mine ? "Tú: " : ""}Imagen`;

  return (
    <Pressable
      onPress={() => openChat(match)}
      accessibilityRole="button"
      accessibilityLabel={`Conversación con ${user.name}${unread ? ", mensaje sin leer" : ""}. ${preview}`}
      style={({ pressed }) => [styles.row, { borderColor: theme.border }, pressed && styles.pressed]}
    >
      <Avatar uri={user.photo_url} name={user.name} size={52} ring={unread} />
      <View style={styles.flex}>
        <ThemedText type="smallBold" numberOfLines={1}>
          {user.name}
        </ThemedText>
        <ThemedText
          type={unread ? "smallBold" : "small"}
          themeColor={unread ? "text" : "textSecondary"}
          numberOfLines={1}
        >
          {preview}
        </ThemedText>
      </View>
      <View style={styles.rowMeta}>
        <ThemedText type="caption" themeColor={unread ? "accentText" : "textSecondary"}>
          {timeLabel(last?.created_at ?? match.matched_at)}
        </ThemedText>
        {unread && <View style={[styles.dot, { backgroundColor: theme.accent }]} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.six,
  },
  section: {
    gap: Spacing.three,
  },
  bubbles: {
    gap: Spacing.three,
    paddingRight: Spacing.three,
  },
  bubble: {
    width: 72,
    alignItems: "center",
    gap: Spacing.one,
  },
  bubbleName: {
    maxWidth: 72,
  },
  more: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.7,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowMeta: {
    alignItems: "flex-end",
    gap: Spacing.one,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: Radius.full,
  },
});
