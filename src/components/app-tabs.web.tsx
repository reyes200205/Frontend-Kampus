import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import { SymbolView, type AndroidSymbol } from 'expo-symbols';
import { forwardRef } from 'react';
import { Pressable, StyleSheet, Text, View, type PressableInstance } from 'react-native';

import { KampusLogo } from '@/components/kampus-logo';
import { TabItems } from '@/constants/navigation';
import { FontFamily, MinTouchSize, Radius, SidebarWidth, Spacing } from '@/constants/theme';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useUnreadChatsCount } from '@/hooks/use-chat';
import { useSession } from '@/hooks/use-session';
import { useTheme } from '@/hooks/use-theme';

/**
 * Navegación principal en web: barra inferior en pantallas angostas y
 * barra lateral izquierda en escritorio (anteproyecto 12.2).
 */
export default function AppTabs() {
  const theme = useTheme();
  const { isDesktop } = useBreakpoint();
  const { user } = useSession();
  // Conversaciones con mensajes sin leer (T-16): se muestra en la pestaña Chats.
  const unread = useUnreadChatsCount(user?.id ?? 0);

  return (
    <Tabs style={[styles.root, isDesktop && styles.rootDesktop, { backgroundColor: theme.background }]}>
      {/* La pantalla siempre va primero; en escritorio `row-reverse` deja la barra a la izquierda. */}
      <TabSlot style={styles.slot} />
      <TabList
        style={[
          isDesktop ? styles.sidebar : styles.bottomBar,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        ]}>
        {isDesktop && (
          <View style={styles.sidebarLogo}>
            <KampusLogo size={28} layout="inline" />
          </View>
        )}
        {TabItems.map((item) => (
          <TabTrigger key={item.name} name={item.name} href={item.href} asChild>
            <TabButton
              icon={item.md}
              label={item.label}
              desktop={isDesktop}
              badge={item.name === 'chats' ? unread : 0}
            />
          </TabTrigger>
        ))}
      </TabList>
    </Tabs>
  );
}

type TabButtonProps = TabTriggerSlotProps & {
  icon: AndroidSymbol;
  label: string;
  desktop: boolean;
  /** Número del contador (p. ej. chats sin leer); con 0 no se muestra. */
  badge: number;
};

const TabButton = forwardRef<PressableInstance, TabButtonProps>(function TabButton(
  { icon, label, desktop, badge, isFocused, ...props },
  ref
) {
  const theme = useTheme();
  const color = isFocused ? theme.accent : theme.textSecondary;
  const badgeText = badge > 9 ? '9+' : String(badge);

  return (
    <Pressable
      ref={ref}
      {...props}
      accessibilityRole="tab"
      accessibilityState={{ selected: !!isFocused }}
      accessibilityLabel={badge > 0 ? `${label}, ${badgeText} sin leer` : label}
      style={({ pressed }) => [
        desktop ? styles.sidebarItem : styles.bottomItem,
        desktop && isFocused && { backgroundColor: theme.backgroundSelected },
        pressed && styles.pressed,
      ]}>
      <View>
        <SymbolView name={{ web: icon }} size={desktop ? 22 : 24} tintColor={color} />
        {badge > 0 && (
          <View style={[styles.badge, { backgroundColor: theme.accent, borderColor: theme.backgroundElement }]}>
            <Text style={[styles.badgeText, { color: theme.onAccent }]}>{badgeText}</Text>
          </View>
        )}
      </View>
      <Text
        style={[
          desktop ? styles.sidebarLabel : styles.bottomLabel,
          { color: isFocused ? theme.text : theme.textSecondary },
          isFocused && styles.labelFocused,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  rootDesktop: {
    flexDirection: 'row-reverse',
  },
  slot: {
    flex: 1,
  },
  bottomBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: Spacing.one,
  },
  bottomItem: {
    flex: 1,
    minHeight: MinTouchSize + 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.half,
  },
  bottomLabel: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
  },
  sidebar: {
    width: SidebarWidth,
    flexDirection: 'column',
    // TabList trae `space-between` por defecto; en la barra lateral los ítems van juntos arriba.
    justifyContent: 'flex-start',
    borderRightWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    gap: Spacing.one,
  },
  sidebarLogo: {
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.two,
    marginBottom: Spacing.four,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: MinTouchSize,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.medium,
  },
  sidebarLabel: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
  },
  labelFocused: {
    fontFamily: FontFamily.semibold,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: Radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 12,
    fontFamily: FontFamily.bold,
  },
  pressed: {
    opacity: 0.7,
  },
});
