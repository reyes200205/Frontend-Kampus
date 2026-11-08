/** Lista de matches (T-10 en el backend, T-12 en el frontend, RF-07). */

import { apiRequest } from "@/services/api";
import type { Paginated } from "@/types/api";
import type { Match } from "@/types/discovery";

/** Matches del alumno, del más reciente al más antiguo, de 20 en 20. `user` es la otra persona. */
export function getMatches(page = 1) {
  return apiRequest<Paginated<Match>>(`/matches?page=${page}`);
}
