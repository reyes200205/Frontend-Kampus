/**
 * Dominios de correo institucional aceptados en el registro.
 * TODO: confirmar los dominios exactos de cada institución.
 */
export const AllowedEmailDomains = [
  "utt.edu.mx",
  "uadec.edu.mx",
  "lalaguna.tecnm.mx",
];

export const MinPasswordLength = 8;

export function isInstitutionalEmail(email: string) {
  const domain = email.trim().toLowerCase().split("@")[1];
  return !!domain && AllowedEmailDomains.includes(domain);
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
