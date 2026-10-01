import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AuthFooter } from "@/components/auth/auth-footer";
import { AuthHeader } from "@/components/auth/auth-header";
import { AuthScreen } from "@/components/auth/auth-screen";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TextField } from "@/components/ui/text-field";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export default function LoginScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleLogin() {
    if (!email.trim() || !password) {
      setError("Please enter your email and password");
      return;
    }
    setError(null);
    // TODO: validar credenciales contra el backend
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
        <TextField
          label="Contraseña"
          icon={{ ios: "lock", android: "lock", web: "lock" }}
          placeholder="Enter password"
          value={password}
          onChangeText={setPassword}
          password
          autoComplete="password"
          textContentType="password"
        />

        <View style={styles.options}>
          <Checkbox
            label="Recordar"
            value={remember}
            onValueChange={setRemember}
          />
          {/* TODO: pantalla de recuperar contraseña */}
          <Pressable hitSlop={Spacing.two}>
            <ThemedText
              type="small"
              style={[styles.forgot, { color: theme.text }]}
            >
              Olvidaste tu contraseña?
            </ThemedText>
          </Pressable>
        </View>

        {error && (
          <ThemedText type="small" themeColor="danger" style={styles.error}>
            {error}
          </ThemedText>
        )}

        <Button
          title="Inciar Sesión"
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
