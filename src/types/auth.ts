/** Usuario, registro, inicio de sesión y verificación de correo (T-06, RF-01 y RF-02). */

export type UserRole = "student" | "moderator" | "admin";

/** Usuario que devuelven `POST /register`, `POST /login` y `GET /user`. */
export type User = {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  role: UserRole;
  university_id: number | null;
  /** `false` mientras el estudiante no termina su perfil por pasos (T-49). El staff siempre trae `true`. */
  profile_completed: boolean;
};

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
};

export type RegisterResponse = { message: string; user: User };

export type LoginRequest = { email: string; password: string; device_name?: string };

/** Sesión emitida: la da `POST /login` sin verificación en dos pasos, o `POST /login/two-factor`. */
export type AuthTokenResponse = {
  token: string;
  token_type: string;
  expires_at: string;
  user: User;
};

/**
 * Con la verificación en dos pasos activa (T-47), `POST /login` no da el token: da un reto que se
 * completa con el código de la app en `POST /login/two-factor`. El reto vence en `expires_in` segundos.
 */
export type TwoFactorChallengeResponse = {
  message: string;
  two_factor_required: true;
  challenge_token: string;
  expires_in: number;
};

export type LoginResponse = AuthTokenResponse | TwoFactorChallengeResponse;

/** Cuerpo de `POST /login/two-factor`: el código de la app o, si no se tiene a la mano, uno de respaldo. */
export type TwoFactorLoginRequest =
  | { challenge_token: string; code: string }
  | { challenge_token: string; recovery_code: string };

/** Parámetros del enlace del correo de verificación. */
export type VerifyEmailParams = {
  id: string;
  hash: string;
  expires: string;
  signature: string;
};

/** Cuerpo de `POST /reset-password`: `token` y `email` vienen en el enlace del correo. */
export type ResetPasswordRequest = {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
};
