/** Mensajes del chat entre matches (T-14 en el backend, T-16 en el frontend, RF-08). */

/** `text` por ahora; las imágenes llegan con T-15. */
export type MessageType = "text" | "image";

/** Mensaje tal como lo manda la API (`MessageResource`) y el evento `message.sent` de Reverb. */
export type Message = {
  id: number;
  match_id: number;
  sender_id: number;
  type: MessageType;
  body: string | null;
  /** Cuándo lo leyó la otra persona; `null` si todavía no. */
  read_at: string | null;
  created_at: string | null;
};

/** Mensaje en pantalla: el que se está enviando lleva un id local negativo y su estado. */
export type ChatMessage = Message & {
  pending?: "sending" | "failed";
};

/** Respuesta de `PATCH /matches/{match}/messages/read`. */
export type MarkReadResult = { read_count: number };
