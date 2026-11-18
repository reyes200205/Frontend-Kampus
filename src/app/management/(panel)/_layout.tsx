import { ManagementTabs } from '@/components/management/management-tabs';
import { useSession } from '@/hooks/use-session';

/** Navegación del panel; `management/_layout` ya comprobó que hay sesión y que es de staff. */
export default function ManagementPanelLayout() {
  const { user } = useSession();

  if (!user) return null;

  return <ManagementTabs user={user} />;
}
