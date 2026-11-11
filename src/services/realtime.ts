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
type Subscription = { handlers: Set<Handler>; client: Echo<"reverb"> | null };
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

  if (!subscription) {
    const created: Subscription = { handlers: new Set(), client: null };
    subscription = created;
    subscriptions.set(name, created);
    void getEcho()
      .then((client) => {
        // Pudo dejar de escucharse (o cerrarse la sesión) mientras se conectaba.
        if (!client || subscriptions.get(name) !== created) return;
        created.client = client;
        client.private(name).listen(event, (payload: T) => {
          created.handlers.forEach((fn) => (fn as (payload: T) => void)(payload));
        });
      })
      .catch(() => undefined);
  }

  const current = subscription;
  current.handlers.add(handler as Handler);

  return () => {
    current.handlers.delete(handler as Handler);
    if (current.handlers.size > 0 || subscriptions.get(name) !== current) return;
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

/** Cierra la conexión al cerrar sesión, para que la siguiente cuenta no herede los canales. */
export function disconnectRealtime() {
  subscriptions.clear();
  echo?.disconnect();
  echo = null;
  echoToken = null;
}
