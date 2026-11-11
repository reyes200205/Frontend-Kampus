/** Formato del token guardado (celular y web): el token y cuándo vence. */

type StoredToken = { token: string; expiresAt: string | null };

export function serializeToken(token: string, expiresAt: string | null) {
  return JSON.stringify({ token, expiresAt } satisfies StoredToken);
}

/** Lee lo guardado; devuelve `null` si no hay, si está dañado o si el token ya venció. */
export function parseStoredToken(raw: string | null): StoredToken | null {
  if (!raw) return null;
  try {
    const stored = JSON.parse(raw) as Partial<StoredToken>;
    if (typeof stored.token !== "string" || stored.token === "") return null;
    const expiresAt = typeof stored.expiresAt === "string" ? stored.expiresAt : null;
    if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) return null;
    return { token: stored.token, expiresAt };
  } catch {
    return null;
  }
}
