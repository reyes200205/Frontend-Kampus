/** Props compartidas por `kampus-map.web.tsx` (maplibre-gl) y `kampus-map.tsx` (WebView en iOS y Android). */

import type { StyleProp, ViewStyle } from "react-native";

export type Coordinate = { lat: number; lng: number };

/**
 * Punto en el mapa. Siempre es un lugar público (el centro de una zona), nunca la ubicación exacta de
 * una persona (RNF-11). En T-30 se usa para los avatares de cada zona.
 */
export type MapMarker = {
  id: string;
  coordinate: Coordinate;
  /** Texto para lectores de pantalla y la etiqueta junto al punto. */
  label?: string;
};

export type KampusMapProps = {
  center: Coordinate;
  /** Zoom inicial. Por defecto se ve un barrio completo. */
  zoom?: number;
  markers?: MapMarker[];
  onMarkerPress?: (id: string) => void;
  /** `false` deja el mapa fijo (sin arrastrar ni hacer zoom), p. ej. en una vista previa. */
  interactive?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export const MapDefaults = {
  zoom: 14,
  minZoom: 10,
  /** Más cerca no tiene sentido: las zonas miden alrededor de 1 km (RNF-11). */
  maxZoom: 17,
} as const;

/** Versión de maplibre-gl que se carga dentro del WebView; debe coincidir con `package.json`. */
export const MapLibreVersion = "5.24.1";

/** Clase y estilos del punto de cada marcador, iguales en web y en el WebView. */
export function markerCss(accent: string, onAccent: string, background: string) {
  return `
.kampus-marker { display: flex; align-items: center; gap: 6px; cursor: pointer; background: none; border: 0; padding: 0; font-family: inherit; }
.kampus-marker__dot { width: 16px; height: 16px; border-radius: 999px; background: ${accent}; border: 3px solid ${background}; box-shadow: 0 0 0 6px ${accent}33; }
.kampus-marker__label { padding: 2px 8px; border-radius: 999px; background: ${accent}; color: ${onAccent}; font-size: 12px; font-weight: 600; white-space: nowrap; }
.maplibregl-ctrl-attrib, .maplibregl-ctrl-attrib.maplibregl-compact { background: ${background}cc !important; color: #A1A1AA; }
.maplibregl-ctrl-attrib a { color: #A1A1AA !important; }
.maplibregl-ctrl-attrib-button { filter: invert(1); background-color: transparent !important; }
.maplibregl-ctrl-group { background: ${background} !important; border: 1px solid #2C2C33; }
.maplibregl-ctrl-group button + button { border-top-color: #2C2C33 !important; }
.maplibregl-ctrl-group button .maplibregl-ctrl-icon { filter: invert(1); }
`;
}
