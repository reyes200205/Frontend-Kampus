/**
 * Zona declarada y "Cerca de ti" (T-28 en el backend, RF-18 y RNF-11).
 * La coordenada del celular nunca se manda: solo la celda (geohash de 6 caracteres).
 */

import { apiRequest } from "@/services/api";
import type { ApiResource } from "@/types/api";
import type { LocationState, Zone } from "@/types/location";

/** Catálogo completo: primero los campus y después las colonias, por nombre. */
export function getZones() {
  return apiRequest<ApiResource<Zone[]>>("/zones").then((res) => res.data);
}

export function getLocation() {
  return apiRequest<ApiResource<LocationState>>("/location").then((res) => res.data);
}

/** Declara la zona, o la quita con `null`. */
export function setZone(zoneId: number | null) {
  return apiRequest<ApiResource<LocationState>>("/location/zone", {
    method: "PUT",
    body: { zone_id: zoneId },
  }).then((res) => res.data);
}

/** Activa "Cerca de ti" o actualiza la celda. */
export function enableNearby(geohash: string) {
  return apiRequest<ApiResource<LocationState>>("/location/nearby", {
    method: "PUT",
    body: { geohash },
  }).then((res) => res.data);
}

/** Apaga "Cerca de ti" y el backend borra la celda. */
export function disableNearby() {
  return apiRequest<ApiResource<LocationState>>("/location/nearby", { method: "DELETE" }).then(
    (res) => res.data,
  );
}
