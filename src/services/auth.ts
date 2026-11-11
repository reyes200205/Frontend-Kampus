/** Registro, sesión, verificación de correo y recuperación de contraseña (T-06 y T-45, RF-01 y RF-02). */

import { apiRequest } from "@/services/api";
import type { ApiResource, MessageResponse } from "@/types/api";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
  User,
  VerifyEmailParams,
} from "@/types/auth";

export function register(body: RegisterRequest) {
  return apiRequest<RegisterResponse>("/register", { method: "POST", body });
}

export function login(body: LoginRequest) {
  return apiRequest<LoginResponse>("/login", { method: "POST", body });
}

export function logout() {
  return apiRequest<null>("/logout", { method: "POST" });
}

/** Usuario dueño del token; sirve para validar una sesión guardada al abrir la app. */
export function getCurrentUser() {
  return apiRequest<ApiResource<User>>("/user").then((res) => res.data);
}

/** Confirma el correo con los parámetros del enlace que manda el backend (RF-01). */
export function verifyEmail(params: VerifyEmailParams) {
  const query = new URLSearchParams({ expires: params.expires, signature: params.signature });
  return apiRequest<MessageResponse>(
    `/email/verify/${encodeURIComponent(params.id)}/${encodeURIComponent(params.hash)}?${query}`,
  );
}

/**
 * Pide el enlace para restablecer la contraseña. La API responde lo mismo exista o no el correo,
 * para no revelar qué cuentas están registradas (T-45).
 */
export function forgotPassword(email: string) {
  return apiRequest<MessageResponse>("/forgot-password", { method: "POST", body: { email } });
}

/** Cambia la contraseña con el `token` y el `email` del enlace. Cierra la sesión en todos los dispositivos. */
export function resetPassword(body: ResetPasswordRequest) {
  return apiRequest<MessageResponse>("/reset-password", { method: "POST", body });
}
