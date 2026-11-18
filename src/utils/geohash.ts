/**
 * Geohash: convierte una coordenada en una celda con nombre. Con 6 caracteres la celda mide unos
 * 1.2 × 0.6 km, la precisión que acepta el backend para "Cerca de ti" (RNF-11). La coordenada se
 * convierte en el celular y nunca sale de él.
 */

const Base32 = "0123456789bcdefghjkmnpqrstuvwxyz";

export const NearbyPrecision = 6;

export function encodeGeohash(latitude: number, longitude: number, precision = NearbyPrecision) {
  let latRange = [-90, 90];
  let lngRange = [-180, 180];
  let hash = "";
  let bits = 0;
  let value = 0;
  let evenBit = true;

  while (hash.length < precision) {
    const range = evenBit ? lngRange : latRange;
    const coordinate = evenBit ? longitude : latitude;
    const middle = (range[0] + range[1]) / 2;

    value <<= 1;
    if (coordinate >= middle) {
      value |= 1;
      range[0] = middle;
    } else {
      range[1] = middle;
    }
    if (evenBit) lngRange = range;
    else latRange = range;

    evenBit = !evenBit;
    bits += 1;
    if (bits === 5) {
      hash += Base32[value];
      bits = 0;
      value = 0;
    }
  }

  return hash;
}

/**
 * Centro de una celda. Sirve para centrar el mapa de Cerca en la celda propia; nunca se usa con la celda
 * de otra persona (la API no la manda).
 */
export function geohashCenter(hash: string): { lat: number; lng: number } {
  const latRange = [-90, 90];
  const lngRange = [-180, 180];
  let evenBit = true;

  for (const char of hash) {
    const value = Base32.indexOf(char);
    if (value === -1) throw new Error(`Geohash inválido: ${hash}`);

    for (let bit = 4; bit >= 0; bit--) {
      const range = evenBit ? lngRange : latRange;
      const middle = (range[0] + range[1]) / 2;
      if ((value >> bit) & 1) range[0] = middle;
      else range[1] = middle;
      evenBit = !evenBit;
    }
  }

  return { lat: (latRange[0] + latRange[1]) / 2, lng: (lngRange[0] + lngRange[1]) / 2 };
}
