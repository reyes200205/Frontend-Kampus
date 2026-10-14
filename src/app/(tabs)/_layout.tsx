import { Redirect } from 'expo-router';

import AppTabs from '@/components/app-tabs';
import { useSession } from '@/hooks/use-session';

export default function TabsLayout() {
  const { isSignedIn } = useSession();

  if (!isSignedIn) return <Redirect href="/auth/login" />;

  return <AppTabs />;
}
