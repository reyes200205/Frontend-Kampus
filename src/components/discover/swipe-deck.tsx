import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { useEffect, useRef } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";

import { SwipeCard, type SwipeCardHandle } from "@/components/discover/swipe-card";
import { useTheme } from "@/hooks/use-theme";
import { Radius, Spacing } from "@/constants/theme";
import type { DiscoveryCard } from "@/services/discovery";

export type SwipeDeckProps = {
  cards: DiscoveryCard[];
  width: number;
  height: number;
  onDecide: (card: DiscoveryCard, liked: boolean) => void;
};

/**
 * Mazo con la tarjeta de arriba y la siguiente asomándose, más los botones "Pasar" y "Me interesa".
 * En web también responde a las flechas ← y → del teclado.
 */
export function SwipeDeck({ cards, width, height, onDecide }: SwipeDeckProps) {
  const top = useRef<SwipeCardHandle>(null);
  // Evita lanzar dos veces la misma tarjeta con un doble toque mientras sale.
  const flinging = useRef<number | null>(null);
  const topId = cards[0]?.id;

  function fling(liked: boolean) {
    if (topId === undefined || flinging.current === topId) return;
    flinging.current = topId;
    top.current?.fling(liked);
  }

  // Nueva tarjeta arriba (o la misma de vuelta tras un error): ya se puede lanzar.
  useEffect(() => {
    flinging.current = null;
  }, [topId]);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable]")) return;
      if (event.key === "ArrowRight") fling(true);
      if (event.key === "ArrowLeft") fling(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  // Se pinta al revés para que la primera tarjeta quede encima.
  const visible = cards.slice(0, 2).reverse();

  return (
    <View style={styles.container}>
      <View style={{ width, height: height + 14 }}>
        {visible.map((card) => (
          <SwipeCard
            key={card.id}
            ref={card.id === topId ? top : undefined}
            card={card}
            width={width}
            height={height}
            isTop={card.id === topId}
            onDecide={onDecide}
          />
        ))}
      </View>

      <View style={styles.actions}>
        <ActionButton
          label="Pasar"
          icon={{ ios: "xmark", android: "close", web: "close" }}
          onPress={() => fling(false)}
        />
        <ActionButton
          label="Me interesa"
          icon={{ ios: "heart.fill", android: "favorite", web: "favorite" }}
          primary
          onPress={() => fling(true)}
        />
      </View>
    </View>
  );
}

function ActionButton({
  label,
  icon,
  primary,
  onPress,
}: {
  label: string;
  icon: SymbolViewProps["name"];
  primary?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const size = primary ? 68 : 60;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.action,
        { width: size, height: size },
        primary
          ? { backgroundColor: theme.accent }
          : { backgroundColor: theme.backgroundElement, borderColor: theme.border, borderWidth: 1.5 },
        pressed && styles.pressed,
      ]}
    >
      <SymbolView name={icon} size={primary ? 30 : 26} tintColor={primary ? theme.onAccent : theme.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: Spacing.four,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.six - Spacing.two,
  },
  action: {
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.94 }],
  },
});
