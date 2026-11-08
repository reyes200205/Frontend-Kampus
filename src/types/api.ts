/** Formas genéricas de las respuestas de la API de Laravel. */

/** Respuesta de un API Resource de Laravel: el recurso viene dentro de `data`. */
export type ApiResource<T> = { data: T };

/** Respuesta que solo trae un mensaje para mostrar (p. ej. al verificar el correo). */
export type MessageResponse = { message: string };

/** Respuesta paginada de Laravel (`->paginate()` con un API Resource). */
export type Paginated<T> = {
  data: T[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
};
