/** Props y utilidades compartidas por `date-field.tsx` (iOS y Android) y `date-field.web.tsx`. */

export type DateFieldProps = {
  label: string;
  /** Fecha `AAAA-MM-DD`, o cadena vacía si no hay. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  /** Mensaje de error; reemplaza al hint y pinta el borde de rojo. */
  error?: string;
  minimumDate?: Date;
  maximumDate?: Date;
};

const pad = (n: number) => String(n).padStart(2, "0");

/** Fecha local → `AAAA-MM-DD` (sin pasar por UTC, que puede cambiar el día). */
export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** `AAAA-MM-DD` → fecha local, o `null` si está vacía o no es válida. */
export function fromIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "15 de agosto de 2004". */
export function formatLongDate(value: string): string | null {
  const date = fromIsoDate(value);
  return date
    ? date.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })
    : null;
}
