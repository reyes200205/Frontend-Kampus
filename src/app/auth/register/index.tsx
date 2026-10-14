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
    if (!lastName.trim()) next.lastName = "Ingresa tu apellido";
    if (!isInstitutionalEmail(email))
      next.email = "Usa tu correo institucional de la UTT, la UAdeC o el Tec Laguna.";
    if (password.length < MinPasswordLength)
      next.password = `Usa mínimo ${MinPasswordLength} caracteres`;
    if (!acceptedPrivacy || !acceptedGuidelines)
      next.terms = "Acepta el aviso de privacidad y las normas de comunidad para continuar.";
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
          title="Verificar cuenta"
          subtitle="Verifica tu correo electrónico para activar tu cuenta."
        />
        <View style={styles.form}>
          <CheckEmailCard email={email.trim()} onResend={handleResend} />
        </View>
        <AuthFooter
          question="¿Ya verificaste tu cuenta?"
          linkText="Iniciar sesión"
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
        subtitle="Únete con tu correo institucional."
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
          autoComplete="given-name"
          textContentType="givenName"
        />
        <TextField
          label="Apellido"
          icon={{ ios: "person", android: "person", web: "person" }}
          placeholder="Apellido"
          value={lastName}
          onChangeText={setLastName}
          error={errors.lastName}
          autoCapitalize="words"
          autoComplete="family-name"
          textContentType="familyName"
        />

        <TextField
          label="Correo institucional"
          icon={{ ios: "envelope", android: "mail", web: "mail" }}
          placeholder="matricula@utt.edu.mx"
          value={email}
          onChangeText={setEmail}
          hint="Dominios aceptados: UTT, UAdeC y Tec Laguna."
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
        />
        <TextField
          label="Contraseña"
          icon={{ ios: "lock", android: "lock", web: "lock" }}
          placeholder={`Mínimo ${MinPasswordLength} caracteres`}
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          password
          autoComplete="new-password"
          textContentType="newPassword"
        />

        <View style={styles.checks}>
          <Checkbox
            label="Acepto el"
            link={{ text: "Aviso de privacidad", href: "/legal/privacy" }}
            value={acceptedPrivacy}
            onValueChange={setAcceptedPrivacy}
          />
          <Checkbox
            label="Acepto las"
            link={{ text: "Normas de comunidad", href: "/legal/guidelines" }}
            value={acceptedGuidelines}
            onValueChange={setAcceptedGuidelines}
          />
          {errors.terms && (
            <ThemedText type="caption" themeColor="danger">
              {errors.terms}
            </ThemedText>
          )}
        </View>

        <Button
          title="Registrarse"
          onPress={handleRegister}
          style={styles.button}
        />
      </View>

      <AuthFooter
        question="¿Ya tienes una cuenta?"
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
  checks: {
    gap: Spacing.one,
  },
  button: {
    marginTop: Spacing.two,
  },
});
