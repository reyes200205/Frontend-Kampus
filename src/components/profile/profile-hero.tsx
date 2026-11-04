import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { ProfilePhoto } from "@/types/profile";

/** Alto máximo de la portada: la foto no debe ocupar más de media pantalla. */
const MaxHeroHeight = 420;
/** Portada sin fotos: más baja, con la invitación a subir la primera. */
const EmptyHeroHeight = 220;
/** Lo que la hoja de datos se monta sobre la portada. */
export const HeroOverlap = Spacing.four;

export type ProfileHeroProps = {
  photos: ProfilePhoto[];
  onAddPhoto: () => void;
};

/**
 * Portada del perfil: la foto ocupa el ancho completo y la hoja de datos se monta encima.
 * Con varias fotos, las barras de arriba indican cuál se ve y tocar a los lados cambia de foto.
 */
export function ProfileHero({ photos, onAddPhoto }: ProfileHeroProps) {
  const theme = useTheme();
  const [index, setIndex] = useState(0);
  const sorted = [...photos].sort((a, b) => a.position - b.position);
  const current = sorted[Math.min(index, sorted.length - 1)];

  if (!current) {
    return (
      <View style={[styles.empty, { height: EmptyHeroHeight + HeroOverlap, backgroundColor: theme.backgroundSelected }]}>
        <SymbolView
          name={{ ios: "camera", android: "photo_camera", web: "photo_camera" }}
          size={32}
          tintColor={theme.textSecondary}
        />
        <ThemedText type="small" themeColor="textSecondary">
          Todavía no tienes fotos
        </ThemedText>
        <Button
          title="Agregar foto"
          variant="secondary"
          icon={{ ios: "plus", android: "add", web: "add" }}
          onPress={onAddPhoto}
        />
      </View>
    );
  }

  return (
    // El alto sale del ancho (cuadrada, con tope): no depende de medir con `onLayout`, que no se
    // dispara si la foto aparece mientras la pestaña está oculta y dejaba la portada aplastada.
    <View style={[styles.hero, { backgroundColor: theme.backgroundSelected }]}>
      <Image
        source={{ uri: current.temporary_url }}
        style={styles.photo}
        contentFit="cover"
        transition={150}
        accessibilityLabel={`Foto ${index + 1} de ${sorted.length} de tu perfil`}
      />
      {/* Oscurece arriba para que se lean las barras y abajo se funde con la hoja. */}
      <LinearGradient
        colors={["rgba(0,0,0,0.35)", "transparent", "transparent", theme.background]}
        locations={[0, 0.25, 0.7, 1]}
        style={styles.photo}
        pointerEvents="none"
      />
      {/* Franja sólida donde se monta la hoja: así la foto no se asoma por sus esquinas redondeadas. */}
      <View style={[styles.overlap, { backgroundColor: theme.background }]} pointerEvents="none" />

      {sorted.length > 1 && (
        <>
          <View style={styles.bars} pointerEvents="none">
            {sorted.map((photo, i) => (
              <View
                key={photo.id}
                style={[styles.bar, { backgroundColor: i === index ? "#FFFFFF" : "rgba(255,255,255,0.4)" }]}
              />
            ))}
          </View>
          <View style={styles.tapZones}>
            <Pressable
              style={styles.flex}
              onPress={() => setIndex((i) => Math.max(0, i - 1))}
              accessibilityRole="button"
              accessibilityLabel="Foto anterior"
            />
            <Pressable
              style={styles.flex}
              onPress={() => setIndex((i) => Math.min(sorted.length - 1, i + 1))}
              accessibilityRole="button"
              accessibilityLabel="Foto siguiente"
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  hero: {
    width: "100%",
    aspectRatio: 1,
    maxHeight: MaxHeroHeight + HeroOverlap,
    overflow: "hidden",
  },
  photo: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: HeroOverlap,
  },
  overlap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: HeroOverlap,
  },
  empty: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    paddingBottom: HeroOverlap,
  },
  bars: {
    position: "absolute",
    top: Spacing.three,
    left: Spacing.three,
    right: Spacing.three,
    flexDirection: "row",
    gap: Spacing.one,
  },
  bar: {
    flex: 1,
    height: 3,
    borderRadius: Radius.full,
  },
  tapZones: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: HeroOverlap,
    left: 0,
    flexDirection: "row",
  },
});
