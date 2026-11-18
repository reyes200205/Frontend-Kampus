/**
 * Estilo oscuro del mapa de Kampus (T-29, RF-19).
 *
 * Usa los tiles vectoriales gratuitos de OpenFreeMap (esquema OpenMapTiles, sin API key) con colores
 * propios sacados del diseño de Figma "Descubrir — Cerca": calles sutiles, parques y agua, y casi sin
 * etiquetas para que lo importante sean los avatares de cada zona (T-30).
 *
 * Es JSON puro (sin funciones) porque también se manda al WebView del mapa en iOS y Android.
 */

import type { StyleSpecification } from "maplibre-gl";

/** Colores del mapa. Parten de la paleta oscura de `theme.ts`. */
export const MapColors = {
  /** Tierra: igual que `backgroundElement`. */
  land: "#1A1A1E",
  /** Zonas habitacionales, apenas distintas de la tierra. */
  residential: "#1C1C21",
  park: "#22302A",
  water: "#1C2A33",
  building: "#212127",
  road: "#2A2A30",
  roadMajor: "#32323A",
  motorway: "#3A3A43",
  rail: "#26262C",
  /** Etiquetas: `textSecondary` y `placeholder` con halo del fondo. */
  label: "#A1A1AA",
  labelMuted: "#8B8B94",
  labelHalo: "#121215",
} as const;

const OpenFreeMap = "https://tiles.openfreemap.org";

/** Nombre en español si existe; si no, el nombre local. */
const name = ["coalesce", ["get", "name:es"], ["get", "name"]];

const isPolygon = ["match", ["geometry-type"], ["Polygon", "MultiPolygon"], true, false];
const isLine = ["match", ["geometry-type"], ["LineString", "MultiLineString"], true, false];

/** Grosor de una calle según el zoom: delgada de lejos y más ancha de cerca. */
function roadWidth(base: number, max: number) {
  return ["interpolate", ["exponential", 1.5], ["zoom"], 10, base, 18, max];
}

export const KampusMapStyle = {
  version: 8,
  name: "Kampus oscuro",
  sources: {
    openmaptiles: { type: "vector", url: `${OpenFreeMap}/planet` },
  },
  glyphs: `${OpenFreeMap}/fonts/{fontstack}/{range}.pbf`,
  layers: [
    { id: "background", type: "background", paint: { "background-color": MapColors.land } },
    {
      id: "residential",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "landuse",
      filter: ["all", isPolygon, ["==", ["get", "class"], "residential"]],
      paint: { "fill-color": MapColors.residential },
    },
    {
      id: "parks",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "park",
      filter: isPolygon,
      paint: { "fill-color": MapColors.park },
    },
    {
      id: "green",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "landcover",
      filter: ["all", isPolygon, ["match", ["get", "class"], ["grass", "wood", "farmland"], true, false]],
      paint: { "fill-color": MapColors.park, "fill-opacity": 0.7 },
    },
    {
      id: "green-landuse",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "landuse",
      filter: [
        "all",
        isPolygon,
        ["match", ["get", "class"], ["park", "cemetery", "pitch", "stadium", "playground"], true, false],
      ],
      paint: { "fill-color": MapColors.park },
    },
    {
      id: "water",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "water",
      filter: ["all", isPolygon, ["!=", ["get", "brunnel"], "tunnel"]],
      paint: { "fill-color": MapColors.water },
    },
    {
      id: "waterway",
      type: "line",
      source: "openmaptiles",
      "source-layer": "waterway",
      filter: isLine,
      paint: { "line-color": MapColors.water, "line-width": roadWidth(1, 6) },
    },
    {
      id: "buildings",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "building",
      minzoom: 14,
      paint: {
        "fill-color": MapColors.building,
        "fill-opacity": ["interpolate", ["linear"], ["zoom"], 14, 0, 15, 1],
      },
    },
    {
      id: "rail",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", isLine, ["match", ["get", "class"], ["rail", "transit"], true, false]],
      paint: { "line-color": MapColors.rail, "line-width": roadWidth(0.5, 2) },
    },
    {
      id: "roads-minor",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", isLine, ["match", ["get", "class"], ["minor", "service", "track"], true, false]],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": MapColors.road, "line-width": roadWidth(0.5, 10) },
    },
    {
      id: "roads-major",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: [
        "all",
        isLine,
        ["match", ["get", "class"], ["primary", "secondary", "tertiary", "trunk"], true, false],
      ],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": MapColors.roadMajor, "line-width": roadWidth(1, 16) },
    },
    {
      id: "roads-motorway",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", isLine, ["==", ["get", "class"], "motorway"]],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": MapColors.motorway, "line-width": roadWidth(1.5, 20) },
    },
    {
      id: "road-names",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "transportation_name",
      minzoom: 15,
      filter: isLine,
      layout: {
        "symbol-placement": "line",
        "text-field": name,
        "text-font": ["Noto Sans Regular"],
        "text-size": 11,
      },
      paint: {
        "text-color": MapColors.labelMuted,
        "text-halo-color": MapColors.labelHalo,
        "text-halo-width": 1,
      },
    },
    {
      id: "neighbourhoods",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      minzoom: 12,
      filter: ["match", ["get", "class"], ["suburb", "neighbourhood", "quarter"], true, false],
      layout: {
        "text-field": name,
        "text-font": ["Noto Sans Regular"],
        "text-size": 12,
        "text-transform": "uppercase",
        "text-letter-spacing": 0.08,
        "text-max-width": 8,
      },
      paint: {
        "text-color": MapColors.labelMuted,
        "text-halo-color": MapColors.labelHalo,
        "text-halo-width": 1,
      },
    },
    {
      id: "cities",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      maxzoom: 13,
      filter: ["match", ["get", "class"], ["city", "town"], true, false],
      layout: {
        "text-field": name,
        "text-font": ["Noto Sans Bold"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 6, 12, 12, 16],
      },
      paint: {
        "text-color": MapColors.label,
        "text-halo-color": MapColors.labelHalo,
        "text-halo-width": 1.2,
      },
    },
  ],
} as StyleSpecification;
