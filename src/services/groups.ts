/**
 * Grupos y clubes (API de T-17 y T-42; pantallas de T-18, RF-11 y RF-12). Un grupo que el estudiante no
 * puede ver responde `404`; editarlo, cambiar su imagen, borrarlo y publicar actividades es de sus
 * administradores.
 */

import { apiRequest } from "@/services/api";
import type { ApiResource, Paginated } from "@/types/api";
import type {
  Group,
  GroupActivity,
  GroupActivityInput,
  GroupFilters,
  GroupImageFile,
  GroupInput,
  GroupMember,
} from "@/types/groups";

/** Grupos aprobados, primero los oficiales y luego por nombre. */
export function listGroups(page: number, filters: GroupFilters = {}) {
  const query = new URLSearchParams({ page: String(page) });
  if (filters.category) query.set("category", filters.category);
  if (filters.university_id) query.set("university_id", String(filters.university_id));
  return apiRequest<Paginated<Group>>(`/groups?${query}`);
}

/** Los grupos del estudiante en cualquier estado: así ve los suyos en revisión o rechazados. */
export function listMyGroups(page: number) {
  return apiRequest<Paginated<Group>>(`/groups/mine?page=${page}`);
}

export function getGroup(groupId: number) {
  return apiRequest<ApiResource<Group>>(`/groups/${groupId}`).then((res) => res.data);
}

/** Queda en revisión hasta que lo aprueba un moderador de su universidad; quien lo crea es administrador. */
export function createGroup(body: GroupInput) {
  return apiRequest<ApiResource<Group>>("/groups", { method: "POST", body }).then((res) => res.data);
}

export function updateGroup(groupId: number, body: GroupInput) {
  return apiRequest<ApiResource<Group>>(`/groups/${groupId}`, { method: "PATCH", body }).then(
    (res) => res.data,
  );
}

/** Borra el grupo con sus integrantes, actividades e imagen. */
export function deleteGroup(groupId: number) {
  return apiRequest<null>(`/groups/${groupId}`, { method: "DELETE" });
}

/** JPG, PNG o WebP de hasta 5 MB; el backend le quita el EXIF antes de guardarla. */
export function uploadGroupImage(groupId: number, image: GroupImageFile) {
  const form = new FormData();
  // En React Native, FormData acepta `{ uri, name, type }` para mandar un archivo local.
  form.append("image", image as unknown as Blob);
  return apiRequest<ApiResource<Group>>(`/groups/${groupId}/image`, { method: "POST", body: form }).then(
    (res) => res.data,
  );
}

export function joinGroup(groupId: number) {
  return apiRequest<ApiResource<Group>>(`/groups/${groupId}/members`, { method: "POST" }).then(
    (res) => res.data,
  );
}

/** Si sale el último administrador, otro integrante toma su lugar; el único integrante no puede salir. */
export function leaveGroup(groupId: number) {
  return apiRequest<null>(`/groups/${groupId}/members/me`, { method: "DELETE" });
}

/** Solo los integrantes ven la lista; primero los administradores. */
export function listGroupMembers(groupId: number, page = 1) {
  return apiRequest<Paginated<GroupMember>>(`/groups/${groupId}/members?page=${page}`);
}

/** Próximas actividades (de la más cercana a la más lejana) o, con `past`, las pasadas. */
export function listGroupActivities(groupId: number, { past = false, page = 1 } = {}) {
  return apiRequest<Paginated<GroupActivity>>(
    `/groups/${groupId}/activities?page=${page}${past ? "&past=1" : ""}`,
  );
}

export function createGroupActivity(groupId: number, body: GroupActivityInput) {
  return apiRequest<ApiResource<GroupActivity>>(`/groups/${groupId}/activities`, {
    method: "POST",
    body,
  }).then((res) => res.data);
}

export function updateGroupActivity(groupId: number, activityId: number, body: GroupActivityInput) {
  return apiRequest<ApiResource<GroupActivity>>(`/groups/${groupId}/activities/${activityId}`, {
    method: "PATCH",
    body,
  }).then((res) => res.data);
}

export function deleteGroupActivity(groupId: number, activityId: number) {
  return apiRequest<null>(`/groups/${groupId}/activities/${activityId}`, { method: "DELETE" });
}
