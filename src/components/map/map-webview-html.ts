/**
 * HTML que carga el WebView del mapa en iOS y Android (T-29): maplibre-gl desde el CDN, el estilo
 * oscuro y un pequeño puente con React Native (`postMessage` hacia la app y `window.kampusUpdate`
 * desde la app).
 */

import { MapColors } from "@/constants/map-style";

import { MapLibreVersion } from "./kampus-map.types";

const LineSeparator = new RegExp(String.fromCharCode(0x2028), "g");
const ParagraphSeparator = new RegExp(String.fromCharCode(0x2029), "g");

/** JSON seguro para meterlo en un `<script>` (sin `</script>` ni separadores de línea raros). */
export function toScriptJson(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(LineSeparator, "\\u2028")
    .replace(ParagraphSeparator, "\\u2029");
}

export type MapHtmlOptions = {
  style: object;
  center: { lat: number; lng: number };
  zoom: number;
  minZoom: number;
  maxZoom: number;
  fitMaxZoom: number;
  fitPadding: number;
  interactive: boolean;
  css: string;
};

export function buildMapHtml(options: MapHtmlOptions) {
  const cdn = `https://unpkg.com/maplibre-gl@${MapLibreVersion}/dist`;
  const { css, ...mapOptions } = options;

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<link rel="stylesheet" href="${cdn}/maplibre-gl.css">
<style>
html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: ${MapColors.land}; }
body { font-family: -apple-system, BlinkMacSystemFont, Roboto, sans-serif; -webkit-tap-highlight-color: transparent; }
${css}
</style>
<script src="${cdn}/maplibre-gl.js"></script>
</head>
<body>
<div id="map"></div>
<script>
(function () {
  function post(message) { window.ReactNativeWebView.postMessage(JSON.stringify(message)); }
  if (!window.maplibregl) { post({ type: "error" }); return; }

  var o = ${toScriptJson(mapOptions)};
  var map = new maplibregl.Map({
    container: "map",
    style: o.style,
    center: [o.center.lng, o.center.lat],
    zoom: o.zoom,
    minZoom: o.minZoom,
    maxZoom: o.maxZoom,
    interactive: o.interactive,
    attributionControl: { compact: true },
    dragRotate: false,
    pitchWithRotate: false,
    touchPitch: false
  });
  map.touchZoomRotate.disableRotation();
  map.once("load", function () { post({ type: "ready" }); });
  map.on("error", function () { if (!map.loaded()) post({ type: "error" }); });
  // Los marcadores son botones fuera del canvas: este click solo llega al tocar el mapa.
  map.on("click", function () { post({ type: "press" }); });

  // Debe dibujar lo mismo que createMarkerElement en kampus-map.web.tsx.
  function createMarker(item) {
    var el = document.createElement("button");
    el.type = "button";
    el.className = "kampus-marker" + (item.selected ? " kampus-marker--selected" : "");
    el.setAttribute("aria-label", item.label || "Marcador");
    el.style.zIndex = item.selected ? "3" : item.kind === "avatar" ? "2" : "1";

    if (item.kind === "avatar") {
      var avatar = document.createElement("span");
      avatar.className = "kampus-avatar";
      var showInitial = function () {
        avatar.textContent = "";
        var initial = document.createElement("span");
        initial.className = "kampus-avatar__initial";
        initial.textContent = (item.label || "?").trim().charAt(0).toUpperCase();
        avatar.appendChild(initial);
      };
      if (item.photoUrl) {
        var img = document.createElement("img");
        img.src = item.photoUrl;
        img.alt = "";
        img.draggable = false;
        img.addEventListener("error", showInitial);
        avatar.appendChild(img);
      } else {
        showInitial();
      }
      el.appendChild(avatar);
      return el;
    }

    var dot = document.createElement("span");
    dot.className = "kampus-marker__dot";
    el.appendChild(dot);
    if (item.label) {
      var text = document.createElement("span");
      text.className = "kampus-marker__label";
      text.textContent = item.label;
      el.appendChild(text);
    }
    return el;
  }

  var markers = [];
  function setMarkers(list) {
    markers.forEach(function (m) { m.remove(); });
    markers = list.map(function (item) {
      var el = createMarker(item);
      el.addEventListener("click", function (event) {
        event.stopPropagation();
        post({ type: "marker", id: item.id });
      });
      var placement = item.kind === "avatar" ? { element: el, anchor: "center" } : { element: el, anchor: "left", offset: [-8, 0] };
      return new maplibregl.Marker(placement)
        .setLngLat([item.coordinate.lng, item.coordinate.lat])
        .addTo(map);
    });
  }

  window.kampusUpdate = function (update) {
    if (update.center) map.easeTo({ center: [update.center.lng, update.center.lat], zoom: update.zoom });
    if (update.markers) setMarkers(update.markers);
    if (update.fitTo && update.fitTo.length > 0) {
      var lngs = update.fitTo.map(function (p) { return p.lng; });
      var lats = update.fitTo.map(function (p) { return p.lat; });
      map.fitBounds(
        [[Math.min.apply(null, lngs), Math.min.apply(null, lats)], [Math.max.apply(null, lngs), Math.max.apply(null, lats)]],
        { padding: o.fitPadding, maxZoom: o.fitMaxZoom, duration: 700 }
      );
    }
  };
})();
</script>
</body>
</html>`;
}
