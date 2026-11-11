/**
 * Conversaciones de los matches (T-16, RF-08), compartidas entre la lista de Chats y la pantalla de
 * cada conversación. Los mensajes se guardan del más reciente al más antiguo, igual que los manda la
 * API, para dibujarlos en una lista invertida. Un mensaje que se está enviando lleva un id local
 * negativo hasta que la API responde.
 */

import { useSyncExternalStore } from "react";

import { ApiError } from "@/services/api";
import { getMessages, markMessagesRead, sendMessage } from "@/services/messages";
import type { ChatMessage, Message } from "@/types/chat";

const PageSize = 30;
/** Las vistas previas de la lista se vuelven a pedir si tienen más de 30 s. */
const PreviewTtlMs = 30_000;
/** Peticiones de vista previa en paralelo, para no gastar de golpe el límite de la API. */
const PreviewConcurrency = 4;

export type Conversation = {
  messages: ChatMessage[];
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
  /** Código HTTP del error al cargar (404 si el match ya no existe o hay un bloqueo). */
  errorStatus: number | null;
  hasMore: boolean;
  loadingMore: boolean;
  page: number;
  /** Último mensaje para la lista de Chats; `undefined` mientras no se sabe, `null` si no hay mensajes. */
  preview: Message | null | undefined;
  previewAt: number;
};

const emptyConversation: Conversation = {
  messages: [],
  status: "idle",
  error: null,
  errorStatus: null,
  hasMore: false,
  loadingMore: false,
  page: 1,
  preview: undefined,
  previewAt: 0,
};

let conversations: Record<number, Conversation> = {};
let nextTempId = -1;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function get(matchId: number) {
  return conversations[matchId] ?? emptyConversation;
}

function update(matchId: number, changes: Partial<Conversation>) {
  conversations = { ...conversations, [matchId]: { ...get(matchId), ...changes } };
  listeners.forEach((listener) => listener());
}

function errorMessage(e: unknown, fallback: string) {
  return e instanceof ApiError ? e.message : fallback;
}

/** Los que se están enviando van primero (el más nuevo arriba); después, por id de mayor a menor. */
function rank(message: ChatMessage) {
  return message.id < 0 ? Number.MAX_SAFE_INTEGER + message.id * -1 : message.id;
}

function merge(existing: ChatMessage[], incoming: ChatMessage[]) {
  const byId = new Map<number, ChatMessage>();
  for (const message of existing) byId.set(message.id, message);
  for (const message of incoming) byId.set(message.id, message);
  return [...byId.values()].sort((a, b) => rank(b) - rank(a));
}

/** Primera página de la conversación. Lo ya cargado se queda en pantalla mientras llega. */
export async function loadConversation(matchId: number) {
  const current = get(matchId);
  update(matchId, {
    status: current.messages.length > 0 ? "ready" : "loading",
    error: null,
    errorStatus: null,
  });
  try {
    const res = await getMessages(matchId, 1, PageSize);
    // Los mensajes más antiguos que ya estaban cargados se conservan.
    const oldest = res.data.at(-1)?.id ?? 0;
    const older = get(matchId).messages.filter((message) => message.id < 0 || message.id < oldest);
    // Si ya se habían cargado páginas anteriores, se sigue desde ahí.
    const keepPages = current.page > 1;
    update(matchId, {
      messages: merge(older, res.data),
      status: "ready",
      page: keepPages ? current.page : 1,
      hasMore: keepPages ? current.hasMore : res.meta.current_page < res.meta.last_page,
      preview: res.data[0] ?? null,
      previewAt: Date.now(),
    });
  } catch (e) {
    const hasMessages = get(matchId).messages.length > 0;
    update(matchId, {
      status: hasMessages ? "ready" : "error",
      error: errorMessage(e, "No se pudieron cargar los mensajes."),
      errorStatus: e instanceof ApiError ? e.status : null,
    });
  }
}

/** Mensajes anteriores, al llegar al principio de la conversación. */
export async function loadOlderMessages(matchId: number) {
  const current = get(matchId);
  if (!current.hasMore || current.loadingMore) return;
  update(matchId, { loadingMore: true });
  try {
    const res = await getMessages(matchId, current.page + 1, PageSize);
    update(matchId, {
      messages: merge(get(matchId).messages, res.data),
      page: res.meta.current_page,
      hasMore: res.meta.current_page < res.meta.last_page,
      loadingMore: false,
    });
  } catch (e) {
    update(matchId, { loadingMore: false, error: errorMessage(e, "No se pudieron cargar más mensajes.") });
  }
}

async function deliver(matchId: number, tempId: number, body: string) {
  try {
    const message = await sendMessage(matchId, body);
    const rest = get(matchId).messages.filter((item) => item.id !== tempId);
    update(matchId, { messages: merge(rest, [message]), preview: message, previewAt: Date.now() });
  } catch (e) {
    update(matchId, {
      messages: get(matchId).messages.map((item) =>
        item.id === tempId ? { ...item, pending: "failed" } : item,
      ),
      error: errorMessage(e, "No se pudo enviar el mensaje."),
    });
  }
}

/** Envía un mensaje: aparece al instante y se confirma cuando responde la API. */
export function sendChatMessage(matchId: number, senderId: number, body: string) {
  const tempId = nextTempId--;
  const message: ChatMessage = {
    id: tempId,
    match_id: matchId,
    sender_id: senderId,
    type: "text",
    body,
    read_at: null,
    created_at: new Date().toISOString(),
    pending: "sending",
  };
  update(matchId, { messages: merge(get(matchId).messages, [message]), error: null });
  void deliver(matchId, tempId, body);
}

/** Reintenta un mensaje que no se pudo enviar. */
export function retryChatMessage(matchId: number, tempId: number) {
  const message = get(matchId).messages.find((item) => item.id === tempId);
  if (!message || message.pending !== "failed" || !message.body) return;
  update(matchId, {
    messages: get(matchId).messages.map((item) => (item.id === tempId ? { ...item, pending: "sending" } : item)),
    error: null,
  });
  void deliver(matchId, tempId, message.body);
}

/** Mensaje que llegó por Reverb. */
export function receiveChatMessage(message: Message) {
  const current = get(message.match_id);
  if (current.messages.some((item) => item.id === message.id)) return;
  update(message.match_id, {
    messages: current.status === "idle" ? current.messages : merge(current.messages, [message]),
    preview: message,
    previewAt: Date.now(),
  });
}

/** Marca como leídos los mensajes de la otra persona, en la API y en la lista. */
export async function markConversationRead(matchId: number, myId: number) {
  const unread = (message: ChatMessage) => message.sender_id !== myId && message.id > 0 && !message.read_at;
  const current = get(matchId);
  if (!current.messages.some(unread) && !(current.preview && unread(current.preview))) return;

  const now = new Date().toISOString();
  update(matchId, {
    messages: current.messages.map((message) => (unread(message) ? { ...message, read_at: now } : message)),
    preview: current.preview && unread(current.preview) ? { ...current.preview, read_at: now } : current.preview,
  });
  await markMessagesRead(matchId).catch(() => undefined);
}

/** Último mensaje de cada match para la lista de Chats. Solo pide los que no tiene o ya están viejos. */
export async function loadPreviews(matchIds: number[]) {
  const now = Date.now();
  const queue = matchIds.filter((id) => now - get(id).previewAt > PreviewTtlMs);

  async function worker() {
    for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
      try {
        const res = await getMessages(id, 1, 1);
        update(id, { preview: res.data[0] ?? null, previewAt: Date.now() });
      } catch {
        // Sin vista previa: la fila muestra el match como antes.
      }
    }
  }

  await Promise.all(Array.from({ length: PreviewConcurrency }, worker));
}

/** Limpia las conversaciones al cerrar sesión para que no las vea la siguiente cuenta. */
export function clearChats() {
  conversations = {};
  listeners.forEach((listener) => listener());
}

export function useConversation(matchId: number) {
  return useSyncExternalStore(subscribe, () => get(matchId), () => get(matchId));
}

/** Todas las conversaciones, para la lista de Chats. */
export function useConversations() {
  return useSyncExternalStore(subscribe, () => conversations, () => conversations);
}

/**
 * Último mensaje conocido de una conversación: el más nuevo entre los cargados y la vista previa.
 * La vista previa puede ser más nueva que lo cargado si el mensaje llegó con la conversación cerrada.
 */
export function lastMessage(conversation: Conversation | undefined): ChatMessage | null | undefined {
  const loaded = conversation?.messages[0];
  const preview = conversation?.preview;
  // Uno que se está enviando (id negativo) siempre es lo último.
  if (loaded && loaded.id < 0) return loaded;
  if (preview && (!loaded || preview.id > loaded.id)) return preview;
  return loaded ?? preview;
}

/** `true` si el último mensaje es de la otra persona y todavía no se lee. */
export function isUnread(message: ChatMessage | null | undefined, myId: number) {
  return !!message && message.id > 0 && message.sender_id !== myId && !message.read_at;
}

/** Conversaciones con mensajes sin leer, para el contador de la pestaña Chats. */
export function useUnreadChatsCount(myId: number) {
  const all = useConversations();
  return Object.values(all).filter((conversation) => isUnread(lastMessage(conversation), myId)).length;
}
