/**
 * Vista "Cerca" (T-30, RF-19): quién está cerca, quién está seleccionado en el mapa y los swipes que se
 * hacen desde ahí. Usa las mismas reglas que Descubrir: quien ya se evaluó desaparece del mapa y un
 * "Me interesa" de los dos lados abre el match.
 */

import { useCallback, useRef, useState } from "react";

import { addMatch } from "@/hooks/use-matches";
import { ApiError } from "@/services/api";
import { getNearby, swipe } from "@/services/discovery";
import type { Match, NearbyUser } from "@/types/discovery";

type Status = "idle" | "loading" | "ready" | "error";
type Coordinate = { lat: number; lng: number };

/** Cuántas de las personas más cercanas se encuadran al cargar (las demás quedan a un zoom de distancia). */
const FocusCount = 8;

export function useNearby() {
  const [users, setUsers] = useState<NearbyUser[]>([]);
  const [center, setCenter] = useState<Coordinate | null>(null);
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  /** Código de la API del último error: `nearby_disabled` o `profile_incomplete`. */
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  /**
   * Puntos a encuadrar en el mapa: tú y las personas más cercanas. Solo cambia con cada respuesta de la
   * API, así el mapa no se mueve tras un swipe.
   */
  const [focus, setFocus] = useState<Coordinate[] | null>(null);
  /** Aviso cuando no se pudo guardar un swipe. */
  const [notice, setNotice] = useState<string | null>(null);

  // Si se recarga mientras un swipe sigue en camino, la API todavía puede devolver a esa persona.
  const evaluated = useRef(new Set<number>());
  const request = useRef(0);

  const load = useCallback(async () => {
    const current = ++request.current;
    setStatus((previous) => (previous === "ready" ? previous : "loading"));

    try {
      const res = await getNearby();
      if (current !== request.current) return;

      const visible = res.data.filter((user) => !evaluated.current.has(user.id));
      setUsers(visible);
      setCenter(res.meta.center);
      setRadiusKm(res.meta.radius_km);
      setFocus([res.meta.center, ...visible.slice(0, FocusCount).map((user) => user.nearby.position)]);
      setStatus("ready");
      setError(null);
      setErrorCode(null);
    } catch (e) {
      if (current !== request.current) return;
      setStatus("error");
      setError(e instanceof ApiError ? e.message : "No pudimos cargar quién está cerca.");
      setErrorCode(e instanceof ApiError ? (e.code ?? null) : null);
    }
  }, []);

  /** "Me interesa" (`liked: true`) o "Pasar" sobre alguien del mapa. */
  const decide = useCallback(async (user: NearbyUser, liked: boolean) => {
    evaluated.current.add(user.id);
    setUsers((previous) => previous.filter((item) => item.id !== user.id));
    setSelectedId((previous) => (previous === user.id ? null : previous));
    setNotice(null);

    try {
      const data = await swipe(user.id, liked);
      if (data.match) {
        setMatch(data.match);
        addMatch(data.match);
      }
    } catch (e) {
      // 409: ya se había evaluado. No hay nada que deshacer.
      if (e instanceof ApiError && e.status === 409) return;

      // 422: dejó de estar disponible (bloqueo, suspensión). Se queda fuera del mapa.
      if (e instanceof ApiError && e.status === 422) {
        setNotice(e.field("user_id") ?? e.message);
        return;
      }

      // Red o servidor: vuelve al mapa para intentarlo de nuevo.
      evaluated.current.delete(user.id);
      setUsers((previous) => [...previous, user].sort((a, b) => a.nearby.distance_km - b.nearby.distance_km));
      setNotice(e instanceof ApiError ? e.message : "No se pudo guardar tu respuesta.");
    }
  }, []);

  return {
    users,
    center,
    radiusKm,
    status,
    focus,
    error,
    errorCode,
    selected: users.find((user) => user.id === selectedId) ?? null,
    match,
    notice,
    load,
    decide,
    select: setSelectedId,
    dismissMatch: () => setMatch(null),
    dismissNotice: () => setNotice(null),
  };
}
