/**
 * Cliente HTTP de la API de Laravel (backend-kampus): token, JSON o FormData y errores.
 * Las llamadas de cada funcionalidad viven en su propio servicio (`auth.ts`, `profile.ts`, …).
 * La URL base sale de `EXPO_PUBLIC_API_URL` (ver `.env.example`).
 */

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000/api";

/**
 * De dónde sale el token y qué hacer si la API lo rechaza (401). Los registra la sesión
 * (`hooks/use-session` y `hooks/end-session`) para que este cliente no dependa de ella.
 */
let getToken: () => string | null = () => null;
let onUnauthorized: (() => void) | null = null;

export function setTokenProvider(provider: () => string | null) {
  getToken = provider;
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

/** Error de la API con el mensaje y, en un 422, los errores por campo que manda Laravel. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fieldErrors: Record<string, string[]> = {},
    /** Código propio de la API para casos que la app trata aparte (p. ej. `profile_incomplete`). */
    readonly code?: string,
  ) {
    super(message);
  }

  /** Primer error del campo, para mostrarlo debajo del input. */
  field(name: string): string | undefined {
    return this.fieldErrors[name]?.[0];
  }
}

export async function apiRequest<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const token = getToken();
  // Con FormData (subir fotos) el navegador o React Native ponen el Content-Type con su boundary.
  const isForm = options.body instanceof FormData;
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      headers: {
        Accept: "application/json",
        ...(isForm ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body:
        options.body === undefined
          ? undefined
          : isForm
            ? (options.body as FormData)
            : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError("No se pudo conectar con el servidor. Revisa tu conexión.", 0);
  }

  const data = response.status === 204 ? null : await response.json().catch(() => null);

  // El token venció o se revocó (p. ej. se cerró esa sesión desde otro dispositivo): fin de la sesión.
  if (response.status === 401 && token) onUnauthorized?.();

  if (!response.ok) {
    throw new ApiError(
      data?.message ?? "Ocurrió un error inesperado. Intenta de nuevo.",
      response.status,
      data?.errors ?? {},
      data?.code,
    );
  }

  return data as T;
}
