/**
 * Mazo de perfiles de Descubrir: pide tandas a la API, registra cada swipe y avisa si hubo match.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError } from "@/services/api";
import { getDiscovery, swipe } from "@/services/discovery";
import type { DiscoveryCard, Match } from "@/types/discovery";

const BatchSize = 10;
/** Con menos tarjetas que esto en el mazo se pide la siguiente tanda, para que no se note la espera. */
const RefillThreshold = 3;

type Status = "loading" | "ready" | "error";

export function useDiscovery() {
  const [cards, setCards] = useState<DiscoveryCard[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  /** La API ya no tiene más perfiles con estos filtros. */
  const [exhausted, setExhausted] = useState(false);
  const [match, setMatch] = useState<Match | null>(null);

  // Ids que ya están en el mazo o ya se evaluaron. Si se pide otra tanda mientras un swipe sigue en
  // camino, la API puede devolver ese perfil otra vez; así no se repite.
  const known = useRef(new Set<number>());
  const evaluated = useRef(new Set<number>());
  const fetching = useRef(false);
  // Cambia en cada `reload` para descartar respuestas de una tanda con filtros anteriores.
  const generation = useRef(0);

  const fetchMore = useCallback(async () => {
    if (fetching.current) return;
    fetching.current = true;
    const current = generation.current;

    try {
      const data = await getDiscovery(BatchSize);
      if (current !== generation.current) return;

      const fresh = data.filter((card) => !known.current.has(card.id) && !evaluated.current.has(card.id));
      fresh.forEach((card) => known.current.add(card.id));

      setCards((previous) => [...previous, ...fresh]);
      if (fresh.length === 0) setExhausted(true);
      setStatus("ready");
      setError(null);
    } catch (e) {
      if (current !== generation.current) return;
      setStatus((previous) => (previous === "loading" ? "error" : previous));
      setError(e instanceof ApiError ? e.message : "No se pudieron cargar los perfiles.");
    } finally {
      fetching.current = false;
    }
  }, []);

  /** Vacía el mazo y vuelve a pedir perfiles (p. ej. después de cambiar los filtros). */
  const reload = useCallback(() => {
    generation.current += 1;
    fetching.current = false;
    known.current = new Set();
    setCards([]);
    setExhausted(false);
    setError(null);
    setStatus("loading");
    void fetchMore();
  }, [fetchMore]);

  useEffect(() => {
    void fetchMore();
  }, [fetchMore]);

  // Rellena el mazo antes de que se acabe.
  useEffect(() => {
    if (status === "ready" && !exhausted && cards.length < RefillThreshold) void fetchMore();
  }, [cards.length, exhausted, fetchMore, status]);

  /** "Me interesa" (`liked: true`) o "Pasar" sobre la tarjeta de arriba. */
  const decide = useCallback(async (card: DiscoveryCard, liked: boolean) => {
    evaluated.current.add(card.id);
    setCards((previous) => previous.filter((item) => item.id !== card.id));

    try {
      const data = await swipe(card.id, liked);
      if (data.match) setMatch(data.match);
    } catch (e) {
      // 409: ya se había evaluado (otra pestaña o un doble toque). No hay nada que deshacer.
      if (e instanceof ApiError && e.status === 409) return;

      // 422: el perfil dejó de estar disponible (bloqueo, suspensión). Se queda fuera del mazo.
      if (e instanceof ApiError && e.status === 422) {
        setError(e.field("user_id") ?? e.message);
        return;
      }

      // Cualquier otro error (red, servidor): la tarjeta vuelve arriba para intentarlo de nuevo.
      evaluated.current.delete(card.id);
      setCards((previous) => [card, ...previous]);
      setError(e instanceof ApiError ? e.message : "No se pudo guardar tu respuesta.");
    }
  }, []);

  return {
    cards,
    status,
    error,
    exhausted,
    match,
    decide,
    reload,
    dismissError: () => setError(null),
    dismissMatch: () => setMatch(null),
  };
}
