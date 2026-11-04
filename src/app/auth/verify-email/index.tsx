import { router, useLocalSearchParams } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { AuthHeader } from "@/components/auth/auth-header";
import { AuthScreen } from "@/components/auth/auth-screen";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { ApiError, verifyEmail } from "@/services/api";

type Status = "loading" | "success" | "error";

type VerifyParams = { id?: string; hash?: string; expires?: string; signature?: string };

/**
 * Pantalla que abre el enlace del correo de verificación (RF-01). Lee `id`, `hash`, `expires` y
 * `signature` de la URL y se los pasa a la API, que valida la firma y activa la cuenta.
 */
export default function VerifyEmailScreen() {
  const theme = useTheme();
  const { id, hash, expires, signature } = useLocalSearchParams<VerifyParams>();
  const complete = Boolean(id && hash && expires && signature);
  const [result, setResult] = useState<{ status: Exclude<Status, "loading">; message: string }>();

  useEffect(() => {
    if (!id || !hash || !expires || !signature) return;

    let active = true;
    verifyEmail({ id, hash, expires, signature })
      .then((res) => {
        if (active) setResult({ status: "success", message: res.message });
      })
      .catch((e) => {
        if (!active) return;
        // 403: la firma no es válida o el enlace ya caducó.
        const message =
          e instanceof ApiError && e.status === 403
            ? "El enlace no es válido o ya caducó. Solicita uno nuevo."
            : e instanceof ApiError
              ? e.message
              : "No se pudo verificar tu correo.";
        setResult({ status: "error", message });
      });

    return () => {
      active = false;
    };
  }, [id, hash, expires, signature]);

  const status: Status = !complete ? "error" : (result?.status ?? "loading");
  const message = !complete
    ? "El enlace de verificación está incompleto. Ábrelo de nuevo desde tu correo."
    : (result?.message ?? "");

  const success = status === "success";

  return (
    <AuthScreen>
      <AuthHeader
        title="Verificar cuenta"
        subtitle="Estamos confirmando tu correo institucional."
      />

      <View style={styles.content}>
        <Card style={styles.card}>
          {status === "loading" ? (
            <>
              <ActivityIndicator size="large" color={theme.accent} />
              <ThemedText type="small" themeColor="textSecondary">
                Verificando tu correo…
              </ThemedText>
            </>
          ) : (
            <>
              <View style={[styles.iconCircle, { backgroundColor: theme.glow }]}>
                <SymbolView
                  name={
                    success
                      ? { ios: "checkmark.circle", android: "check_circle", web: "check_circle" }
                      : { ios: "xmark.circle", android: "error", web: "error" }
                  }
                  size={28}
                  tintColor={success ? theme.accent : theme.danger}
                />
              </View>
              <View style={styles.texts}>
                <ThemedText type="heading">
                  {success ? "¡Cuenta verificada!" : "No pudimos verificarte"}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
                  {success ? "Ya puedes iniciar sesión en Kampus." : message}
                </ThemedText>
              </View>
            </>
          )}
        </Card>

        {status !== "loading" && (
          <Button
            title={success ? "Iniciar sesión" : "Volver al inicio de sesión"}
            variant={success ? "primary" : "secondary"}
            onPress={() => router.replace("/auth/login")}
          />
        )}
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: Spacing.three,
  },
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
});
