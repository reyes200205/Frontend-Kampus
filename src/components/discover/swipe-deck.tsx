import { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";

import { ActionButton, LikeIcon } from "@/components/discover/action-button";
import { ExpandedProfile } from "@/components/discover/expanded-profile";
import { SwipeCard, type SwipeCardHandle } from "@/components/discover/swipe-card";
import { Spacing } from "@/constants/theme";
import type { DiscoveryCard } from "@/types/discovery";

/** Cuánto suben los botones sobre la tarjeta (la mitad del botón de "Me interesa"). */
export const OverlapHeight = 35;

/** Tiempo para que el perfil expandido termine de cerrarse antes de lanzar la tarjeta. */
const CloseBeforeFlingMs = 280;

export type SwipeDeckProps = {
  cards: DiscoveryCard[];
  width: number;
  height: number;
  onDecide: (card: DiscoveryCard, liked: boolean) => void;
};

/**
 * Mazo con la tarjeta de arriba y la siguiente asomándose, más los botones "Pasar" y "Me interesa".
 * Tocar la tarjeta o deslizarla hacia arriba abre el perfil completo (T-31).
 * En web también responde a las flechas ← y → del teclado.
 */
export function SwipeDeck({ cards, width, height, onDecide }: SwipeDeckProps) {
  const top = useRef<SwipeCardHandle>(null);
  // Evita lanzar dos veces la misma tarjeta con un doble toque mientras sale.
  const flinging = useRef<number | null>(null);
  const [expanded, setExpanded] = useState<DiscoveryCard | null>(null);
  const topId = cards[0]?.id;

  function fling(liked: boolean) {
    if (topId === undefined || flinging.current === topId) return;
    flinging.current = topId;
    top.current?.fling(liked);
  }

  /** Decidir desde el perfil expandido: primero se cierra y luego sale la tarjeta, para que se vea. */
  function decideFromProfile(liked: boolean) {
    setExpanded(null);
    setTimeout(() => fling(liked), CloseBeforeFlingMs);
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
      if (event.key === "ArrowRight") (expanded ? decideFromProfile : fling)(true);
      if (event.key === "ArrowLeft") (expanded ? decideFromProfile : fling)(false);
      if (event.key === "ArrowUp" && !expanded && cards[0]) setExpanded(cards[0]);
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
            onExpand={setExpanded}
          />
        ))}
      </View>

      {/* Los botones se montan sobre el borde de abajo de la tarjeta: la foto gana alto sin esconderlos. */}
      <View style={styles.actions}>
        <ActionButton
          label="Pasar"
          tone="pass"
          icon={{ ios: "xmark", android: "close", web: "close" }}
          onPress={() => fling(false)}
        />
        <ActionButton
          label="Ver perfil completo"
          tone="info"
          icon={{ ios: "chevron.up", android: "keyboard_arrow_up", web: "keyboard_arrow_up" }}
          onPress={() => cards[0] && setExpanded(cards[0])}
        />
        <ActionButton
          label="Like"
          tone="like"
          icon={LikeIcon}
          onPress={() => fling(true)}
        />
      </View>

      <ExpandedProfile
        card={expanded}
        onClose={() => setExpanded(null)}
        onDecide={decideFromProfile}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.four,
    // La mitad del botón grande queda sobre la tarjeta (que ya reserva ese espacio abajo).
    marginTop: -(OverlapHeight + 14),
  },
});
