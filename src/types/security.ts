/** Verificación en dos pasos de la cuenta (T-47 en el backend, T-50 en la app). */

/** `GET /two-factor`: si está activa y cuántos códigos de respaldo quedan. */
export type TwoFactorStatus = {
  enabled: boolean;
  /** Se empezó a activar pero nunca se confirmó con un código; hay que empezar de nuevo. */
  pending_confirmation: boolean;
  confirmed_at: string | null;
  recovery_codes_left: number;
};

/** `POST /two-factor`: el secreto nuevo, para el QR (`otpauth_url`) o para escribirlo a mano. */
export type TwoFactorSetup = {
  secret: string;
  otpauth_url: string;
};

/** Códigos de respaldo: la API los manda solo al confirmar o al regenerarlos. */
export type RecoveryCodes = {
  recovery_codes: string[];
};
