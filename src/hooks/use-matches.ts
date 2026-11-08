/**
 * Matches del estudiante compartidos entre Descubrir y Chats (T-12, RF-07).
 * Cuando un swipe crea un match se agrega aquí al instante, así la pestaña Chats lo muestra sin
 * esperar a volver a pedir la lista.
 */

import { useSyncExternalStore } from "react";

import { ApiError } from "@/services/api";
import { getMatches } from "@/services/matches";
import type { Match } from "@/types/discovery";

type MatchesState = {
  matches: Match[];
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
  /** Hay más páginas en la API. */
  hasMore: boolean;
  loadingMore: boolean;
};

const initialState: MatchesState = {
  matches: [],
  status: "idle",
  error: null,
  hasMore: false,
  loadingMore: false,
};

let state = initialState;
let page = 1;
const listeners = new Set<() => void>();

function setState(next: Partial<MatchesState>) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function errorMessage(e: unknown) {
  return e instanceof ApiError ? e.message : "No se pudieron cargar tus matches.";
}

/**
 * Pide la primera página. También renueva las URL firmadas de las fotos, que caducan a los 15 min.
 * Si ya había matches, se quedan en pantalla mientras llega la respuesta.
 */
export async function loadMatches() {
  setState({ status: state.matches.length > 0 ? "ready" : "loading", error: null });
  try {
    const res = await getMatches(1);
    page = 1;
    setState({
      matches: res.data,
      status: "ready",
      hasMore: res.meta.current_page < res.meta.last_page,
    });
  } catch (e) {
    setState({ status: state.matches.length > 0 ? "ready" : "error", error: errorMessage(e) });
  }
}

/** Siguiente página de matches. */
export async function loadMoreMatches() {
  if (!state.hasMore || state.loadingMore) return;
  setState({ loadingMore: true });
  try {
    const res = await getMatches(page + 1);
    page = res.meta.current_page;
    const known = new Set(state.matches.map((match) => match.id));
    setState({
      matches: [...state.matches, ...res.data.filter((match) => !known.has(match.id))],
      hasMore: res.meta.current_page < res.meta.last_page,
      loadingMore: false,
    });
  } catch (e) {
    setState({ loadingMore: false, error: errorMessage(e) });
  }
}

/** Agrega el match que acaba de crear un swipe, al principio de la lista. */
export function addMatch(match: Match) {
  if (state.matches.some((item) => item.id === match.id)) return;
  setState({ matches: [match, ...state.matches] });
}

/** Limpia los matches al cerrar sesión para que no los vea la siguiente cuenta. */
export function clearMatches() {
  page = 1;
  setState(initialState);
}

export function useMatches() {
  return useSyncExternalStore(subscribe, () => state, () => state);
}
