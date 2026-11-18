/** Descubrimiento, filtros, swipe y match (T-09 y T-10 en el backend, T-11 en el frontend, RF-05 a RF-07). */

import type { Interest, ProfilePhoto } from "@/types/profile";

/** Universidad tal como la manda la API dentro de una tarjeta o un match. */
export type UniversitySummary = { id: number; name: string; short_name: string };

/** Tarjeta de un perfil por evaluar. No trae correo, fecha de nacimiento ni zona (RNF-03). */
export type DiscoveryCard = {
  id: number;
  name: string;
  university: UniversitySummary | null;
  career: string | null;
  semester: number | null;
  age: number | null;
  bio: string | null;
  /** Intereses en común con quien mira la tarjeta. */
  shared_interests: number;
  interests: Interest[];
  photos: ProfilePhoto[];
};

/**
 * Estudiante en la vista "Cerca" (T-35 en el backend, T-30 en el frontend, RF-19): la misma tarjeta de
 * Descubrir más su punto en el mapa y la distancia aproximada. El punto ya viene desplazado de 150 a
 * 500 m desde su celda: nunca es su ubicación real (RNF-11).
 */
export type NearbyUser = DiscoveryCard & {
  nearby: {
    position: { lat: number; lng: number };
    /** Kilómetros enteros; 0 significa "menos de 1 km". */
    distance_km: number;
    /** Texto listo para mostrar: "Menos de 1 km" o "≈ 3 km". */
    distance_label: string;
  };
};

/** Respuesta de `GET /discover/nearby`. `meta.center` es el punto (desplazado) de quien consulta. */
export type NearbyResponse = {
  data: NearbyUser[];
  meta: { radius_km: number; center: { lat: number; lng: number } };
};

/** Filtros guardados en el perfil. Una lista vacía o `career: null` significan "sin filtro". */
export type DiscoveryFilters = {
  universities: number[];
  career: string | null;
  interests: number[];
};

/** Match que se crea cuando los dos dieron "Me interesa" (T-10, RF-07). `user` es la otra persona. */
export type Match = {
  id: number;
  matched_at: string | null;
  user: {
    id: number;
    name: string;
    university: UniversitySummary | null;
    photo_url: string | null;
  };
};

/** Respuesta de `POST /swipes`. */
export type SwipeResult = {
  user_id: number;
  liked: boolean;
  /** El match, o `null` si todavía no hay "Me interesa" de los dos lados. */
  match: Match | null;
};
