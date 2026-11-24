import { router, useFocusEffect } from "expo-router";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { ActivityFormDialog } from "@/components/groups/activity-form-dialog";
import { ActivityPost } from "@/components/groups/activity-post";
import { membersLabel } from "@/components/groups/members-label";
import { CreateSheet } from "@/components/groups/create-sheet";
import { GroupRow } from "@/components/groups/group-row";
import { Screen } from "@/components/layout/screen";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { SearchField } from "@/components/ui/search-field";
import { showToast } from "@/components/ui/toast";
import { GroupCategoryLabels, GroupCategoryOptions } from "@/constants/management";
import { MinTouchSize, Spacing } from "@/constants/theme";
import { useGroupsHome } from "@/hooks/use-groups-home";
import { usePaginated } from "@/hooks/use-paginated";
import { useSession } from "@/hooks/use-session";
import { useTheme } from "@/hooks/use-theme";
import { ApiError } from "@/services/api";
import { joinGroup, listGroups, listMyGroups } from "@/services/groups";
import type { Group, GroupCategory } from "@/types/groups";

type Tab = "forYou" | "mine" | "activity" | "discover";

const Tabs: { value: Tab; label: string }[] = [
  { value: "forYou", label: "Para ti" },
  { value: "mine", label: "Tus grupos" },
  { value: "activity", label: "Tu actividad" },
  { value: "discover", label: "Descubrir" },
];

/** Cuántos de "Tus grupos" se muestran en "Para ti" antes de "Ver todo". */
const PreviewGroups = 3;

function openGroup(group: Pick<Group, "id">) {
  router.push({ pathname: "/groups/[groupId]", params: { groupId: String(group.id) } });
}

/** Crear grupo a pantalla completa, como en Facebook. */
function createGroup() {
  router.push("/groups/form");
}

/**
 * Grupos (T-18, RF-11 y RF-12), con la idea de Grupos de Facebook:
 * - **Para ti**: tus grupos en lista compacta, las próximas actividades de tus grupos como publicaciones y
 *   recomendaciones para unirte.
 * - **Tus grupos**: todos los tuyos, también los que están en revisión o rechazados (RF-23).
 * - **Tu actividad**: lo que publicaste y tus grupos pendientes de revisión.
 * - **Descubrir**: los grupos aprobados con filtros por categoría y universidad.
 * El "+" abre la hoja para crear un grupo o publicar una actividad.
 */
export default function GroupsScreen() {
  const theme = useTheme();
  const { user } = useSession();
  const [tab, setTab] = useState<Tab>("forYou");
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [publishIn, setPublishIn] = useState<Group | null>(null);

  const home = useGroupsHome(user?.university_id ?? null);
  const { load: loadHome } = home;

  // Descubrir: filtros de la API; la búsqueda por nombre filtra la página cargada (la API no busca).
  const [category, setCategory] = useState<GroupCategory | null>(null);
  const [onlyMyUniversity, setOnlyMyUniversity] = useState(true);
  const universityId = onlyMyUniversity ? (user?.university_id ?? undefined) : undefined;

  const fetchPage = useCallback(
    (page: number) =>
      tab === "mine"
        ? listMyGroups(page)
        : listGroups(page, { category: category ?? undefined, university_id: universityId }),
    [tab, category, universityId],
  );
  const list = usePaginated<Group>(fetchPage, "No pudimos cargar los grupos.");
  const { reload: reloadList, setItems } = list;
  const usesList = tab === "mine" || tab === "discover";

  // Al entrar a la pestaña y al volver de un grupo (pudo unirse, salir, borrar o publicar).
  useFocusEffect(
    useCallback(() => {
      void loadHome();
      if (usesList) void reloadList();
    }, [loadHome, reloadList, usesList]),
  );

  const managedGroups = useMemo(
    () => home.myGroups.filter((group) => group.my_role === "admin" && group.status === "approved"),
    [home.myGroups],
  );

  function groupSubtitle(group: Group) {
    if (group.status === "pending") return "En revisión";
    if (group.status === "rejected") return "Rechazado";
    const upcoming = home.upcomingCount[group.id] ?? 0;
    if (upcoming > 0) return upcoming === 1 ? "1 actividad próxima" : `${upcoming} actividades próximas`;
    return group.my_role === "admin" ? "Administras este grupo" : membersLabel(group.members_count);
  }

  async function handleJoin(group: Group) {
    try {
      const joined = await joinGroup(group.id);
      home.dismissRecommendation(group.id);
      setItems((current) => current.map((item) => (item.id === joined.id ? joined : item)));
      showToast({ title: `Te uniste a ${group.name}`, tone: "success" });
      void loadHome();
    } catch (e) {
      showToast({
        title: "No pudimos unirte al grupo",
        message: e instanceof ApiError ? e.message : undefined,
        tone: "danger",
      });
    }
  }

  function toggleSearch() {
    if (searching) {
      setSearching(false);
      setQuery("");
    } else {
      setSearching(true);
      setTab("discover");
    }
  }

  function renderForYou() {
    if (home.status === "loading" && home.myGroups.length === 0) return <Loading />;
    if (home.status === "error") {
      return (
        <EmptyState
          icon={{ ios: "wifi.exclamationmark", android: "wifi_off", web: "wifi_off" }}
          title="No pudimos cargar tus grupos"
          message={home.error ?? "Revisa tu conexión e intenta de nuevo."}
          action={{ title: "Reintentar", onPress: () => void loadHome() }}
        />
      );
    }

    return (
      <>
        <Section
          title="Tus grupos"
          action={home.myGroups.length > PreviewGroups ? { label: "Ver todo", onPress: () => setTab("mine") } : undefined}
        >
          {home.myGroups.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              Todavía no estás en ningún grupo. Únete a uno de las recomendaciones o crea el tuyo con el “+”.
            </ThemedText>
          ) : (
            home.myGroups
              .slice(0, PreviewGroups)
              .map((group) => (
                <GroupRow
                  key={group.id}
                  group={group}
                  subtitle={groupSubtitle(group)}
                  highlight={(home.upcomingCount[group.id] ?? 0) > 0 || group.status !== "approved"}
                  onPress={() => openGroup(group)}
                />
              ))
          )}
        </Section>

        <Divider />

        <Section title="Próximas actividades">
          {home.posts.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              {managedGroups.length > 0
                ? "No hay actividades próximas. Publica una con el “+”."
                : "Cuando tus grupos publiquen actividades, aparecerán aquí."}
            </ThemedText>
          ) : (
            home.posts.map(({ group, activity }) => (
              <ActivityPost
                key={activity.id}
                group={group}
                activity={activity}
                onPress={() => openGroup(group)}
              />
            ))
          )}
        </Section>

        {home.recommended.length > 0 && (
          <>
            <Divider />
            <Section
              title="Recomendaciones para ti"
              action={{ label: "Ver más", onPress: () => setTab("discover") }}
            >
              {home.recommended.map((group) => (
                <GroupRow
                  key={group.id}
                  group={group}
                  subtitle={`${GroupCategoryLabels[group.category]} · ${membersLabel(group.members_count)}`}
                  onPress={() => openGroup(group)}
                  trailing={
                    <View style={styles.rowActions}>
                      <Button title="Unirme" size="small" onPress={() => void handleJoin(group)} />
                      <IconButton
                        icon={{ ios: "xmark", android: "close", web: "close" }}
                        label={`Descartar ${group.name}`}
                        onPress={() => home.dismissRecommendation(group.id)}
                        small
                      />
                    </View>
                  }
                />
              ))}
            </Section>
          </>
        )}
      </>
    );
  }

  function renderActivity() {
    if (home.status === "loading" && home.myGroups.length === 0) return <Loading />;
    const myPosts = home.posts.filter(({ activity }) => activity.created_by?.id === user?.id);
    const inReview = home.myGroups.filter((group) => group.status !== "approved");

    if (myPosts.length === 0 && inReview.length === 0) {
      return (
        <EmptyState
          icon={{ ios: "clock.arrow.circlepath", android: "history", web: "history" }}
          title="Todavía no tienes actividad"
          message="Aquí verás los grupos que creaste mientras se revisan y las actividades que publiques."
          action={{ title: "Crear o publicar", onPress: () => setSheetOpen(true) }}
        />
      );
    }

    return (
      <>
        {inReview.length > 0 && (
          <Section title="Tus grupos en revisión">
            {inReview.map((group) => (
              <GroupRow
                key={group.id}
                group={group}
                subtitle={
                  group.status === "pending"
                    ? "Esperando la aprobación de un moderador"
                    : `Rechazado${group.rejection_reason ? `: ${group.rejection_reason}` : ""}`
                }
                highlight
                onPress={() => openGroup(group)}
              />
            ))}
          </Section>
        )}
        {inReview.length > 0 && myPosts.length > 0 && <Divider />}
        {myPosts.length > 0 && (
          <Section title="Actividades que publicaste">
            {myPosts.map(({ group, activity }) => (
              <ActivityPost key={activity.id} group={group} activity={activity} onPress={() => openGroup(group)} />
            ))}
          </Section>
        )}
      </>
    );
  }

  function renderList() {
    if (list.status === "loading" && list.items.length === 0) return <Loading />;
    if (list.status === "error") {
      return (
        <EmptyState
          icon={{ ios: "wifi.exclamationmark", android: "wifi_off", web: "wifi_off" }}
          title="No pudimos cargar los grupos"
          message={list.error ?? "Revisa tu conexión e intenta de nuevo."}
          action={{ title: "Reintentar", onPress: () => void reloadList() }}
        />
      );
    }

    const needle = query.trim().toLocaleLowerCase("es");
    const items = needle ? list.items.filter((group) => group.name.toLocaleLowerCase("es").includes(needle)) : list.items;

    if (items.length === 0) {
      if (needle) {
        return (
          <EmptyState
            icon={{ ios: "magnifyingglass", android: "search", web: "search" }}
            title="Sin resultados"
            message={`No encontramos grupos con “${query.trim()}”. Prueba con otra palabra o quita los filtros.`}
          />
        );
      }
      return tab === "mine" ? (
        <EmptyState
          icon={{ ios: "person.3", android: "groups", web: "groups" }}
          title="Todavía no estás en ningún grupo"
          message="Descubre los clubes de tu campus para unirte, o crea uno nuevo."
          action={{ title: "Descubrir grupos", onPress: () => setTab("discover") }}
        />
      ) : (
        <EmptyState
          icon={{ ios: "person.3", android: "groups", web: "groups" }}
          title="No hay grupos con estos filtros"
          message="Prueba con otra categoría o con todas las universidades. También puedes crear el primero."
          action={{ title: "Crear grupo", onPress: createGroup }}
        />
      );
    }

    return (
      <>
        <View>
          {items.map((group) => (
            <GroupRow
              key={group.id}
              group={group}
              subtitle={
                tab === "mine"
                  ? groupSubtitle(group)
                  : `${group.is_official ? "Oficial · " : ""}${GroupCategoryLabels[group.category]} · ${membersLabel(group.members_count)}`
              }
              highlight={tab === "mine" ? group.status !== "approved" : group.is_official}
              onPress={() => openGroup(group)}
              trailing={
                tab === "discover" && group.my_role === null ? (
                  <Button title="Unirme" size="small" onPress={() => void handleJoin(group)} />
                ) : undefined
              }
            />
          ))}
        </View>
        <Pagination page={list.page} lastPage={list.lastPage} onChange={list.setPage} />
      </>
    );
  }

  return (
    <Screen
      title="Grupos"
      action={
        <View style={styles.headerActions}>
          <IconButton
            icon={{ ios: "plus", android: "add", web: "add" }}
            label="Crear"
            onPress={() => setSheetOpen(true)}
          />
          <IconButton
            icon={
              searching
                ? { ios: "xmark", android: "close", web: "close" }
                : { ios: "magnifyingglass", android: "search", web: "search" }
            }
            label={searching ? "Cerrar búsqueda" : "Buscar grupos"}
            onPress={toggleSearch}
          />
        </View>
      }
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.pillScroll}
        contentContainerStyle={styles.tabs}
      >
        {Tabs.map((item) => (
          <Chip key={item.value} label={item.label} selected={tab === item.value} onPress={() => setTab(item.value)} />
        ))}
      </ScrollView>

      {searching && usesList && (
        <SearchField value={query} onChangeText={setQuery} placeholder="Buscar grupos por nombre" />
      )}

      {tab === "discover" && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.pillScroll}
          contentContainerStyle={styles.tabs}
        >
          <Chip label="Mi universidad" selected={onlyMyUniversity} onPress={() => setOnlyMyUniversity(true)} />
          <Chip label="Todas" selected={!onlyMyUniversity} onPress={() => setOnlyMyUniversity(false)} />
          <View style={[styles.chipDivider, { backgroundColor: theme.border }]} />
          <Chip label="Todas las categorías" selected={category === null} onPress={() => setCategory(null)} />
          {GroupCategoryOptions.map((item) => (
            <Chip
              key={item.value}
              label={item.label}
              selected={category === item.value}
              onPress={() => setCategory(item.value)}
            />
          ))}
        </ScrollView>
      )}

      {tab === "forYou" ? renderForYou() : tab === "activity" ? renderActivity() : renderList()}

      <CreateSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        managedGroups={managedGroups}
        onCreateGroup={createGroup}
        onPublishActivity={setPublishIn}
      />

      <ActivityFormDialog
        visible={publishIn !== null}
        groupId={publishIn?.id ?? 0}
        onClose={() => setPublishIn(null)}
        onSaved={() => {
          showToast({ title: `Actividad publicada en ${publishIn?.name ?? "el grupo"}`, tone: "success" });
          setPublishIn(null);
          setTab("forYou");
          void loadHome();
        }}
      />
    </Screen>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: { label: string; onPress: () => void };
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <ThemedText type="subtitle" style={styles.flex}>
          {title}
        </ThemedText>
        {action && (
          <Pressable onPress={action.onPress} accessibilityRole="link" hitSlop={8}>
            <ThemedText type="link">{action.label}</ThemedText>
          </Pressable>
        )}
      </View>
      {children}
    </View>
  );
}

function Divider() {
  const theme = useTheme();
  return <View style={[styles.divider, { backgroundColor: theme.border }]} />;
}

function Loading() {
  const theme = useTheme();
  return (
    <View style={styles.center}>
      <ActivityIndicator color={theme.accent} size="large" />
    </View>
  );
}

function IconButton({
  icon,
  label,
  onPress,
  small,
}: {
  icon: SymbolViewProps["name"];
  label: string;
  onPress: () => void;
  small?: boolean;
}) {
  const theme = useTheme();
  const size = small ? 36 : MinTouchSize;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={small ? 4 : 0}
      style={({ pressed }) => [
        styles.iconButton,
        { width: size, height: size, backgroundColor: small ? "transparent" : theme.backgroundElement },
        pressed && { backgroundColor: theme.backgroundSelected },
      ]}
    >
      <SymbolView name={icon} size={small ? 18 : 22} tintColor={small ? theme.textSecondary : theme.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  iconButton: {
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  // En web, un ScrollView horizontal dentro de la columna crece a todo el alto libre; así ocupa solo su fila.
  pillScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  tabs: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  chipDivider: {
    width: 1,
    height: 24,
    marginHorizontal: Spacing.one,
  },
  section: {
    gap: Spacing.three,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  divider: {
    height: 6,
    marginHorizontal: -Spacing.three,
    opacity: 0.6,
  },
  rowActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
  },
  center: {
    paddingVertical: Spacing.six,
    alignItems: "center",
  },
});
