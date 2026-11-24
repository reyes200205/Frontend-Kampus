import { SymbolView } from "expo-symbols";
import { useEffect } from "react";
import { Modal, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import { LikeIcon } from "@/components/discover/action-button";
import { Avatar } from "@/components/matches/avatar";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { MaxFormWidth, Radius, Spacing } from "@/constants/theme";
import { loadProfile, useProfile } from "@/hooks/use-profile";
import { useSession } from "@/hooks/use-session";
import { useTheme } from "@/hooks/use-theme";
import type { Match } from "@/types/discovery";

export type MatchModalProps = {
  /** El match recién creado, o `null` para ocultar la pantalla. */
  match: Match | null;
  onClose: () => void;
  onSeeMatches: () => void;
};

const AvatarSize = 116;
/** Distancia desde la que entran las fotos, una por cada lado. */
const AvatarStart = 180;
/** Likes que salen disparados del centro cuando chocan las fotos. */
const Particles = 10;
const ParticleDistance = 150;
/** Momento en que las dos fotos se juntan; lo demás se encadena a partir de aquí. */
const ImpactMs = 420;

/**
 * Pantalla "Es un match" (T-12, RF-07). Primero un Like grande salta al centro con un pequeño vaivén y se
 * desvanece mientras las dos fotos entran desde los lados y chocan; ahí aparece el Like que late, salen
 * Likes disparados y después el título y los botones.
 * Con "Reducir movimiento" activo en el sistema, todo aparece sin animación.
 */
export function MatchModal({ match, onClose, onSeeMatches }: MatchModalProps) {
  const theme = useTheme();
  const { user } = useSession();
  const { profile, loading } = useProfile();
  const reduceMotion = useReducedMotion();

  const backdrop = useSharedValue(0);
  const avatars = useSharedValue(0);
  const heart = useSharedValue(0);
  /** El Like grande del principio: entra (0 → 1) y se va (1 → 2) cuando chocan las fotos. */
  const bigLike = useSharedValue(0);
  const pulse = useSharedValue(1);
  const burst = useSharedValue(0);
  const title = useSharedValue(0);
  const actions = useSharedValue(0);

  // La foto propia sale del perfil; si todavía no se pidió (no se ha abierto la pestaña Perfil), se pide.
  useEffect(() => {
    if (match && !profile && !loading) void loadProfile();
  }, [match, profile, loading]);

  // Se reinicia y vuelve a correr con cada match nuevo.
  useEffect(() => {
    if (!match) {
      // El latido se repite sin fin: se detiene al cerrar la pantalla.
      cancelAnimation(pulse);
      return;
    }

    if (reduceMotion) {
      [backdrop, avatars, heart, title, actions].forEach((value) => value.set(1));
      burst.set(1);
      bigLike.set(2);
      return;
    }

    [backdrop, avatars, heart, burst, title, actions, bigLike].forEach((value) => value.set(0));
    pulse.set(1);

    // Like grande: salta con resorte y, al chocar las fotos, crece un poco y se desvanece.
    bigLike.set(
      withSequence(
        withSpring(1, { damping: 7, stiffness: 220 }),
        withDelay(80, withTiming(2, { duration: 260, easing: Easing.in(Easing.cubic) })),
      ),
    );

    backdrop.set(withTiming(1, { duration: 250 }));
    avatars.set(withSpring(1, { damping: 11, stiffness: 120, mass: 0.9 }));
    heart.set(withDelay(ImpactMs, withSpring(1, { damping: 6, stiffness: 180 })));
    burst.set(withDelay(ImpactMs, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) })));
    pulse.set(
      withDelay(
        ImpactMs + 600,
        withRepeat(
          withSequence(withTiming(1.15, { duration: 380 }), withTiming(1, { duration: 380 })),
          -1,
        ),
      ),
    );
    title.set(withDelay(ImpactMs + 150, withSpring(1, { damping: 9, stiffness: 140 })));
    actions.set(withDelay(ImpactMs + 450, withTiming(1, { duration: 320 })));
  }, [match, reduceMotion, backdrop, avatars, heart, pulse, burst, title, actions, bigLike]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.get() }));
  const bigLikeStyle = useAnimatedStyle(() => {
    const value = bigLike.get();
    const entering = Math.min(value, 1);
    const leaving = Math.max(value - 1, 0);
    return {
      opacity: entering * (1 - leaving),
      transform: [
        { scale: entering * (1 + leaving * 0.6) },
        // Vaivén del pulgar al entrar: de -25° a 0°.
        { rotate: `${-25 * (1 - entering)}deg` },
      ],
    };
  });
  const leftAvatarStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: (1 - avatars.get()) * -AvatarStart },
      { rotate: `${-12 * avatars.get()}deg` },
    ],
  }));
  const rightAvatarStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: (1 - avatars.get()) * AvatarStart },
      { rotate: `${12 * avatars.get()}deg` },
    ],
  }));
  const heartStyle = useAnimatedStyle(() => ({
    opacity: Math.min(heart.get() * 2, 1),
    transform: [{ scale: heart.get() * pulse.get() }],
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: Math.min(title.get() * 1.5, 1),
    transform: [{ scale: 0.4 + 0.6 * title.get() }],
  }));
  const actionsStyle = useAnimatedStyle(() => ({
    opacity: actions.get(),
    transform: [{ translateY: (1 - actions.get()) * 24 }],
  }));

  const myPhoto =
    [...(profile?.profile?.photos ?? [])].sort((a, b) => a.position - b.position)[0]?.temporary_url ?? null;
  const theirFirstName = match?.user.name.split(" ")[0] ?? "";

  return (
    <Modal visible={match !== null} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { backgroundColor: theme.background }, backdropStyle]}>
        {match && (
          <View style={styles.content} accessibilityViewIsModal>
            <View style={styles.stage}>
              {Array.from({ length: Particles }, (_, index) => (
                <Particle key={index} index={index} progress={burst} color={theme.accent} />
              ))}

              <View style={styles.avatars}>
                <Animated.View style={[styles.leftAvatar, leftAvatarStyle]}>
                  <Avatar uri={myPhoto} name={user?.name ?? "Tú"} size={AvatarSize} ring />
                </Animated.View>
                <Animated.View style={rightAvatarStyle}>
                  <Avatar uri={match.user.photo_url} name={match.user.name} size={AvatarSize} ring />
                </Animated.View>
              </View>

              <Animated.View pointerEvents="none" style={[styles.bigLike, bigLikeStyle]}>
                <View style={[styles.bigLikeCircle, { backgroundColor: theme.accent }]}>
                  <SymbolView name={LikeIcon} size={64} tintColor={theme.onAccent} />
                </View>
              </Animated.View>

              <Animated.View
                style={[styles.heart, { backgroundColor: theme.accent, borderColor: theme.background }, heartStyle]}
              >
                <SymbolView
                  name={LikeIcon}
                  size={26}
                  tintColor={theme.onAccent}
                />
              </Animated.View>
            </View>

            <Animated.View style={[styles.texts, titleStyle]}>
              <ThemedText
                type="title"
                themeColor="accentText"
                accessibilityRole="header"
                accessibilityLiveRegion="assertive"
                style={[styles.center, styles.bigTitle]}
              >
                ¡Es un match!
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.center}>
                Tú y {match.user.name}
                {match.user.university ? ` (${match.user.university.short_name})` : ""} se interesaron
                mutuamente.
              </ThemedText>
            </Animated.View>

            <Animated.View style={[styles.actions, actionsStyle]}>
              <Button
                title={`Ver a ${theirFirstName} en mis matches`}
                icon={{ ios: "bubble.left.and.bubble.right", android: "forum", web: "forum" }}
                onPress={onSeeMatches}
              />
              <Button title="Seguir descubriendo" variant="ghost" onPress={onClose} />
            </Animated.View>
          </View>
        )}
      </Animated.View>
    </Modal>
  );
}

/** Un Like pequeño que sale del centro en su propia dirección y se desvanece. */
function Particle({ index, progress, color }: { index: number; progress: SharedValue<number>; color: string }) {
  // Repartidos en círculo, con un poco de variación para que no se vea como reloj.
  const angle = (index / Particles) * Math.PI * 2 + (index % 2 === 0 ? 0.18 : -0.12);
  const distance = ParticleDistance * (index % 3 === 0 ? 1.15 : 0.9);
  const size = index % 2 === 0 ? 18 : 13;

  const style = useAnimatedStyle(() => {
    const value = progress.get();
    return {
      opacity: value === 0 ? 0 : 1 - value,
      transform: [
        { translateX: Math.cos(angle) * distance * value },
        { translateY: Math.sin(angle) * distance * value },
        { scale: 0.5 + value },
      ],
    };
  });

  return (
    <Animated.View pointerEvents="none" style={[styles.particle, style]}>
      <SymbolView name={LikeIcon} size={size} tintColor={color} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.four,
  },
  content: {
    width: "100%",
    maxWidth: MaxFormWidth,
    alignItems: "center",
    gap: Spacing.five,
  },
  stage: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: AvatarSize + Spacing.five,
  },
  avatars: {
    flexDirection: "row",
    alignItems: "center",
  },
  leftAvatar: {
    // Las dos fotos se enciman un poco al chocar.
    marginRight: -Spacing.four,
    zIndex: 1,
  },
  heart: {
    position: "absolute",
    bottom: 0,
    width: 52,
    height: 52,
    borderRadius: Radius.full,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  particle: {
    position: "absolute",
  },
  bigLike: {
    position: "absolute",
    zIndex: 3,
  },
  bigLikeCircle: {
    width: 128,
    height: 128,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  texts: {
    gap: Spacing.two,
  },
  bigTitle: {
    fontSize: 40,
    lineHeight: 48,
  },
  center: {
    textAlign: "center",
  },
  actions: {
    alignSelf: "stretch",
    gap: Spacing.two,
  },
});
