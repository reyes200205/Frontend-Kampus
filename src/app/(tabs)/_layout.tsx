import { Redirect } from 'expo-router';

import AppTabs from '@/components/app-tabs';
import { useChatRealtime } from '@/hooks/use-chat-realtime';
import { useSession } from '@/hooks/use-session';

export default function TabsLayout() {
  const { isSignedIn, user } = useSession();
  const canChat = isSignedIn && user?.role === 'student' && user.profile_completed;

  // Mensajes y matches nuevos aunque no estés en Chats (T-16): alimenta el contador de la pestaña.
  useChatRealtime(canChat ? user.id : null);

  if (!isSignedIn) return <Redirect href="/auth/login" />;

  // Perfil obligatorio (T-49): hasta terminarlo, el estudiante no entra a las pestañas.
  if (user?.role === "student" && !user.profile_completed) return <Redirect href="/onboarding" />;

  return <AppTabs />;
}
