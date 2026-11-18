import { NavTabs } from '@/components/navigation/nav-tabs';
import { TabItems } from '@/constants/navigation';
import { useUnreadChatsCount } from '@/hooks/use-chat';
import { useSession } from '@/hooks/use-session';

/** Navegación del estudiante: las cuatro secciones principales (anteproyecto 12.2). */
export default function AppTabs() {
  const { user } = useSession();
  // Conversaciones con mensajes sin leer (T-16): se muestra en la pestaña Chats.
  const unread = useUnreadChatsCount(user?.id ?? 0);

  return (
    <NavTabs
      items={TabItems.map((item) => (item.name === 'chats' ? { ...item, badge: unread } : item))}
    />
  );
}
