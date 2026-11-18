/** Mensajes entre matches (T-14 en el backend, T-16 en el frontend, RF-08). Solo entre los dos del match. */

import { apiRequest } from "@/services/api";
import type { ApiResource, Paginated } from "@/types/api";
import type { ChatImageFile, MarkReadResult, Message } from "@/types/chat";

/** Historial del más reciente al más antiguo. La API acepta hasta 100 por página. */
export function getMessages(matchId: number, page = 1, perPage = 30) {
  return apiRequest<Paginated<Message>>(`/matches/${matchId}/messages?page=${page}&per_page=${perPage}`);
}

/**
 * Envía un mensaje (máximo 5000 caracteres). La API también lo publica por Reverb.
 * Con imagen (T-15) va como multipart: `image` (JPG o PNG de hasta 5 MB) y `body` como texto opcional.
 * El backend le quita la ubicación y los metadatos a la foto antes de guardarla.
 */
export function sendMessage(matchId: number, body: string, image?: ChatImageFile) {
  let payload: unknown = { body };
  if (image) {
    const form = new FormData();
    // En React Native, FormData acepta `{ uri, name, type }` para mandar un archivo local.
    form.append("image", image as unknown as Blob);
    if (body !== "") form.append("body", body);
    payload = form;
  }
  return apiRequest<ApiResource<Message>>(`/matches/${matchId}/messages`, {
    method: "POST",
    body: payload,
  }).then((res) => res.data);
}

/** Marca como leídos los mensajes que mandó la otra persona. */
export function markMessagesRead(matchId: number) {
  return apiRequest<ApiResource<MarkReadResult>>(`/matches/${matchId}/messages/read`, {
    method: "PATCH",
  }).then((res) => res.data);
}
