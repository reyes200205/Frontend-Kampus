import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import { SymbolView, type AndroidSymbol } from 'expo-symbols';
import { Fragment, forwardRef, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View, type PressableInstance } from 'react-native';

import { KampusLogo } from '@/components/kampus-logo';
import { Avatar } from '@/components/matches/avatar';
import {
  isSoonItem,
  ManagementAccountItem,
  ManagementSections,
  ManagementTabItems,
} from '@/constants/navigation';
import { Universities } from '@/constants/management';
import { FontFamily, MinTouchSize, Radius, Spacing } from '@/constants/theme';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { refreshPendingGroups, usePendingGroupsCount } from '@/hooks/use-pending-groups';
import { useTheme } from '@/hooks/use-theme';
import type { User } from '@/types/auth';
import { RoleLabels } from '@/utils/roles';

/** Ancho de la barra lateral completa (escritorio) y del riel de íconos (tableta). */
const SidebarWidth = 264;
const RailWidth = 76;

type Mode = 'sidebar' | 'rail' | 'bottom';

/**
 * Navegación del panel de gestión en web (T-44):
 * - escritorio: barra lateral con secciones, contador de pendientes y la cuenta abajo;
 * - tableta: riel solo con íconos;
 * - celular: barra inferior.
 * Las pestañas tienen que ser hijas directas de `TabList` (o de un fragmento) para que el router
 * registre sus rutas; por eso las secciones van "planas" y no envueltas en otro `View`.
 */
export function ManagementTabs({ user }: { user: User }) {
  const theme = useTheme();
  const { isTablet, isDesktop } = useBreakpoint();
  const pending = usePendingGroupsCount();
  const mode: Mode = isDesktop ? 'sidebar' : isTablet ? 'rail' : 'bottom';
  const can = (roles: string[]) => roles.includes(user.role);

  useEffect(() => {
    void refreshPendingGroups();
  }, []);

  const university = Universities.find((item) => item.id === user.university_id);
  const scope = user.role === 'admin' ? 'Todas las universidades' : (university?.name ?? 'Tu universidad');

  return (
    <Tabs style={[styles.root, mode !== 'bottom' && styles.rootSide, { backgroundColor: theme.background }]}>
      {/* La pantalla va primero; con `row-reverse` la barra queda a la izquierda. */}
      <TabSlot style={styles.slot} />
      <TabList
        style={[
          mode === 'sidebar' ? styles.sidebar : mode === 'rail' ? styles.rail : styles.bottomBar,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        ]}>
        {mode === 'bottom' ? (
          ManagementTabItems.filter((item) => can(item.roles)).map((item) => (
            <TabTrigger key={item.name} name={item.name} href={item.href} asChild>
              <NavButton mode="bottom" icon={item.md} label={item.label} badge={item.name === 'index' ? pending : 0} />
            </TabTrigger>
          ))
        ) : (
          <>
            <View style={[styles.brand, mode === 'rail' && styles.brandRail]}>
              <KampusLogo size={mode === 'rail' ? 30 : 28} layout="inline" wordmark={mode === 'sidebar'} />
            </View>

            {mode === 'sidebar' && (
              <View style={[styles.scope, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <Text style={[styles.scopeTitle, { color: theme.text }]}>Panel de gestión</Text>
                <Text style={[styles.scopeText, { color: theme.textSecondary }]} numberOfLines={1}>
                  {RoleLabels[user.role]} · {scope}
                </Text>
              </View>
            )}

            {ManagementSections.map((section) => {
              const items = section.items.filter((item) => can(item.roles));
              if (items.length === 0) return null;
              return (
                <Fragment key={section.title}>
                  {mode === 'sidebar' ? (
                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{section.title}</Text>
                  ) : (
                    <View style={[styles.railDivider, { backgroundColor: theme.border }]} />
                  )}
                  {items.map((item) =>
                    isSoonItem(item) ? (
                      <SoonItem key={item.label} mode={mode} icon={item.md} label={item.label} task={item.task} />
                    ) : (
                      <TabTrigger key={item.name} name={item.name} href={item.href} asChild>
                        <NavButton
                          mode={mode}
                          icon={item.md}
                          label={item.label}
                          badge={item.name === 'index' ? pending : 0}
                        />
                      </TabTrigger>
                    ),
                  )}
                </Fragment>
              );
            })}

            {/* Empuja la cuenta al fondo de la barra. */}
            <View style={styles.spacer} />
            <View style={[styles.footerDivider, { backgroundColor: theme.border }]} />

            <TabTrigger name={ManagementAccountItem.name} href={ManagementAccountItem.href} asChild>
              <AccountButton mode={mode} user={user} />
            </TabTrigger>
          </>
        )}
      </TabList>
    </Tabs>
  );
}

type NavButtonProps = TabTriggerSlotProps & {
  mode: Mode;
  icon: AndroidSymbol;
  label: string;
  /** Contador (p. ej. grupos en revisión); con 0 no se muestra. */
  badge: number;
};

const NavButton = forwardRef<PressableInstance, NavButtonProps>(function NavButton(
  { mode, icon, label, badge, isFocused, ...props },
  ref,
) {
  const theme = useTheme();
  const color = isFocused ? theme.accent : theme.textSecondary;
  const badgeText = badge > 99 ? '99+' : String(badge);

  return (
    <Pressable
      ref={ref}
      {...props}
      accessibilityRole="tab"
      accessibilityState={{ selected: !!isFocused }}
      accessibilityLabel={badge > 0 ? `${label}, ${badgeText} pendientes` : label}
      style={({ pressed, hovered }) => [
        mode === 'sidebar' ? styles.item : mode === 'rail' ? styles.railItem : styles.bottomItem,
        mode !== 'bottom' && hovered && { backgroundColor: theme.background },
        mode !== 'bottom' && isFocused && { backgroundColor: theme.backgroundSelected },
        pressed && styles.pressed,
      ]}>
      <View>
        <SymbolView name={{ web: icon }} size={mode === 'bottom' ? 24 : 22} tintColor={color} />
        {badge > 0 && mode !== 'sidebar' && (
          <View style={[styles.dotBadge, { backgroundColor: theme.accent, borderColor: theme.backgroundElement }]}>
            <Text style={[styles.dotBadgeText, { color: theme.onAccent }]}>{badge > 9 ? '9+' : badge}</Text>
          </View>
        )}
      </View>
      {mode !== 'rail' && (
        <Text
          numberOfLines={1}
          style={[
            mode === 'sidebar' ? styles.label : styles.bottomLabel,
            { color: isFocused ? theme.text : theme.textSecondary },
            isFocused && styles.labelFocused,
          ]}>
          {label}
        </Text>
      )}
      {mode === 'sidebar' && badge > 0 && (
        <View style={[styles.countBadge, { backgroundColor: theme.accent }]}>
          <Text style={[styles.countText, { color: theme.onAccent }]}>{badgeText}</Text>
        </View>
      )}
    </Pressable>
  );
});

/** Sección sin API todavía: no se puede abrir y avisa con qué tarea llega. */
function SoonItem({ mode, icon, label, task }: { mode: Mode; icon: AndroidSymbol; label: string; task: string }) {
  const theme = useTheme();

  return (
    <View
      accessible
      accessibilityLabel={`${label}, disponible pronto (${task})`}
      accessibilityState={{ disabled: true }}
      style={[mode === 'sidebar' ? styles.item : styles.railItem, styles.soon]}>
      <SymbolView name={{ web: icon }} size={22} tintColor={theme.textSecondary} />
      {mode === 'sidebar' && (
        <>
          <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
          <View style={[styles.soonTag, { borderColor: theme.border }]}>
            <Text style={[styles.soonText, { color: theme.textSecondary }]}>Pronto</Text>
          </View>
        </>
      )}
    </View>
  );
}

type AccountButtonProps = TabTriggerSlotProps & { mode: Mode; user: User };

/** Cuenta al fondo de la barra: avatar con iniciales, nombre y correo. */
const AccountButton = forwardRef<PressableInstance, AccountButtonProps>(function AccountButton(
  { mode, user, isFocused, ...props },
  ref,
) {
  const theme = useTheme();

  return (
    <Pressable
      ref={ref}
      {...props}
      accessibilityRole="tab"
      accessibilityState={{ selected: !!isFocused }}
      accessibilityLabel={`Cuenta de ${user.name}`}
      style={({ pressed, hovered }) => [
        mode === 'sidebar' ? styles.account : styles.railItem,
        hovered && { backgroundColor: theme.background },
        isFocused && { backgroundColor: theme.backgroundSelected },
        pressed && styles.pressed,
      ]}>
      <Avatar uri={null} name={user.name} size={36} ring={isFocused} />
      {mode === 'sidebar' && (
        <>
          <View style={styles.accountTexts}>
            <Text numberOfLines={1} style={[styles.accountName, { color: theme.text }]}>
              {user.name}
            </Text>
            <Text numberOfLines={1} style={[styles.accountEmail, { color: theme.textSecondary }]}>
              {user.email}
            </Text>
          </View>
          <SymbolView name={{ web: 'chevron_right' }} size={18} tintColor={theme.textSecondary} />
        </>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  rootSide: {
    flexDirection: 'row-reverse',
  },
  slot: {
    flex: 1,
  },
  // Barra lateral completa (escritorio).
  sidebar: {
    width: SidebarWidth,
    flexDirection: 'column',
    // TabList trae `space-between` por defecto; aquí los ítems van juntos arriba.
    justifyContent: 'flex-start',
    borderRightWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    gap: Spacing.half,
  },
  brand: {
    paddingHorizontal: Spacing.two,
    marginBottom: Spacing.three,
  },
  brandRail: {
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  scope: {
    borderWidth: 1,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    gap: 2,
    marginBottom: Spacing.three,
  },
  scopeTitle: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
  },
  scopeText: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: Spacing.three,
    marginTop: Spacing.three,
    marginBottom: Spacing.one,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: MinTouchSize,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.medium,
  },
  label: {
    flex: 1,
    fontSize: 15,
    fontFamily: FontFamily.medium,
  },
  labelFocused: {
    fontFamily: FontFamily.semibold,
  },
  countBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
  },
  soon: {
    opacity: 0.55,
  },
  soonTag: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
  },
  soonText: {
    fontSize: 10,
    fontFamily: FontFamily.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  spacer: {
    flex: 1,
  },
  footerDivider: {
    height: 1,
    marginVertical: Spacing.two,
  },
  account: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.two,
    borderRadius: Radius.medium,
  },
  accountTexts: {
    flex: 1,
    gap: 2,
  },
  accountName: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
  },
  accountEmail: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },
  // Riel de íconos (tableta).
  rail: {
    width: RailWidth,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    borderRightWidth: 1,
    paddingVertical: Spacing.four,
    gap: Spacing.one,
  },
  railDivider: {
    width: 28,
    height: 1,
    marginVertical: Spacing.two,
  },
  railItem: {
    width: MinTouchSize + 4,
    height: MinTouchSize + 4,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotBadge: {
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
  dotBadgeText: {
    fontSize: 10,
    lineHeight: 12,
    fontFamily: FontFamily.bold,
  },
  // Barra inferior (celular).
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
  pressed: {
    opacity: 0.7,
  },
});
