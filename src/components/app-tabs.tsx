import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { TabItems } from '@/constants/navigation';
import { useUnreadChatsCount } from '@/hooks/use-chat';
import { useSession } from '@/hooks/use-session';
import { useTheme } from '@/hooks/use-theme';

/** Barra de pestañas nativa (iOS y Android) con las cuatro secciones principales. */
export default function AppTabs() {
  const theme = useTheme();
  const { user } = useSession();
  // Conversaciones con mensajes sin leer (T-16): se muestra en la pestaña Chats.
  const unread = useUnreadChatsCount(user?.id ?? 0);

  return (
    <NativeTabs
      backgroundColor={theme.backgroundElement}
      indicatorColor={theme.backgroundSelected}
      tintColor={theme.accent}
      iconColor={{ default: theme.textSecondary, selected: theme.accent }}
      badgeBackgroundColor={theme.accent}
      badgeTextColor={theme.onAccent}
      labelStyle={{
        default: { color: theme.textSecondary },
        selected: { color: theme.accent },
      }}>
      {TabItems.map((item) => (
        <NativeTabs.Trigger key={item.name} name={item.name}>
          <NativeTabs.Trigger.Label>{item.label}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={item.sf} md={item.md} />
          {item.name === 'chats' && (
            <NativeTabs.Trigger.Badge hidden={unread === 0}>
              {unread > 9 ? '9+' : String(unread)}
            </NativeTabs.Trigger.Badge>
          )}
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
