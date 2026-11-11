/**
 * Dónde se guarda el token de Sanctum en web: en `localStorage`, junto con su fecha de vencimiento
 * (`expires_at` del login, 7 días en el backend). Mientras siga vigente, la sesión se conserva al
 * recargar o cerrar el navegador; se borra al cerrar sesión o cuando vence.
 * La versión del celular está en `token-storage.ts`.
 */

import { parseStoredToken, serializeToken } from "@/services/stored-token";

const Key = "kampus.token";

function storage() {
  // En el render estático de la versión web no hay `window`.
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Token guardado, o `null` si no hay o ya venció (en ese caso también se borra). */
export async function readToken(): Promise<string | null> {
  try {
    const stored = parseStoredToken(storage()?.getItem(Key) ?? null);
    if (!stored) await deleteToken();
    return stored?.token ?? null;
  } catch {
    return null;
  }
}

export async function saveToken(token: string, expiresAt: string | null) {
  try {
    storage()?.setItem(Key, serializeToken(token, expiresAt));
  } catch {
    // Almacenamiento bloqueado (modo privado o sin permisos): la sesión sigue en memoria.
  }
}

export async function deleteToken() {
  try {
    storage()?.removeItem(Key);
    // Sesiones guardadas por la versión anterior en `sessionStorage`.
    window.sessionStorage?.removeItem(Key);
  } catch {
    // Nada que borrar.
  }
}
