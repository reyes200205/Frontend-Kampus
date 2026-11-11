/**
 * Dónde se guarda el token de Sanctum en el celular: en el llavero cifrado del sistema
 * (Keychain en iOS, Keystore en Android) con `expo-secure-store`. Se guarda junto con su fecha de
 * vencimiento (`expires_at` del login, 7 días en el backend): mientras siga vigente, la sesión se
 * conserva aunque se cierre la app, como en cualquier red social.
 * La versión web está en `token-storage.web.ts`.
 */

import * as SecureStore from "expo-secure-store";

import { parseStoredToken, serializeToken } from "@/services/stored-token";

const Key = "kampus.token";

/** Token guardado, o `null` si no hay o ya venció (en ese caso también se borra). */
export async function readToken(): Promise<string | null> {
  try {
    const stored = parseStoredToken(await SecureStore.getItemAsync(Key));
    if (!stored) await deleteToken();
    return stored?.token ?? null;
  } catch {
    return null;
  }
}

export async function saveToken(token: string, expiresAt: string | null) {
  try {
    await SecureStore.setItemAsync(Key, serializeToken(token, expiresAt));
  } catch {
    // Sin llavero disponible la sesión sigue en memoria.
  }
}

export async function deleteToken() {
  try {
    await SecureStore.deleteItemAsync(Key);
  } catch {
    // Nada que borrar.
  }
}
