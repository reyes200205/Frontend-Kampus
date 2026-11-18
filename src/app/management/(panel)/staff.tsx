import { Redirect, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AdminPage } from "@/components/management/admin-page";
import { DataTable, TableToolbar, type Column } from "@/components/management/data-table";
import { PersonCell } from "@/components/management/person-cell";
import { ReasonDialog } from "@/components/management/reason-dialog";
import { StaffCreateDialog } from "@/components/management/staff-create-dialog";
import { ThemedText } from "@/components/themed-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { SearchField } from "@/components/ui/search-field";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { showToast } from "@/components/ui/toast";
import { formatShortDate, MaxReasonLength } from "@/constants/management";
import { usePaginated } from "@/hooks/use-paginated";
import { useSession } from "@/hooks/use-session";
import { getStaff, setStaffActive } from "@/services/admin";
import type { StaffMember, StaffRole } from "@/types/admin";
import { isAdmin, RoleLabels } from "@/utils/roles";

type RoleFilter = "all" | StaffRole;

const RoleFilters: { value: RoleFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "moderator", label: "Moderadores" },
  { value: "admin", label: "Administradores" },
];

/** Cuentas de staff (T-41, RF-22): solo administradores. */
export default function StaffScreen() {
  const { user } = useSession();
  const admin = isAdmin(user);
  const list = usePaginated(getStaff, "No se pudo cargar el staff.");
  const { reload, setItems } = list;
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<RoleFilter>("all");
  const [creating, setCreating] = useState(false);
  const [toggling, setToggling] = useState<StaffMember | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (admin) void reload();
    }, [admin, reload]),
  );

  // Un moderador no tiene esta sección (en iOS y Android la pestaña ni siquiera existe).
  if (!admin) return <Redirect href="/management" />;

  // La API no busca ni filtra por rol todavía: se filtra la página cargada.
  const query = search.trim().toLowerCase();
  const visible = list.items.filter(
    (member) =>
      (role === "all" || member.role === role) &&
      (!query || member.name.toLowerCase().includes(query) || member.email.toLowerCase().includes(query)),
  );

  async function toggle(member: StaffMember, reason: string) {
    const updated = await setStaffActive(member.id, !member.active, reason);
    setItems((items) => items.map((item) => (item.id === updated.id ? updated : item)));
    setToggling(null);
    showToast({
      title: updated.active ? "Cuenta reactivada" : "Cuenta desactivada",
      message: updated.active
        ? `${updated.name} ya puede iniciar sesión.`
        : `Se cerraron las sesiones de ${updated.name}.`,
    });
  }

  const columns: Column<StaffMember>[] = [
    {
      key: "person",
      title: "Persona",
      flex: 2.4,
      role: "primary",
      render: (member) => (
        <PersonCell
          name={member.name}
          email={member.email}
          suffix={member.id === user?.id ? "(tú)" : undefined}
          muted={!member.active}
        />
      ),
    },
    {
      key: "role",
      title: "Rol",
      flex: 1.2,
      render: (member) => (
        <Badge label={RoleLabels[member.role]} tone={member.role === "admin" ? "accent" : "neutral"} />
      ),
    },
    {
      key: "university",
      title: "Universidad",
      render: (member) => (
        <ThemedText type="small" themeColor={member.university ? "text" : "textSecondary"}>
          {member.university?.short_name ?? "Todas"}
        </ThemedText>
      ),
    },
    {
      key: "status",
      title: "Estado",
      render: (member) =>
        member.active ? (
          <Badge label="Activa" tone="success" dot />
        ) : (
          <Badge label="Desactivada" tone="danger" dot />
        ),
    },
    {
      key: "date",
      title: "Fecha",
      render: (member) => (
        <ThemedText type="small" themeColor="textSecondary">
          {member.active
            ? `Alta ${formatShortDate(member.created_at)}`
            : `Baja ${formatShortDate(member.deactivated_at)}`}
        </ThemedText>
      ),
    },
    {
      key: "actions",
      title: "",
      width: 130,
      align: "right",
      role: "actions",
      // La propia cuenta no se puede desactivar (el backend responde `422`).
      render: (member) =>
        member.id === user?.id ? null : (
          <Button
            title={member.active ? "Desactivar" : "Reactivar"}
            variant="secondary"
            size="small"
            onPress={() => setToggling(member)}
          />
        ),
    },
  ];

  return (
    <AdminPage
      breadcrumb={["Administración", "Staff"]}
      title="Staff"
      description="Moderadores y administradores. Las cuentas se desactivan, no se borran, para conservar la bitácora."
      actions={
        <Button
          title="Dar de alta"
          size="small"
          icon={{ ios: "person.badge.plus", android: "person_add", web: "person_add" }}
          onPress={() => setCreating(true)}
        />
      }
    >
      <TableToolbar title="Todo el staff" count={list.total}>
        <SearchField
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nombre o correo"
          style={styles.search}
        />
      </TableToolbar>

      <View style={styles.filters}>
        <SegmentedControl options={RoleFilters} value={role} onChange={setRole} accessibilityLabel="Filtrar por rol" />
      </View>

      <DataTable
        columns={columns}
        items={visible}
        keyExtractor={(member) => member.id}
        status={list.status}
        error={list.error}
        onRetry={reload}
        empty={
          list.items.length > 0
            ? {
                icon: { ios: "magnifyingglass", android: "search", web: "search" },
                title: "Sin resultados",
                message: "Nadie de esta página coincide con la búsqueda o el filtro.",
              }
            : {
                icon: { ios: "person.badge.key", android: "admin_panel_settings", web: "admin_panel_settings" },
                title: "Sin cuentas de staff",
                message: "Da de alta a los moderadores de cada universidad.",
                action: { title: "Dar de alta", onPress: () => setCreating(true) },
              }
        }
        footer={<Pagination page={list.page} lastPage={list.lastPage} onChange={list.setPage} />}
      />

      <StaffCreateDialog
        visible={creating}
        onClose={() => setCreating(false)}
        onCreated={(member) => {
          setCreating(false);
          void reload();
          showToast({ title: "Cuenta creada", message: `${member.name} ya puede iniciar sesión como ${RoleLabels[member.role].toLowerCase()}.` });
        }}
      />

      <ReasonDialog
        visible={toggling !== null}
        title={toggling?.active ? `Desactivar a ${toggling.name}` : `Reactivar a ${toggling?.name ?? ""}`}
        description={
          toggling?.active
            ? "Se cerrarán todas sus sesiones y no podrá entrar hasta que la reactives."
            : "Podrá volver a iniciar sesión con su contraseña."
        }
        label="Motivo"
        placeholder={toggling?.active ? "Por ejemplo: terminó su servicio social." : undefined}
        confirmTitle={toggling?.active ? "Desactivar cuenta" : "Reactivar cuenta"}
        maxLength={MaxReasonLength}
        onConfirm={(reason) => (toggling ? toggle(toggling, reason) : Promise.resolve())}
        onClose={() => setToggling(null)}
      />
    </AdminPage>
  );
}

const styles = StyleSheet.create({
  search: {
    minWidth: 280,
  },
  filters: {
    flexDirection: "row",
  },
});
