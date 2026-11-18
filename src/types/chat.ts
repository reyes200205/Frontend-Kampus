/** Mensajes del chat entre matches (T-14 y T-15 en el backend, T-16 en el frontend, RF-08). */

/** `text` es solo texto; `image` es una foto con un texto opcional en `body` (T-15). */
export type MessageType = "text" | "image";

/** Mensaje tal como lo manda la API (`MessageResource`) y el evento `message.sent` de Reverb. */
export type Message = {
  id: number;
  match_id: number;
  sender_id: number;
  type: MessageType;
  body: string | null;
  /** Solo en los de tipo `image`: URL firmada que vence a los 15 minutos. */
  image_url?: string | null;
  /** Cuándo lo leyó la otra persona; `null` si todavía no. */
  read_at: string | null;
  created_at: string | null;
};

/**
 * Imagen elegida para enviar. En web es el `File` del navegador; en iOS y Android, el archivo local
 * que React Native manda en el FormData como `{ uri, name, type }`.
 */
export type ChatImageFile = File | { uri: string; name: string; type: string };

/** Imagen que se está enviando: el archivo para reintentar y lo necesario para dibujarla al instante. */
export type LocalChatImage = {
  file: ChatImageFile;
  uri: string;
  width: number;
  height: number;
};

/** Mensaje en pantalla: el que se está enviando lleva un id local negativo y su estado. */
export type ChatMessage = Message & {
  pending?: "sending" | "failed";
  /** Imagen propia recién enviada: se sigue dibujando desde el archivo local para que no parpadee. */
  local_image?: LocalChatImage;
};

/** Respuesta de `PATCH /matches/{match}/messages/read`. */
export type MarkReadResult = { read_count: number };
