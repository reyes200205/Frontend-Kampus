import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { AuthFooter } from "@/components/auth/auth-footer";
import { AuthHeader } from "@/components/auth/auth-header";
import { AuthScreen } from "@/components/auth/auth-screen";
import { CheckEmailCard } from "@/components/auth/check-email-card";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { isInstitutionalEmail } from "@/constants/auth";
import { Spacing } from "@/constants/theme";
import { ApiError } from "@/services/api";
import { forgotPassword } from "@/services/auth";

/** Mensaje para errores que no son de un campo (sin red, límite de peticiones). */
function requestError(e: unknown) {
  if (e instanceof ApiError && e.status === 429) {
    return "Pediste demasiados enlaces. Espera un minuto e intenta de nuevo.";
  }
  return e instanceof ApiError ? e.message : "Ocurrió un error inesperado.";
}

/**
 * "Olvidé mi contraseña" (T-45): pide a la API el enlace de un solo uso. La API responde igual
 * exista o no la cuenta, así que la pantalla siempre muestra "Revisa tu correo".
 */
export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resendNote, setResendNote] = useState<string | undefined>();

  async function handleSend() {
    if (!isInstitutionalEmail(email)) {
      setError("Usa tu correo institucional de la UTT, la UAdeC o el Tec Laguna.");
      return;
    }
    setError(undefined);
    setFormError(undefined);
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setEmailSent(true);
    } catch (e) {
      if (e instanceof ApiError && e.status === 422) setError(e.field("email") ?? e.message);
      else setFormError(requestError(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResendNote(undefined);
    try {
      // Si se pide otro antes de 60 segundos, la API no manda un correo nuevo: el anterior sigue sirviendo.
      await forgotPassword(email.trim());
      setResendNote("Listo. Si no lo ves en unos minutos, revisa la carpeta de spam.");
    } catch (e) {
      setResendNote(requestError(e));
    }
  }

  return (
    <AuthScreen>
      <AuthHeader
        title="Recupera tu contraseña"
        subtitle="Te enviaremos un enlace a tu correo institucional para crear una nueva."
      />

      <View style={styles.form}>
        {emailSent ? (
          <>
            <CheckEmailCard
              email={email.trim()}
              onResend={handleResend}
              message="Si hay una cuenta con este correo, te enviamos un enlace para restablecer tu contraseña a"
            />
            <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
              El enlace vence en 60 minutos y solo sirve una vez.
            </ThemedText>
            {resendNote && (
              <ThemedText type="small" themeColor="textSecondary" accessibilityRole="alert" style={styles.center}>
                {resendNote}
              </ThemedText>
            )}
          </>
        ) : (
          <>
            <TextField
              label="Correo institucional"
              icon={{ ios: "envelope", android: "mail", web: "mail" }}
              placeholder="matricula@utt.edu.mx"
              value={email}
              onChangeText={setEmail}
              error={error}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              onSubmitEditing={handleSend}
            />
            {formError && (
              <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
                {formError}
              </ThemedText>
            )}
            <Button title="Enviar enlace" onPress={handleSend} loading={loading} style={styles.button} />
          </>
        )}
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
  center: {
    textAlign: "center",
  },
});
