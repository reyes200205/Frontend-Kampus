/** Grupos y clubes vistos por el estudiante (API de T-17 y T-42; pantallas de T-18, RF-11 y RF-12). */

import type { GroupCategory, GroupStatus, UniversitySummary } from "@/types/admin";

export type { GroupCategory, GroupStatus };

export type GroupRole = "admin" | "member";

/** `GroupResource`: el grupo visto por quien hace la petición. */
export type Group = {
  id: number;
  name: string;
  description: string | null;
  category: GroupCategory;
  /** `null` en un grupo oficial interinstitucional. */
  university: UniversitySummary | null;
  /** Los de alumnos empiezan en `pending` hasta que los aprueba un moderador (RF-23). */
  status: GroupStatus;
  is_official: boolean;
  /** Solo llega a los administradores del grupo. */
  rejection_reason: string | null;
  /** URL firmada de la imagen (bucket privado); vence, así que no se guarda. */
  image_url: string | null;
  members_count: number;
  /** `null` si quien pregunta no es integrante. */
  my_role: GroupRole | null;
  created_at: string;
};

export type GroupMember = {
  id: number;
  name: string;
  role: GroupRole;
  joined_at: string | null;
};

export type GroupActivity = {
  id: number;
  group_id: number;
  title: string;
  description: string | null;
  location: string | null;
  /** ISO 8601. Al crearla tiene que ser en el futuro. */
  starts_at: string;
  created_by: { id: number; name: string } | null;
};

/** Cuerpo de `POST /groups` y `PATCH /groups/{id}`. */
export type GroupInput = {
  name: string;
  description: string | null;
  category: GroupCategory;
};

/** Cuerpo de `POST` y `PATCH /groups/{id}/activities`. */
export type GroupActivityInput = {
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
};

/** Filtros de `GET /groups`: sin ellos, todos los grupos aprobados. */
export type GroupFilters = {
  category?: GroupCategory;
  university_id?: number;
};

/** Imagen elegida en el dispositivo: `File` en web, `{ uri, name, type }` en el celular. */
export type GroupImageFile = File | { uri: string; name: string; type: string };
