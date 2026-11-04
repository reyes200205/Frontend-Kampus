/**
 * Cliente mínimo de la API de Laravel (backend-kampus).
 * La URL base sale de `EXPO_PUBLIC_API_URL` (ver `.env.example`).
 */

import { getToken } from "@/hooks/use-session";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000/api";

/** Error de la API con el mensaje y, en un 422, los errores por campo que manda Laravel. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fieldErrors: Record<string, string[]> = {},
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
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError("No se pudo conectar con el servidor. Revisa tu conexión.", 0);
  }

  const data = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      data?.message ?? "Ocurrió un error inesperado. Intenta de nuevo.",
      response.status,
      data?.errors ?? {},
    );
  }

  return data as T;
}

export type User = {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  role: "student" | "moderator" | "admin";
  university_id: number | null;
};

export function register(body: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}) {
  return apiRequest<{ message: string; user: User }>("/register", { method: "POST", body });
}

export function login(body: { email: string; password: string; device_name?: string }) {
  return apiRequest<{ token: string; token_type: string; expires_at: string; user: User }>(
    "/login",
    { method: "POST", body },
  );
}

export function logout() {
  return apiRequest<null>("/logout", { method: "POST" });
}
