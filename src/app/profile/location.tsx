import * as Location from "expo-location";
import { router } from "expo-router";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { useEffect, useState, type ReactNode } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { MaxFormWidth, MinTouchSize, Radius, Spacing } from "@/constants/theme";
import { loadLocation, setLocation, useLocation } from "@/hooks/use-location";
import { useSession } from "@/hooks/use-session";
import { useTheme } from "@/hooks/use-theme";
import { ApiError } from "@/services/api";
import { disableNearby, enableNearby, setZone } from "@/services/location";
import type { Zone } from "@/types/location";
import { encodeGeohash } from "@/utils/geohash";

type Busy = "zone" | "nearby" | null;

function apiMessage(e: unknown, fallback: string) {
  return e instanceof ApiError ? e.message : fallback;
}

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace("/profile");
}

/**
 * Zona y "Cerca de ti" (T-36, RF-18 y RNF-11). El alumno elige su campus o colonia del catálogo y,
 * si quiere, activa "Cerca de ti": antes de pedir el permiso se explica qué se comparte, y del GPS
 * solo sale la celda de ~1 km (geohash de 6 caracteres), nunca la coordenada.
 */
export default function LocationScreen() {
  const theme = useTheme();
  const { user } = useSession();
  const { location, zones, loading, error } = useLocation();
  const [busy, setBusy] = useState<Busy>(null);
  const [message, setMessage] = useState<{ text: string; danger?: boolean } | null>(null);

  useEffect(() => {
    void loadLocation({ withZones: true });
  }, []);

  // Primero los campus (el de su universidad al inicio) y después las colonias.
  const campuses = zones
    .filter((zone) => zone.type === "campus")
    .sort(
      (a, b) =>
        Number(b.university_id === user?.university_id) - Number(a.university_id === user?.university_id),
    );
  const neighborhoods = zones.filter((zone) => zone.type === "colonia");
  const selected = location?.zone ?? null;

  async function chooseZone(zone: Zone | null) {
    if (busy || zone?.id === selected?.id) return;
    setBusy("zone");
    setMessage(null);
    try {
      setLocation(await setZone(zone?.id ?? null));
    } catch (e) {
      setMessage({ text: apiMessage(e, "No se pudo guardar tu zona."), danger: true });
    } finally {
      setBusy(null);
    }
  }

  async function turnOnNearby() {
    setBusy("nearby");
    setMessage(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        setMessage({
          text: permission.canAskAgain
            ? "Sin el permiso de ubicación no podemos activar Cerca de ti."
            : "Kampus no tiene permiso de ubicación. Actívalo en los ajustes de tu celular para usar Cerca de ti.",
          danger: true,
        });
        return;
      }
      // Precisión equilibrada: alcanza para una celda de ~1 km y gasta menos batería que la alta.
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const geohash = encodeGeohash(position.coords.latitude, position.coords.longitude);
      setLocation(await enableNearby(geohash));
      setMessage({ text: "Listo. Apareces en Cerca de ti con tu zona aproximada." });
    } catch (e) {
      setMessage({
        text:
          e instanceof ApiError
            ? e.message
            : "No pudimos obtener tu ubicación. Revisa que el GPS esté encendido e intenta de nuevo.",
        danger: true,
      });
    } finally {
      setBusy(null);
    }
  }

  async function turnOffNearby() {
    setBusy("nearby");
    setMessage(null);
    try {
      setLocation(await disableNearby());
      setMessage({ text: "Cerca de ti está apagado y borramos tu celda." });
    } catch (e) {
      setMessage({ text: apiMessage(e, "No se pudo apagar Cerca de ti."), danger: true });
    } finally {
      setBusy(null);
    }
  }

  return (
    <SafeAreaView edges={["top", "left", "right", "bottom"]} style={[styles.flex, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Regresar a tu perfil"
          hitSlop={Spacing.two}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <SymbolView
            name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }}
            size={22}
            tintColor={theme.text}
          />
        </Pressable>
        <ThemedText type="heading" numberOfLines={1} accessibilityRole="header" style={styles.flex}>
          Zona y Cerca de ti
        </ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.inner}>
          {!location ? (
            <Card style={styles.state}>
              {loading || !error ? (
                <ActivityIndicator color={theme.accent} />
              ) : (
                <>
                  <ThemedText type="small" themeColor="danger" style={styles.center}>
                    {error}
                  </ThemedText>
                  <Button
                    title="Reintentar"
                    variant="secondary"
                    onPress={() => void loadLocation({ withZones: true })}
                  />
                </>
              )}
            </Card>
          ) : (
            <>
              <ThemedText type="small" themeColor="textSecondary">
                Ayuda a que te encuentren estudiantes cerca de ti, sin mostrar dónde estás.
              </ThemedText>

              <Card style={styles.card}>
                <CardHeader
                  icon={{ ios: "mappin.and.ellipse", android: "location_on", web: "location_on" }}
                  title="Tu zona"
                  subtitle={selected ? selected.name : "Sin zona elegida"}
                  trailing={busy === "zone" ? <ActivityIndicator color={theme.accent} /> : undefined}
                />
                <ThemedText type="small" themeColor="textSecondary">
                  Elige tu campus o tu colonia. Se muestra en tu perfil y en el mapa de Cerca.
                </ThemedText>

                {zones.length === 0 ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    Todavía no hay zonas disponibles. Intenta más tarde.
                  </ThemedText>
                ) : (
                  <>
                    <ZoneGroup title="Campus" zones={campuses} selectedId={selected?.id} onChoose={chooseZone} />
                    <ZoneGroup title="Colonias" zones={neighborhoods} selectedId={selected?.id} onChoose={chooseZone} />
                  </>
                )}

                {selected && (
                  <Button
                    title="Quitar mi zona"
                    variant="ghost"
                    disabled={busy !== null}
                    onPress={() => void chooseZone(null)}
                  />
                )}
              </Card>

              <Card highlighted={location.nearby_enabled} style={styles.card}>
                <CardHeader
                  icon={{ ios: "location.circle", android: "my_location", web: "my_location" }}
                  title="Cerca de ti"
                  subtitle={location.nearby_enabled ? "Compartes una zona aproximada" : "No compartes tu ubicación"}
                  trailing={<StatusPill active={location.nearby_enabled} />}
                />

                {location.nearby_enabled ? (
                  <>
                    <ThemedText type="small" themeColor="textSecondary">
                      Apareces con una celda de alrededor de 1 km. Actualízala si cambias de lugar.
                    </ThemedText>
                    <Button
                      title="Actualizar mi ubicación"
                      variant="secondary"
                      icon={{ ios: "arrow.clockwise", android: "refresh", web: "refresh" }}
                      loading={busy === "nearby"}
                      disabled={busy !== null}
                      onPress={() => void turnOnNearby()}
                    />
                    <Button
                      title="Apagar Cerca de ti"
                      variant="ghost"
                      disabled={busy !== null}
                      onPress={() => void turnOffNearby()}
                    />
                  </>
                ) : (
                  <>
                    <ThemedText type="small" themeColor="textSecondary">
                      Te pediremos permiso para usar tu ubicación. Esto es lo que compartes:
                    </ThemedText>
                    <View style={styles.points}>
                      <Point
                        icon={{ ios: "square.grid.3x3", android: "grid_on", web: "grid_on" }}
                        text="Solo una celda de alrededor de 1 km. Tu ubicación exacta nunca sale de tu celular."
                      />
                      <Point
                        icon={{ ios: "mappin.and.ellipse", android: "location_on", web: "location_on" }}
                        text="En el mapa apareces en el centro de tu zona, no donde estás."
                      />
                      <Point
                        icon={{ ios: "trash", android: "delete", web: "delete" }}
                        text="Puedes apagarlo cuando quieras y tu celda se borra."
                      />
                    </View>
                    <Button
                      title="Activar Cerca de ti"
                      icon={{ ios: "location", android: "near_me", web: "near_me" }}
                      loading={busy === "nearby"}
                      disabled={busy !== null}
                      onPress={() => void turnOnNearby()}
                    />
                  </>
                )}
              </Card>

              {message && (
                <ThemedText
                  type="small"
                  themeColor={message.danger ? "danger" : "textSecondary"}
                  accessibilityRole="alert"
                  style={styles.center}
                >
                  {message.text}
                </ThemedText>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/** Encabezado de una tarjeta: ícono en círculo, título, dato corto y algo a la derecha. */
function CardHeader({
  icon,
  title,
  subtitle,
  trailing,
}: {
  icon: SymbolViewProps["name"];
  title: string;
  subtitle: string;
  trailing?: ReactNode;
}) {
  const theme = useTheme();

  return (
    <View style={styles.cardHeader}>
      <View style={[styles.iconCircle, { backgroundColor: theme.backgroundSelected }]}>
        <SymbolView name={icon} size={20} tintColor={theme.accent} />
      </View>
      <View style={styles.flex}>
        <ThemedText type="smallBold">{title}</ThemedText>
        <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
          {subtitle}
        </ThemedText>
      </View>
      {trailing}
    </View>
  );
}

function ZoneGroup({
  title,
  zones,
  selectedId,
  onChoose,
}: {
  title: string;
  zones: Zone[];
  selectedId: number | undefined;
  onChoose: (zone: Zone) => void;
}) {
  if (zones.length === 0) return null;

  return (
    <View style={styles.group}>
      <ThemedText type="caption" themeColor="textSecondary">
        {title.toUpperCase()}
      </ThemedText>
      <View style={styles.chips}>
        {zones.map((zone) => (
          <Chip key={zone.id} label={zone.name} selected={zone.id === selectedId} onPress={() => onChoose(zone)} />
        ))}
      </View>
    </View>
  );
}

function StatusPill({ active }: { active: boolean }) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.pill,
        active ? { backgroundColor: theme.accent } : { backgroundColor: theme.backgroundSelected },
      ]}
    >
      <ThemedText type="caption" style={{ color: active ? theme.onAccent : theme.textSecondary }}>
        {active ? "Activo" : "Apagado"}
      </ThemedText>
    </View>
  );
}

function Point({ icon, text }: { icon: SymbolViewProps["name"]; text: string }) {
  const theme = useTheme();

  return (
    <View style={styles.point}>
      <SymbolView name={icon} size={18} tintColor={theme.accent} />
      <ThemedText type="small" style={styles.flex}>
        {text}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    textAlign: "center",
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
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
  },
  inner: {
    width: "100%",
    maxWidth: MaxFormWidth,
    alignSelf: "center",
    gap: Spacing.three,
  },
  state: {
    alignItems: "center",
    gap: Spacing.three,
    paddingVertical: Spacing.five,
  },
  card: {
    gap: Spacing.three,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  group: {
    gap: Spacing.two,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  pill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.full,
  },
  points: {
    gap: Spacing.three,
  },
  point: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.three,
  },
});
