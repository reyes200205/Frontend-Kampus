import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AdminPage } from "@/components/management/admin-page";
import { DataTable, TableToolbar, type Column } from "@/components/management/data-table";
import { OfficialGroupDialog } from "@/components/management/official-group-dialog";
import { ReasonDialog } from "@/components/management/reason-dialog";
import { ThemedText } from "@/components/themed-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { SearchField } from "@/components/ui/search-field";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { showToast } from "@/components/ui/toast";
import {
  formatShortDate,
  GroupCategoryLabels,
  GroupFilterOptions,
  MaxRejectReasonLength,
} from "@/constants/management";
import { Spacing } from "@/constants/theme";
import { usePaginated } from "@/hooks/use-paginated";
import {
  decrementPendingGroups,
  refreshPendingGroups,
  usePendingGroupsCount,
} from "@/hooks/use-pending-groups";
import { useSession } from "@/hooks/use-session";
import { approveGroup, getAdminGroups, rejectGroup } from "@/services/admin";
import { ApiError } from "@/services/api";
import type { AdminGroup, GroupFilter } from "@/types/admin";
import { isAdmin } from "@/utils/roles";

const ToolbarTitles: Record<GroupFilter, string> = {
  all: "Todos los grupos",
  pending: "Por revisar",
  approved: "Aprobados",
  rejected: "Rechazados",
};

const EmptyMessages: Record<GroupFilter, { title: string; message: string }> = {
  all: {
    title: "Todavía no hay grupos",
    message: "Aquí verás los grupos que crean los estudiantes y los oficiales del staff.",
  },
  pending: {
    title: "No hay grupos por revisar",
    message: "Cuando un estudiante cree un grupo, aparecerá aquí para que lo apruebes o rechaces.",
  },
  approved: { title: "Sin grupos aprobados", message: "Aquí verás el historial de grupos aprobados." },
  rejected: { title: "Sin grupos rechazados", message: "Aquí verás el historial de grupos rechazados." },
};

/**
 * Revisión de grupos (T-42, RF-23): todos los grupos (filtro por defecto), la cola de los que crean
 * los estudiantes y el historial.
 * Un moderador solo ve los de su universidad; un administrador, todos.
 */
export default function GroupReviewScreen() {
  const { user } = useSession();
  const admin = isAdmin(user);
  const pendingCount = usePendingGroupsCount();
  const [status, setStatus] = useState<GroupFilter>("all");
  const fetchPage = useCallback((page: number) => getAdminGroups(status, page), [status]);
  const list = usePaginated(fetchPage, "No se pudieron cargar los grupos.");
  const { reload, setItems } = list;
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [rejecting, setRejecting] = useState<AdminGroup | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  // La API no busca todavía: se filtra la página cargada.
  const query = search.trim().toLowerCase();
  const visible = list.items.filter(
    (group) =>
      !query ||
      group.name.toLowerCase().includes(query) ||
      group.creator?.name.toLowerCase().includes(query),
  );

  /** Un grupo revisado sale de la cola; en "Todos" se queda con su nuevo estado. */
  function removeReviewed(group: AdminGroup) {
    setItems((items) =>
      status === "all"
        ? items.map((item) => (item.id === group.id ? group : item))
        : items.filter((item) => item.id !== group.id),
    );
    decrementPendingGroups();
    void refreshPendingGroups();
  }

  async function approve(group: AdminGroup) {
    setApprovingId(group.id);
    try {
      removeReviewed(await approveGroup(group.id));
      showToast({ title: "Grupo aprobado", message: `“${group.name}” ya es visible para los estudiantes.` });
    } catch (e) {
      showToast({
        title: "No se pudo aprobar",
        message: e instanceof ApiError ? e.message : "Intenta de nuevo.",
        tone: "danger",
      });
    } finally {
      setApprovingId(null);
    }
  }

  async function reject(group: AdminGroup, reason: string) {
    removeReviewed(await rejectGroup(group.id, reason));
    setRejecting(null);
    showToast({ title: "Grupo rechazado", message: "Le avisamos por correo a quien lo creó, con el motivo." });
  }

  const columns: Column<AdminGroup>[] = [
    {
      key: "group",
      title: "Grupo",
      flex: 2.6,
      role: "primary",
      render: (group) => (
        <View style={styles.groupCell}>
          <View style={styles.groupTitle}>
            <ThemedText type="smallBold" numberOfLines={1} style={styles.shrink}>
              {group.name}
            </ThemedText>
            {group.is_official && <Badge label="Oficial" tone="accent" />}
          </View>
          <ThemedText type="caption" themeColor="textSecondary" numberOfLines={2}>
            {group.description || "Sin descripción."}
          </ThemedText>
          {group.rejection_reason && (
            <ThemedText type="caption" themeColor="danger" numberOfLines={2}>
              Motivo: {group.rejection_reason}
            </ThemedText>
          )}
        </View>
      ),
    },
    {
      key: "category",
      title: "Categoría",
      render: (group) => <Badge label={GroupCategoryLabels[group.category] ?? group.category} />,
    },
    {
      key: "university",
      title: "Universidad",
      flex: 0.9,
      render: (group) => (
        <ThemedText type="small" themeColor={group.university ? "text" : "textSecondary"}>
          {group.university?.short_name ?? "Todas"}
        </ThemedText>
      ),
    },
    {
      key: "creator",
      title: "Creado por",
      flex: 1.3,
      render: (group) => (
        <View>
          <ThemedText type="small" numberOfLines={1}>
            {group.creator?.name ?? "Staff"}
          </ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            {group.members_count} {group.members_count === 1 ? "miembro" : "miembros"}
          </ThemedText>
        </View>
      ),
    },
    {
      key: "date",
      title: status === "all" ? "Creado" : status === "pending" ? "Enviado" : "Revisado",
      render: (group) => (
        <View>
          <ThemedText type="small" themeColor="textSecondary">
            {formatShortDate(status === "all" || status === "pending" ? group.created_at : group.reviewed_at)}
          </ThemedText>
          {(status === "approved" || status === "rejected") && group.reviewed_by && (
            <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
              por {group.reviewed_by.name}
            </ThemedText>
          )}
        </View>
      ),
    },
    {
      key: "actions",
      // En "Todos" pueden venir grupos en revisión, con sus botones.
      title: status === "pending" ? "" : "Estado",
      width: status === "approved" || status === "rejected" ? 130 : 220,
      align: "right",
      role: "actions",
      render: (group) =>
        group.status === "pending" ? (
          <View style={styles.actions}>
            <Button
              title="Rechazar"
              variant="secondary"
              size="small"
              onPress={() => setRejecting(group)}
              disabled={approvingId === group.id}
            />
            <Button
              title="Aprobar"
              size="small"
              onPress={() => approve(group)}
              loading={approvingId === group.id}
            />
          </View>
        ) : group.status === "approved" ? (
          <Badge label="Aprobado" tone="success" dot />
        ) : (
          <Badge label="Rechazado" tone="danger" dot />
        ),
    },
  ];

  return (
    <AdminPage
      breadcrumb={["Moderación", "Grupos"]}
      title="Grupos"
      description={
        admin
          ? "Revisa los grupos que crean los estudiantes de todas las universidades."
          : "Revisa los grupos que crean los estudiantes de tu universidad."
      }
      actions={
        <Button
          title="Grupo oficial"
          size="small"
          icon={{ ios: "plus", android: "add", web: "add" }}
          onPress={() => setCreating(true)}
        />
      }
    >
      <SegmentedControl
        options={GroupFilterOptions.map((option) =>
          option.value === "pending" ? { ...option, count: pendingCount } : option,
        )}
        value={status}
        onChange={(value) => {
          setSearch("");
          setStatus(value);
        }}
        accessibilityLabel="Estado de los grupos"
      />

      <TableToolbar title={ToolbarTitles[status]} count={list.total}>
        <SearchField
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por grupo o creador"
          style={styles.search}
        />
      </TableToolbar>

      <DataTable
        columns={columns}
        items={visible}
        keyExtractor={(group) => group.id}
        status={list.status}
        error={list.error}
        onRetry={reload}
        empty={
          list.items.length > 0
            ? {
                icon: { ios: "magnifyingglass", android: "search", web: "search" },
                title: "Sin resultados",
                message: "Ningún grupo de esta página coincide con la búsqueda.",
              }
            : { icon: { ios: "checkmark.shield", android: "fact_check", web: "fact_check" }, ...EmptyMessages[status] }
        }
        footer={<Pagination page={list.page} lastPage={list.lastPage} onChange={list.setPage} />}
      />

      <OfficialGroupDialog
        visible={creating}
        canChooseUniversity={admin}
        onClose={() => setCreating(false)}
        onCreated={(group) => {
          setCreating(false);
          if (status === "approved") void reload();
          showToast({ title: "Grupo oficial creado", message: `“${group.name}” ya está publicado.` });
        }}
      />

      <ReasonDialog
        visible={rejecting !== null}
        title={`Rechazar “${rejecting?.name ?? ""}”`}
        description="Quien lo creó recibirá un correo con el motivo."
        label="Motivo del rechazo"
        placeholder="Explica qué tiene que cambiar el grupo."
        confirmTitle="Rechazar grupo"
        maxLength={MaxRejectReasonLength}
        onConfirm={(reason) => (rejecting ? reject(rejecting, reason) : Promise.resolve())}
        onClose={() => setRejecting(null)}
      />
    </AdminPage>
  );
}

const styles = StyleSheet.create({
  search: {
    minWidth: 280,
  },
  groupCell: {
    gap: Spacing.half,
  },
  groupTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  shrink: {
    flexShrink: 1,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.two,
  },
});
