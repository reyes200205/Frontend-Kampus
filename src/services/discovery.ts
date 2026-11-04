/**
 * Descubrimiento, filtros y swipe (T-09 en backend-kampus, RF-05 y RF-06).
 */

import { apiRequest } from "@/services/api";

export type Interest = {
  id: number;
  name: string;
  category: string;
};

/** Tarjeta de un perfil por evaluar. No trae correo, fecha de nacimiento ni zona (RNF-03). */
export type DiscoveryCard = {
  id: number;
  name: string;
  university: { id: number; name: string; short_name: string } | null;
  career: string | null;
  semester: number | null;
  age: number | null;
  bio: string | null;
  /** Intereses en común con quien mira la tarjeta. */
  shared_interests: number;
  interests: Interest[];
  photos: { id: number; position: number; temporary_url: string }[];
};

/** Filtros guardados en el perfil. Una lista vacía o `career: null` significan "sin filtro". */
export type DiscoveryFilters = {
  universities: number[];
  career: string | null;
  interests: number[];
};

export const EmptyFilters: DiscoveryFilters = { universities: [], career: null, interests: [] };

/** Match que se crea cuando los dos dieron "Me interesa" (T-10, RF-07). */
export type Match = {
  id: number;
  matched_at: string | null;
  user: {
    id: number;
    name: string;
    university: { id: number; name: string; short_name: string } | null;
    photo_url: string | null;
  };
};

/**
 * Siguiente tanda de perfiles con los filtros guardados. Un perfil evaluado ya no vuelve a salir,
 * así que no hay paginación: se pide otra tanda cuando se acaba la anterior.
 */
export function getDiscovery(limit = 10) {
  return apiRequest<{ data: DiscoveryCard[]; filters: DiscoveryFilters }>(`/discover?limit=${limit}`);
}

export function getDiscoveryFilters() {
  return apiRequest<{ data: DiscoveryFilters }>("/discover/filters");
}

/** Reemplaza todos los filtros; se guardan en el perfil y persisten entre sesiones. */
export function saveDiscoveryFilters(filters: DiscoveryFilters) {
  return apiRequest<{ data: DiscoveryFilters }>("/discover/filters", {
    method: "PUT",
    body: filters,
  });
}

/** "Me interesa" (`liked: true`) o "Pasar" (`liked: false`). Responde 409 si ya se había evaluado. */
export function swipe(userId: number, liked: boolean) {
  return apiRequest<{ data: { user_id: number; liked: boolean; match: Match | null } }>("/swipes", {
    method: "POST",
    body: { user_id: userId, liked },
  });
}

export function getInterests() {
  return apiRequest<{ data: Interest[] }>("/interests");
}
