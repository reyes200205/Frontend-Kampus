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
  Record<
    "fullName" | "email" | "password" | "confirmPassword" | "terms",
    string
  >
>;

export default function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedGuidelines, setAcceptedGuidelines] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [emailSent, setEmailSent] = useState(false);

  function validate() {
    const next: FormErrors = {};
    if (!fullName.trim()) next.fullName = "Enter your full name";
    if (!isInstitutionalEmail(email))
      next.email = "Use your UTT, UAdeC or Tec. Laguna email";
    if (password.length < MinPasswordLength)
      next.password = `Use at least ${MinPasswordLength} characters`;
    if (!acceptedPrivacy || !acceptedGuidelines)
      next.terms =
        "You must accept the privacy notice and community guidelines";
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
        title="Create your account"
        subtitle="Join your campus community with your school email"
      />

      <View style={styles.form}>
        <TextField
          label="Full name"
          icon={{ ios: "person", android: "person", web: "person" }}
          placeholder="Full name"
          value={fullName}
          onChangeText={setFullName}
          error={errors.fullName}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
        />
        <TextField
          label="School email"
          icon={{ ios: "envelope", android: "mail", web: "mail" }}
          placeholder="Email address"
          value={email}
          onChangeText={setEmail}
          hint="Only UTT, UAdeC and Tec. Laguna emails"
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
        />
        <TextField
          label="Password"
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
            label="I accept the privacy notice"
            value={acceptedPrivacy}
            onValueChange={setAcceptedPrivacy}
          />
          <Checkbox
            label="I accept the community guidelines"
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
          title="Sign up"
          onPress={handleRegister}
          style={styles.button}
        />
      </View>

      <AuthFooter
        question="Already have an account?"
        linkText="Log in"
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
