import { Link, Redirect, router } from "expo-router";
import { useState } from "react";
import { Platform, StyleSheet, View } from "react-native";

import { AuthFooter } from "@/components/auth/auth-footer";
import { AuthHeader } from "@/components/auth/auth-header";
import { AuthScreen } from "@/components/auth/auth-screen";
import { TwoFactorStep } from "@/components/auth/two-factor-step";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { Spacing } from "@/constants/theme";
import { signIn, useSession } from "@/hooks/use-session";
import { ApiError } from "@/services/api";
import { login } from "@/services/auth";
import type { AuthTokenResponse } from "@/types/auth";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  /** Reto de `POST /login` cuando la cuenta tiene la verificación en dos pasos activa. */
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const { isSignedIn } = useSession();

  // Con una sesión ya activa (p. ej. recargó en /auth/login) no tiene caso pedirla otra vez.
  // Al terminar el login (con o sin código) ya navega `finishLogin`; no se redirige dos veces.
  if (isSignedIn && !loading && !challengeToken) return <Redirect href="/" />;

  function finishLogin({ token, user, expires_at }: AuthTokenResponse) {
    // La sesión se conserva mientras el token siga vigente (7 días en el backend), como en una red social.
    signIn(token, user, expires_at);
    router.replace("/");
  }

  /** Vuelve al paso de correo y contraseña; la contraseña se borra porque el reto anterior ya no sirve. */
  function restartLogin(message?: string) {
    setChallengeToken(null);
    setPassword("");
    setError(message ?? null);
  }

  if (challengeToken) {
    return (
      <AuthScreen>
        <TwoFactorStep challengeToken={challengeToken} onSuccess={finishLogin} onRestart={restartLogin} />
      </AuthScreen>
    );
  }

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError("Ingresa tu correo y tu contraseña.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await login({ email, password, device_name: Platform.OS });
      // Con la verificación en dos pasos activa no llega el token, sino un reto para pedir el código (T-50).
      if ("two_factor_required" in res) {
        setChallengeToken(res.challenge_token);
        return;
      }
      finishLogin(res);
    } catch (e) {
      // 422: credenciales incorrectas o bloqueo; 403: correo sin verificar. El backend ya manda el texto.
      setError(e instanceof ApiError ? (e.field("email") ?? e.message) : "Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreen>
      <AuthHeader
        title="¡Bienvenido de vuelta!"
        subtitle="Inicia sesión con tu correo institucional."
      />

      <View style={styles.form}>
        <TextField
          label="Correo institucional"
          icon={{ ios: "envelope", android: "mail", web: "mail" }}
          placeholder="matricula@utt.edu.mx"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
        />
        <TextField
          label="Contraseña"
          icon={{ ios: "lock", android: "lock", web: "lock" }}
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          password
          autoComplete="password"
          textContentType="password"
        />

        <View style={styles.options}>
          <Link href="/auth/forgot-password">
            <ThemedText type="link">¿Olvidaste tu contraseña?</ThemedText>
          </Link>
        </View>

        {error && (
          <ThemedText type="small" themeColor="danger" style={styles.error}>
            {error}
          </ThemedText>
        )}

        <Button
          title="Iniciar sesión"
          onPress={handleLogin}
          loading={loading}
          style={styles.button}
        />
      </View>

      <AuthFooter
        question="¿No tienes una cuenta?"
        linkText="Regístrate"
        href="/auth/register"
      />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  form: {
    flex: 1,
    gap: Spacing.three,
  },
  options: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  error: {
    textAlign: "center",
  },
  button: {
    marginTop: Spacing.two,
  },
});
