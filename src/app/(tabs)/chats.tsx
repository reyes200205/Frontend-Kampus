import { router, useFocusEffect } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useCallback } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { Screen } from "@/components/layout/screen";
import { Avatar } from "@/components/matches/avatar";
import { ThemedText } from "@/components/themed-text";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Radius, Spacing } from "@/constants/theme";
import { loadMatches, loadMoreMatches, useMatches } from "@/hooks/use-matches";
import { useTheme } from "@/hooks/use-theme";
import type { Match } from "@/types/discovery";

/** Un match de las últimas 24 horas se marca como nuevo. */
const NewMatchMs = 24 * 60 * 60 * 1000;

/**
 * Chats (T-12): fila de nuevos matches y lista de conversaciones. La conversación llega con T-14
 * (API de mensajes) y T-16 (pantallas de chat); mientras tanto, la lista muestra los matches.
 */
export default function ChatsScreen() {
  const theme = useTheme();
  const { matches, status, error, hasMore, loadingMore } = useMatches();

  // Al entrar a la pestaña: aparecen los matches que creó la otra persona y se renuevan las fotos.
  useFocusEffect(
    useCallback(() => {
      void loadMatches();
    }, []),
  );

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

  return (
    <Screen
      title="Chats"
      subtitle={`${matches.length}${hasMore ? "+" : ""} ${matches.length === 1 && !hasMore ? "match" : "matches"}`}
    >
      <View style={styles.section}>
        <ThemedText type="smallBold" themeColor="textSecondary" accessibilityRole="header">
          Nuevos matches
        </ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bubbles}>
          {matches.map((match) => (
            <MatchBubble key={match.id} match={match} />
          ))}
          {hasMore && <MoreBubble loading={loadingMore} onPress={() => void loadMoreMatches()} />}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <ThemedText type="smallBold" themeColor="textSecondary" accessibilityRole="header">
          Conversaciones
        </ThemedText>
        <Card style={styles.soon}>
          <SymbolView
            name={{ ios: "bubble.left.and.bubble.right", android: "forum", web: "forum" }}
            size={24}
            tintColor={theme.accent}
          />
          <View style={styles.flex}>
            <ThemedText type="smallBold">El chat llega muy pronto</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Podrás escribirle a cualquiera de tus matches desde aquí.
            </ThemedText>
          </View>
        </Card>
        {matches.map((match) => (
          <MatchRow key={match.id} match={match} />
        ))}
      </View>

      {error && (
        <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
          {error}
        </ThemedText>
      )}
    </Screen>
  );
}

function isNew(match: Match) {
  return match.matched_at !== null && Date.now() - new Date(match.matched_at).getTime() < NewMatchMs;
}

/** "Hoy", "Ayer" o la fecha corta ("2 nov"). */
function matchedLabel(matchedAt: string | null) {
  if (!matchedAt) return "";
  const date = new Date(matchedAt);
  const today = new Date();
  const days = Math.round(
    (new Date(today.toDateString()).getTime() - new Date(date.toDateString()).getTime()) / 86_400_000,
  );
  if (days <= 0) return "Hoy";
  if (days === 1) return "Ayer";
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

function MatchBubble({ match }: { match: Match }) {
  const firstName = match.user.name.split(" ")[0];

  return (
    <View style={styles.bubble} accessible accessibilityLabel={`Match con ${match.user.name}`}>
      <Avatar uri={match.user.photo_url} name={match.user.name} size={64} ring={isNew(match)} />
      <ThemedText type="caption" numberOfLines={1} style={styles.bubbleName}>
        {firstName}
      </ThemedText>
    </View>
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

function MatchRow({ match }: { match: Match }) {
  const theme = useTheme();
  const { user } = match;

  return (
    <View style={[styles.row, { borderColor: theme.border }]}>
      <Avatar uri={user.photo_url} name={user.name} size={48} />
      <View style={styles.flex}>
        <ThemedText type="smallBold" numberOfLines={1}>
          {user.name}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {user.university?.short_name ?? "Kampus"} · Hicieron match
        </ThemedText>
      </View>
      <View style={styles.rowMeta}>
        <ThemedText type="caption" themeColor="textSecondary">
          {matchedLabel(match.matched_at)}
        </ThemedText>
        {isNew(match) && (
          <View style={[styles.newBadge, { backgroundColor: theme.accent }]}>
            <ThemedText type="caption" style={{ color: theme.onAccent }}>
              Nuevo
            </ThemedText>
          </View>
        )}
      </View>
    </View>
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
  soon: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
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
  newBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.full,
  },
});
