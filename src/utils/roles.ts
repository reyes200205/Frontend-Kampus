/**
 * Roles de la cuenta (T-40). Los estudiantes usan las funciones sociales; el staff (moderadores y
 * administradores) no tiene perfil y solo entra al panel de gestión en `/management` (T-44).
 */

import type { User, UserRole } from "@/types/auth";

export const RoleLabels: Record<UserRole, string> = {
  student: "Estudiante",
  moderator: "Moderador",
  admin: "Administrador",
};

/** Moderador o administrador. */
export function isStaff(user: Pick<User, "role"> | null | undefined): boolean {
  return user?.role === "moderator" || user?.role === "admin";
}

export function isAdmin(user: Pick<User, "role"> | null | undefined): boolean {
  return user?.role === "admin";
}
