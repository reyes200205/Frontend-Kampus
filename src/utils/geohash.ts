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
