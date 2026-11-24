import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { FiltersPanel, countActiveFilters } from "@/components/discover/filters-panel";
import { firstName } from "@/components/discover/swipe-card";
import { SwipeDeck } from "@/components/discover/swipe-deck";
import { NearbyMap } from "@/components/discover/nearby-map";
import { MatchModal } from "@/components/matches/match-modal";
import { Screen } from "@/components/layout/screen";
import { ThemedText } from "@/components/themed-text";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Universities } from "@/constants/management";
import { BottomTabInset, MinTouchSize, Radius, Spacing } from "@/constants/theme";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useDiscovery } from "@/hooks/use-discovery";
import { useProfile } from "@/hooks/use-profile";
import { useSession } from "@/hooks/use-session";
import { loadLocation, useLocation } from "@/hooks/use-location";
import { useTheme } from "@/hooks/use-theme";
import { ApiError } from "@/services/api";
import { EmptyFilters, getDiscoveryFilters, saveDiscoveryFilters } from "@/services/discovery";
import { getInterests } from "@/services/profile";
import { geohashCenter } from "@/utils/geohash";
import type { DiscoveryFilters } from "@/types/discovery";
import type { Interest } from "@/types/profile";

type DiscoverMode = "for-you" | "nearby";

const MaxCardWidth = 420;
const FiltersPanelWidth = 320;
/**
 * Alto que ocupan saludo, selector, la parte de los botones que sale de la tarjeta y la barra de pestañas,
 * para que los botones queden a la vista sin hacer scroll. En nativo la barra de pestañas va encima.
 */
const ReservedHeight = Platform.OS === "web" ? 272 : 212 + BottomTabInset;
const MinCardHeight = 320;
const MinMapHeight = 360;
/** Proporción máxima alto/ancho de la tarjeta: más alta que ancha para que la foto luzca (T-31). */
const MaxCardRatio = 1.6;

export default function DiscoverScreen() {
  const [mode, setMode] = useState<DiscoverMode>("for-you");
  const { isDesktop } = useBreakpoint();
  const discovery = useDiscovery();

  const [filters, setFilters] = useState<DiscoveryFilters>(EmptyFilters);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [savingFilters, setSavingFilters] = useState(false);
  const [filtersError, setFiltersError] = useState<string | null>(null);

  // Los filtros viven en el perfil (RF-06), así que se recuperan al abrir la app.
  useEffect(() => {
    getDiscoveryFilters()
      .then(setFilters)
      .catch(() => {});
    getInterests()
      .then(setInterests)
      .catch(() => {});
  }, []);

  async function applyFilters(next: DiscoveryFilters) {
    setSavingFilters(true);
    setFiltersError(null);
    try {
      setFilters(await saveDiscoveryFilters(next));
      setFiltersOpen(false);
      discovery.reload();
    } catch (e) {
      const firstFieldError =
        e instanceof ApiError ? Object.values(e.fieldErrors)[0]?.[0] : undefined;
      setFiltersError(
        firstFieldError ?? (e instanceof ApiError ? e.message : "No se pudieron guardar los filtros."),
      );
    } finally {
      setSavingFilters(false);
    }
  }

  const activeFilters = countActiveFilters(filters);
  const panel = (
    <FiltersPanel
      // Al guardar (o al llegar de la API) el panel se reinicia con los filtros vigentes.
      key={JSON.stringify(filters)}
      value={filters}
      interests={interests}
      saving={savingFilters}
      error={filtersError}
      onApply={applyFilters}
    />
  );

  return (
    <Screen
      title="Descubrir"
      header={<Greeting />}
      action={
        mode === "for-you" && !isDesktop ? (
          <FiltersButton active={activeFilters} onPress={() => setFiltersOpen(true)} />
        ) : undefined
      }
    >
      <View style={styles.modes}>
        <Chip label="Para ti" selected={mode === "for-you"} onPress={() => setMode("for-you")} />
        <Chip label="Cerca" selected={mode === "nearby"} onPress={() => setMode("nearby")} />
      </View>

      {mode === "nearby" ? (
        <NearbyArea />
      ) : (
        <View style={[styles.forYou, isDesktop && styles.forYouDesktop]}>
          <View style={styles.deckColumn}>
            <Notices discovery={discovery} />
            <DeckArea discovery={discovery} onAdjustFilters={() => setFiltersOpen(true)} />
          </View>

          {isDesktop && (
            <Card style={styles.sidePanel}>
              <ThemedText type="heading">Filtros</ThemedText>
              {panel}
            </Card>
          )}
        </View>
      )}

      <MatchModal
        match={discovery.match}
        onClose={discovery.dismissMatch}
        onSeeMatches={() => {
          discovery.dismissMatch();
          router.navigate("/chats");
        }}
      />

      {!isDesktop && (
        <FiltersSheet visible={filtersOpen} onClose={() => setFiltersOpen(false)}>
          {panel}
        </FiltersSheet>
      )}
    </Screen>
  );
}

type Discovery = ReturnType<typeof useDiscovery>;

/** Saludo de Descubrir (como el "Hello Damien!" de las apps de citas): foto, nombre de pila y universidad. */
function Greeting() {
  const theme = useTheme();
  const { user } = useSession();
  const { profile } = useProfile();
  const photo = profile?.profile?.photos
    ? [...profile.profile.photos].sort((a, b) => a.position - b.position)[0]?.temporary_url
    : undefined;
  const name = user?.name ?? "";
  const university = Universities.find((item) => item.id === user?.university_id)?.short_name;

  return (
    <Pressable onPress={() => router.navigate("/profile")} accessibilityRole="link" style={styles.greeting}>
      {photo ? (
        <Image source={{ uri: photo }} style={[styles.avatar, { backgroundColor: theme.backgroundSelected }]} contentFit="cover" />
      ) : (
        <View style={[styles.avatar, styles.center, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText type="smallBold">{name.trim().charAt(0).toUpperCase() || "?"}</ThemedText>
        </View>
      )}
      <View style={styles.flex}>
        <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
          ¡Hola, {firstName(name) || "de nuevo"}!
        </ThemedText>
        <View style={styles.place}>
          <SymbolView name={{ ios: "mappin.and.ellipse", android: "location_on", web: "location_on" }} size={14} tintColor={theme.accentText} />
          <ThemedText type="smallBold" numberOfLines={1} style={styles.flex}>
            {university ? `Descubre gente de ${university}` : "Descubre gente de tu campus"}
          </ThemedText>
        </View>
      </View>
    </Pressable>
  );
}

/**
 * Modo "Cerca". Si el alumno no ha activado "Cerca de ti", se lo recuerda con un botón que lo lleva a
 * activarlo (T-36). Con "Cerca de ti" activo muestra el mapa con quienes están cerca (T-29 y T-30).
 */
function NearbyArea() {
  const theme = useTheme();
  const { location, loading, error } = useLocation();
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const mapHeight = Math.max(MinMapHeight, windowHeight - ReservedHeight - insets.top - insets.bottom);

  // Al volver de activarlo (o de apagarlo) en el perfil, el estado se actualiza.
  useFocusEffect(
    useCallback(() => {
      void loadLocation();
    }, []),
  );

  if (!location) {
    if (error && !loading) {
      return (
        <EmptyState
          icon={{ ios: "wifi.exclamationmark", android: "wifi_off", web: "wifi_off" }}
          title="No pudimos revisar tu ubicación"
          message={error}
          action={{ title: "Reintentar", onPress: () => void loadLocation() }}
        />
      );
    }
    return (
      <View style={[styles.center, styles.nearbyLoading]}>
        <ActivityIndicator color={theme.accent} size="large" />
      </View>
    );
  }

  if (!location.nearby_enabled) {
    return (
      <EmptyState
        icon={{ ios: "location.slash", android: "location_off", web: "location_off" }}
        title="Activa Cerca de ti"
        message="Para ver a quienes estudian cerca, primero comparte tu ubicación aproximada. Solo se comparte una celda de 1 km, nunca tu ubicación exacta."
        action={{ title: "Activar Cerca de ti", onPress: () => router.push("/profile/location") }}
      />
    );
  }

  // Activo pero sin celda guardada (p. ej. se borró): hay que volver a compartirla.
  if (!location.geohash) {
    return (
      <EmptyState
        icon={{ ios: "location.slash", android: "location_off", web: "location_off" }}
        title="Actualiza tu ubicación"
        message="No tenemos tu ubicación aproximada. Vuelve a compartirla para ver quién está cerca."
        action={{ title: "Actualizar ubicación", onPress: () => router.push("/profile/location") }}
      />
    );
  }

  // Mientras responde la API, el mapa se centra en la última celda de ~1 km que compartiste (solo tú la
  // ves). La zona declarada ya no se usa en Cerca.
  return (
    <NearbyMap fallbackCenter={geohashCenter(location.geohash)} cell={location.geohash} height={mapHeight} />
  );
}

function DeckArea({ discovery, onAdjustFilters }: { discovery: Discovery; onAdjustFilters: () => void }) {
  const theme = useTheme();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { isDesktop } = useBreakpoint();

  const cardWidth = Math.min(
    MaxCardWidth,
    isDesktop ? windowWidth : windowWidth - Spacing.three * 2,
  );
  const cardHeight = Math.max(
    MinCardHeight,
    Math.min(cardWidth * MaxCardRatio, windowHeight - ReservedHeight - insets.top - insets.bottom),
  );

  if (discovery.status === "loading") {
    return (
      <View style={[styles.center, { height: cardHeight }]}>
        <ActivityIndicator color={theme.accent} size="large" />
      </View>
    );
  }

  // El perfil dejó de estar completo (p. ej. borró su única foto): se le pide terminarlo (T-49).
  if (discovery.status === "error" && discovery.errorCode === "profile_incomplete") {
    return (
      <EmptyState
        icon={{ ios: "person.crop.circle.badge.exclamationmark", android: "person_alert", web: "person_alert" }}
        title="Completa tu perfil"
        message="Para descubrir a otros estudiantes, tu perfil necesita tus datos, al menos una foto y algo sobre ti."
        action={{ title: "Completar mi perfil", onPress: () => router.push("/onboarding") }}
      />
    );
  }

  if (discovery.status === "error") {
    return (
      <EmptyState
        icon={{ ios: "wifi.exclamationmark", android: "wifi_off", web: "wifi_off" }}
        title="No pudimos cargar perfiles"
        message={discovery.error ?? "Revisa tu conexión e intenta de nuevo."}
        action={{ title: "Reintentar", onPress: discovery.reload }}
      />
    );
  }

  if (discovery.cards.length === 0) {
    if (!discovery.exhausted) {
      return (
        <View style={[styles.center, { height: cardHeight }]}>
          <ActivityIndicator color={theme.accent} size="large" />
        </View>
      );
    }
    return (
      <EmptyState
        icon={{ ios: "rectangle.stack", android: "style", web: "style" }}
        title="Ya viste a todos por ahora"
        message="Cambia tus filtros para conocer a más estudiantes, o vuelve más tarde."
        action={isDesktop ? undefined : { title: "Ajustar filtros", onPress: onAdjustFilters }}
      />
    );
  }

  return (
    <SwipeDeck cards={discovery.cards} width={cardWidth} height={cardHeight} onDecide={discovery.decide} />
  );
}

/** Aviso sobre el mazo cuando no se pudo guardar un swipe. El match se muestra en `MatchModal`. */
function Notices({ discovery }: { discovery: Discovery }) {
  const { error, status } = discovery;

  if (!error || status !== "ready") return null;

  return (
    <Card style={styles.notice}>
      <ThemedText type="small" themeColor="danger" accessibilityRole="alert" style={styles.flex}>
        {error}
      </ThemedText>
      <CloseButton label="Cerrar aviso" onPress={discovery.dismissError} />
    </Card>
  );
}

function FiltersButton({ active, onPress }: { active: number; onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={active > 0 ? `Filtros, ${active} activos` : "Filtros"}
      style={({ pressed }) => [
        styles.filtersButton,
        { backgroundColor: theme.backgroundElement, borderColor: active > 0 ? theme.accent : theme.border },
        pressed && styles.pressed,
      ]}
    >
      <SymbolView
        name={{ ios: "line.3.horizontal.decrease", android: "tune", web: "tune" }}
        size={20}
        tintColor={theme.text}
      />
      {active > 0 && (
        <View style={[styles.badge, { backgroundColor: theme.accent }]}>
          <ThemedText type="caption" style={{ color: theme.onAccent }}>
            {active}
          </ThemedText>
        </View>
      )}
    </Pressable>
  );
}

/** Hoja inferior con los filtros en móvil y tableta. */
function FiltersSheet({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const theme = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Cerrar filtros" />
        <SafeAreaView
          edges={["bottom"]}
          style={[styles.sheet, { backgroundColor: theme.background, borderColor: theme.border }]}
        >
          <View style={styles.sheetHeader}>
            <ThemedText type="heading" accessibilityRole="header" style={styles.flex}>
              Filtros
            </ThemedText>
            <CloseButton label="Cerrar filtros" onPress={onClose} />
          </View>
          <ScrollView contentContainerStyle={styles.sheetContent}>{children}</ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function CloseButton({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={(MinTouchSize - 24) / 2}
    >
      <SymbolView name={{ ios: "xmark", android: "close", web: "close" }} size={20} tintColor={theme.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  modes: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  greeting: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two + 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
  },
  place: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
  },
  forYou: {
    gap: Spacing.four,
  },
  forYouDesktop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  deckColumn: {
    flex: 1,
    gap: Spacing.three,
  },
  sidePanel: {
    width: FiltersPanelWidth,
    padding: Spacing.four,
    gap: Spacing.four,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  nearbyLoading: {
    flexGrow: 1,
    paddingVertical: Spacing.six,
  },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
  filtersButton: {
    width: MinTouchSize,
    height: MinTouchSize,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.85,
  },
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  sheet: {
    maxHeight: "88%",
    borderTopLeftRadius: Radius.large,
    borderTopRightRadius: Radius.large,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
  },
  sheetContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
});
