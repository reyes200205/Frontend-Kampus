import { router, type Href } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { MinTouchSize, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type StackHeaderProps = {
  title: string;
  /** A dónde ir si no hay historial (p. ej. al recargar la página en web). */
  fallback: Href;
};

/** Encabezado de pantallas apiladas estilo ajustes: botón redondo para regresar y título centrado. */
export function StackHeader({ title, fallback }: StackHeaderProps) {
  const theme = useTheme();

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace(fallback);
  }

  return (
    <View style={styles.header}>
      <Pressable
        onPress={goBack}
        accessibilityRole="button"
        accessibilityLabel="Regresar"
        hitSlop={Spacing.one}
        style={({ pressed }) => [
          styles.back,
          { backgroundColor: theme.backgroundElement },
          pressed && { backgroundColor: theme.backgroundSelected },
        ]}
      >
        <SymbolView
          name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }}
          size={22}
          tintColor={theme.text}
        />
      </Pressable>
      <ThemedText type="heading" numberOfLines={1} accessibilityRole="header" style={styles.title}>
        {title}
      </ThemedText>
      {/* Mismo ancho que el botón para que el título quede centrado. */}
      <View style={styles.back} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  back: {
    width: MinTouchSize + 4,
    height: MinTouchSize + 4,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    textAlign: "center",
  },
});
