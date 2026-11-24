/**
 * Verificación en dos pasos con una app de autenticación (TOTP). La API es de T-47; las pantallas, de T-50.
 * Activar, desactivar y regenerar códigos piden la contraseña actual.
 */

import { apiRequest } from "@/services/api";
import type { ApiResource } from "@/types/api";
import type { RecoveryCodes, TwoFactorSetup, TwoFactorStatus } from "@/types/security";

export function getTwoFactorStatus() {
  return apiRequest<ApiResource<TwoFactorStatus>>("/two-factor").then((res) => res.data);
}

/** Empieza la activación: da el secreto nuevo. Si había una sin confirmar, la reemplaza. */
export function startTwoFactor(password: string) {
  return apiRequest<ApiResource<TwoFactorSetup>>("/two-factor", {
    method: "POST",
    body: { password },
  }).then((res) => res.data);
}

/** Confirma con el primer código de la app; desde aquí el login lo pide. Devuelve los códigos de respaldo. */
export function confirmTwoFactor(code: string) {
  return apiRequest<ApiResource<RecoveryCodes>>("/two-factor/confirm", {
    method: "POST",
    body: { code },
  }).then((res) => res.data.recovery_codes);
}

export function disableTwoFactor(password: string) {
  return apiRequest<null>("/two-factor", { method: "DELETE", body: { password } });
}

/** Códigos de respaldo nuevos; los anteriores dejan de servir. */
export function regenerateRecoveryCodes(password: string) {
  return apiRequest<ApiResource<RecoveryCodes>>("/two-factor/recovery-codes", {
    method: "POST",
    body: { password },
  }).then((res) => res.data.recovery_codes);
}
