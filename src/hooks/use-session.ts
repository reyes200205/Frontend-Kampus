/**
 * Sesión temporal en memoria para poder recorrer la app mientras no hay backend.
 * Se pierde al recargar. TODO (T-06): reemplazar por el token de Sanctum guardado de forma segura.
 */

import { useSyncExternalStore } from 'react';

let isSignedIn = false;
const listeners = new Set<() => void>();

function setSignedIn(value: boolean) {
  isSignedIn = value;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function signIn() {
  setSignedIn(true);
}

export function signOut() {
  setSignedIn(false);
}

export function useSession() {
  const signedIn = useSyncExternalStore(subscribe, () => isSignedIn, () => false);
  return { isSignedIn: signedIn };
}
