import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Image, StyleSheet, View } from "react-native";

import { AdminPage } from "@/components/management/admin-page";
import { DataTable, TableToolbar, type Column } from "@/components/management/data-table";
import { ReasonDialog } from "@/components/management/reason-dialog";
import { ThemedText } from "@/components/themed-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChoiceField } from "@/components/ui/choice-field";
import { Dialog } from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";
import { SearchField } from "@/components/ui/search-field";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { showToast } from "@/components/ui/toast";
import { MaxReasonLength, Universities, formatShortDate } from "@/constants/management";
import { Spacing } from "@/constants/theme";
import { usePaginated } from "@/hooks/use-paginated";
import { useSession } from "@/hooks/use-session";
import { getAdminUser, getAdminUsers, reactivateAdminUser, suspendAdminUser } from "@/services/admin";
import { ApiError } from "@/services/api";
import type { AdminUser, AdminUserSort, AdminUserStatus } from "@/types/admin";
import type { UserRole } from "@/types/auth";

const statusOptions = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Activos" },
  { value: "suspended", label: "Suspendidos" },
] as const;

const roleOptions = [
  { value: "all", label: "Todos los roles" },
  { value: "student", label: "Estudiante" },
  { value: "moderator", label: "Moderador" },
  { value: "admin", label: "Administrador" },
] as const;

const sortOptions = [
  { value: "name", label: "Nombre" },
  { value: "reports", label: "Más reportados" },
  { value: "newest", label: "Más recientes" },
] as const;

const roleLabel: Record<UserRole, string> = {
  student: "Estudiante",
  moderator: "Moderador",
  admin: "Administrador",
};

/** Usuarios visibles según el alcance que aplica el backend al rol autenticado. */
export default function AdminUsersScreen() {
  const { user } = useSession();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AdminUserStatus>("all");
  const [role, setRole] = useState<UserRole | "all">("student");
  const [university, setUniversity] = useState<number | "all">("all");
  const [sort, setSort] = useState<AdminUserSort>("reports");
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [suspending, setSuspending] = useState<AdminUser | null>(null);
  const [reactivating, setReactivating] = useState<AdminUser | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchPage = useCallback(
    (page: number) => getAdminUsers({ search, status, role, university_id: university, sort }, page),
    [search, status, role, university, sort],
  );
  const list = usePaginated(fetchPage, "No se pudieron cargar los usuarios.");

  useFocusEffect(useCallback(() => { void list.reload(); }, [list.reload]));

  async function openUser(item: AdminUser) {
    setDetailLoading(true);
    setSelected(item);
    try {
      setSelected(await getAdminUser(item.id));
    } catch (error) {
      showToast({ title: "No se pudo abrir el usuario", message: error instanceof ApiError ? error.message : "Intenta de nuevo.", tone: "danger" });
      setSelected(null);
    } finally {
      setDetailLoading(false);
    }
  }

  async function suspend(reason: string, reportId?: number) {
    if (!suspending) return;
    setSaving(true);
    try {
      const updated = await suspendAdminUser(suspending.id, { reason, ...(reportId ? { report_id: reportId } : {}) });
      list.setItems((items) => items.map((item) => item.id === updated.id ? updated : item));
      setSelected(updated);
      setSuspending(null);
      showToast({ title: "Cuenta suspendida", message: `${updated.name} ya no podrá iniciar sesión.` });
      void list.reload();
    } catch (error) {
      throw error;
    } finally {
      setSaving(false);
    }
  }

  async function reactivate(reason: string) {
    if (!reactivating) return;
    setSaving(true);
    try {
      const updated = await reactivateAdminUser(reactivating.id, reason);
      list.setItems((items) => items.map((item) => item.id === updated.id ? updated : item));
      setSelected(updated);
      setReactivating(null);
      showToast({ title: "Cuenta reactivada", message: `${updated.name} puede volver a iniciar sesión.` });
      void list.reload();
    } finally {
      setSaving(false);
    }
  }

  const columns: Column<AdminUser>[] = [
    {
      key: "user", title: "Usuario", flex: 2, role: "primary",
      render: (item) => <View style={styles.userCell}>
        <ThemedText type="smallBold">{item.name}</ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">{item.email}</ThemedText>
      </View>,
    },
    { key: "role", title: "Rol", render: (item) => <Badge label={roleLabel[item.role]} /> },
    { key: "university", title: "Universidad", render: (item) => <ThemedText type="small">{item.university?.short_name ?? "—"}</ThemedText> },
    { key: "reports", title: "Reportes", render: (item) => <Badge label={`${item.reports_count} (${item.pending_reports_count} pendientes)`} tone={item.pending_reports_count ? "danger" : "neutral"} /> },
    { key: "status", title: "Estado", render: (item) => <Badge label={item.suspended ? "Suspendido" : "Activo"} tone={item.suspended ? "danger" : "success"} dot /> },
    { key: "actions", title: "", width: 110, align: "right", role: "actions", render: (item) => <Button title="Ver" size="small" variant="secondary" onPress={() => void openUser(item)} /> },
  ];

  return (
    <AdminPage
      breadcrumb={["Moderación", "Usuarios"]}
      title="Usuarios"
      description="Consulta cuentas, revisa reportes recibidos y aplica medidas de moderación."
    >
      <SegmentedControl options={statusOptions as any} value={status} onChange={setStatus} accessibilityLabel="Estado de usuarios" />
      <View style={styles.filters}>
        <SearchField value={search} onChangeText={setSearch} placeholder="Buscar por nombre o correo" style={styles.search} />
        <ChoiceField label="Rol" options={roleOptions as any} value={role} onChange={setRole} />
        <ChoiceField label="Ordenar" options={sortOptions as any} value={sort} onChange={setSort} />
        {user?.role === "admin" && (
          <ChoiceField
            label="Universidad"
            options={[{ value: "all" as const, label: "Todas" }, ...Universities.map((u) => ({ value: u.id, label: u.short_name }))]}
            value={university}
            onChange={setUniversity}
          />
        )}
      </View>
      <TableToolbar title="Cuentas registradas" count={list.total} />
      <DataTable
        columns={columns}
        items={list.items}
        keyExtractor={(item) => item.id}
        status={list.status}
        error={list.error}
        onRetry={list.reload}
        empty={{ icon: { ios: "person.2", android: "group", web: "group" }, title: "No hay usuarios", message: "No se encontraron cuentas con los filtros seleccionados." }}
        footer={<Pagination page={list.page} lastPage={list.lastPage} onChange={list.setPage} />}
      />

      <Dialog
        visible={!!selected}
        title={selected?.name ?? "Detalle de usuario"}
        description={detailLoading ? "Cargando información…" : selected?.email}
        onClose={() => setSelected(null)}
        maxWidth={720}
        footer={
          selected ? <>
            {selected.suspended
              ? <Button title="Reactivar cuenta" size="small" onPress={() => setReactivating(selected)} />
              : <Button title="Suspender cuenta" size="small" variant="secondary" onPress={() => setSuspending(selected)} />}
            <Button title="Cerrar" size="small" variant="ghost" onPress={() => setSelected(null)} />
          </> : null
        }
      >
        {selected && !detailLoading && <>
          <View style={styles.detailGrid}>
            <Detail label="Rol" value={roleLabel[selected.role]} />
            <Detail label="Universidad" value={selected.university?.name ?? "Sin universidad"} />
            <Detail label="Correo verificado" value={selected.email_verified ? "Sí" : "No"} />
            <Detail label="Fecha de registro" value={formatShortDate(selected.created_at)} />
            <Detail label="Reportes recibidos" value={`${selected.reports_count} (${selected.pending_reports_count} pendientes)`} />
            <Detail label="Estado" value={selected.suspended ? `Suspendido ${formatShortDate(selected.suspended_at)}` : "Activo"} />
          </View>
          {selected.profile && <>
            <ThemedText type="smallBold">Perfil</ThemedText>
            <ThemedText type="small">{selected.profile.career ?? "Carrera no indicada"} · {selected.profile.semester ? `${selected.profile.semester}° semestre` : "Semestre no indicado"}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">{selected.profile.bio || "Sin biografía."}</ThemedText>
            <View style={styles.photos}>{selected.profile.photos.map((photo) => <Image key={photo.id} source={{ uri: photo.temporary_url }} style={styles.photo} />)}</View>
          </>}
          <ThemedText type="smallBold">Reportes recibidos</ThemedText>
          {(selected.reports ?? []).length === 0 ? <ThemedText type="small" themeColor="textSecondary">No hay reportes registrados.</ThemedText> : selected.reports?.map((report) =>
            <View key={report.id} style={styles.historyItem}>
              <View style={styles.rowBetween}><ThemedText type="smallBold">#{report.id} · {report.reason.replaceAll("_", " ")}</ThemedText><Badge label={report.status} tone={report.status === "pending" ? "danger" : "neutral"} /></View>
              <ThemedText type="caption" themeColor="textSecondary">{report.description || "Sin descripción"} · {formatShortDate(report.created_at)}</ThemedText>
              {report.reporter && <ThemedText type="caption">Reportó: {report.reporter.name}</ThemedText>}
            </View>
          )}
          <ThemedText type="smallBold">Historial de moderación</ThemedText>
          {(selected.moderation_history ?? []).length === 0 ? <ThemedText type="small" themeColor="textSecondary">Sin acciones de moderación.</ThemedText> : selected.moderation_history?.map((entry) =>
            <View key={entry.id} style={styles.historyItem}>
              <ThemedText type="smallBold">{entry.action.replaceAll("_", " ")}</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">{entry.reason}</ThemedText>
              <ThemedText type="caption">{entry.actor?.name ?? "Staff"} · {formatShortDate(entry.created_at)}</ThemedText>
            </View>
          )}
        </>}
      </Dialog>

      <ReasonDialog
        visible={!!suspending}
        title={`Suspender a ${suspending?.name ?? ""}`}
        description={user?.role === "moderator" ? "Selecciona un reporte pendiente que justifique la suspensión." : "La suspensión cerrará sus sesiones activas."}
        label="Motivo de suspensión"
        placeholder="Describe el motivo de la medida."
        confirmTitle="Suspender"
        maxLength={MaxReasonLength}
        onConfirm={(reason) => {
          const reportId = user?.role === "moderator" ? suspending?.reports?.find((r) => r.status === "pending")?.id : undefined;
          if (user?.role === "moderator" && !reportId) {
            showToast({ title: "Falta un reporte pendiente", message: "Abre el detalle y confirma que exista un reporte pendiente.", tone: "danger" });
            return Promise.reject(new Error("No hay reporte pendiente asociado."));
          }
          return suspend(reason, reportId);
        }}
        onClose={() => setSuspending(null)}
      />
      <ReasonDialog
        visible={!!reactivating}
        title={`Reactivar a ${reactivating?.name ?? ""}`}
        description="La cuenta podrá volver a iniciar sesión."
        label="Motivo de reactivación"
        placeholder="Describe por qué se reactiva la cuenta."
        confirmTitle="Reactivar"
        maxLength={MaxReasonLength}
        onConfirm={reactivate}
        onClose={() => setReactivating(null)}
      />
    </AdminPage>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <View style={styles.detail}><ThemedText type="caption" themeColor="textSecondary">{label}</ThemedText><ThemedText type="small">{value}</ThemedText></View>;
}

const styles = StyleSheet.create({
  filters: { gap: Spacing.three },
  search: { minWidth: 260 },
  userCell: { gap: Spacing.half },
  detailGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.three },
  detail: { minWidth: 180, flexGrow: 1, gap: Spacing.half },
  photos: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
  photo: { width: 88, height: 88, borderRadius: 12 },
  historyItem: { gap: Spacing.half, paddingVertical: Spacing.two, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#8886" },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: Spacing.two },
});
