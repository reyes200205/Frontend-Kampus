import { router, useLocalSearchParams } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { AuthFooter } from "@/components/auth/auth-footer";
import { AuthHeader } from "@/components/auth/auth-header";
import { AuthScreen } from "@/components/auth/auth-screen";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TextField } from "@/components/ui/text-field";
import { MinPasswordLength } from "@/constants/auth";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { ApiError } from "@/services/api";
import { resetPassword } from "@/services/auth";

type ResetParams = { token?: string; email?: string };
type Errors = Partial<Record<"password" | "confirmation" | "link" | "form", string>>;

/** La misma política que el registro y `Password::defaults()` del backend. */
function passwordProblem(password: string) {
  if (password.length < MinPasswordLength) return `Usa mínimo ${MinPasswordLength} caracteres.`;
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) return "Combina mayúsculas y minúsculas.";
  if (!/\d/.test(password)) return "Incluye al menos un número.";
  return undefined;
}

/**
 * Pantalla que abre el enlace del correo de recuperación (T-45): `auth/reset-password?token=…&email=…`.
 * Al guardar, la API cierra la sesión en todos los dispositivos y la persona vuelve a iniciar sesión.
 */
export default function ResetPasswordScreen() {
  const theme = useTheme();
  const { token, email } = useLocalSearchParams<ResetParams>();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const linkComplete = Boolean(token && email);

  async function handleSave() {
    const next: Errors = {};
    const problem = passwordProblem(password);
    if (problem) next.password = problem;
    if (confirmation !== password) next.confirmation = "Las contraseñas no coinciden.";
    setErrors(next);
    if (Object.keys(next).length > 0 || !token || !email) return;

    setLoading(true);
    try {
      await resetPassword({ token, email, password, password_confirmation: confirmation });
      setDone(true);
    } catch (e) {
      if (!(e instanceof ApiError)) {
        setErrors({ form: "Ocurrió un error inesperado." });
      } else if (e.status === 422 && e.field("email")) {
        // Token inválido, vencido o ya usado: la API responde lo mismo en todos los casos.
        setErrors({ link: e.field("email") });
      } else if (e.status === 422) {
        setErrors({ password: e.field("password") ?? e.message });
      } else if (e.status === 429) {
        setErrors({ form: "Demasiados intentos. Espera un minuto e intenta de nuevo." });
      } else {
        setErrors({ form: e.message });
      }
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <AuthScreen>
        <AuthHeader title="Contraseña actualizada" subtitle="Ya puedes entrar con tu contraseña nueva." />
        <Card style={styles.result}>
          <SymbolView
            name={{ ios: "checkmark.circle.fill", android: "check_circle", web: "check_circle" }}
            size={40}
            tintColor={theme.accent}
          />
          <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
            Por seguridad cerramos tu sesión en todos tus dispositivos.
          </ThemedText>
        </Card>
        <Button title="Iniciar sesión" onPress={() => router.replace("/auth/login")} />
      </AuthScreen>
    );
  }

  if (!linkComplete || errors.link) {
    return (
      <AuthScreen>
        <AuthHeader title="Enlace no válido" subtitle="Pide uno nuevo para restablecer tu contraseña." />
        <Card style={styles.result}>
          <SymbolView
            name={{ ios: "exclamationmark.triangle", android: "warning", web: "warning" }}
            size={40}
            tintColor={theme.danger}
          />
          <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
            {errors.link ??
              "El enlace está incompleto. Ábrelo de nuevo desde tu correo, o pide uno nuevo: vence en 60 minutos y solo sirve una vez."}
          </ThemedText>
        </Card>
        <Button title="Pedir un enlace nuevo" onPress={() => router.replace("/auth/forgot-password")} />
      </AuthScreen>
    );
  }

  return (
    <AuthScreen>
      <AuthHeader title="Crea una contraseña nueva" subtitle={`Para ${email}`} />

      <View style={styles.form}>
        <TextField
          label="Contraseña nueva"
          icon={{ ios: "lock", android: "lock", web: "lock" }}
          placeholder={`Mínimo ${MinPasswordLength} caracteres`}
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          password
          autoComplete="new-password"
          textContentType="newPassword"
        />
        <TextField
          label="Confirma la contraseña"
          icon={{ ios: "lock", android: "lock", web: "lock" }}
          placeholder="Escríbela otra vez"
          value={confirmation}
          onChangeText={setConfirmation}
          error={errors.confirmation}
          password
          autoComplete="new-password"
          textContentType="newPassword"
          onSubmitEditing={handleSave}
        />
        <ThemedText type="caption" themeColor="textSecondary">
          Usa mayúsculas, minúsculas y al menos un número.
        </ThemedText>
        {errors.form && (
          <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
            {errors.form}
          </ThemedText>
        )}
        <Button title="Guardar contraseña" onPress={handleSave} loading={loading} style={styles.button} />
      </View>

      <AuthFooter question="¿Ya la recordaste?" linkText="Inicia sesión" href="/auth/login" />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  form: {
    flex: 1,
    gap: Spacing.three,
  },
  button: {
    marginTop: Spacing.two,
  },
  result: {
    alignItems: "center",
    gap: Spacing.three,
    paddingVertical: Spacing.four,
  },
  center: {
    textAlign: "center",
  },
});
