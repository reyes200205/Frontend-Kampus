/** Textos y catálogos del panel de gestión (T-44). Los valores coinciden con los enums del backend. */

import type { GroupCategory, GroupFilter, StaffRole, UniversitySummary } from "@/types/admin";

export const GroupCategoryOptions: { value: GroupCategory; label: string }[] = [
  { value: "deportivo", label: "Deportivo" },
  { value: "cultural", label: "Cultural" },
  { value: "academico", label: "Académico" },
  { value: "social", label: "Social" },
];

export const GroupCategoryLabels = Object.fromEntries(
  GroupCategoryOptions.map((option) => [option.value, option.label]),
) as Record<GroupCategory, string>;

/** Filtros de la tabla de grupos; "Todos" es el de por defecto. */
export const GroupFilterOptions: { value: GroupFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "En revisión" },
  { value: "approved", label: "Aprobados" },
  { value: "rejected", label: "Rechazados" },
];

export const StaffRoleOptions: { value: StaffRole; label: string }[] = [
  { value: "moderator", label: "Moderador" },
  { value: "admin", label: "Administrador" },
];

/**
 * Instituciones participantes, en el orden de `CatalogSeeder` del backend.
 * TODO: cambiar por un endpoint de universidades cuando exista; hoy la API no tiene uno y el alta de
 * un moderador necesita `university_id`.
 */
export const Universities: UniversitySummary[] = [
  { id: 1, name: "Universidad Tecnológica de Torreón", short_name: "UTT" },
  { id: 2, name: "Universidad Autónoma de Coahuila", short_name: "UAdeC" },
  { id: 3, name: "Instituto Tecnológico de La Laguna", short_name: "ITL" },
];

/** Límites de los motivos, iguales a las reglas del backend. */
export const MaxRejectReasonLength = 300;
export const MaxReasonLength = 1000;

export function formatShortDate(value: string | null): string {
  if (!value) return "";
  return new Date(value).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}
