/**
 * Universidades participantes, para el filtro de Descubrir.
 * Los ids siguen el orden de `CatalogSeeder` en backend-kampus.
 * TODO: pedirlas a la API cuando exista un `GET /universities`; hoy el backend no lo expone.
 */
export const Universities = [
  { id: 1, shortName: "UTT", name: "Universidad Tecnológica de Torreón" },
  { id: 2, shortName: "UAdeC", name: "Universidad Autónoma de Coahuila" },
  { id: 3, shortName: "Tec Laguna", name: "Instituto Tecnológico de La Laguna" },
] as const;
