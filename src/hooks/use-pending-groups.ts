/**
 * Cuántos grupos esperan revisión (T-42): el contador de "Grupos" en la barra lateral del panel.
 * Sale del `meta.total` de la cola, así no hace falta un endpoint aparte.
 */

import { useSyncExternalStore } from "react";

import { getAdminGroups } from "@/services/admin";

let count = 0;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setCount(value: number) {
  count = value;
  listeners.forEach((listener) => listener());
}

/** Vuelve a pedir el total; si falla, se queda el último valor. */
export async function refreshPendingGroups() {
  try {
    const res = await getAdminGroups("pending", 1);
    setCount(res.meta.total);
  } catch {
    // Sin red o sin acceso: el contador no es crítico.
  }
}

/** Ajuste inmediato al aprobar o rechazar, antes de que llegue la respuesta del total. */
export function decrementPendingGroups() {
  setCount(Math.max(0, count - 1));
}

export function clearPendingGroups() {
  setCount(0);
}

export function usePendingGroupsCount() {
  return useSyncExternalStore(subscribe, () => count, () => count);
}
