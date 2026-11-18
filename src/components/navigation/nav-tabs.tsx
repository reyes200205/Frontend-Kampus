import { NativeTabs } from 'expo-router/unstable-native-tabs';

import type { NavTab } from '@/constants/navigation';
import { useTheme } from '@/hooks/use-theme';

export type NavTabsProps = {
  items: NavTab[];
  /** Solo en web (barra lateral); en iOS y Android no se muestra. */
  sidebarTitle?: string;
};

/**
 * Barra de pestañas nativa (iOS y Android). La usan la app del estudiante (`AppTabs`) y el panel de
 * gestión (`ManagementTabs`). Una pestaña con `hidden` no se puede abrir de ninguna forma.
 */
export function NavTabs({ items }: NavTabsProps) {
  const theme = useTheme();

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
      {items.map((item) => {
        const badge = item.badge ?? 0;
        return (
          <NativeTabs.Trigger key={item.name} name={item.name} hidden={item.hidden}>
            <NativeTabs.Trigger.Label>{item.label}</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon sf={item.sf} md={item.md} />
            {item.badge !== undefined && (
              <NativeTabs.Trigger.Badge hidden={badge === 0}>
                {badge > 9 ? '9+' : String(badge)}
              </NativeTabs.Trigger.Badge>
            )}
          </NativeTabs.Trigger>
        );
      })}
    </NativeTabs>
  );
}
