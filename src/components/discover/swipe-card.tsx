import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { SymbolView } from "expo-symbols";
import { useImperativeHandle, useRef, type Ref } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
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
import { FontFamily, FontSize, MinTouchSize, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { DiscoveryCard } from "@/types/discovery";

/** Velocidad (px/s) con la que un gesto corto también cuenta como swipe. */
const FlingVelocity = 800;
/** Lo que hay que deslizar hacia arriba para abrir el perfil completo (T-31). */
const ExpandDistance = 70;

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
  /** Abre el perfil completo, con todas sus fotos (T-31, RF-21). */
  onExpand: (card: DiscoveryCard) => void;
  ref?: Ref<SwipeCardHandle>;
};

/** Fotos en su orden: la 1 es la principal. */
export function sortedPhotos(card: DiscoveryCard) {
  return [...card.photos].sort((a, b) => a.position - b.position);
}

/**
 * Tarjeta de perfil que se desliza: a la derecha es "Me interesa" y a la izquierda "Pasar" (RF-05).
 * La tarjeta solo muestra la foto principal: tocarla o deslizar hacia arriba abre el perfil completo
 * con todas las fotos (T-31). Cada tarjeta tiene sus propios valores animados, así que al salir no hay que
 * reiniciar nada.
 */
export function SwipeCard({ card, width, height, isTop, onDecide, onExpand, ref }: SwipeCardProps) {
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

  // En web, soltar después de arrastrar también dispara un clic: se ignoran los toques justo después.
  const draggedAt = useRef(0);
  function markDragged() {
    draggedAt.current = Date.now();
  }
  function wasDragging() {
    return Date.now() - draggedAt.current < 350;
  }

  function expand() {
    onExpand(card);
  }

  function tapExpand() {
    if (!wasDragging()) expand();
  }

  const pan = usePanGesture({
    enabled: isTop,
    // Arrastre horizontal para decidir y hacia arriba para ver el perfil. Hacia abajo se deja pasar
    // para que la pantalla pueda hacer scroll.
    // Los rangos son [inicio, fin]: se activa al salir de ese rango y falla al salir del de `fail`.
    activeOffsetX: [-12, 12],
    activeOffsetY: [-16, Number.MAX_SAFE_INTEGER],
    failOffsetY: [Number.MIN_SAFE_INTEGER, 20],
    onActivate: () => {
      scheduleOnRN(markDragged);
    },
    onUpdate: (event) => {
      translateX.set(event.translationX);
      translateY.set(event.translationY * (event.translationY < 0 ? 0.35 : 0.2));
    },
    onDeactivate: (event) => {
      const decided =
        Math.abs(event.translationX) > threshold || Math.abs(event.velocityX) > FlingVelocity;
      // Con la velocidad manda la dirección del lanzamiento; si no, hacia dónde quedó la tarjeta.
      const liked = Math.abs(event.velocityX) > FlingVelocity ? event.velocityX > 0 : event.translationX > 0;
      const expanded = !decided && event.translationY < -ExpandDistance;

      scheduleOnRN(markDragged);
      translateY.set(withSpring(0));
      if (!decided) {
        translateX.set(withSpring(0));
        if (expanded) scheduleOnRN(expand);
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

  const photo = sortedPhotos(card)[0]?.temporary_url;
  const studies = [card.university?.short_name, card.career, card.semester ? `${card.semester}º semestre` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        accessible={false}
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

        {/* El degradado solo cubre la parte de abajo para que la foto se vea casi completa. */}
        <LinearGradient
          colors={["transparent", `${theme.background}F2`]}
          locations={[0.55, 0.95]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* Tocar la foto también abre el perfil completo; el botón accesible es el de los datos. */}
        {isTop && (
          <Pressable
            style={styles.photoTap}
            onPress={tapExpand}
            accessible={false}
            importantForAccessibility="no"
          />
        )}

        <Animated.View style={[styles.stamp, styles.stampLike, { borderColor: theme.accent }, likeStyle]}>
          <Text style={[styles.stampText, { color: theme.accent }]}>ME INTERESA</Text>
        </Animated.View>
        <Animated.View style={[styles.stamp, styles.stampPass, { borderColor: theme.text }, passStyle]}>
          <Text style={[styles.stampText, { color: theme.text }]}>PASAR</Text>
        </Animated.View>

        <Pressable
          onPress={tapExpand}
          disabled={!isTop}
          accessibilityRole="button"
          accessibilityLabel={`${card.name}${card.age ? `, ${card.age} años` : ""}. ${studies}`}
          accessibilityHint="Abre el perfil completo. Desliza la tarjeta a la derecha si te interesa o a la izquierda para pasar."
          style={styles.info}
        >
          <View style={styles.nameRow}>
            <View style={styles.nameBlock}>
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
            <View style={[styles.expand, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <SymbolView
                name={{ ios: "chevron.up", android: "keyboard_arrow_up", web: "keyboard_arrow_up" }}
                size={20}
                tintColor={theme.text}
              />
            </View>
          </View>

          {studies !== "" && (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {studies}
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
            <ThemedText type="small" numberOfLines={1}>
              {card.bio}
            </ThemedText>
          )}
        </Pressable>
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
  photoTap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: "35%",
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
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
    gap: Spacing.one,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  nameBlock: {
    flex: 1,
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
  expand: {
    width: MinTouchSize - 8,
    height: MinTouchSize - 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
