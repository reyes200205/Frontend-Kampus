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
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ActiveTheme, ActiveThemeMode, Themes } from '@/constants/theme';
// Registra el cierre de sesión cuando la API rechaza el token (401).
import '@/hooks/end-session';
import { restoreSession, useSessionRestored } from '@/hooks/use-session';

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

  const sessionRestored = useSessionRestored();

  // Si había una sesión guardada, se valida con `GET /api/user` antes de decidir a dónde ir: así una
  // recarga no manda al inicio de sesión a quien ya lo había hecho.
  useEffect(() => {
    void restoreSession();
  }, []);

  // El splash sigue visible hasta que las fuentes y la sesión estén listas.
  const ready = fontsLoaded && sessionRestored;
  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    // Necesario para los gestos de swipe en Descubrir (react-native-gesture-handler).
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={navigationTheme}>
        <StatusBar style={ActiveThemeMode === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auth/login/index" />
          <Stack.Screen name="auth/verify-email/index" />
          <Stack.Screen name="profile/edit" />
          <Stack.Screen name="profile/location" />
          <Stack.Screen name="chat/[matchId]" />
          <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
          <Stack.Screen name="legal/privacy" options={{ presentation: 'modal' }} />
          <Stack.Screen name="legal/guidelines" options={{ presentation: 'modal' }} />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
