/** Zonas y ubicación aproximada (T-28 en el backend, T-36 en el frontend, RF-18 y RNF-11). */

export type ZoneType = "campus" | "colonia";

/** Campus o colonia del catálogo. `center` es un punto público de la zona, nunca de una persona. */
export type Zone = {
  id: number;
  name: string;
  type: ZoneType;
  university_id: number | null;
  city: string;
  center: { lat: number; lng: number };
};

/** Respuesta de `GET /location` y de las rutas que la cambian. */
export type LocationState = {
  zone: Zone | null;
  nearby_enabled: boolean;
  /** Celda de unos 1.2 × 0.6 km (geohash de 6 caracteres), o `null` si Cerca de ti está apagado. */
  geohash: string | null;
};
