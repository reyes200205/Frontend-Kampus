/**
 * Preferencias del dispositivo (apariencia, etc.) en el celular: texto guardado con `expo-secure-store`,
 * que ya usa la app para el token. No son datos sensibles; se usa porque ya está instalado y es estable.
 * La versión web está en `preferences-storage.web.ts`.
 */

import * as SecureStore from "expo-secure-store";

export async function readPreference(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function writePreference(key: string, value: string) {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    // Sin almacenamiento la preferencia dura hasta cerrar la app.
  }
}
