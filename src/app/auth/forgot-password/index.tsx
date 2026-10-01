import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { AuthFooter } from "@/components/auth/auth-footer";
import { AuthHeader } from "@/components/auth/auth-header";
import { AuthScreen } from "@/components/auth/auth-screen";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export default function LoginScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleLogin() {
    if (!email.trim()) {
      setError("Please enter your email and password");
      return;
    }
    setError(null);
    router.replace("/");
  }

  return (
    <AuthScreen>
      <AuthHeader
        title="Bienvenido De Vuelta!"
        subtitle="Inicia sesión con tu correo institucional."
      />

      <View style={styles.form}>
        <TextField
          label="Correo Institucional"
          icon={{ ios: "envelope", android: "mail", web: "mail" }}
          placeholder="Email address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
        />

        {error && (
          <ThemedText type="small" themeColor="danger" style={styles.error}>
            {error}
          </ThemedText>
        )}

        <Button
          title="Enviar Correo"
          onPress={handleLogin}
          style={styles.button}
        />
      </View>

      <AuthFooter
        question="No tienes una cuenta?"
        linkText="Registrate"
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
    justifyContent: "space-between",
    alignItems: "center",
  },
  forgot: {
    fontSize: 13,
  },
  error: {
    fontSize: 13,
    textAlign: "center",
  },
  button: {
    marginTop: Spacing.two,
  },
});
