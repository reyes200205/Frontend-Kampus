/** Props compartidas por `kampus-map.web.tsx` (maplibre-gl) y `kampus-map.tsx` (WebView en iOS y Android). */

import type { StyleProp, ViewStyle } from "react-native";

export type Coordinate = { lat: number; lng: number };

/**
 * Punto en el mapa. Nunca es la ubicación exacta de una persona: en Cerca la API ya lo manda desplazado
 * de 150 a 500 m desde su celda de ~1 km (RNF-11).
 */
export type MapMarker = {
  id: string;
  coordinate: Coordinate;
  /**
   * Texto para lectores de pantalla. En un `dot` también se muestra junto al punto; en un `avatar`, su
   * primera letra se usa si no hay foto.
   */
  label?: string;
  /** `dot`: punto con etiqueta (p. ej. "Tú"). `avatar`: foto redonda de una persona (T-30). */
  kind?: "dot" | "avatar";
  photoUrl?: string | null;
  /** Resalta el avatar con el color de acento y lo pone encima de los demás. */
  selected?: boolean;
};

export type KampusMapProps = {
  center: Coordinate;
  /** Zoom inicial. Por defecto se ve un barrio completo. */
  zoom?: number;
  /**
   * Puntos que deben quedar a la vista. Cuando cambian, el mapa se encuadra para mostrarlos todos
   * (sin pasar de `MapDefaults.fitMaxZoom`) en lugar de usar `center` y `zoom`.
   */
  fitTo?: Coordinate[];
  markers?: MapMarker[];
  onMarkerPress?: (id: string) => void;
  /** Toque en el mapa fuera de un marcador (p. ej. para cerrar una ficha). */
  onPress?: () => void;
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
  /** Al encuadrar varios puntos no se acerca más que esto, aunque estén juntos. */
  fitMaxZoom: 15,
  /** Margen en píxeles alrededor de los puntos encuadrados (deja espacio a los avatares). */
  fitPadding: 72,
} as const;

/** Versión de maplibre-gl que se carga dentro del WebView; debe coincidir con `package.json`. */
export const MapLibreVersion = "5.24.1";

/** Diámetro del avatar de una persona en el mapa. */
export const AvatarSize = 44;

/** Clase y estilos de los marcadores, iguales en web y en el WebView. */
export function markerCss(accent: string, onAccent: string, background: string) {
  return `
.kampus-marker { display: flex; align-items: center; gap: 6px; cursor: pointer; background: none; border: 0; padding: 0; font-family: inherit; }
.kampus-marker__dot { width: 16px; height: 16px; border-radius: 999px; background: ${accent}; border: 3px solid ${background}; box-shadow: 0 0 0 6px ${accent}33; }
.kampus-marker__label { padding: 2px 8px; border-radius: 999px; background: ${accent}; color: ${onAccent}; font-size: 12px; font-weight: 600; white-space: nowrap; }
.kampus-avatar { width: ${AvatarSize}px; height: ${AvatarSize}px; box-sizing: border-box; border-radius: 999px; overflow: hidden; border: 3px solid ${background}; background: #2C2C33; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.55); display: flex; align-items: center; justify-content: center; transition: transform 120ms ease, border-color 120ms ease; }
.kampus-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
.kampus-avatar__initial { color: #FFFFFF; font-size: 17px; font-weight: 700; }
.kampus-marker--selected .kampus-avatar { border-color: ${accent}; transform: scale(1.18); box-shadow: 0 0 0 5px ${accent}40, 0 4px 14px rgba(0, 0, 0, 0.6); }
.maplibregl-ctrl-attrib, .maplibregl-ctrl-attrib.maplibregl-compact { background: ${background}cc !important; color: #A1A1AA; }
.maplibregl-ctrl-attrib a { color: #A1A1AA !important; }
.maplibregl-ctrl-attrib-button { filter: invert(1); background-color: transparent !important; }
.maplibregl-ctrl-group { background: ${background} !important; border: 1px solid #2C2C33; }
.maplibregl-ctrl-group button + button { border-top-color: #2C2C33 !important; }
.maplibregl-ctrl-group button .maplibregl-ctrl-icon { filter: invert(1); }
`;
}
