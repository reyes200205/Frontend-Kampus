import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { SymbolView } from "expo-symbols";
import { useImperativeHandle, type Ref } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { ThemedText } from "@/components/themed-text";
import { Chip } from "@/components/ui/chip";
import { FontFamily, FontSize, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { DiscoveryCard } from "@/services/discovery";

/** Intereses que caben en la tarjeta; el resto se resume en "+N". */
const VisibleInterests = 4;
/** Velocidad (px/s) con la que un gesto corto también cuenta como swipe. */
const FlingVelocity = 800;

export type SwipeCardHandle = {
  /** Lanza la tarjeta como si se hubiera deslizado (para los botones y el teclado). */
  fling: (liked: boolean) => void;
};

export type SwipeCardProps = {
  card: DiscoveryCard;
  width: number;
  height: number;
  /** Solo la tarjeta de arriba responde a gestos; la de abajo se asoma detrás. */
  isTop: boolean;
  onDecide: (card: DiscoveryCard, liked: boolean) => void;
  ref?: Ref<SwipeCardHandle>;
};

/**
 * Tarjeta de perfil que se desliza: a la derecha es "Me interesa" y a la izquierda "Pasar" (RF-05).
 * Cada tarjeta tiene sus propios valores animados, así que al salir no hay que reiniciar nada.
 */
export function SwipeCard({ card, width, height, isTop, onDecide, ref }: SwipeCardProps) {
  const theme = useTheme();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const threshold = width * 0.3;
  const exitX = width * 1.5;

  function fling(liked: boolean) {
    translateX.set(
      withTiming(liked ? exitX : -exitX, { duration: 220 }, (finished) => {
        if (finished) scheduleOnRN(onDecide, card, liked);
      }),
    );
  }

  useImperativeHandle(ref, () => ({ fling }));

  const pan = usePanGesture({
    enabled: isTop,
    // Arrastre horizontal: deja pasar el scroll vertical de la pantalla.
    activeOffsetX: [-12, 12],
    failOffsetY: [-20, 20],
    onUpdate: (event) => {
      translateX.set(event.translationX);
      translateY.set(event.translationY * 0.2);
    },
    onDeactivate: (event) => {
      const decided =
        Math.abs(event.translationX) > threshold || Math.abs(event.velocityX) > FlingVelocity;
      // Con la velocidad manda la dirección del lanzamiento; si no, hacia dónde quedó la tarjeta.
      const liked = Math.abs(event.velocityX) > FlingVelocity ? event.velocityX > 0 : event.translationX > 0;

      translateY.set(withSpring(0));
      if (!decided) {
        translateX.set(withSpring(0));
        return;
      }
      translateX.set(
        withTiming(liked ? exitX : -exitX, { duration: 200 }, (finished) => {
          if (finished) scheduleOnRN(onDecide, card, liked);
        }),
      );
    },
  });

  const cardStyle = useAnimatedStyle(() => ({
    opacity: isTop ? 1 : 0.7,
    transform: [
      { translateX: translateX.get() },
      // La tarjeta de abajo queda un poco más chica y más abajo, como en un mazo.
      { translateY: translateY.get() + (isTop ? 0 : 14) },
      { scale: withTiming(isTop ? 1 : 0.95, { duration: 150 }) },
      { rotate: `${interpolate(translateX.get(), [-width, 0, width], [-12, 0, 12])}deg` },
    ],
  }));
  const likeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.get(), [0, threshold], [0, 1], Extrapolation.CLAMP),
  }));
  const passStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.get(), [-threshold, 0], [1, 0], Extrapolation.CLAMP),
  }));

  const photo = card.photos[0]?.temporary_url;
  const subtitle = [card.university?.short_name, card.career].filter(Boolean).join(" · ");
  const extraInterests = card.interests.length - VisibleInterests;

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        accessible={isTop}
        accessibilityLabel={`${card.name}${card.age ? `, ${card.age} años` : ""}. ${subtitle}`}
        accessibilityHint="Desliza a la derecha si te interesa o a la izquierda para pasar."
        style={[
          styles.card,
          { width, height, backgroundColor: theme.backgroundSelected, borderColor: theme.border },
          cardStyle,
        ]}
      >
        {photo ? (
          <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.noPhoto]}>
            <Text style={[styles.initial, { color: theme.textSecondary }]}>
              {card.name.trim().charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <LinearGradient
          colors={["transparent", `${theme.background}F2`]}
          locations={[0.25, 0.7]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <Animated.View style={[styles.stamp, styles.stampLike, { borderColor: theme.accent }, likeStyle]}>
          <Text style={[styles.stampText, { color: theme.accent }]}>ME INTERESA</Text>
        </Animated.View>
        <Animated.View style={[styles.stamp, styles.stampPass, { borderColor: theme.text }, passStyle]}>
          <Text style={[styles.stampText, { color: theme.text }]}>PASAR</Text>
        </Animated.View>

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <ThemedText type="subtitle" numberOfLines={1} style={styles.name}>
              {card.name}
              {card.age ? `, ${card.age}` : ""}
            </ThemedText>
            {/* Toda cuenta que aparece en Descubrir verificó su correo institucional (RF-01). */}
            <View
              style={[styles.verified, { backgroundColor: theme.accent }]}
              accessibilityLabel="Correo institucional verificado"
            >
              <SymbolView
                name={{ ios: "checkmark", android: "check", web: "check" }}
                size={12}
                tintColor={theme.onAccent}
              />
            </View>
          </View>

          {subtitle !== "" && (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {subtitle}
              {card.semester ? ` · ${card.semester}º semestre` : ""}
            </ThemedText>
          )}

          {card.shared_interests > 0 && (
            <ThemedText type="caption" themeColor="accentText">
              {card.shared_interests === 1
                ? "1 interés en común"
                : `${card.shared_interests} intereses en común`}
            </ThemedText>
          )}

          {card.bio && (
            <ThemedText type="small" numberOfLines={2}>
              {card.bio}
            </ThemedText>
          )}

          {card.interests.length > 0 && (
            <View style={styles.chips}>
              {card.interests.slice(0, VisibleInterests).map((interest) => (
                <Chip key={interest.id} label={interest.name} />
              ))}
              {extraInterests > 0 && <Chip label={`+${extraInterests}`} />}
            </View>
          )}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    borderRadius: Radius.large,
    borderWidth: 1,
    overflow: "hidden",
    justifyContent: "flex-end",
    ...Platform.select({ web: { userSelect: "none", cursor: "grab" } as object }),
  },
  noPhoto: {
    alignItems: "center",
    justifyContent: "center",
  },
  initial: {
    fontSize: 96,
    fontFamily: FontFamily.bold,
  },
  stamp: {
    position: "absolute",
    top: Spacing.five,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderWidth: 3,
    borderRadius: Radius.small,
  },
  stampLike: {
    left: Spacing.four,
    transform: [{ rotate: "-14deg" }],
  },
  stampPass: {
    right: Spacing.four,
    transform: [{ rotate: "14deg" }],
  },
  stampText: {
    fontSize: FontSize.h3,
    fontFamily: FontFamily.bold,
    letterSpacing: 1,
  },
  info: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  name: {
    flexShrink: 1,
    fontFamily: FontFamily.bold,
  },
  verified: {
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
});
