/**
 * Preferencias del dispositivo (apariencia, etc.) en web: `localStorage`.
 * La versión del celular está en `preferences-storage.ts`.
 */

function storage() {
  // En el render estático de la versión web no hay `window`.
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export async function readPreference(key: string): Promise<string | null> {
  try {
    return storage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export async function writePreference(key: string, value: string) {
  try {
    storage()?.setItem(key, value);
  } catch {
    // Almacenamiento bloqueado (modo privado): la preferencia dura hasta recargar.
  }
}
