import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AdminPage } from "@/components/management/admin-page";
import { Avatar } from "@/components/matches/avatar";
import { ThemedText } from "@/components/themed-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Universities } from "@/constants/management";
import { Spacing } from "@/constants/theme";
import { endSession } from "@/hooks/end-session";
import { useSession } from "@/hooks/use-session";
import { useTheme } from "@/hooks/use-theme";
import { RoleLabels } from "@/utils/roles";

/** Cuenta del staff (T-44): datos de la cuenta, alcance y cerrar sesión. El staff no tiene perfil social. */
export default function ManagementAccountScreen() {
  const theme = useTheme();
  const { user } = useSession();

  async function handleSignOut() {
    // Revoca el token en el backend; si falla (sin red, token vencido) igual se cierra la sesión local.
    await endSession({ revoke: true });
    router.replace("/auth/login");
  }

  if (!user) return null;

  const university = Universities.find((item) => item.id === user.university_id);
  const details = [
    { label: "Correo", value: user.email },
    { label: "Rol", value: RoleLabels[user.role] },
    {
      label: "Alcance",
      value: user.role === "admin" ? "Todas las universidades" : (university?.name ?? "Tu universidad"),
    },
  ];

  return (
    <AdminPage breadcrumb={["Cuenta"]} title="Cuenta" description="Los datos de tu cuenta de staff.">
      <Card style={styles.card}>
        <View style={styles.header}>
          <Avatar uri={null} name={user.name} size={64} />
          <View style={styles.flex}>
            <ThemedText type="subtitle">{user.name}</ThemedText>
            <Badge label={RoleLabels[user.role]} tone={user.role === "admin" ? "accent" : "neutral"} />
          </View>
        </View>

        <View style={[styles.details, { borderColor: theme.border }]}>
          {details.map((item, index) => (
            <View
              key={item.label}
              style={[styles.detail, index > 0 && { borderTopWidth: 1, borderColor: theme.border }]}
            >
              <ThemedText type="small" themeColor="textSecondary" style={styles.detailLabel}>
                {item.label}
              </ThemedText>
              <ThemedText type="small" style={styles.flex}>
                {item.value}
              </ThemedText>
            </View>
          ))}
        </View>
      </Card>

      <Card style={styles.card}>
        <View style={styles.flex}>
          <ThemedText type="heading">Cerrar sesión</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Se cierra la sesión en este dispositivo.
          </ThemedText>
        </View>
        <View style={styles.signOut}>
          <Button
            title="Cerrar sesión"
            variant="secondary"
            size="small"
            icon={{ ios: "rectangle.portrait.and.arrow.right", android: "logout", web: "logout" }}
            onPress={handleSignOut}
          />
        </View>
      </Card>
    </AdminPage>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.four,
    maxWidth: 720,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
  flex: {
    flex: 1,
    gap: Spacing.one,
  },
  details: {
    borderWidth: 1,
    borderRadius: 12,
  },
  detail: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  detailLabel: {
    width: 90,
  },
  signOut: {
    flexDirection: "row",
  },
});
