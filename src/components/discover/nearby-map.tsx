import { router, useFocusEffect } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { ExpandedProfile } from "@/components/discover/expanded-profile";
import { NearbyCard } from "@/components/discover/nearby-card";
import { sortedPhotos } from "@/components/discover/swipe-card";
import { KampusMap } from "@/components/map/kampus-map";
import type { Coordinate, MapMarker } from "@/components/map/kampus-map.types";
import { MatchModal } from "@/components/matches/match-modal";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { MinTouchSize, Radius, Spacing } from "@/constants/theme";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useNearby } from "@/hooks/use-nearby";
import { useTheme } from "@/hooks/use-theme";
import type { NearbyUser } from "@/types/discovery";

/** Ancho de la ficha rápida en tableta y escritorio, flotando en la esquina del mapa. */
const CardWidth = 380;
const MeMarkerId = "me";
const userMarkerId = (id: number) => `user-${id}`;

export type NearbyMapProps = {
  /** Centro mientras llega la respuesta de la API: el de la celda propia. */
  fallbackCenter: Coordinate;
  /** Cambia al actualizar la ubicación; entonces se vuelve a pedir quién está cerca. */
  cell: string;
  height: number;
};

/**
 * Mapa de "Cerca" con quienes están cerca (T-30, RF-19, RNF-11). Cada persona aparece con su foto en el
 * punto que manda la API (desplazado de 150 a 500 m de su celda); al tocarla se abre su ficha rápida y de
 * ahí el perfil expandido. "Pasar" y "Me interesa" funcionan igual que en Descubrir.
 */
export function NearbyMap({ fallbackCenter, cell, height }: NearbyMapProps) {
  const theme = useTheme();
  const { isTablet } = useBreakpoint();
  const nearby = useNearby();
  const { load, select } = nearby;
  const [profile, setProfile] = useState<NearbyUser | null>(null);

  // Al entrar a la pestaña (o al cambiar la celda) se vuelve a preguntar quién está cerca.
  useFocusEffect(
    useCallback(() => {
      if (cell) void load();
    }, [load, cell]),
  );

  if (nearby.status === "error" && nearby.errorCode === "profile_incomplete") {
    return (
      <EmptyState
        icon={{ ios: "person.crop.circle.badge.exclamationmark", android: "person_alert", web: "person_alert" }}
        title="Completa tu perfil"
        message="Para ver quién está cerca, tu perfil necesita tus datos, al menos una foto y algo sobre ti."
        action={{ title: "Completar mi perfil", onPress: () => router.push("/onboarding") }}
      />
    );
  }

  const center = nearby.center ?? fallbackCenter;
  const markers: MapMarker[] = [
    { id: MeMarkerId, coordinate: center, label: "Tú" },
    ...nearby.users.map(
      (user): MapMarker => ({
        id: userMarkerId(user.id),
        kind: "avatar",
        coordinate: user.nearby.position,
        label: user.name,
        photoUrl: sortedPhotos(user)[0]?.temporary_url ?? null,
        selected: user.id === nearby.selected?.id,
      }),
    ),
  ];

  function handleMarkerPress(id: string) {
    const user = nearby.users.find((item) => userMarkerId(item.id) === id);
    select(user ? user.id : null);
  }

  function decide(user: NearbyUser, liked: boolean) {
    setProfile(null);
    void nearby.decide(user, liked);
  }

  return (
    <View style={styles.wrapper}>
      <View style={[styles.mapBox, { height, borderColor: theme.border }]}>
        <KampusMap
          center={center}
          fitTo={nearby.focus ?? undefined}
          markers={markers}
          onMarkerPress={handleMarkerPress}
          onPress={() => select(null)}
          accessibilityLabel="Mapa de quienes están cerca de ti"
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.topLeft} pointerEvents="box-none">
          <StatusPill status={nearby.status} count={nearby.users.length} radiusKm={nearby.radiusKm} />
          {nearby.notice && (
            <Pressable
              onPress={nearby.dismissNotice}
              accessibilityRole="alert"
              accessibilityHint="Toca para cerrar el aviso"
              style={[styles.pill, { backgroundColor: theme.backgroundElement, borderColor: theme.danger }]}
            >
              <ThemedText type="caption" themeColor="danger">
                {nearby.notice}
              </ThemedText>
            </Pressable>
          )}
        </View>

        {nearby.status === "error" && (
          <View style={[styles.errorBox, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <ThemedText type="smallBold">No pudimos cargar quién está cerca</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {nearby.error ?? "Revisa tu conexión e intenta de nuevo."}
            </ThemedText>
            <Button title="Reintentar" variant="secondary" onPress={() => void load()} />
          </View>
        )}

        {nearby.selected && (
          <NearbyCard
            key={nearby.selected.id}
            user={nearby.selected}
            onOpenProfile={() => setProfile(nearby.selected)}
            onDecide={(liked) => nearby.selected && decide(nearby.selected, liked)}
            onClose={() => select(null)}
            style={[styles.card, isTablet && styles.cardWide]}
          />
        )}
      </View>

      <View style={[styles.notice, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <SymbolView name={{ ios: "lock.fill", android: "lock", web: "lock" }} size={16} tintColor={theme.textSecondary} />
        <ThemedText type="caption" themeColor="textSecondary" style={styles.flex}>
          Solo mostramos ubicaciones aproximadas, nunca la exacta de nadie.
        </ThemedText>
      </View>

      <ExpandedProfile
        card={profile}
        onClose={() => setProfile(null)}
        onDecide={(liked) => profile && decide(profile, liked)}
      />

      <MatchModal
        match={nearby.match}
        onClose={nearby.dismissMatch}
        onSeeMatches={() => {
          nearby.dismissMatch();
          router.navigate("/chats");
        }}
      />
    </View>
  );
}

/** Cuántas personas hay cerca, encima del mapa. */
function StatusPill({
  status,
  count,
  radiusKm,
}: {
  status: ReturnType<typeof useNearby>["status"];
  count: number;
  radiusKm: number | null;
}) {
  const theme = useTheme();

  if (status === "error") return null;

  const radius = radiusKm ? ` a menos de ${radiusKm} km` : "";
  const text =
    status !== "ready"
      ? "Buscando gente cerca…"
      : count === 0
        ? "Nadie cerca por ahora"
        : count === 1
          ? `1 persona${radius}`
          : `${count} personas${radius}`;

  return (
    <View
      style={[styles.pill, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
      accessibilityLiveRegion="polite"
    >
      {status !== "ready" ? (
        <ActivityIndicator size="small" color={theme.accent} />
      ) : (
        <SymbolView name={{ ios: "person.2.fill", android: "group", web: "group" }} size={14} tintColor={theme.accent} />
      )}
      <ThemedText type="caption">{text}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  wrapper: {
    gap: Spacing.three,
  },
  mapBox: {
    borderRadius: Radius.large,
    borderWidth: 1,
    overflow: "hidden",
  },
  topLeft: {
    position: "absolute",
    top: Spacing.three,
    left: Spacing.three,
    // Deja libres los botones de zoom de la esquina derecha.
    right: Spacing.six,
    alignItems: "flex-start",
    gap: Spacing.two,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    minHeight: 32,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  errorBox: {
    position: "absolute",
    left: Spacing.three,
    right: Spacing.three,
    bottom: Spacing.three,
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.large,
    borderWidth: 1,
  },
  card: {
    position: "absolute",
    left: Spacing.three,
    right: Spacing.three,
    bottom: Spacing.three,
  },
  cardWide: {
    right: undefined,
    width: CardWidth,
  },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    alignSelf: "flex-start",
    minHeight: MinTouchSize - Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
});
