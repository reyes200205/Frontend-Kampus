import { ActivityIndicator, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/** Capa encima del mapa mientras carga el estilo o si no se pudo cargar (sin internet). */
export function MapStatusOverlay({
  status,
  onRetry,
}: {
  status: "loading" | "ready" | "error";
  onRetry: () => void;
}) {
  const theme = useTheme();

  if (status === "ready") return null;

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay, { backgroundColor: theme.backgroundElement }]}>
      {status === "loading" ? (
        <ActivityIndicator color={theme.accent} size="large" accessibilityLabel="Cargando mapa" />
      ) : (
        <>
          <ThemedText type="smallBold" accessibilityRole="alert">
            No se pudo cargar el mapa
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
            Revisa tu conexión e intenta de nuevo.
          </ThemedText>
          <Button title="Reintentar" variant="secondary" onPress={onRetry} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    padding: Spacing.four,
  },
  message: {
    textAlign: "center",
    marginBottom: Spacing.two,
  },
});
