/**
 * Zona declarada y "Cerca de ti" compartidos entre la pestaña Perfil y la pantalla de zona (T-36).
 * Cada respuesta de la API reemplaza el estado guardado aquí, así el cambio se ve en las dos.
 */

import { useSyncExternalStore } from "react";

import { ApiError } from "@/services/api";
import { getLocation, getZones } from "@/services/location";
import type { LocationState, Zone } from "@/types/location";

type State = {
  location: LocationState | null;
  zones: Zone[];
  loading: boolean;
  error: string | null;
};

const initialState: State = { location: null, zones: [], loading: false, error: null };

let state = initialState;
const listeners = new Set<() => void>();

function setState(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Pide la ubicación del alumno y, si hace falta, el catálogo de zonas (es corto y casi no cambia). */
export async function loadLocation({ withZones = false } = {}) {
  setState({ loading: true, error: null });
  try {
    const [location, zones] = await Promise.all([
      getLocation(),
      withZones && state.zones.length === 0 ? getZones() : Promise.resolve(state.zones),
    ]);
    setState({ location, zones, loading: false });
  } catch (e) {
    setState({
      loading: false,
      error: e instanceof ApiError ? e.message : "No se pudo cargar tu zona.",
    });
  }
}

/** Guarda lo que devolvió la API después de un cambio. */
export function setLocation(location: LocationState) {
  setState({ location, error: null });
}

/** Limpia la ubicación al cerrar sesión para que no la vea la siguiente cuenta. */
export function clearLocation() {
  setState(initialState);
}

export function useLocation() {
  return useSyncExternalStore(subscribe, () => state, () => state);
}
