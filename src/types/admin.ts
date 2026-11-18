/** Panel de gestión del staff (T-44): grupos en revisión (T-42) y cuentas de staff (T-41). */

import type { UserRole } from "@/types/auth";

export type UniversitySummary = { id: number; name: string; short_name: string };

export type StaffRole = Exclude<UserRole, "student">;

/** Cuenta de `GET /admin/staff`. */
export type StaffMember = {
  id: number;
  name: string;
  email: string;
  role: StaffRole;
  /** Universidad del moderador; `null` en un administrador. */
  university: UniversitySummary | null;
  active: boolean;
  deactivated_at: string | null;
  created_at: string;
};

/** Cuerpo de `POST /admin/staff`. `university_id` solo va en un moderador. */
export type StaffCreate = {
  name: string;
  email: string;
  role: StaffRole;
  university_id?: number;
  password: string;
  password_confirmation: string;
  reason: string;
};

export type GroupStatus = "pending" | "approved" | "rejected";

/** Filtro de `GET /admin/groups`: un estado o `all` (todos, del más nuevo al más antiguo). */
export type GroupFilter = GroupStatus | "all";

export type GroupCategory = "deportivo" | "cultural" | "academico" | "social";

/** Grupo de `GET /admin/groups`: lo que ve el estudiante más quién lo creó y quién lo revisó. */
export type AdminGroup = {
  id: number;
  name: string;
  description: string | null;
  category: GroupCategory;
  university: UniversitySummary | null;
  status: GroupStatus;
  is_official: boolean;
  rejection_reason: string | null;
  image_url: string | null;
  members_count: number;
  creator: { id: number; name: string } | null;
  reviewed_by: { id: number; name: string } | null;
  reviewed_at: string | null;
  created_at: string;
};

/** Cuerpo de `POST /admin/groups` (grupo oficial). `university_id` solo lo manda un administrador. */
export type OfficialGroupCreate = {
  name: string;
  description?: string;
  category: GroupCategory;
  university_id?: number | null;
};
