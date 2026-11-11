/** Mensajes entre matches (T-14 en el backend, T-16 en el frontend, RF-08). Solo entre los dos del match. */

import { apiRequest } from "@/services/api";
import type { ApiResource, Paginated } from "@/types/api";
import type { MarkReadResult, Message } from "@/types/chat";

/** Historial del más reciente al más antiguo. La API acepta hasta 100 por página. */
export function getMessages(matchId: number, page = 1, perPage = 30) {
  return apiRequest<Paginated<Message>>(`/matches/${matchId}/messages?page=${page}&per_page=${perPage}`);
}

/** Envía un mensaje de texto (máximo 5000 caracteres). La API también lo publica por Reverb. */
export function sendMessage(matchId: number, body: string) {
  return apiRequest<ApiResource<Message>>(`/matches/${matchId}/messages`, {
    method: "POST",
    body: { body },
  }).then((res) => res.data);
}

/** Marca como leídos los mensajes que mandó la otra persona. */
export function markMessagesRead(matchId: number) {
  return apiRequest<ApiResource<MarkReadResult>>(`/matches/${matchId}/messages/read`, {
    method: "PATCH",
  }).then((res) => res.data);
}
