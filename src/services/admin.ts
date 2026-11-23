// Cliente de la API de administración (docs/backend/api/admin/*).
import { signOut as endSession } from '@/hooks/use-session';
import { ApiError, apiRequest } from '@/services/api';

export type University = { id: number; name: string; short_name: string };

export type StaffMember = {
  id: number;
  name: string;
  email: string;
  role: 'moderator' | 'admin';
  university: University | null;
  active: boolean;
  deactivated_at: string | null;
  created_at: string;
};

export type GroupStatus = 'pending' | 'approved' | 'rejected';
export type GroupCategory = 'deportivo' | 'cultural' | 'academico' | 'social';

export type Group = {
  id: number;
  name: string;
  description: string | null;
  category: GroupCategory;
  status: GroupStatus;
  is_official: boolean;
  image_url: string | null;
  university: University | null;
  creator?: { name: string } | null;
  members_count: number;
  rejection_reason?: string | null;
  reviewed_by?: { name?: string } | string | null;
  reviewed_at?: string | null;
  created_at: string;
};

export type Paginated<T> = {
  data: T[];
  meta: { current_page: number; last_page: number; total: number };
};

// Universidades vistas en las respuestas: la API no tiene catálogo.
const known = new Map<number, University>();
export const knownUniversities = () => Array.from(known.values());
const learn = (u?: University | null) => {
  if (u) known.set(u.id, u);
};

/** apiRequest del proyecto; si el token venció (401) cierra la sesión y las rutas redirigen al login. */
async function call<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  try {
    return await apiRequest<T>(path, { method, body });
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) endSession();
    throw e;
  }
}

export const logoutRequest = () => apiRequest<null>('/logout', { method: 'POST' });

// ---- Staff (solo admin) ----
export async function listStaff(page: number) {
  const r = await call<Paginated<StaffMember>>(`/admin/staff?page=${page}`);
  r.data.forEach((s) => learn(s.university));
  return r;
}

export type NewStaff = {
  name: string;
  email: string;
  role: 'moderator' | 'admin';
  university_id?: number | null;
  password: string;
  password_confirmation: string;
  reason: string;
};
export const createStaff = (body: NewStaff) => call('/admin/staff', 'POST', body);

export const setStaffActive = (id: number, active: boolean, reason: string) =>
  call(`/admin/staff/${id}`, 'PATCH', { active, reason });

// ---- Grupos ----
export async function listGroups(status: GroupStatus, page: number) {
  const r = await call<Paginated<Group>>(`/admin/groups?status=${status}&page=${page}`);
  r.data.forEach((g) => learn(g.university));
  return r;
}

export const reviewGroup = (id: number, approve: boolean, reason?: string) =>
  call(`/admin/groups/${id}/${approve ? 'approve' : 'reject'}`, 'POST', reason ? { reason } : {});

export type NewOfficialGroup = {
  name: string;
  description?: string;
  category: GroupCategory;
  university_id?: number | null;
  admin_user_id?: number;
};
export const createOfficialGroup = (body: NewOfficialGroup) => call('/admin/groups', 'POST', body);
