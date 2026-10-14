import {
  Sora_400Regular,
  Sora_500Medium,
  Sora_600SemiBold,
  Sora_700Bold,
  useFonts,
} from '@expo-google-fonts/sora';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { ActiveTheme, ActiveThemeMode, Themes } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

// Tema de la navegación (fondos de pantallas y modales) a partir del tema activo.
const palette = Themes[ActiveTheme];
const baseNavigationTheme = ActiveThemeMode === 'dark' ? DarkTheme : DefaultTheme;
const navigationTheme: Theme = {
  ...baseNavigationTheme,
  colors: {
    ...baseNavigationTheme.colors,
    primary: palette.accent,
    background: palette.background,
    card: palette.background,
    text: palette.text,
    border: palette.border,
  },
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Sora_400Regular,
    Sora_500Medium,
    Sora_600SemiBold,
    Sora_700Bold,
  });

  // El splash sigue visible hasta que las fuentes estén listas
  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={ActiveThemeMode === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth/login/index" />
        <Stack.Screen name="legal/privacy" options={{ presentation: 'modal' }} />
        <Stack.Screen name="legal/guidelines" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
