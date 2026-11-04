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
};

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
};

export type RegisterResponse = { message: string; user: User };

export type LoginRequest = { email: string; password: string; device_name?: string };

export type LoginResponse = {
  token: string;
  token_type: string;
  expires_at: string;
  user: User;
};

/** Parámetros del enlace del correo de verificación. */
export type VerifyEmailParams = {
  id: string;
  hash: string;
  expires: string;
  signature: string;
};
