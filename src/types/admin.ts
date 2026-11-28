/** Tipos del panel administrativo Kampus: grupos, staff, usuarios y reportes. */

import type { UserRole } from "@/types/auth";

export type UniversitySummary = { id: number; name: string; short_name: string };
export type StaffRole = Exclude<UserRole, "student">;

export type StaffMember = {
  id: number;
  name: string;
  email: string;
  role: StaffRole;
  university: UniversitySummary | null;
  active: boolean;
  deactivated_at: string | null;
  created_at: string;
};

export type StaffCreate = {
  name: string;
  email: string;
  role: StaffRole;
  university_id?: number;
  password: string;
  password_confirmation: string;
  reason: string;
};

export type GroupStatus = "pending" | "approved" | "rejected";
export type GroupFilter = GroupStatus | "all";
export type GroupCategory = "deportivo" | "cultural" | "academico" | "social";

export type AdminGroup = {
  id: number;
  name: string;
  description: string | null;
  category: GroupCategory;
  university: UniversitySummary | null;
  status: GroupStatus;
  is_official: boolean;
  rejection_reason: string | null;
  image_url: string | null;
  members_count: number;
  creator: { id: number; name: string } | null;
  reviewed_by: { id: number; name: string } | null;
  reviewed_at: string | null;
  created_at: string;
};

export type OfficialGroupCreate = {
  name: string;
  description?: string;
  category: GroupCategory;
  university_id?: number | null;
};

export type AdminUserStatus = "all" | "active" | "suspended";
export type AdminUserSort = "name" | "reports" | "newest";

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  university: UniversitySummary | null;
  email_verified: boolean;
  suspended: boolean;
  suspended_at: string | null;
  reports_count: number;
  pending_reports_count: number;
  created_at: string;
  profile?: {
    career: string | null;
    semester: number | null;
    bio: string | null;
    completed: boolean;
    photos: { id: number; position: number; temporary_url: string }[];
  } | null;
  reports?: {
    id: number;
    reason: ReportReason;
    description: string | null;
    status: ReportStatus;
    reporter: { id: number; name: string } | null;
    created_at: string;
  }[];
  moderation_history?: {
    id: number;
    action: string;
    reason: string;
    report_id: number | null;
    actor: { id: number; name: string } | null;
    created_at: string;
  }[];
};

export type AdminUserQuery = {
  search?: string;
  status?: AdminUserStatus;
  role?: UserRole | "all";
  university_id?: number | "all";
  sort?: AdminUserSort;
};

export type AdminUserModerationBody = {
  reason: string;
  /** Obligatorio para moderadores; opcional para administradores. */
  report_id?: number;
};

export type ReportReason = "acoso" | "perfil_falso" | "contenido_inapropiado" | "spam" | "otro";
export type ReportStatus = "pending" | "reviewed" | "dismissed";
export type ReportFilter = "all" | ReportStatus;

export type AdminReport = {
  id: number;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  university: UniversitySummary | null;
  reporter: { id: number; name: string; email: string } | null;
  reported: {
    id: number;
    name: string;
    email: string;
    suspended: boolean;
    suspended_at: string | null;
    reports_count: number;
  };
  match_id: number | null;
  reviewed_by: { id: number; name: string } | null;
  reviewed_at: string | null;
  created_at: string;
};

export type AdminReportQuery = {
  status?: ReportFilter;
  user_id?: number;
  reason?: ReportReason | "all";
};

export type ReviewReportBody = {
  status: "reviewed" | "dismissed";
  reason: string;
  suspend?: boolean;
};
