/**
 * Mensajes y matches nuevos mientras la sesión está abierta, aunque no estés en Chats (T-16, RF-08).
 * Se monta una sola vez junto a las pestañas: escucha el canal `chat.{id}` de cada match y el canal
 * propio `user.{id}` para los matches nuevos, y así la pestaña Chats muestra cuántas conversaciones
 * tienen mensajes sin leer. Sin Reverb, revisa las vistas previas cada 30 s.
 */

import { useEffect, useRef } from "react";

import { loadPreviews, receiveChatMessage } from "@/hooks/use-chat";
import { addMatch, loadMatches, useMatches } from "@/hooks/use-matches";
import { isRealtimeEnabled, listenToChat, listenToNewMatches } from "@/services/realtime";

const PollMs = 30_000;

export function useChatRealtime(myId: number | null) {
  const { matches, status } = useMatches();
  const matchIds = matches.map((match) => match.id).join(",");
  const stops = useRef(new Map<number, () => void>());

  // La lista de matches hace falta para saber qué conversaciones escuchar.
  useEffect(() => {
    if (myId && status === "idle") void loadMatches();
  }, [myId, status]);

  // Un canal por match; al cambiar la lista solo se suscriben los nuevos y se dejan los que ya no están.
  useEffect(() => {
    const ids = matchIds ? matchIds.split(",").map(Number) : [];
    if (!myId) return;

    void loadPreviews(ids);

    const current = stops.current;
    for (const id of ids) {
      if (current.has(id)) continue;
      current.set(
        id,
        listenToChat(id, (message) => {
          // Los propios ya llegan con la respuesta de la API.
          if (message.sender_id !== myId) receiveChatMessage(message);
        }),
      );
    }
    for (const [id, stop] of current) {
      if (!ids.includes(id)) {
        stop();
        current.delete(id);
      }
    }
  }, [matchIds, myId]);

  // Al cerrar sesión (o desmontar las pestañas) se deja de escuchar todo.
  useEffect(() => {
    const current = stops.current;
    return () => {
      current.forEach((stop) => stop());
      current.clear();
    };
  }, [myId]);

  // Matches nuevos que creó la otra persona con su swipe.
  useEffect(() => {
    if (!myId) return;
    return listenToNewMatches(myId, addMatch);
  }, [myId]);

  // Sin tiempo real, se revisa de vez en cuando si llegaron mensajes.
  useEffect(() => {
    if (!myId || isRealtimeEnabled() || !matchIds) return;
    const ids = matchIds.split(",").map(Number);
    const timer = setInterval(() => void loadPreviews(ids), PollMs);
    return () => clearInterval(timer);
  }, [matchIds, myId]);
}
