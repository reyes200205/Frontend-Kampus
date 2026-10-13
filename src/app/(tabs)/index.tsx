import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { Screen } from "@/components/layout/screen";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Spacing } from "@/constants/theme";

type DiscoverMode = "for-you" | "nearby";

// TODO (T-11, T-30): tarjetas de swipe en "Para ti" y mapa por zonas en "Cerca".
export default function DiscoverScreen() {
  const [mode, setMode] = useState<DiscoverMode>("for-you");

  return (
    <Screen title="Descubrir" subtitle="Tu campus, tu gente.">
      <View style={styles.modes}>
        <Chip label="Para ti" selected={mode === "for-you"} onPress={() => setMode("for-you")} />
        <Chip label="Cerca" selected={mode === "nearby"} onPress={() => setMode("nearby")} />
      </View>

      {mode === "for-you" ? (
        <EmptyState
          icon={{ ios: "rectangle.stack", android: "style", web: "style" }}
          title="Conecta con tu comunidad"
          message="Muy pronto podrás deslizar perfiles de estudiantes de la UTT, la UAdeC y el Tec Laguna."
        />
      ) : (
        <EmptyState
          icon={{ ios: "map", android: "map", web: "map" }}
          title="Gente cerca de ti"
          message="Verás en un mapa a quienes estudian en tu zona, sin mostrar nunca su ubicación exacta."
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  modes: {
    flexDirection: "row",
    gap: Spacing.two,
  },
});
