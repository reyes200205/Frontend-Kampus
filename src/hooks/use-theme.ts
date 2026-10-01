/**
 * Kampus solo usa modo oscuro (ver `userInterfaceStyle` en app.json),
 * así que siempre regresamos la paleta `dark`.
 */

import { Colors } from '@/constants/theme';

export function useTheme() {
  return Colors.dark;
}
