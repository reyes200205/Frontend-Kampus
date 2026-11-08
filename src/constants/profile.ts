/** Reglas y formato de los datos del perfil (T-08, RF-03). Los límites coinciden con el backend. */

import type { Gender } from "@/types/profile";

export const MaxSemester = 12;
export const MaxCareerLength = 120;
export const MaxBioLength = 300;
export const MaxProfilePhotos = 5;
export const MinInterests = 3;
export const MaxInterests = 20;
/** Edad mínima para usar Kampus (T-49); el backend aplica la misma regla. */
export const MinAge = 17;

/** Opciones de género con el texto que ve el estudiante (T-49). */
export const GenderOptions: { value: Gender; label: string }[] = [
  { value: "mujer", label: "Mujer" },
  { value: "hombre", label: "Hombre" },
  { value: "no_binario", label: "No binario" },
  { value: "prefiero_no_decir", label: "Prefiero no decir" },
];

/** Fecha de nacimiento más reciente que se acepta: hoy hace 17 años. */
export function latestBirthdate(): Date {
  const today = new Date();
  return new Date(today.getFullYear() - MinAge, today.getMonth(), today.getDate());
}

/** Nombre visible de las categorías del catálogo de intereses (el backend manda la clave). */
const InterestCategoryLabels: Record<string, string> = {
  academico: "Académico",
  cultura: "Cultura",
  deportes: "Deportes",
  entretenimiento: "Entretenimiento",
  social: "Social",
};

export function interestCategoryLabel(category: string): string {
  return InterestCategoryLabels[category] ?? category.charAt(0).toUpperCase() + category.slice(1);
}

const DatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Convierte `AAAA-MM-DD` en fecha local; `null` si el texto no es una fecha real (p. ej. 2004-02-31). */
export function parseBirthdate(value: string): Date | null {
  const match = DatePattern.exec(value.trim());
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(year, month - 1, day);
  const isSameDay =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return isSameDay ? date : null;
}

/** Valida la fecha de nacimiento; devuelve el mensaje de error o `undefined` si es válida. */
export function validateBirthdate(value: string): string | undefined {
  if (!value.trim()) return undefined;
  if (!DatePattern.test(value.trim())) return "Usa el formato AAAA-MM-DD, por ejemplo 2004-08-15.";
  const date = parseBirthdate(value);
  if (!date) return "Esa fecha no existe. Revisa el día y el mes.";
  if (date >= new Date()) return "La fecha debe ser anterior a hoy.";
  if (date > latestBirthdate()) return `Debes tener al menos ${MinAge} años para usar Kampus.`;
  return undefined;
}

/** Edad cumplida a partir de `AAAA-MM-DD`. */
export function ageFromBirthdate(value: string | null): number | null {
  const date = value ? parseBirthdate(value) : null;
  if (!date) return null;
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const beforeBirthday =
    today.getMonth() < date.getMonth() ||
    (today.getMonth() === date.getMonth() && today.getDate() < date.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}
