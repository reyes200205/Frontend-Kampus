import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { AuthFooter } from "@/components/auth/auth-footer";
import { AuthHeader } from "@/components/auth/auth-header";
import { AuthScreen } from "@/components/auth/auth-screen";
import { CheckEmailCard } from "@/components/auth/check-email-card";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { isInstitutionalEmail } from "@/constants/auth";
import { Spacing } from "@/constants/theme";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [emailSent, setEmailSent] = useState(false);

  function handleSend() {
    if (!isInstitutionalEmail(email)) {
      setError("Usa tu correo institucional de la UTT, la UAdeC o el Tec Laguna.");
      return;
    }
    setError(undefined);
    // TODO (T-06): pedir al backend el enlace para restablecer la contraseña
    setEmailSent(true);
  }

  function handleResend() {
    // TODO (T-06): reenviar el enlace desde el backend
  }

  return (
    <AuthScreen>
      <AuthHeader
        title="Recupera tu contraseña"
        subtitle="Te enviaremos un enlace a tu correo institucional para crear una nueva."
      />

      <View style={styles.form}>
        {emailSent ? (
          <CheckEmailCard
            email={email.trim()}
            onResend={handleResend}
            message="Te enviamos un enlace para restablecer tu contraseña a"
          />
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
            />
            <Button title="Enviar enlace" onPress={handleSend} style={styles.button} />
          </>
        )}
      </View>

      <AuthFooter
        question="¿Ya la recordaste?"
        linkText="Inicia sesión"
        href="/auth/login"
      />
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
});
