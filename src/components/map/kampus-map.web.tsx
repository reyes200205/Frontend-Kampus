/**
 * Mapa base de Kampus en web y escritorio (T-29): maplibre-gl con el estilo oscuro de
 * `map-style.ts` sobre los tiles gratuitos de OpenFreeMap.
 */

import "maplibre-gl/dist/maplibre-gl.css";

import type { Map as MapLibreMap, Marker, MarkerOptions } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

import { MapStatusOverlay } from "@/components/map/map-status-overlay";
import { KampusMapStyle } from "@/constants/map-style";
import { useTheme } from "@/hooks/use-theme";

import { MapDefaults, markerCss, type Coordinate, type KampusMapProps, type MapMarker } from "./kampus-map.types";

type Status = "loading" | "ready" | "error";
type MapLibre = typeof import("maplibre-gl");

/**
 * maplibre-gl se importa al usarse porque toca `window` y la web se prerenderiza en el servidor
 * (`web.output: static`). Es un paquete UMD: según el bundler llega con o sin `default`.
 */
async function loadMapLibre(): Promise<MapLibre> {
  const mod = (await import("maplibre-gl")) as MapLibre & { default?: MapLibre };
  return mod.default ?? mod;
}

export function KampusMap({
  center,
  zoom = MapDefaults.zoom,
  fitTo,
  markers = [],
  onMarkerPress,
  onPress,
  interactive = true,
  style,
  accessibilityLabel = "Mapa",
}: KampusMapProps) {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const onMarkerPressRef = useRef(onMarkerPress);
  const onPressRef = useRef(onPress);
  const [status, setStatus] = useState<Status>("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    onMarkerPressRef.current = onMarkerPress;
    onPressRef.current = onPress;
  });

  // Se crea una sola vez (o al reintentar).
  useEffect(() => {
    let cancelled = false;
    let map: MapLibreMap | null = null;

    loadMapLibre().then((maplibregl) => {
      if (cancelled || !containerRef.current) return;

      map = new maplibregl.Map({
        container: containerRef.current,
        style: KampusMapStyle,
        center: [center.lng, center.lat],
        zoom,
        minZoom: MapDefaults.minZoom,
        maxZoom: MapDefaults.maxZoom,
        interactive,
        attributionControl: { compact: true },
        // El mapa es plano: sin rotar ni inclinar.
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
      });
      map.touchZoomRotate.disableRotation();
      if (interactive) map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

      // Los marcadores son botones fuera del canvas: este click solo llega al tocar el mapa.
      map.on("click", () => onPressRef.current?.());
      map.once("load", () => setStatus("ready"));
      map.on("error", () => {
        // Un tile suelto que falla no tumba el mapa; solo si el estilo nunca terminó de cargar.
        if (!map?.loaded()) setStatus("error");
      });
      mapRef.current = map;
    });

    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
    };
    // Centro y zoom se aplican abajo sin recrear el mapa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive, attempt]);

  const fitKey = fitTo && fitTo.length > 0 ? JSON.stringify(fitTo) : null;

  useEffect(() => {
    if (fitKey) return;
    mapRef.current?.easeTo({ center: [center.lng, center.lat], zoom });
  }, [center.lat, center.lng, zoom, fitKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready" || !fitKey) return;
    const points: Coordinate[] = JSON.parse(fitKey);
    const lngs = points.map((point) => point.lng);
    const lats = points.map((point) => point.lat);
    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: MapDefaults.fitPadding, maxZoom: MapDefaults.fitMaxZoom, duration: 700 },
    );
  }, [fitKey, status]);

  const markersKey = JSON.stringify(markers);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;

    let cancelled = false;
    loadMapLibre().then((maplibregl) => {
      if (cancelled) return;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = markers.map((item) => {
        const element = createMarkerElement(item);
        element.addEventListener("click", (event) => {
          event.stopPropagation();
          onMarkerPressRef.current?.(item.id);
        });
        const placement: MarkerOptions =
          item.kind === "avatar" ? { anchor: "center" } : { anchor: "left", offset: [-8, 0] };
        return new maplibregl.Marker({ element, ...placement })
          .setLngLat([item.coordinate.lng, item.coordinate.lat])
          .addTo(map);
      });
    });

    return () => {
      cancelled = true;
    };
    // `markersKey` evita recrear los marcadores si el arreglo es nuevo pero con lo mismo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markersKey, status]);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.backgroundElement }, style]}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      <style>{markerCss(theme.accent, theme.onAccent, theme.background)}</style>
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />
      <MapStatusOverlay
        status={status}
        onRetry={() => {
          setStatus("loading");
          setAttempt((n) => n + 1);
        }}
      />
    </View>
  );
}

/** Debe dibujar lo mismo que `createMarker` dentro del HTML del WebView (`map-webview-html.ts`). */
function createMarkerElement(item: MapMarker) {
  const element = document.createElement("button");
  element.type = "button";
  element.className = "kampus-marker" + (item.selected ? " kampus-marker--selected" : "");
  element.setAttribute("aria-label", item.label ?? "Marcador");
  element.style.zIndex = item.selected ? "3" : item.kind === "avatar" ? "2" : "1";

  if (item.kind === "avatar") {
    const avatar = document.createElement("span");
    avatar.className = "kampus-avatar";
    const showInitial = () => {
      avatar.textContent = "";
      const initial = document.createElement("span");
      initial.className = "kampus-avatar__initial";
      initial.textContent = (item.label ?? "?").trim().charAt(0).toUpperCase();
      avatar.appendChild(initial);
    };
    if (item.photoUrl) {
      const img = document.createElement("img");
      img.src = item.photoUrl;
      img.alt = "";
      img.draggable = false;
      img.addEventListener("error", showInitial);
      avatar.appendChild(img);
    } else {
      showInitial();
    }
    element.appendChild(avatar);
    return element;
  }

  const dot = document.createElement("span");
  dot.className = "kampus-marker__dot";
  element.appendChild(dot);

  if (item.label) {
    const text = document.createElement("span");
    text.className = "kampus-marker__label";
    text.textContent = item.label;
    element.appendChild(text);
  }
  return element;
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
});
