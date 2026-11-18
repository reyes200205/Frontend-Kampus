export const MinPasswordLength = 8;

/**
 * Solo revisa que el texto tenga forma de correo. Si el dominio es institucional lo decide el
 * backend (tabla `universities`), que responde 422 con el mensaje para el campo `email`.
 */
export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Pone en mayúscula la primera letra de cada palabra mientras se escribe ("diego leonel" →
 * "Diego Leonel"), también después de un guion ("Ana-Luisa"). Las demás letras se dejan como se
 * escribieron, así "McDonald" se conserva. En web `autoCapitalize` no cambia el texto, por eso se hace aquí.
 */
export function capitalizeWords(value: string) {
  return value.replace(/(^|[\s-])(\p{L})/gu, (_, separator: string, letter: string) =>
    separator + letter.toLocaleUpperCase("es-MX"),
  );
}
