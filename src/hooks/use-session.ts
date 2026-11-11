/**
 * Sesión con el token de Sanctum que devuelve `POST /api/login`.
 * El token se guarda con su vencimiento (llavero cifrado en el celular, `localStorage` en web; ver
 * `services/token-storage`) y al abrir la app `restoreSession` lo valida con `GET /api/user`:
 * si sigue vigente, se entra directo; si venció o se revocó, se borra y se pide iniciar sesión.
 */

import { useSyncExternalStore } from 'react';

import { ApiError, setTokenProvider } from '@/services/api';
import { getCurrentUser } from '@/services/auth';
import { deleteToken, readToken, saveToken } from '@/services/token-storage';
import type { User } from '@/types/auth';

type Session = { token: string; user: User } | null;

let session: Session = null;
/** `false` hasta revisar si había un token guardado; mientras, la app no decide a dónde ir. */
let restored = false;
/** Token guardado que se está validando: lo usa `apiRequest` para `GET /user`. */
let pendingToken: string | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function setSession(value: Session) {
  session = value;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Inicia sesión y guarda el token con su vencimiento (`expires_at` del login): mientras siga vigente,
 * la sesión se conserva al recargar o al cerrar la app o el navegador.
 */
export function signIn(token: string, user: User, expiresAt: string | null) {
  setSession({ token, user });
  void saveToken(token, expiresAt);
}

/** Actualiza datos del usuario de la sesión, p. ej. al terminar el perfil por pasos (T-49). */
export function updateSessionUser(changes: Partial<User>) {
  if (session) setSession({ ...session, user: { ...session.user, ...changes } });
}

/** Cierra la sesión local y borra el token guardado. Para revocarlo en el backend, ver `endSession`. */
export function signOut() {
  setSession(null);
  void deleteToken();
}

export function getToken() {
  return session?.token ?? pendingToken;
}

// El cliente HTTP toma el token de aquí.
setTokenProvider(getToken);

/**
 * Revisa si hay un token guardado y si sigue siendo válido (`GET /api/user`). Se llama una vez al
 * abrir la app; hasta que termina, `useSessionRestored` devuelve `false`.
 */
export async function restoreSession() {
  if (restored) return;
  const token = await readToken();
  if (token && !session) {
    pendingToken = token;
    try {
      setSession({ token, user: await getCurrentUser() });
    } catch (e) {
      // 401 o 403: el token venció, se revocó o la cuenta ya no puede entrar. Sin red, se conserva
      // para intentarlo la próxima vez.
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) await deleteToken();
    } finally {
      pendingToken = null;
    }
  }
  restored = true;
  emit();
}

export function useSessionRestored() {
  return useSyncExternalStore(subscribe, () => restored, () => false);
}

export function useSession() {
  const current = useSyncExternalStore(subscribe, () => session, () => null);
  return { isSignedIn: current !== null, user: current?.user ?? null };
}
