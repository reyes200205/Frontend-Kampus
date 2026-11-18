/**
 * Estilo predeterminado del chat (burbuja propia y fondo), compartido entre Apariencia y las
 * conversaciones. Es una preferencia del dispositivo: se guarda localmente y no se borra al cerrar sesión.
 */

import { useSyncExternalStore } from "react";

import { DefaultChatStyle, sanitizeChatStyle, type ChatStyle } from "@/constants/chat-style";
import { readPreference, writePreference } from "@/services/preferences-storage";

const Key = "kampus.chat-style";

let state: ChatStyle = DefaultChatStyle;
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Lee el estilo guardado; se llama una vez al abrir la app. */
export async function loadChatStyle() {
  if (loaded) return;
  loaded = true;
  const stored = await readPreference(Key);
  if (!stored) return;
  try {
    state = sanitizeChatStyle(JSON.parse(stored));
    emit();
  } catch {
    // Valor dañado: se queda el predeterminado.
  }
}

export function setChatStyle(next: Partial<ChatStyle>) {
  state = { ...state, ...next };
  emit();
  void writePreference(Key, JSON.stringify(state));
}

export function resetChatStyle() {
  setChatStyle(DefaultChatStyle);
}

export function useChatStyle() {
  return useSyncExternalStore(subscribe, () => state, () => state);
}
