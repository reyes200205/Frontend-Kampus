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
