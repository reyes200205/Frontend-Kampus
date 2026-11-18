/**
 * API del panel de gestión (`/api/admin`, T-41 y T-42). El backend revisa el rol en cada ruta:
 * Staff es solo para administradores y la revisión de grupos para moderadores y administradores.
 */

import { apiRequest } from "@/services/api";
import type { ApiResource, Paginated } from "@/types/api";
import type {
  AdminGroup,
  GroupFilter,
  OfficialGroupCreate,
  StaffCreate,
  StaffMember,
} from "@/types/admin";

// Grupos: cola de revisión, historial y grupos oficiales (T-42, RF-23).

export function getAdminGroups(status: GroupFilter, page = 1) {
  return apiRequest<Paginated<AdminGroup>>(`/admin/groups?status=${status}&page=${page}`);
}

export function approveGroup(groupId: number) {
  return apiRequest<ApiResource<AdminGroup>>(`/admin/groups/${groupId}/approve`, {
    method: "POST",
  }).then((res) => res.data);
}

/** El motivo es obligatorio y lo ve quien creó el grupo. */
export function rejectGroup(groupId: number, reason: string) {
  return apiRequest<ApiResource<AdminGroup>>(`/admin/groups/${groupId}/reject`, {
    method: "POST",
    body: { reason },
  }).then((res) => res.data);
}

export function createOfficialGroup(body: OfficialGroupCreate) {
  return apiRequest<ApiResource<AdminGroup>>("/admin/groups", { method: "POST", body }).then(
    (res) => res.data,
  );
}

// Staff: alta, desactivación y reactivación (T-41, RF-22). Solo administradores.

export function getStaff(page = 1) {
  return apiRequest<Paginated<StaffMember>>(`/admin/staff?page=${page}`);
}

export function createStaff(body: StaffCreate) {
  return apiRequest<ApiResource<StaffMember>>("/admin/staff", { method: "POST", body }).then(
    (res) => res.data,
  );
}

/** `active: false` desactiva la cuenta (y cierra sus sesiones); `true` la reactiva. */
export function setStaffActive(staffId: number, active: boolean, reason: string) {
  return apiRequest<ApiResource<StaffMember>>(`/admin/staff/${staffId}`, {
    method: "PATCH",
    body: { active, reason },
  }).then((res) => res.data);
}
