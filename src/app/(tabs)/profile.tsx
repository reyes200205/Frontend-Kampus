import { router, type Href } from "expo-router";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { Pressable, StyleSheet, View } from "react-native";

import { Screen } from "@/components/layout/screen";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MinTouchSize, Radius, Spacing } from "@/constants/theme";
import { signOut } from "@/hooks/use-session";
import { useTheme } from "@/hooks/use-theme";
import { logout } from "@/services/api";

// TODO (T-08): datos reales del perfil, fotos, intereses y edición.
export default function ProfileScreen() {
  const theme = useTheme();

  async function handleSignOut() {
    // Revoca el token en el backend; si falla (sin red, token vencido) igual se cierra la sesión local.
    await logout().catch(() => undefined);
    signOut();
    router.replace("/auth/login");
  }

  return (
    <Screen title="Perfil">
      <Card style={styles.profileCard}>
        <View style={[styles.avatar, { backgroundColor: theme.backgroundSelected, borderColor: theme.accent }]}>
          <SymbolView
            name={{ ios: "person.fill", android: "person", web: "person" }}
            size={36}
            tintColor={theme.textSecondary}
          />
        </View>
        <View style={styles.flex}>
          <ThemedText type="heading">Tu perfil</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Agrega tu carrera, intereses y fotos para que otros estudiantes te conozcan.
          </ThemedText>
        </View>
      </Card>

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
    </Screen>
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
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
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
