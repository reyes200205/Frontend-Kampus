import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { AuthHeader } from "@/components/auth/auth-header";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { Spacing } from "@/constants/theme";
import { ApiError } from "@/services/api";
import { loginTwoFactor } from "@/services/auth";
import type { AuthTokenResponse } from "@/types/auth";

type Props = {
  /** Reto que devolvió `POST /login` (vence a los 5 minutos o tras 5 códigos incorrectos). */
  challengeToken: string;
  /** Se llama con la sesión emitida cuando el código es correcto. */
  onSuccess: (session: AuthTokenResponse) => void;
  /** Regresa al paso de correo y contraseña; con `message` si el reto ya no sirve. */
  onRestart: (message?: string) => void;
};

/**
 * Segundo paso del login con la verificación en dos pasos activa (T-50, sobre la API de T-47): pide el
 * código de 6 dígitos de la app de autenticación o, si no la tiene a la mano, un código de respaldo.
 */
export function TwoFactorStep({ challengeToken, onSuccess, onRestart }: Props) {
  const [useRecovery, setUseRecovery] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleMode() {
    setUseRecovery((value) => !value);
    setCode("");
    setError(null);
  }

  async function handleVerify() {
    const value = code.trim();
    if (!value) {
      setError(useRecovery ? "Escribe uno de tus códigos de respaldo." : "Escribe el código de tu app.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const session = await loginTwoFactor(
        useRecovery
          ? { challenge_token: challengeToken, recovery_code: value }
          : { challenge_token: challengeToken, code: value },
      );
      onSuccess(session);
    } catch (e) {
      if (!(e instanceof ApiError)) {
        setError("Ocurrió un error inesperado.");
        return;
      }
      // El reto venció, se agotaron los intentos o la cuenta cambió: hay que volver a la contraseña.
      const expired = e.field("challenge_token");
      if (expired) {
        onRestart(expired);
        return;
      }
      // 422 con el código incorrecto, o 429 por demasiadas peticiones; el backend ya manda el texto.
      setError(e.field(useRecovery ? "recovery_code" : "code") ?? e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AuthHeader
        title="Verificación en dos pasos"
        subtitle={
          useRecovery
            ? "Escribe uno de los códigos de respaldo que guardaste al activar la verificación. Cada uno sirve una sola vez."
            : "Abre tu app de autenticación y escribe el código de 6 dígitos de Kampus."
        }
      />

      <View style={styles.form}>
        {useRecovery ? (
          <TextField
            key="recovery"
            label="Código de respaldo"
            icon={{ ios: "key", android: "key", web: "key" }}
            placeholder="xxxxx-xxxxx"
            value={code}
            onChangeText={setCode}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            maxLength={20}
            onSubmitEditing={handleVerify}
          />
        ) : (
          <TextField
            key="app"
            label="Código de la app"
            icon={{ ios: "lock.shield", android: "shield", web: "shield" }}
            placeholder="123456"
            value={code}
            onChangeText={(text) => setCode(text.replace(/\D/g, ""))}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            autoFocus
            maxLength={6}
            onSubmitEditing={handleVerify}
          />
        )}

        {error && (
          <ThemedText type="small" themeColor="danger" style={styles.error}>
            {error}
          </ThemedText>
        )}

        <Button title="Verificar" onPress={handleVerify} loading={loading} style={styles.button} />
        <Button
          title={useRecovery ? "Usar el código de la app" : "Usar un código de respaldo"}
          variant="ghost"
          onPress={toggleMode}
          disabled={loading}
        />
        <Button title="Volver" variant="ghost" onPress={() => onRestart()} disabled={loading} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  form: {
    flex: 1,
    gap: Spacing.three,
  },
  error: {
    textAlign: "center",
  },
  button: {
    marginTop: Spacing.two,
  },
});
