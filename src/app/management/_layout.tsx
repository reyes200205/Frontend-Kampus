import { Redirect, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Toaster } from '@/components/ui/toast';
import { useSession } from '@/hooks/use-session';
import { isStaff } from '@/utils/roles';

/**
 * Panel de gestión del staff (T-44): moderadores y administradores. La navegación vive en `(panel)`;
 * los formularios se abren como diálogos encima de cada sección.
 */
export default function ManagementLayout() {
  const { isSignedIn, user } = useSession();

  if (!isSignedIn) return <Redirect href="/auth/login" />;
  // Un estudiante no tiene acceso al panel: vuelve a su inicio.
  if (!isStaff(user)) return <Redirect href="/" />;

  return (
    <View style={styles.flex}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(panel)" />
      </Stack>
      {/* Avisos después de aprobar, rechazar, dar de alta, etc. */}
      <Toaster />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
