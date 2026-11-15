/**
 * Videollamada 1 a 1 entre matches (T-19 en el backend, T-20 en el frontend, RF-10).
 * La API solo entrega el token de LiveKit a los dos del match; las credenciales nunca llegan a la app.
 * Si LiveKit no está configurado o no responde, la API contesta 503 con `code: "video_unavailable"`.
 */

import { apiRequest } from "@/services/api";
import type { ApiResource } from "@/types/api";
import type { CallAccess } from "@/types/call";

/** Empieza la llamada: la API prepara la sala, entrega tu token y le avisa a la otra persona. */
export function startCall(matchId: number) {
  return apiRequest<ApiResource<CallAccess>>(`/matches/${matchId}/call`, { method: "POST" }).then((res) => res.data);
}

/** Contesta o vuelve a entrar: solo entrega tu token, sin avisar a nadie. */
export function getCallToken(matchId: number) {
  return apiRequest<ApiResource<CallAccess>>(`/matches/${matchId}/call/token`, { method: "POST" }).then(
    (res) => res.data,
  );
}

/** Cuelga o rechaza: cierra la sala para los dos y le avisa a la otra persona. */
export function endCall(matchId: number) {
  return apiRequest<null>(`/matches/${matchId}/call`, { method: "DELETE" });
}
