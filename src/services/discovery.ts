/** Descubrimiento, filtros y swipe (T-09 en el backend, RF-05 y RF-06). */

import { apiRequest } from "@/services/api";
import type { ApiResource } from "@/types/api";
import type { DiscoveryCard, DiscoveryFilters, NearbyResponse, SwipeResult } from "@/types/discovery";

export const EmptyFilters: DiscoveryFilters = { universities: [], career: null, interests: [] };

/**
 * Siguiente tanda de perfiles con los filtros guardados. Un perfil evaluado ya no vuelve a salir,
 * así que no hay paginación: se pide otra tanda cuando se acaba la anterior.
 */
export function getDiscovery(limit = 10) {
  return apiRequest<ApiResource<DiscoveryCard[]>>(`/discover?limit=${limit}`).then((res) => res.data);
}

/**
 * Quién está cerca (T-35, RF-19): estudiantes con "Cerca de ti" activo a menos de `meta.radius_km`,
 * del más cercano al más lejano, con los mismos filtros y reglas que Descubrir. Responde 403
 * (`nearby_disabled`) si quien consulta no comparte su celda.
 */
export function getNearby(limit = 30) {
  return apiRequest<NearbyResponse>(`/discover/nearby?limit=${limit}`);
}

export function getDiscoveryFilters() {
  return apiRequest<ApiResource<DiscoveryFilters>>("/discover/filters").then((res) => res.data);
}

/** Reemplaza todos los filtros; se guardan en el perfil y persisten entre sesiones. */
export function saveDiscoveryFilters(filters: DiscoveryFilters) {
  return apiRequest<ApiResource<DiscoveryFilters>>("/discover/filters", {
    method: "PUT",
    body: filters,
  }).then((res) => res.data);
}

/** "Me interesa" (`liked: true`) o "Pasar" (`liked: false`). Responde 409 si ya se había evaluado. */
export function swipe(userId: number, liked: boolean) {
  return apiRequest<ApiResource<SwipeResult>>("/swipes", {
    method: "POST",
    body: { user_id: userId, liked },
  }).then((res) => res.data);
}
