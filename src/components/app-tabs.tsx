import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { TabItems } from '@/constants/navigation';
import { useTheme } from '@/hooks/use-theme';

/** Barra de pestañas nativa (iOS y Android) con las cuatro secciones principales. */
export default function AppTabs() {
  const theme = useTheme();

  return (
    <NativeTabs
      backgroundColor={theme.backgroundElement}
      indicatorColor={theme.backgroundSelected}
      tintColor={theme.accent}
      iconColor={{ default: theme.textSecondary, selected: theme.accent }}
      labelStyle={{
        default: { color: theme.textSecondary },
        selected: { color: theme.accent },
      }}>
      {TabItems.map((item) => (
        <NativeTabs.Trigger key={item.name} name={item.name}>
          <NativeTabs.Trigger.Label>{item.label}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={item.sf} md={item.md} />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
