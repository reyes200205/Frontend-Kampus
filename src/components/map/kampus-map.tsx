/**
 * Mapa base de Kampus en iOS y Android (T-29). Carga maplibre-gl dentro de un WebView para que
 * funcione en Expo Go sin development build; el estilo y los tiles son los mismos que en web.
 *
 * Si más adelante el equipo usa development builds, este archivo se puede cambiar por
 * `@maplibre/maplibre-react-native` sin tocar a quienes usan `<KampusMap>`.
 */

import * as WebBrowser from "expo-web-browser";
import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

import { MapStatusOverlay } from "@/components/map/map-status-overlay";
import { buildMapHtml, toScriptJson } from "@/components/map/map-webview-html";
import { KampusMapStyle, MapColors } from "@/constants/map-style";
import { useTheme } from "@/hooks/use-theme";

import { MapDefaults, markerCss, type KampusMapProps } from "./kampus-map.types";

/**
 * Los tipos de react-native-webview 14 declaran `WebView<P = undefined>`, y `Props & undefined`
 * es `never` en TypeScript 6; con `object` las props quedan bien tipadas.
 */
const MapWebView = WebView<object>;
type MapWebViewRef = InstanceType<typeof MapWebView>;

type Status = "loading" | "ready" | "error";
type MapMessage = { type: "ready" } | { type: "error" } | { type: "marker"; id: string };

export function KampusMap({
  center,
  zoom = MapDefaults.zoom,
  markers = [],
  onMarkerPress,
  interactive = true,
  style,
  accessibilityLabel = "Mapa",
}: KampusMapProps) {
  const theme = useTheme();
  const webViewRef = useRef<MapWebViewRef>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [attempt, setAttempt] = useState(0);

  // El HTML solo se arma al montar o al reintentar; los cambios de centro y marcadores se mandan
  // con `injectJavaScript` para no recargar el mapa.
  // Al reintentar se vuelve a usar este centro; en cuanto carga se manda el centro actual.
  const [initialView] = useState(() => ({ center, zoom }));
  const html = useMemo(
    () =>
      buildMapHtml({
        style: KampusMapStyle,
        center: initialView.center,
        zoom: initialView.zoom,
        minZoom: MapDefaults.minZoom,
        maxZoom: MapDefaults.maxZoom,
        interactive,
        css: markerCss(theme.accent, theme.onAccent, theme.background),
      }),
    [initialView, interactive, theme],
  );

  const send = (update: object) => {
    webViewRef.current?.injectJavaScript(`window.kampusUpdate && window.kampusUpdate(${toScriptJson(update)}); true;`);
  };

  useEffect(() => {
    if (status === "ready") send({ center: { lat: center.lat, lng: center.lng }, zoom });
  },[center.lat, center.lng, zoom, status]);

  const markersKey = JSON.stringify(markers);
  useEffect(() => {
    if (status === "ready") send({ markers });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markersKey, status]);

  function handleMessage(event: WebViewMessageEvent) {
    let message: MapMessage;
    try {
      message = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }
    if (message.type === "ready") setStatus("ready");
    else if (message.type === "error") setStatus("error");
    else if (message.type === "marker") onMarkerPress?.(message.id);
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.backgroundElement }, style]}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      <MapWebView
        key={attempt}
        ref={webViewRef}
        source={{ html }}
        originWhitelist={["*"]}
        onMessage={handleMessage}
        onError={() => setStatus("error")}
        style={[styles.webView, { backgroundColor: MapColors.land }]}
        // El mapa maneja sus propios gestos; la página del WebView nunca hace scroll.
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        nestedScrollEnabled
        setBuiltInZoomControls={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        // Los enlaces de la atribución (OpenStreetMap, etc.) se abren en el navegador, no dentro del
        // mapa. Los tiles y scripts no pasan por aquí: solo las navegaciones de la página.
        setSupportMultipleWindows={false}
        onShouldStartLoadWithRequest={(request) => {
          if (!/^https?:/i.test(request.url)) return true;
          void WebBrowser.openBrowserAsync(request.url);
          return false;
        }}
      />
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

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  webView: {
    flex: 1,
  },
});
