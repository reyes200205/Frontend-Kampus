/**
 * Paleta del tema activo. El tema se elige en código con `ActiveTheme`
 * (ver `src/constants/theme.ts`); todavía no se cambia desde la app.
 */

import { ActiveTheme, Themes } from '@/constants/theme';

export function useTheme() {
  return Themes[ActiveTheme];
}
