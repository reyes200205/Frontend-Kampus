import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AdminPage } from "@/components/management/admin-page";
import { DataTable, TableToolbar, type Column } from "@/components/management/data-table";
import { ReasonDialog } from "@/components/management/reason-dialog";
import { ThemedText } from "@/components/themed-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ChoiceField } from "@/components/ui/choice-field";
import { Pagination } from "@/components/ui/pagination";
import { SearchField } from "@/components/ui/search-field";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { showToast } from "@/components/ui/toast";
import { MaxReasonLength, formatShortDate } from "@/constants/management";
import { Spacing } from "@/constants/theme";
import { usePaginated } from "@/hooks/use-paginated";
import { useSession } from "@/hooks/use-session";
import { getAdminReport, getAdminReports, reviewAdminReport } from "@/services/admin";
import { ApiError } from "@/services/api";
import type { AdminReport, ReportFilter, ReportReason } from "@/types/admin";

const statuses = [
  { value: "pending", label: "Pendientes" },
  { value: "reviewed", label: "Resueltos" },
  { value: "dismissed", label: "Descartados" },
  { value: "all", label: "Todos" },
] as const;

const reasons = [
  { value: "all", label: "Todos los motivos" },
  { value: "acoso", label: "Acoso" },
  { value: "perfil_falso", label: "Perfil falso" },
  { value: "contenido_inapropiado", label: "Contenido inapropiado" },
  { value: "spam", label: "Spam" },
  { value: "otro", label: "Otro" },
] as const;

const reasonLabels: Record<ReportReason, string> = {
  acoso: "Acoso",
  perfil_falso: "Perfil falso",
  contenido_inapropiado: "Contenido inapropiado",
  spam: "Spam",
  otro: "Otro",
};

/** Cola e historial de reportes; las decisiones se envían al endpoint PATCH /admin/reports/{id}. */
export default function AdminReportsScreen() {
  const { user } = useSession();
  const [status, setStatus] = useState<ReportFilter>("pending");
  const [reason, setReason] = useState<ReportReason | "all">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AdminReport | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [decision, setDecision] = useState<"reviewed" | "dismissed">("reviewed");
  const [suspend, setSuspend] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  const fetchPage = useCallback((page: number) => getAdminReports({ status, reason }, page), [status, reason]);
  const list = usePaginated(fetchPage, "No se pudieron cargar los reportes.");

  useFocusEffect(useCallback(() => { void list.reload(); }, [list.reload]));

  const query = search.trim().toLowerCase();
  const visible = list.items.filter((item) =>
    !query ||
    item.reporter?.name.toLowerCase().includes(query) ||
    item.reported.name.toLowerCase().includes(query) ||
    item.reported.email.toLowerCase().includes(query) ||
    String(item.id).includes(query),
  );

  async function openReport(item: AdminReport) {
    setSelected(item);
    setLoadingDetail(true);
    try {
      setSelected(await getAdminReport(item.id));
    } catch (error) {
      setSelected(null);
      showToast({ title: "No se pudo abrir el reporte", message: error instanceof ApiError ? error.message : "Intenta de nuevo.", tone: "danger" });
    } finally {
      setLoadingDetail(false);
    }
  }

  async function submitReview(reasonText: string) {
    if (!selected) return;
    setReviewing(true);
    try {
      const updated = await reviewAdminReport(selected.id, {
        status: decision,
        reason: reasonText,
        ...(decision === "reviewed" && suspend ? { suspend: true } : {}),
      });
      list.setItems((items) => status === "all"
        ? items.map((item) => item.id === updated.id ? updated : item)
        : items.filter((item) => item.id !== updated.id));
      setSelected(updated);
      setReviewing(false);
      showToast({
        title: decision === "reviewed" ? "Reporte resuelto" : "Reporte descartado",
        message: decision === "reviewed" && suspend ? "La cuenta reportada también fue suspendida." : "La decisión quedó registrada.",
      });
      void list.reload();
    } catch (error) {
      throw error;
    } finally {
      setReviewing(false);
    }
  }

  const columns: Column<AdminReport>[] = [
    {
      key: "report", title: "Reporte", flex: 2, role: "primary",
      render: (item) => <View style={styles.cell}>
        <ThemedText type="smallBold">Reporte #{item.id} · {reasonLabels[item.reason]}</ThemedText>
        <ThemedText type="caption" themeColor="textSecondary" numberOfLines={2}>{item.description || "Sin descripción."}</ThemedText>
      </View>,
    },
    { key: "reporter", title: "Reportó", render: (item) => <ThemedText type="small">{item.reporter?.name ?? "Cuenta eliminada"}</ThemedText> },
    { key: "reported", title: "Reportado", flex: 1.4, render: (item) => <View><ThemedText type="small">{item.reported.name}</ThemedText><ThemedText type="caption" themeColor="textSecondary">{item.reported.email}</ThemedText></View> },
    { key: "date", title: "Fecha", render: (item) => <ThemedText type="small">{formatShortDate(item.created_at)}</ThemedText> },
    { key: "status", title: "Estado", render: (item) => <Badge label={item.status === "pending" ? "Pendiente" : item.status === "reviewed" ? "Resuelto" : "Descartado"} tone={item.status === "pending" ? "danger" : item.status === "reviewed" ? "success" : "neutral"} dot /> },
    { key: "actions", title: "", width: 110, align: "right", role: "actions", render: (item) => <Button title="Revisar" size="small" variant="secondary" onPress={() => void openReport(item)} /> },
  ];

  return (
    <AdminPage
      breadcrumb={["Moderación", "Reportes"]}
      title="Reportes"
      description={user?.role === "admin" ? "Revisa los reportes de todas las universidades." : "Revisa los reportes de usuarios de tu universidad."}
    >
      <SegmentedControl options={statuses as any} value={status} onChange={setStatus} accessibilityLabel="Estado de reportes" />
      <View style={styles.filters}>
        <SearchField value={search} onChangeText={setSearch} placeholder="Buscar por persona o folio" style={styles.search} />
        <ChoiceField label="Motivo" options={reasons as any} value={reason} onChange={setReason} />
      </View>
      <TableToolbar title="Reportes" count={list.total} />
      <DataTable
        columns={columns}
        items={visible}
        keyExtractor={(item) => item.id}
        status={list.status}
        error={list.error}
        onRetry={list.reload}
        empty={{ icon: { ios: "flag", android: "flag", web: "flag" }, title: "Sin reportes", message: "No hay reportes que coincidan con los filtros seleccionados." }}
        footer={<Pagination page={list.page} lastPage={list.lastPage} onChange={list.setPage} />}
      />

      <Dialog
        visible={!!selected}
        title={selected ? `Reporte #${selected.id}` : "Detalle del reporte"}
        description={loadingDetail ? "Cargando…" : selected ? `${reasonLabels[selected.reason]} · ${formatShortDate(selected.created_at)}` : undefined}
        onClose={() => setSelected(null)}
        maxWidth={680}
        footer={selected?.status === "pending" ? <>
          <Button title="Descartar" size="small" variant="secondary" onPress={() => { setDecision("dismissed"); setSuspend(false); setReviewing(true); }} />
          <Button title="Resolver" size="small" onPress={() => { setDecision("reviewed"); setReviewing(true); }} />
        </> : <Button title="Cerrar" size="small" variant="ghost" onPress={() => setSelected(null)} />}
      >
        {selected && !loadingDetail && <>
          <View style={styles.detailBlock}>
            <ThemedText type="smallBold">Descripción</ThemedText>
            <ThemedText type="small">{selected.description || "El usuario no agregó una descripción."}</ThemedText>
          </View>
          <View style={styles.detailBlock}>
            <ThemedText type="smallBold">Persona que reportó</ThemedText>
            <ThemedText type="small">{selected.reporter?.name ?? "Cuenta eliminada"}</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">{selected.reporter?.email ?? ""}</ThemedText>
          </View>
          <View style={styles.detailBlock}>
            <ThemedText type="smallBold">Persona reportada</ThemedText>
            <ThemedText type="small">{selected.reported.name} · {selected.reported.email}</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              {selected.reported.reports_count} reportes recibidos · {selected.reported.suspended ? "Cuenta suspendida" : "Cuenta activa"}
            </ThemedText>
          </View>
          <View style={styles.detailBlock}>
            <ThemedText type="smallBold">Revisión</ThemedText>
            <ThemedText type="small">{selected.reviewed_by ? `${selected.reviewed_by.name} · ${formatShortDate(selected.reviewed_at)}` : "Todavía no revisado"}</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">Universidad: {selected.university?.name ?? "No especificada"}</ThemedText>
            {selected.match_id !== null && <ThemedText type="caption" themeColor="textSecondary">Match relacionado: #{selected.match_id}</ThemedText>}
          </View>
          <ThemedText type="caption" themeColor="textSecondary">
            La API no proporciona una ruta de evidencia o transcripción del chat para este reporte.
          </ThemedText>
        </>}
      </Dialog>

      <ReasonDialog
        visible={reviewing}
        title={decision === "reviewed" ? "Resolver reporte" : "Descartar reporte"}
        description={decision === "reviewed" ? "La decisión quedará registrada en el historial de moderación." : "El reporte se marcará como descartado."}
        label="Motivo de la decisión"
        placeholder="Explica brevemente la decisión."
        confirmTitle={decision === "reviewed" ? "Confirmar resolución" : "Confirmar descarte"}
        maxLength={MaxReasonLength}
        onConfirm={submitReview}
        onClose={() => setReviewing(false)}
      />
    </AdminPage>
  );
}

const styles = StyleSheet.create({
  filters: { gap: Spacing.three },
  search: { minWidth: 260 },
  cell: { gap: Spacing.half },
  detailBlock: { gap: Spacing.half },
});
