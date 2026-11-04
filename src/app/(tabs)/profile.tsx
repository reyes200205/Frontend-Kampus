import { router, useFocusEffect, type Href } from "expo-router";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { useCallback, type ReactNode } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Screen } from "@/components/layout/screen";
import { HeroOverlap, ProfileHero } from "@/components/profile/profile-hero";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { ageFromBirthdate, MinInterests } from "@/constants/profile";
import {
  BottomTabInset,
  MaxContentWidth,
  MinTouchSize,
  Radius,
  Spacing,
} from "@/constants/theme";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { clearProfile, loadProfile, useProfile } from "@/hooks/use-profile";
import { signOut } from "@/hooks/use-session";
import { useTheme } from "@/hooks/use-theme";
import { logout } from "@/services/auth";

/**
 * Perfil del estudiante (T-08, RF-03): portada con las fotos y, encima, la hoja con nombre, datos,
 * "Sobre mí" e intereses. Se edita en `/profile/edit`.
 */
export default function ProfileScreen() {
  const theme = useTheme();
  const { isTablet } = useBreakpoint();
  const { profile: data, loading, error } = useProfile();

  // Se pide al entrar a la pestaña: así también se renuevan las URL firmadas de las fotos.
  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, []),
  );

  async function handleSignOut() {
    // Revoca el token en el backend; si falla (sin red, token vencido) igual se cierra la sesión local.
    await logout().catch(() => undefined);
    clearProfile();
    signOut();
    router.replace("/auth/login");
  }

  const goToEdit = () => router.push("/profile/edit");

  if (!data) {
    return (
      <Screen title="Perfil">
        <Card style={styles.state}>
          {loading || !error ? (
            <>
              <ActivityIndicator color={theme.accent} />
              <ThemedText type="small" themeColor="textSecondary">
                Cargando tu perfil…
              </ThemedText>
            </>
          ) : (
            <>
              <ThemedText type="small" themeColor="danger" style={styles.center}>
                {error}
              </ThemedText>
              <Button title="Reintentar" variant="secondary" onPress={loadProfile} />
            </>
          )}
        </Card>
      </Screen>
    );
  }

  const details = data.profile;
  const photos = details?.photos ?? [];
  const interests = details?.interests ?? [];
  const age = ageFromBirthdate(details?.birthdate ?? null);
  const missing = [
    photos.length === 0 && "una foto",
    interests.length < MinInterests && `al menos ${MinInterests} intereses`,
    !details?.bio && "algo sobre ti",
  ].filter(Boolean) as string[];

  return (
    <SafeAreaView edges={["left", "right"]} style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.inner, isTablet && styles.innerWide]}>
          <ProfileHero photos={photos} onAddPhoto={goToEdit} />

          <View style={[styles.sheet, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
              <View style={styles.flex}>
                <ThemedText type="subtitle" accessibilityRole="header">
                  {data.user.name}
                  {age !== null && (
                    <ThemedText type="subtitle" themeColor="textSecondary">{`, ${age}`}</ThemedText>
                  )}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {data.user.email}
                </ThemedText>
              </View>
              <Button
                title="Editar"
                icon={{ ios: "pencil", android: "edit", web: "edit" }}
                onPress={goToEdit}
              />
            </View>

            <View style={styles.tiles}>
              <InfoTile
                icon={{ ios: "graduationcap", android: "school", web: "school" }}
                label="Carrera"
                value={details?.career ?? "Sin agregar"}
              />
              <InfoTile
                icon={{ ios: "calendar", android: "calendar_month", web: "calendar_month" }}
                label="Semestre"
                value={details?.semester ? `${details.semester}.º` : "Sin agregar"}
              />
            </View>

            <Section title="Sobre mí">
              <ThemedText type="small" themeColor={details?.bio ? "text" : "textSecondary"}>
                {details?.bio || "Todavía no escribes nada sobre ti."}
              </ThemedText>
            </Section>

            <Section title="Intereses">
              {interests.length > 0 ? (
                <View style={styles.chips}>
                  {interests.map((interest) => (
                    <Chip key={interest.id} label={interest.name} />
                  ))}
                </View>
              ) : (
                <ThemedText type="small" themeColor="textSecondary">
                  Elige tus intereses para encontrar estudiantes afines.
                </ThemedText>
              )}
            </Section>

            {missing.length > 0 && (
              <Card highlighted style={styles.completeCard}>
                <SymbolView
                  name={{ ios: "sparkles", android: "auto_awesome", web: "auto_awesome" }}
                  size={22}
                  tintColor={theme.accent}
                />
                <View style={styles.flex}>
                  <ThemedText type="smallBold">Completa tu perfil</ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">
                    {`Agrega ${joinList(missing)} para que otros estudiantes te conozcan.`}
                  </ThemedText>
                </View>
              </Card>
            )}

            <Card style={styles.menu}>
              <MenuRow
                icon={{ ios: "lock.shield", android: "shield", web: "shield" }}
                label="Aviso de privacidad"
                href="/legal/privacy"
              />
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <MenuRow
                icon={{ ios: "person.2", android: "diversity_3", web: "diversity_3" }}
                label="Normas de comunidad"
                href="/legal/guidelines"
              />
            </Card>

            <Button
              title="Cerrar sesión"
              variant="secondary"
              icon={{ ios: "rectangle.portrait.and.arrow.right", android: "logout", web: "logout" }}
              onPress={handleSignOut}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/** "a", "a y b", "a, b y c". */
function joinList(items: string[]) {
  return items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} y ${items.at(-1)}`;
}

/** Dato corto con ícono (carrera, semestre), en una fila de dos. */
function InfoTile({
  icon,
  label,
  value,
}: {
  icon: SymbolViewProps["name"];
  label: string;
  value: string;
}) {
  const theme = useTheme();

  return (
    <View style={[styles.tile, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <View style={[styles.tileIcon, { backgroundColor: theme.backgroundSelected }]}>
        <SymbolView name={icon} size={18} tintColor={theme.accent} />
      </View>
      <View style={styles.flex}>
        <ThemedText type="caption" themeColor="textSecondary">
          {label}
        </ThemedText>
        <ThemedText type="smallBold" numberOfLines={2}>
          {value}
        </ThemedText>
      </View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText type="heading">{title}</ThemedText>
      {children}
    </View>
  );
}

function MenuRow({
  icon,
  label,
  href,
}: {
  icon: SymbolViewProps["name"];
  label: string;
  href: Href;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={() => router.push(href)}
      accessibilityRole="link"
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <SymbolView name={icon} size={20} tintColor={theme.textSecondary} />
      <ThemedText style={styles.flex}>{label}</ThemedText>
      <SymbolView
        name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }}
        size={16}
        tintColor={theme.placeholder}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    textAlign: "center",
  },
  state: {
    alignItems: "center",
    gap: Spacing.three,
    paddingVertical: Spacing.five,
  },
  scroll: {
    flexGrow: 1,
    // En iOS y Android la barra de pestañas nativa queda encima del contenido.
    paddingBottom: (Platform.OS === "web" ? 0 : BottomTabInset) + Spacing.four,
  },
  inner: {
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
  },
  innerWide: {
    marginTop: Spacing.four,
    borderRadius: Radius.large,
    overflow: "hidden",
  },
  sheet: {
    marginTop: -HeroOverlap,
    borderTopLeftRadius: Radius.large,
    borderTopRightRadius: Radius.large,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    gap: Spacing.four,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
  tiles: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  tile: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    padding: Spacing.two + 4,
    borderRadius: Radius.medium,
    borderWidth: 1,
  },
  tileIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    gap: Spacing.two,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  completeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
  menu: {
    paddingVertical: Spacing.one,
    gap: 0,
  },
  row: {
    minHeight: MinTouchSize + 8,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  pressed: {
    opacity: 0.7,
  },
});
