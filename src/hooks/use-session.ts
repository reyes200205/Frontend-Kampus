/**
 * Sesión en memoria con el token de Sanctum que devuelve `POST /api/login`.
 * Se pierde al recargar. TODO (T-06): guardar el token de forma segura (expo-secure-store).
 */

import { useSyncExternalStore } from 'react';

import type { User } from '@/types/auth';

type Session = { token: string; user: User } | null;

let session: Session = null;
const listeners = new Set<() => void>();

function setSession(value: Session) {
  session = value;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function signIn(token: string, user: User) {
  setSession({ token, user });
}

/** Actualiza datos del usuario de la sesión, p. ej. al terminar el perfil por pasos (T-49). */
export function updateSessionUser(changes: Partial<User>) {
  if (session) setSession({ ...session, user: { ...session.user, ...changes } });
}

export function signOut() {
  setSession(null);
}

export function getToken() {
  return session?.token ?? null;
}

export function useSession() {
  const current = useSyncExternalStore(subscribe, () => session, () => null);
  return { isSignedIn: current !== null, user: current?.user ?? null };
}
