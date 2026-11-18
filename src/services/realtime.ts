/**
 * Tiempo real con Laravel Reverb (T-13 en el backend, T-16 en el frontend, RF-08).
 * Echo se conecta al WebSocket con el token de Sanctum de la sesión y autoriza los canales privados en
 * `POST /api/broadcasting/auth`. La configuración sale de las variables `EXPO_PUBLIC_REVERB_*`
 * (ver `.env.example`); sin `EXPO_PUBLIC_REVERB_APP_KEY` el tiempo real queda apagado y la app
 * se actualiza pidiendo los datos cada pocos segundos.
 *
 * Varias partes de la app pueden escuchar el mismo canal (la lista de Chats y la conversación abierta):
 * cada canal se suscribe una sola vez y se deja cuando ya nadie lo escucha.
 *
 * `laravel-echo` y `pusher-js` se cargan hasta que se necesitan: así no corren durante el render
 * estático de la versión web, donde no hay WebSocket.
 */

import type Echo from "laravel-echo";

import { getToken } from "@/hooks/use-session";
import type { EndedCall, IncomingCall } from "@/types/call";
import type { Message } from "@/types/chat";
import type { Match } from "@/types/discovery";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000/api";
const REVERB_KEY = process.env.EXPO_PUBLIC_REVERB_APP_KEY ?? "";
const REVERB_HOST = process.env.EXPO_PUBLIC_REVERB_HOST ?? "localhost";
const REVERB_PORT = Number(process.env.EXPO_PUBLIC_REVERB_PORT ?? 8080);
const REVERB_SCHEME = process.env.EXPO_PUBLIC_REVERB_SCHEME ?? "http";

let echo: Echo<"reverb"> | null = null;
/** Token con el que se creó la conexión; si cambia (otra cuenta), se vuelve a crear. */
let echoToken: string | null = null;

type Handler = (payload: never) => void;
/**
 * Un canal con sus eventos: cada evento tiene sus funciones y se registra en Echo una sola vez.
 * Un mismo canal puede escuchar varios eventos (p. ej. `user.{id}` recibe matches y llamadas).
 */
type Subscription = {
  events: Map<string, Set<Handler>>;
  /** Eventos ya registrados en Echo. */
  bound: Set<string>;
  client: Echo<"reverb"> | null;
};
const subscriptions = new Map<string, Subscription>();

/** `true` si la app tiene la clave de Reverb para conectarse en tiempo real. */
export function isRealtimeEnabled() {
  return REVERB_KEY !== "";
}

async function getEcho() {
  const token = getToken();
  if (!isRealtimeEnabled() || !token || typeof WebSocket === "undefined") return null;
  if (echo && echoToken === token) return echo;

  const [{ default: EchoClient }, { default: Pusher }] = await Promise.all([
    import("laravel-echo"),
    import("pusher-js"),
  ]);
  // Mientras cargaban los módulos otra llamada pudo crear la conexión.
  if (echo && echoToken === token) return echo;

  echo?.disconnect();
  echoToken = token;
  echo = new EchoClient({
    broadcaster: "reverb",
    Pusher,
    key: REVERB_KEY,
    wsHost: REVERB_HOST,
    wsPort: REVERB_PORT,
    wssPort: REVERB_PORT,
    forceTLS: REVERB_SCHEME === "https",
    enabledTransports: ["ws", "wss"],
    authEndpoint: `${API_URL}/broadcasting/auth`,
    auth: {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  });
  return echo;
}

/** Escucha `event` en el canal privado `name`. Devuelve la función para dejar de escuchar. */
function listen<T>(name: string, event: string, handler: (payload: T) => void) {
  let subscription = subscriptions.get(name);

  // Registra en Echo los eventos del canal que todavía no lo están (si ya hay conexión).
  const bindEvents = (sub: Subscription) => {
    if (!sub.client) return;
    const channel = sub.client.private(name);
    for (const [eventName, handlers] of sub.events) {
      if (sub.bound.has(eventName)) continue;
      sub.bound.add(eventName);
      channel.listen(eventName, (payload: unknown) => {
        handlers.forEach((fn) => (fn as (payload: unknown) => void)(payload));
      });
    }
  };

  if (!subscription) {
    const created: Subscription = { events: new Map(), bound: new Set(), client: null };
    subscription = created;
    subscriptions.set(name, created);
    void getEcho()
      .then((client) => {
        // Pudo dejar de escucharse (o cerrarse la sesión) mientras se conectaba.
        if (!client || subscriptions.get(name) !== created) return;
        created.client = client;
        bindEvents(created);
      })
      .catch(() => undefined);
  }

  const current = subscription;
  let handlers = current.events.get(event);
  if (!handlers) {
    handlers = new Set();
    current.events.set(event, handlers);
  }
  handlers.add(handler as Handler);
  bindEvents(current);

  return () => {
    const eventHandlers = current.events.get(event);
    eventHandlers?.delete(handler as Handler);
    if (subscriptions.get(name) !== current) return;
    if (eventHandlers && eventHandlers.size === 0) {
      current.events.delete(event);
      if (current.bound.delete(event)) current.client?.private(name).stopListening(event);
    }
    if (current.events.size > 0) return;
    subscriptions.delete(name);
    current.client?.leave(name);
  };
}

/**
 * Mensajes nuevos de un match en el canal `chat.{matchId}`. Solo los dos del match pueden
 * suscribirse (el backend lo revisa).
 */
export function listenToChat(matchId: number, onMessage: (message: Message) => void) {
  return listen<{ message: Message }>(`chat.${matchId}`, ".message.sent", (event) => onMessage(event.message));
}

type MatchCreatedPayload = {
  match: { id: number; matched_at: string | null; users: Match["user"][] };
};

/** Matches nuevos en el canal propio `user.{userId}`: llega `users` con los dos y se toma al otro. */
export function listenToNewMatches(userId: number, onMatch: (match: Match) => void) {
  return listen<MatchCreatedPayload>(`user.${userId}`, ".match.created", ({ match }) => {
    const other = match.users.find((user) => user.id !== userId);
    if (other) onMatch({ id: match.id, matched_at: match.matched_at, user: other });
  });
}

/**
 * Videollamadas en el canal propio `user.{userId}` (T-19): `call.started` cuando alguien del match te llama
 * y `call.ended` cuando la otra persona cuelga o rechaza.
 */
export function listenToCalls(
  userId: number,
  handlers: { onStarted: (call: IncomingCall) => void; onEnded: (call: EndedCall) => void },
) {
  const stopStarted = listen<{ call: IncomingCall }>(`user.${userId}`, ".call.started", ({ call }) =>
    handlers.onStarted(call),
  );
  const stopEnded = listen<{ call: EndedCall }>(`user.${userId}`, ".call.ended", ({ call }) =>
    handlers.onEnded(call),
  );
  return () => {
    stopStarted();
    stopEnded();
  };
}

/** Cierra la conexión al cerrar sesión, para que la siguiente cuenta no herede los canales. */
export function disconnectRealtime() {
  subscriptions.clear();
  echo?.disconnect();
  echo = null;
  echoToken = null;
}
