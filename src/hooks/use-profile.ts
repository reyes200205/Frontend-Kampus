/**
 * Perfil del estudiante compartido entre la pestaña Perfil y la pantalla de edición (T-08, RF-03).
 * Cada respuesta de la API (guardar datos, intereses o fotos) reemplaza el perfil guardado aquí,
 * así que los cambios se ven al instante en todas las pantallas sin volver a pedirlo.
 */

import { useSyncExternalStore } from "react";

import { ApiError } from "@/services/api";
import { getProfile } from "@/services/profile";
import type { Profile } from "@/types/profile";

type ProfileState = {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
};

let state: ProfileState = { profile: null, loading: false, error: null };
const listeners = new Set<() => void>();

function setState(next: Partial<ProfileState>) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Guarda el perfil que devolvió la API después de un cambio. */
export function setProfile(profile: Profile) {
  setState({ profile, error: null });
}

/** Pide el perfil al backend. También renueva las URL firmadas de las fotos, que caducan a los 15 min. */
export async function loadProfile() {
  setState({ loading: true, error: null });
  try {
    setState({ profile: await getProfile(), loading: false });
  } catch (e) {
    setState({
      loading: false,
      error: e instanceof ApiError ? e.message : "No se pudo cargar tu perfil.",
    });
  }
}

/** Limpia el perfil al cerrar sesión para que no lo vea la siguiente cuenta. */
export function clearProfile() {
  setState({ profile: null, loading: false, error: null });
}

export function useProfile() {
  return useSyncExternalStore(subscribe, () => state, () => state);
}
