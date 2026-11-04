/** Registro, sesión y verificación de correo (T-06, RF-01 y RF-02). */

import { apiRequest } from "@/services/api";
import type { MessageResponse } from "@/types/api";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
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

/** Confirma el correo con los parámetros del enlace que manda el backend (RF-01). */
export function verifyEmail(params: VerifyEmailParams) {
  const query = new URLSearchParams({ expires: params.expires, signature: params.signature });
  return apiRequest<MessageResponse>(
    `/email/verify/${encodeURIComponent(params.id)}/${encodeURIComponent(params.hash)}?${query}`,
  );
}
