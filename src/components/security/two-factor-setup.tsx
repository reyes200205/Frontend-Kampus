import { useState } from "react";
import { Linking, Platform, StyleSheet, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TextField } from "@/components/ui/text-field";
import { Fonts, Radius, Spacing } from "@/constants/theme";
import { ApiError } from "@/services/api";
import { confirmTwoFactor } from "@/services/security";
import type { TwoFactorSetup as Setup } from "@/types/security";

type Props = {
  setup: Setup;
  /** El código fue correcto: la verificación quedó activa y estos son los códigos de respaldo. */
  onConfirmed: (recoveryCodes: string[]) => void;
  onCancel: () => void;
};

/** El secreto en grupos de 4 para copiarlo a mano sin perderse (p. ej. `ABCD EFGH IJKL ...`). */
function groupSecret(secret: string) {
  return secret.replace(/(.{4})/g, "$1 ").trim();
}

/**
 * Activación de la verificación en dos pasos (T-50): QR con el `otpauth_url` para escanearlo con la app
 * de autenticación, el secreto para escribirlo a mano y el primer código para confirmar.
 */
export function TwoFactorSetup({ setup, onConfirmed, onCancel }: Props) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (code.length !== 6) {
      setError("Escribe el código de 6 dígitos que muestra tu app.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      onConfirmed(await confirmTwoFactor(code));
    } catch (e) {
      setError(e instanceof ApiError ? (e.field("code") ?? e.message) : "Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card style={styles.card}>
      <View style={styles.step}>
        <ThemedText type="smallBold">1. Escanea el código QR</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Abre Google Authenticator, Microsoft Authenticator u otra app de autenticación y escanea este código.
        </ThemedText>
      </View>

      {/* Fondo blanco siempre: con el tema oscuro, algunas cámaras no leen un QR invertido. */}
      <View style={styles.qr}>
        <QRCode value={setup.otpauth_url} size={184} color="#000000" backgroundColor="#FFFFFF" />
      </View>

      {/* En el celular, la app de autenticación puede estar en el mismo teléfono y no se puede escanear. */}
      {Platform.OS !== "web" && (
        <Button
          title="Abrir en mi app de autenticación"
          variant="secondary"
          icon={{ ios: "arrow.up.right.square", android: "open_in_new", web: "open_in_new" }}
          onPress={() => Linking.openURL(setup.otpauth_url).catch(() => undefined)}
        />
      )}

      <View style={styles.step}>
        <ThemedText type="small" themeColor="textSecondary">
          ¿No puedes escanearlo? Escribe esta clave en la app:
        </ThemedText>
        <ThemedText selectable style={styles.secret}>
          {groupSecret(setup.secret)}
        </ThemedText>
      </View>

      <View style={styles.step}>
        <ThemedText type="smallBold">2. Escribe el código que aparece en la app</ThemedText>
        <TextField
          label="Código de 6 dígitos"
          icon={{ ios: "lock.shield", android: "shield", web: "shield" }}
          placeholder="123456"
          value={code}
          onChangeText={(text) => setCode(text.replace(/\D/g, ""))}
          keyboardType="number-pad"
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          maxLength={6}
          onSubmitEditing={handleConfirm}
        />
        {error && (
          <ThemedText type="small" themeColor="danger">
            {error}
          </ThemedText>
        )}
      </View>

      <View style={styles.actions}>
        <Button title="Cancelar" variant="ghost" onPress={onCancel} disabled={loading} />
        <Button title="Activar" onPress={handleConfirm} loading={loading} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.four,
  },
  step: {
    gap: Spacing.two,
  },
  qr: {
    alignSelf: "center",
    padding: Spacing.three,
    borderRadius: Radius.medium,
    backgroundColor: "#FFFFFF",
  },
  secret: {
    fontFamily: Fonts?.mono,
    letterSpacing: 1,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.two,
  },
});
