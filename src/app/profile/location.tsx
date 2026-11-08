import * as Location from "expo-location";
import { router } from "expo-router";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { Screen } from "@/components/layout/screen";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Spacing } from "@/constants/theme";
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
    .sort((a, b) => Number(b.university_id === user?.university_id) - Number(a.university_id === user?.university_id));
  const neighborhoods = zones.filter((zone) => zone.type === "colonia");
  const selectedId = location?.zone?.id ?? null;

  async function chooseZone(zone: Zone | null) {
    if (busy || zone?.id === selectedId) return;
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

  const done = <Button title="Listo" variant="ghost" onPress={() => router.back()} />;

  if (!location) {
    return (
      <Screen title="Zona y Cerca de ti" action={done}>
        <Card style={styles.state}>
          {loading || !error ? (
            <ActivityIndicator color={theme.accent} />
          ) : (
            <>
              <ThemedText type="small" themeColor="danger" style={styles.center}>
                {error}
              </ThemedText>
              <Button title="Reintentar" variant="secondary" onPress={() => void loadLocation({ withZones: true })} />
            </>
          )}
        </Card>
      </Screen>
    );
  }

  return (
    <Screen
      title="Zona y Cerca de ti"
      subtitle="Ayuda a que te encuentren estudiantes cerca de ti, sin mostrar dónde estás."
      action={done}
    >
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="heading" style={styles.flex}>
            Tu zona
          </ThemedText>
          {busy === "zone" && <ActivityIndicator color={theme.accent} />}
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          Elige tu campus y, si quieres, tu colonia. Se muestra en tu perfil y en el mapa de Cerca.
        </ThemedText>

        <ThemedText type="smallBold" themeColor="textSecondary">
          Campus
        </ThemedText>
        <View style={styles.chips}>
          {campuses.map((zone) => (
            <Chip key={zone.id} label={zone.name} selected={zone.id === selectedId} onPress={() => void chooseZone(zone)} />
          ))}
        </View>

        <ThemedText type="smallBold" themeColor="textSecondary">
          Colonias
        </ThemedText>
        <View style={styles.chips}>
          {neighborhoods.map((zone) => (
            <Chip key={zone.id} label={zone.name} selected={zone.id === selectedId} onPress={() => void chooseZone(zone)} />
          ))}
        </View>

        {selectedId !== null && (
          <Button
            title="Quitar mi zona"
            variant="ghost"
            disabled={busy !== null}
            onPress={() => void chooseZone(null)}
            style={styles.alignStart}
          />
        )}
      </View>

      <View style={styles.section}>
        <ThemedText type="heading">Cerca de ti</ThemedText>

        {location.nearby_enabled ? (
          <Card highlighted style={styles.nearbyCard}>
            <View style={styles.row}>
              <SymbolView
                name={{ ios: "location.circle.fill", android: "my_location", web: "my_location" }}
                size={28}
                tintColor={theme.accent}
              />
              <View style={styles.flex}>
                <ThemedText type="smallBold">Cerca de ti está activo</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Compartes una celda aproximada de 1 km. Actualízala si cambias de lugar.
                </ThemedText>
              </View>
            </View>
            <Button
              title="Actualizar mi ubicación"
              variant="secondary"
              icon={{ ios: "arrow.clockwise", android: "refresh", web: "refresh" }}
              loading={busy === "nearby"}
              disabled={busy !== null}
              onPress={() => void turnOnNearby()}
            />
            <Button title="Apagar Cerca de ti" variant="ghost" disabled={busy !== null} onPress={() => void turnOffNearby()} />
          </Card>
        ) : (
          <Card style={styles.nearbyCard}>
            <ThemedText type="small" themeColor="textSecondary">
              Al activarlo te pediremos permiso para usar tu ubicación. Antes, esto es lo que compartes:
            </ThemedText>
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
            <Button
              title="Activar Cerca de ti"
              icon={{ ios: "location", android: "near_me", web: "near_me" }}
              loading={busy === "nearby"}
              disabled={busy !== null}
              onPress={() => void turnOnNearby()}
            />
          </Card>
        )}
      </View>

      {message && (
        <ThemedText
          type="small"
          themeColor={message.danger ? "danger" : "textSecondary"}
          accessibilityRole="alert"
        >
          {message.text}
        </ThemedText>
      )}
    </Screen>
  );
}

function Point({ icon, text }: { icon: SymbolViewProps["name"]; text: string }) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <SymbolView name={icon} size={20} tintColor={theme.accent} />
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
  state: {
    alignItems: "center",
    gap: Spacing.three,
    paddingVertical: Spacing.five,
  },
  section: {
    gap: Spacing.three,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  alignStart: {
    alignSelf: "flex-start",
  },
  nearbyCard: {
    gap: Spacing.three,
    padding: Spacing.four,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
});
