/**
 * Dominios de correo institucional aceptados en el registro.
 * TODO: confirmar los dominios exactos de cada institución.
 */
export const AllowedEmailDomains = ["utt.edu.mx", "uadec.edu.mx", "lalaguna.tecnm.mx"];

export const MinPasswordLength = 8;

export function isInstitutionalEmail(email: string) {
  const domain = email.trim().toLowerCase().split("@")[1];
  return !!domain && AllowedEmailDomains.includes(domain);
}
