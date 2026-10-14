import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Card } from "@/components/ui/card";
import { MinTouchSize, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type CheckEmailCardProps = {
  email: string;
  onResend: () => void;
  /** Texto antes del correo; cambia entre verificación y recuperación de contraseña. */
  message?: string;
};

export function CheckEmailCard({
  email,
  onResend,
  message = "Te enviamos un enlace de verificación a",
}: CheckEmailCardProps) {
  const theme = useTheme();

  return (
    <Card style={styles.card}>
      <View style={[styles.iconCircle, { backgroundColor: theme.glow }]}>
        <SymbolView
          name={{ ios: "envelope", android: "mail", web: "mail" }}
          size={28}
          tintColor={theme.accent}
        />
      </View>

      <View style={styles.texts}>
        <ThemedText type="heading">Revisa tu correo</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
          {message}{" "}
          <ThemedText type="smallBold">{email}</ThemedText>
        </ThemedText>
      </View>

      <View style={styles.resend}>
        <ThemedText type="small" themeColor="textSecondary">
          ¿No te llegó el correo?
        </ThemedText>
        <Pressable
          onPress={onResend}
          hitSlop={(MinTouchSize - 20) / 2}
          accessibilityRole="button"
        >
          <ThemedText type="link">Reenviar correo</ThemedText>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    gap: Spacing.three,
    padding: Spacing.four,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  texts: {
    alignItems: "center",
    gap: Spacing.one,
  },
  center: {
    textAlign: "center",
  },
  resend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.one,
  },
});
