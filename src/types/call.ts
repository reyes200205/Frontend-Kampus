/** Videollamada 1 a 1 entre matches (T-19 en el backend, T-20 en el frontend, RF-10). */

import type { Match } from "@/types/discovery";

/** Respuesta de `POST /matches/{match}/call` y `POST /matches/{match}/call/token`. */
export type CallAccess = {
  /** Servidor de LiveKit (`wss://…`). */
  url: string;
  /** Sala del match (`match-{id}`): siempre la misma para los dos. */
  room: string;
  /** Token para entrar a la sala; dura 15 minutos. */
  token: string;
  expires_at: string;
};

/** Evento `call.started` del canal `user.{id}`: alguien del match te está llamando. */
export type IncomingCall = {
  match_id: number;
  caller: Match["user"];
};

/** Evento `call.ended` del canal `user.{id}`: la otra persona colgó o rechazó. */
export type EndedCall = {
  match_id: number;
  ended_by: number;
};
