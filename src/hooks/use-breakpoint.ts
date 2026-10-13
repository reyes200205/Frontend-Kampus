import { useWindowDimensions } from 'react-native';

import { Breakpoints } from '@/constants/theme';

/** Tamaño de pantalla actual según los `Breakpoints` del tema. Se recalcula al girar o redimensionar. */
export function useBreakpoint() {
  const { width } = useWindowDimensions();

  return {
    width,
    isTablet: width >= Breakpoints.tablet,
    isDesktop: width >= Breakpoints.desktop,
  };
}
