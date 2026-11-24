import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, View } from "react-native";

import { GroupAvatar } from "@/components/groups/group-avatar";
import { ThemedText } from "@/components/themed-text";
import { MinTouchSize, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { Group, GroupActivity } from "@/types/groups";

type Props = {
  group: Group;
  activity: GroupActivity;
  /**
   * - `feed` (Para ti): el encabezado es el grupo, como una publicación de grupo en el inicio de Facebook.
   * - `group` (dentro del grupo): el encabezado es quien la publicó, como en el muro del grupo.
   */
  variant?: "feed" | "group";
  /** En el feed, toda la tarjeta abre el grupo. */
  onPress?: () => void;
  /** Botón "⋯" (editar o borrar), solo para los administradores. */
  onMenu?: () => void;
};

/** "vie 28 nov, 18:30". */
export function formatActivityDate(iso: string) {
  const date = new Date(iso);
  const day = date.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" });
  const time = date.toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" });
  return `${day.replace(/\./g, "")}, ${time}`;
}

/** Inicial del nombre en un círculo, mientras la API no manda la foto de quien publica. */
export function InitialAvatar({ name, size = 40 }: { name: string; size?: number }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.initial,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: theme.backgroundSelected },
      ]}
    >
      <ThemedText type="smallBold">{name.trim().charAt(0).toUpperCase() || "?"}</ThemedText>
    </View>
  );
}

/**
 * Actividad de un grupo mostrada como publicación (estilo Facebook): quién la publicó o en qué grupo, el
 * título, cuándo y dónde, y la descripción.
 */
export function ActivityPost({ group, activity, variant = "feed", onPress, onMenu }: Props) {
  const theme = useTheme();
  const author = activity.created_by?.name ?? "Administrador del grupo";

  const content = (
    <>
      <View style={styles.header}>
        {variant === "feed" ? <GroupAvatar group={group} size={40} /> : <InitialAvatar name={author} />}
        <View style={styles.flex}>
          <ThemedText type="smallBold" numberOfLines={1}>
            {variant === "feed" ? group.name : author}
          </ThemedText>
          <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
            {variant === "feed" ? `${author} publicó una actividad` : "Publicó una actividad"}
          </ThemedText>
        </View>
        {onMenu && (
          <Pressable
            onPress={onMenu}
            accessibilityRole="button"
            accessibilityLabel={`Opciones de ${activity.title}`}
            hitSlop={8}
            style={({ pressed }) => [styles.menu, pressed && { backgroundColor: theme.backgroundSelected }]}
          >
            <SymbolView
              name={{ ios: "ellipsis", android: "more_horiz", web: "more_horiz" }}
              size={20}
              tintColor={theme.textSecondary}
            />
          </Pressable>
        )}
      </View>

      <ThemedText type="heading">{activity.title}</ThemedText>

      <View style={[styles.when, { backgroundColor: theme.backgroundSelected }]}>
        <Detail icon={{ ios: "calendar", android: "event", web: "event" }} text={formatActivityDate(activity.starts_at)} />
        {activity.location && (
          <Detail
            icon={{ ios: "mappin.and.ellipse", android: "location_on", web: "location_on" }}
            text={activity.location}
          />
        )}
      </View>

      {activity.description && (
        <ThemedText type="small" numberOfLines={variant === "feed" ? 4 : undefined}>
          {activity.description}
        </ThemedText>
      )}
    </>
  );

  const style = [styles.post, { backgroundColor: theme.backgroundElement, borderColor: theme.border }];

  if (!onPress) return <View style={style}>{content}</View>;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={`${activity.title}, en ${group.name}`}
      style={({ pressed }) => [style, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

function Detail({ icon, text }: { icon: React.ComponentProps<typeof SymbolView>["name"]; text: string }) {
  const theme = useTheme();
  return (
    <View style={styles.detail}>
      <SymbolView name={icon} size={16} tintColor={theme.accentText} />
      <ThemedText type="small" style={styles.flex} numberOfLines={1}>
        {text}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  post: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.large,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.85,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two + 4,
  },
  initial: {
    alignItems: "center",
    justifyContent: "center",
  },
  menu: {
    width: MinTouchSize - 8,
    height: MinTouchSize - 8,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  when: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.medium,
  },
  detail: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
});
