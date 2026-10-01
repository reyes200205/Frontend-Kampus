import { Redirect } from 'expo-router';

import AppTabs from '@/components/app-tabs';

// TODO: reemplazar por la sesión real cuando conectemos el backend
const isAuthenticated = false;

export default function TabsLayout() {
  if (!isAuthenticated) return <Redirect href="/auth/login" />;

  return <AppTabs />;
}
