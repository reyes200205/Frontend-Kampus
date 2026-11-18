import { useEffect } from 'react';

import { NavTabs } from '@/components/navigation/nav-tabs';
import { ManagementTabItems } from '@/constants/navigation';
import { refreshPendingGroups, usePendingGroupsCount } from '@/hooks/use-pending-groups';
import type { User } from '@/types/auth';

/**
 * Navegación del panel de gestión en iOS y Android (T-44): pestañas nativas. En web se usa la
 * barra lateral de `management-tabs.web.tsx`. Las secciones que el rol no puede usar se ocultan.
 */
export function ManagementTabs({ user }: { user: User }) {
  const pending = usePendingGroupsCount();

  useEffect(() => {
    void refreshPendingGroups();
  }, []);

  return (
    <NavTabs
      items={ManagementTabItems.map(({ roles, ...item }) => ({
        ...item,
        hidden: !roles.includes(user.role),
        ...(item.name === 'index' ? { badge: pending } : {}),
      }))}
    />
  );
}
