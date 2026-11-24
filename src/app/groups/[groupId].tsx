import { Image } from "expo-image";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { ActivityFormDialog } from "@/components/groups/activity-form-dialog";
import { ActivityPost, InitialAvatar } from "@/components/groups/activity-post";
import { membersLabel } from "@/components/groups/members-label";
import { ThemedText } from "@/components/themed-text";
import { ActionSheet, ActionSheetItem } from "@/components/ui/action-sheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { showToast } from "@/components/ui/toast";
import { GroupCategoryLabels } from "@/constants/management";
import { MaxContentWidth, MinTouchSize, Radius, Spacing } from "@/constants/theme";
import { useSession } from "@/hooks/use-session";
import { useTheme } from "@/hooks/use-theme";
import { ApiError } from "@/services/api";
import {
  deleteGroup,
  deleteGroupActivity,
  getGroup,
  joinGroup,
  leaveGroup,
  listGroupActivities,
  listGroupMembers,
} from "@/services/groups";
import type { Group, GroupActivity, GroupMember } from "@/types/groups";

type Tab = "activities" | "members" | "info";
type When = "upcoming" | "past";

/** Qué confirmación está abierta. */
type Confirm = { kind: "leave" } | { kind: "delete" } | { kind: "deleteActivity"; activity: GroupActivity } | null;

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Detalle de un grupo con la idea de un grupo de Facebook (T-18, RF-11 y RF-12): portada a lo ancho con
 * regresar y "⋯" encima, nombre e integrantes, pestañas Actividades / Integrantes / Información, y las
 * actividades como publicaciones. Los administradores publican desde "Publica una actividad…" y editan o
 * borran el grupo desde "⋯". Un grupo propio en revisión o rechazado muestra su estado (RF-23).
 */
export default function GroupDetailScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useSession();
  const params = useLocalSearchParams<{ groupId: string }>();
  const groupId = Number(params.groupId);

  const [group, setGroup] = useState<Group | null>(null);
  const [loadError, setLoadError] = useState<{ notFound: boolean; message: string } | null>(null);
  const [tab, setTab] = useState<Tab>("activities");
  const [when, setWhen] = useState<When>("upcoming");
  const [activities, setActivities] = useState<GroupActivity[] | null>(null);
  const [members, setMembers] = useState<GroupMember[] | null>(null);
  const [joining, setJoining] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activityMenu, setActivityMenu] = useState<GroupActivity | null>(null);
  const [activityForm, setActivityForm] = useState<{ activity?: GroupActivity } | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);

  const isMember = group?.my_role != null;
  const isAdmin = group?.my_role === "admin";
  const approved = group?.status === "approved";

  const loadGroup = useCallback(
    () =>
      getGroup(groupId)
        .then((next) => {
          setGroup(next);
          setLoadError(null);
        })
        .catch((e: unknown) => {
          setLoadError({
            notFound: e instanceof ApiError && e.status === 404,
            message: e instanceof ApiError ? e.message : "No pudimos cargar el grupo.",
          });
        }),
    [groupId],
  );

  const loadActivities = useCallback(
    () =>
      listGroupActivities(groupId, { past: when === "past" })
        .then((res) => setActivities(res.data))
        .catch(() => setActivities([])),
    [groupId, when],
  );

  // Al abrirlo y al volver de "Editar grupo", para mostrar los cambios.
  useFocusEffect(
    useCallback(() => {
      void loadGroup();
    }, [loadGroup]),
  );

  // Las actividades solo existen en un grupo aprobado.
  useEffect(() => {
    if (approved) void loadActivities();
  }, [approved, loadActivities]);

  // La lista de integrantes solo la ven los integrantes; se vuelve a pedir al unirse o salir.
  useEffect(() => {
    if (!isMember) return;
    listGroupMembers(groupId)
      .then((res) => setMembers(res.data))
      .catch(() => setMembers([]));
  }, [groupId, isMember, group?.members_count]);

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/groups");
  }

  async function handleJoin() {
    setJoining(true);
    try {
      setGroup(await joinGroup(groupId));
      showToast({ title: "Te uniste al grupo", tone: "success" });
    } catch (e) {
      showToast({
        title: "No pudimos unirte al grupo",
        message: e instanceof ApiError ? e.message : undefined,
        tone: "danger",
      });
    } finally {
      setJoining(false);
    }
  }

  async function handleConfirm() {
    if (!confirm || !group) return;
    if (confirm.kind === "leave") {
      await leaveGroup(groupId);
      setConfirm(null);
      setMembers(null);
      setTab("activities");
      showToast({ title: `Saliste de ${group.name}` });
      // Un grupo en revisión deja de verse al salir; uno aprobado se queda abierto para volver a unirse.
      if (approved) await loadGroup();
      else goBack();
    } else if (confirm.kind === "delete") {
      await deleteGroup(groupId);
      setConfirm(null);
      showToast({ title: "Grupo borrado" });
      goBack();
    } else {
      await deleteGroupActivity(groupId, confirm.activity.id);
      setConfirm(null);
      setActivities((current) => current?.filter((item) => item.id !== confirm.activity.id) ?? null);
    }
  }

  const confirmCopy = {
    leave: {
      title: "¿Abandonar el grupo?",
      description: isAdmin
        ? "Si eres el único administrador, el integrante más antiguo tomará tu lugar."
        : "Puedes volver a unirte cuando quieras.",
      confirm: "Abandonar",
    },
    delete: {
      title: "¿Borrar el grupo?",
      description: "Se borran sus integrantes, sus actividades y su portada. No se puede deshacer.",
      confirm: "Borrar grupo",
    },
    deleteActivity: {
      title: "¿Borrar la actividad?",
      description: "Dejará de verse en el grupo. No se puede deshacer.",
      confirm: "Borrar",
    },
  }[confirm?.kind ?? "leave"];

  function renderActivities() {
    if (!group) return null;
    if (!approved) {
      return (
        <ThemedText type="small" themeColor="textSecondary">
          Las actividades se publican cuando el grupo está aprobado.
        </ThemedText>
      );
    }

    return (
      <>
        {isAdmin && (
          // Como el "Escribe algo…" de Facebook: abre el formulario de una actividad nueva.
          <Pressable
            onPress={() => setActivityForm({})}
            accessibilityRole="button"
            accessibilityLabel="Publicar una actividad"
            style={styles.composer}
          >
            <InitialAvatar name={user?.name ?? "?"} />
            <View style={[styles.composerInput, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <ThemedText themeColor="placeholder" numberOfLines={1} style={styles.flex}>
                Publica una actividad…
              </ThemedText>
              <SymbolView name={{ ios: "calendar.badge.plus", android: "event", web: "event" }} size={20} tintColor={theme.textSecondary} />
            </View>
          </Pressable>
        )}

        <View style={styles.sectionHeader}>
          <ThemedText type="heading" style={styles.flex}>
            {when === "upcoming" ? "Próximas actividades" : "Actividades pasadas"}
          </ThemedText>
          <Chip
            label={when === "upcoming" ? "Ver pasadas" : "Ver próximas"}
            onPress={() => {
              setActivities(null);
              setWhen(when === "upcoming" ? "past" : "upcoming");
            }}
          />
        </View>

        {activities === null ? (
          <ActivityIndicator color={theme.accent} />
        ) : activities.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            {when === "upcoming"
              ? isAdmin
                ? "No hay actividades próximas. Publica la primera."
                : "Todavía no hay actividades próximas."
              : "Todavía no hay actividades pasadas."}
          </ThemedText>
        ) : (
          activities.map((activity) => (
            <ActivityPost
              key={activity.id}
              group={group}
              activity={activity}
              variant="group"
              onMenu={isAdmin ? () => setActivityMenu(activity) : undefined}
            />
          ))
        )}
      </>
    );
  }

  function renderMembers() {
    if (!group) return null;
    if (members === null) return <ActivityIndicator color={theme.accent} />;
    return (
      <>
        <ThemedText type="heading">{membersLabel(group.members_count)}</ThemedText>
        {members.map((member) => (
          <View key={member.id} style={styles.member}>
            <InitialAvatar name={member.name} size={44} />
            <View style={styles.flex}>
              <ThemedText type="smallBold" numberOfLines={1}>
                {member.name}
              </ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                {member.role === "admin" ? "Administrador" : "Integrante"}
                {member.joined_at ? ` · Desde el ${formatDay(member.joined_at)}` : ""}
              </ThemedText>
            </View>
          </View>
        ))}
        {group.members_count > members.length && (
          <ThemedText type="caption" themeColor="textSecondary">
            y {group.members_count - members.length} más
          </ThemedText>
        )}
      </>
    );
  }

  function renderInfo() {
    if (!group) return null;
    return (
      <Card style={styles.info}>
        <ThemedText type="heading">Información</ThemedText>
        {group.description && <ThemedText>{group.description}</ThemedText>}
        <InfoRow
          icon={group.is_official ? { ios: "checkmark.seal", android: "verified", web: "verified" } : { ios: "person.3", android: "groups", web: "groups" }}
          text={group.is_official ? "Grupo oficial de la institución" : "Grupo creado por estudiantes"}
        />
        <InfoRow icon={{ ios: "tag", android: "sell", web: "sell" }} text={GroupCategoryLabels[group.category]} />
        <InfoRow
          icon={{ ios: "building.columns", android: "school", web: "school" }}
          text={group.university?.name ?? "Interinstitucional: abierto a todas las universidades"}
        />
        <InfoRow icon={{ ios: "person.2", android: "group", web: "group" }} text={membersLabel(group.members_count)} />
        <InfoRow icon={{ ios: "clock", android: "schedule", web: "schedule" }} text={`Creado el ${formatDay(group.created_at)}`} />
      </Card>
    );
  }

  function renderBody() {
    if (loadError) {
      return (
        <View style={[styles.padded, { paddingTop: insets.top + Spacing.six }]}>
          {loadError.notFound ? (
            <EmptyState
              icon={{ ios: "person.3", android: "groups", web: "groups" }}
              title="Este grupo no está disponible"
              message="Puede que lo hayan borrado o que todavía esté en revisión."
              action={{ title: "Ver grupos", onPress: () => router.replace("/groups") }}
            />
          ) : (
            <EmptyState
              icon={{ ios: "wifi.exclamationmark", android: "wifi_off", web: "wifi_off" }}
              title="No pudimos cargar el grupo"
              message={loadError.message}
              action={{ title: "Reintentar", onPress: () => void loadGroup() }}
            />
          )}
        </View>
      );
    }

    if (!group) {
      return (
        <View style={[styles.center, { paddingTop: insets.top + Spacing.six }]}>
          <ActivityIndicator color={theme.accent} size="large" />
        </View>
      );
    }

    const tabs: { value: Tab; label: string }[] = [
      { value: "activities", label: "Actividades" },
      ...(isMember ? [{ value: "members" as const, label: "Integrantes" }] : []),
      { value: "info", label: "Información" },
    ];

    return (
      <>
        {/* Portada a lo ancho, como la de un grupo de Facebook. */}
        <View style={[styles.cover, { backgroundColor: theme.backgroundSelected }]}>
          {group.image_url ? (
            <Image
              source={{ uri: group.image_url }}
              recyclingKey={`group-cover-${group.id}`}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={150}
              accessibilityIgnoresInvertColors
            />
          ) : (
            <SymbolView name={{ ios: "person.3.fill", android: "groups", web: "groups" }} size={72} tintColor={theme.textSecondary} />
          )}
        </View>

        <View style={styles.padded}>
          <Pressable onPress={() => setTab("info")} accessibilityRole="button" style={styles.nameRow}>
            <ThemedText type="title" style={styles.shrink}>
              {group.name}
            </ThemedText>
            <SymbolView name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }} size={20} tintColor={theme.textSecondary} />
          </Pressable>

          <View style={styles.meta}>
            <SymbolView
              name={group.is_official ? { ios: "checkmark.seal.fill", android: "verified", web: "verified" } : { ios: "person.3", android: "groups", web: "groups" }}
              size={16}
              tintColor={group.is_official ? theme.success : theme.textSecondary}
            />
            <ThemedText type="small" themeColor="textSecondary" style={styles.shrink}>
              {group.is_official ? "Oficial" : GroupCategoryLabels[group.category]}
              {" · "}
              <ThemedText type="smallBold">{membersLabel(group.members_count)}</ThemedText>
              {` · ${group.university?.short_name ?? "Interinstitucional"}`}
            </ThemedText>
          </View>

          {!isMember && approved && (
            <Button
              title="Unirme al grupo"
              icon={{ ios: "person.badge.plus", android: "group_add", web: "group_add" }}
              onPress={handleJoin}
              loading={joining}
            />
          )}

          {group.status === "pending" && (
            <Card>
              <ThemedText type="smallBold">En revisión</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Un moderador de tu universidad revisará el grupo. Cuando lo apruebe, aparecerá en Descubrir y podrás
                publicar actividades.
              </ThemedText>
            </Card>
          )}
          {group.status === "rejected" && (
            <Card>
              <ThemedText type="smallBold" themeColor="danger">
                El grupo fue rechazado
              </ThemedText>
              {group.rejection_reason && <ThemedText type="small">Motivo: {group.rejection_reason}</ThemedText>}
              <ThemedText type="small" themeColor="textSecondary">
                Solo lo ven sus integrantes. Puedes borrarlo desde “⋯” y crear uno nuevo con los cambios.
              </ThemedText>
            </Card>
          )}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll} contentContainerStyle={styles.pills}>
            {tabs.map((item) => (
              <Chip key={item.value} label={item.label} selected={tab === item.value} onPress={() => setTab(item.value)} />
            ))}
          </ScrollView>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.backgroundElement }]} />

        <View style={styles.padded}>
          {tab === "activities" ? renderActivities() : tab === "members" ? renderMembers() : renderInfo()}
        </View>
      </>
    );
  }

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.inner}>{renderBody()}</View>
      </ScrollView>

      {/* Regresar y "⋯" flotan sobre la portada, como en Facebook. */}
      <View style={[styles.overlay, { paddingTop: insets.top + Spacing.two }]} pointerEvents="box-none">
        <View style={styles.overlayInner} pointerEvents="box-none">
          <OverlayButton
            icon={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }}
            label="Regresar"
            onPress={goBack}
          />
          {group && (
            <OverlayButton
              icon={{ ios: "ellipsis", android: "more_horiz", web: "more_horiz" }}
              label="Opciones del grupo"
              onPress={() => setMenuOpen(true)}
            />
          )}
        </View>
      </View>

      <ActionSheet visible={menuOpen} onClose={() => setMenuOpen(false)}>
        <ActionSheetItem
          icon={{ ios: "info.circle", android: "info", web: "info" }}
          title="Información del grupo"
          onPress={() => {
            setMenuOpen(false);
            setTab("info");
          }}
        />
        {isAdmin && (
          <ActionSheetItem
            icon={{ ios: "gearshape", android: "settings", web: "settings" }}
            title="Editar grupo"
            description="Nombre, categoría, descripción y portada."
            onPress={() => {
              setMenuOpen(false);
              router.push({ pathname: "/groups/form", params: { groupId: String(groupId) } });
            }}
          />
        )}
        {isMember && (
          <ActionSheetItem
            icon={{ ios: "rectangle.portrait.and.arrow.right", android: "logout", web: "logout" }}
            title="Abandonar grupo"
            onPress={() => {
              setMenuOpen(false);
              setConfirm({ kind: "leave" });
            }}
          />
        )}
        {isAdmin && (
          <ActionSheetItem
            icon={{ ios: "trash", android: "delete", web: "delete" }}
            title="Borrar grupo"
            description="Se borran sus integrantes y actividades."
            onPress={() => {
              setMenuOpen(false);
              setConfirm({ kind: "delete" });
            }}
          />
        )}
      </ActionSheet>

      <ActionSheet visible={activityMenu !== null} onClose={() => setActivityMenu(null)}>
        {when === "upcoming" && (
          <ActionSheetItem
            icon={{ ios: "pencil", android: "edit", web: "edit" }}
            title="Editar actividad"
            onPress={() => {
              const activity = activityMenu ?? undefined;
              setActivityMenu(null);
              setActivityForm({ activity });
            }}
          />
        )}
        <ActionSheetItem
          icon={{ ios: "trash", android: "delete", web: "delete" }}
          title="Borrar actividad"
          onPress={() => {
            if (activityMenu) setConfirm({ kind: "deleteActivity", activity: activityMenu });
            setActivityMenu(null);
          }}
        />
      </ActionSheet>

      <ActivityFormDialog
        visible={activityForm !== null}
        groupId={groupId}
        activity={activityForm?.activity}
        onClose={() => setActivityForm(null)}
        onSaved={() => {
          const wasEditing = activityForm?.activity !== undefined;
          setActivityForm(null);
          showToast({ title: wasEditing ? "Actividad actualizada" : "Actividad publicada", tone: "success" });
          if (when === "upcoming") void loadActivities();
          else setWhen("upcoming");
        }}
      />

      <ConfirmDialog
        visible={confirm !== null}
        title={confirmCopy.title}
        description={confirmCopy.description}
        confirmLabel={confirmCopy.confirm}
        onClose={() => setConfirm(null)}
        onConfirm={handleConfirm}
      />
    </SafeAreaView>
  );
}

function OverlayButton({ icon, label, onPress }: { icon: SymbolViewProps["name"]; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={Spacing.one}
      style={({ pressed }) => [styles.overlayButton, pressed && styles.overlayPressed]}
    >
      <SymbolView name={icon} size={22} tintColor="#FFFFFF" />
    </Pressable>
  );
}

function InfoRow({ icon, text }: { icon: SymbolViewProps["name"]; text: string }) {
  const theme = useTheme();
  return (
    <View style={styles.infoRow}>
      <SymbolView name={icon} size={20} tintColor={theme.textSecondary} />
      <ThemedText type="small" style={styles.flex}>
        {text}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  shrink: {
    flexShrink: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: Spacing.five,
  },
  inner: {
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
  },
  padded: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  center: {
    alignItems: "center",
  },
  cover: {
    width: "100%",
    aspectRatio: 16 / 9,
    maxHeight: 300,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  overlayInner: {
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.three,
  },
  overlayButton: {
    width: MinTouchSize,
    height: MinTouchSize,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    // Oscuro translúcido para que se vea sobre cualquier portada.
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  overlayPressed: {
    backgroundColor: "rgba(0, 0, 0, 0.65)",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    marginTop: -Spacing.two,
  },
  pillScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  pills: {
    flexDirection: "row",
    gap: Spacing.two,
    paddingBottom: Spacing.one,
  },
  divider: {
    height: 6,
    marginTop: Spacing.three,
  },
  composer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two + 4,
  },
  composerInput: {
    flex: 1,
    minHeight: MinTouchSize,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  member: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
  info: {
    gap: Spacing.three,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
});
