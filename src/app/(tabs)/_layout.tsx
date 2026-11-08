import { Redirect } from 'expo-router';

import AppTabs from '@/components/app-tabs';
import { useSession } from '@/hooks/use-session';

export default function TabsLayout() {
  const { isSignedIn, user } = useSession();

  if (!isSignedIn) return <Redirect href="/auth/login" />;

  // Perfil obligatorio (T-49): hasta terminarlo, el estudiante no entra a las pestañas.
  if (user?.role === "student" && !user.profile_completed) return <Redirect href="/onboarding" />;

  return <AppTabs />;
}
