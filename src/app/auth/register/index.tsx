import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { AuthFooter } from "@/components/auth/auth-footer";
import { AuthHeader } from "@/components/auth/auth-header";
import { AuthScreen } from "@/components/auth/auth-screen";
import { CheckEmailCard } from "@/components/auth/check-email-card";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TextField } from "@/components/ui/text-field";
import { isInstitutionalEmail, MinPasswordLength } from "@/constants/auth";
import { Spacing } from "@/constants/theme";

type FormErrors = Partial<
  Record<"firstName" | "lastName" | "email" | "password" | "terms", string>
>;

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedGuidelines, setAcceptedGuidelines] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [emailSent, setEmailSent] = useState(false);

  function validate() {
    const next: FormErrors = {};
    if (!firstName.trim()) next.firstName = "Ingresa tu nombre";
    if (!lastName.trim()) next.lastName = "ingresa tu apellido";
    if (!isInstitutionalEmail(email))
      next.email = "Usa un correo de  UTT, UAdeC or Tec. Laguna";
    if (password.length < MinPasswordLength)
      next.password = `Usa minimo ${MinPasswordLength} Caracteres`;
    if (!acceptedPrivacy || !acceptedGuidelines)
      next.terms = "Por favor acepta los terminos y condiciones de uso";
    return next;
  }

  function handleRegister() {
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    // TODO: crear la cuenta en el backend y enviar el correo de verificación
    setEmailSent(true);
  }

  function handleResend() {
    // TODO: reenviar el correo de verificación desde el backend
  }

  if (emailSent) {
    return (
      <AuthScreen>
        <AuthHeader
          title="Almost there"
          subtitle="Verify your school email to activate your Kampus account"
        />
        <View style={styles.form}>
          <CheckEmailCard email={email.trim()} onResend={handleResend} />
        </View>
        <AuthFooter
          question="Already verified?"
          linkText="Log in"
          href="/auth/login"
        />
      </AuthScreen>
    );
  }

  return (
    <AuthScreen>
      <AuthHeader
        withLogo={false}
        title="Crea tu cuenta"
        subtitle="Unete con tu correo institucional"
      />

      <View style={styles.form}>
        <TextField
          label="Nombre"
          icon={{ ios: "person", android: "person", web: "person" }}
          placeholder="Nombre"
          value={firstName}
          onChangeText={setFirstName}
          error={errors.firstName}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
        />
        <TextField
          label="Apellido"
          icon={{ ios: "person", android: "person", web: "person" }}
          placeholder="Apellido"
          value={lastName}
          onChangeText={setLastName}
          error={errors.lastName}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
        />

        <TextField
          label="Correo Institucional"
          icon={{ ios: "envelope", android: "mail", web: "mail" }}
          placeholder="matricula@utt.edu.mx"
          value={email}
          onChangeText={setEmail}
          hint="UTT, UAdeC y Tec. Laguna"
          error={errors.email}
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
          error={errors.password}
          password
          autoComplete="new-password"
          textContentType="newPassword"
        />

        <View style={styles.checks}>
          <Checkbox
            label="Acepto los terminos privacidad"
            value={acceptedPrivacy}
            onValueChange={setAcceptedPrivacy}
          />
          <Checkbox
            label="Acepto reglas comunidad"
            value={acceptedGuidelines}
            onValueChange={setAcceptedGuidelines}
          />
          {errors.terms && (
            <ThemedText type="small" themeColor="danger" style={styles.error}>
              {errors.terms}
            </ThemedText>
          )}
        </View>

        <Button
          title="Iniciar Sesión"
          onPress={handleRegister}
          style={styles.button}
        />
      </View>

      <AuthFooter
        question="Ya tienes una cuenta?"
        linkText="Incia sesión"
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
  checks: {
    gap: 12,
    marginTop: Spacing.one,
  },
  error: {
    fontSize: 12,
    lineHeight: 16,
  },
  button: {
    marginTop: Spacing.two,
  },
});
