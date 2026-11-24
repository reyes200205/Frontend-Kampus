/**
 * API del panel de administración (`/api/admin`).
 * Las rutas y cuerpos corresponden a backend-kampus, rama develop.
 */

import { apiRequest } from "@/services/api";
import type { ApiResource, Paginated } from "@/types/api";
import type {
  AdminGroup,
  AdminReport,
  AdminReportQuery,
  AdminUser,
  AdminUserModerationBody,
  AdminUserQuery,
  GroupFilter,
  OfficialGroupCreate,
  ReviewReportBody,
  StaffCreate,
  StaffMember,
} from "@/types/admin";

function queryString(values: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

// Grupos
export function getAdminGroups(status: GroupFilter, page = 1) {
  return apiRequest<Paginated<AdminGroup>>(`/admin/groups?status=${status}&page=${page}`);
}
export function approveGroup(groupId: number) {
  return apiRequest<ApiResource<AdminGroup>>(`/admin/groups/${groupId}/approve`, { method: "POST" }).then((res) => res.data);
}
export function rejectGroup(groupId: number, reason: string) {
  return apiRequest<ApiResource<AdminGroup>>(`/admin/groups/${groupId}/reject`, { method: "POST", body: { reason } }).then((res) => res.data);
}
export function createOfficialGroup(body: OfficialGroupCreate) {
  return apiRequest<ApiResource<AdminGroup>>("/admin/groups", { method: "POST", body }).then((res) => res.data);
}

// Staff
export function getStaff(page = 1) {
  return apiRequest<Paginated<StaffMember>>(`/admin/staff?page=${page}`);
}
export function createStaff(body: StaffCreate) {
  return apiRequest<ApiResource<StaffMember>>("/admin/staff", { method: "POST", body }).then((res) => res.data);
}
export function setStaffActive(staffId: number, active: boolean, reason: string) {
  return apiRequest<ApiResource<StaffMember>>(`/admin/staff/${staffId}`, {
    method: "PATCH",
    body: { active, reason },
  }).then((res) => res.data);
}

// Usuarios (T-43 / RF-24)
export function getAdminUsers(query: AdminUserQuery = {}, page = 1) {
  return apiRequest<Paginated<AdminUser>>(
    `/admin/users${queryString({
      page,
      search: query.search?.trim() || undefined,
      status: query.status && query.status !== "all" ? query.status : "all",
      role: query.role && query.role !== "all" ? query.role : undefined,
      university_id: query.university_id && query.university_id !== "all" ? query.university_id : undefined,
      sort: query.sort,
    })}`,
  );
}
export function getAdminUser(userId: number) {
  return apiRequest<ApiResource<AdminUser>>(`/admin/users/${userId}`).then((res) => res.data);
}
export function suspendAdminUser(userId: number, body: AdminUserModerationBody) {
  return apiRequest<ApiResource<AdminUser>>(`/admin/users/${userId}/suspend`, {
    method: "POST",
    body,
  }).then((res) => res.data);
}
export function reactivateAdminUser(userId: number, reason: string) {
  return apiRequest<ApiResource<AdminUser>>(`/admin/users/${userId}/reactivate`, {
    method: "POST",
    body: { reason },
  }).then((res) => res.data);
}

// Reportes (T-37 / RF-15)
export function getAdminReports(query: AdminReportQuery = {}, page = 1) {
  return apiRequest<Paginated<AdminReport>>(
    `/admin/reports${queryString({
      page,
      status: query.status ?? "pending",
      user_id: query.user_id,
      reason: query.reason && query.reason !== "all" ? query.reason : undefined,
    })}`,
  );
}
export function getAdminReport(reportId: number) {
  return apiRequest<ApiResource<AdminReport>>(`/admin/reports/${reportId}`).then((res) => res.data);
}
export function reviewAdminReport(reportId: number, body: ReviewReportBody) {
  return apiRequest<ApiResource<AdminReport>>(`/admin/reports/${reportId}`, {
    method: "PATCH",
    body,
  }).then((res) => res.data);
}
