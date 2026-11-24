/**
 * Carreras de cada universidad para elegir en el perfil, en lugar de escribirlas a mano. Así el filtro de
 * carrera de Descubrir (que compara el texto) junta a quienes estudian lo mismo.
 *
 * Las llaves son el `university_id` (mismo orden que `CatalogSeeder` y `Universities` en `management.ts`).
 * TODO: completar con la oferta real de cada universidad; por ahora son las de `DemoSeeder`. Cuando el backend
 * tenga un catálogo de carreras, cambiar esto por su endpoint. Quien no encuentre la suya elige "Otra carrera".
 */
export const CareersByUniversity: Record<number, string[]> = {
  // UTT
  1: [
    "Ingeniería en Desarrollo y Gestión de Software",
    "Ingeniería en Tecnologías de la Información",
    "Ingeniería en Mecatrónica",
    "Ingeniería en Mantenimiento Industrial",
    "Licenciatura en Gestión de Negocios",
  ],
  // UAdeC
  2: ["Medicina", "Derecho", "Arquitectura", "Psicología", "Contaduría Pública", "Ingeniería Civil"],
  // ITL
  3: [
    "Ingeniería en Sistemas Computacionales",
    "Ingeniería Industrial",
    "Ingeniería Electrónica",
    "Ingeniería Mecánica",
    "Ingeniería en Gestión Empresarial",
  ],
};

/** Carreras de la universidad del estudiante; sin universidad, todas sin repetir. */
export function careersFor(universityId: number | null | undefined): string[] {
  if (universityId && CareersByUniversity[universityId]) return CareersByUniversity[universityId];
  return [...new Set(Object.values(CareersByUniversity).flat())].sort((a, b) => a.localeCompare(b, "es"));
}
