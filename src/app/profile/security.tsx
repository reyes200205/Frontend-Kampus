import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { StackHeader } from "@/components/layout/stack-header";
import { PasswordDialog } from "@/components/security/password-dialog";
import { RecoveryCodes } from "@/components/security/recovery-codes";
import { TwoFactorSetup } from "@/components/security/two-factor-setup";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { MenuGroup, MenuRow } from "@/components/ui/menu-list";
import { showToast } from "@/components/ui/toast";
import { MaxFormWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { ApiError } from "@/services/api";
import {
  disableTwoFactor,
  getTwoFactorStatus,
  regenerateRecoveryCodes,
  startTwoFactor,
} from "@/services/security";
import type { TwoFactorSetup as Setup, TwoFactorStatus } from "@/types/security";

/** Qué se ve debajo del encabezado: el estado, el QR para activar o los códigos recién generados. */
type View_ =
  | { kind: "status" }
  | { kind: "setup"; setup: Setup }
  | { kind: "codes"; codes: string[] };

/** Acción que espera la contraseña actual en el diálogo. */
type PasswordAction = "enable" | "disable" | "regenerate";

const PasswordCopy: Record<PasswordAction, { title: string; description: string; confirm: string }> = {
  enable: {
    title: "Activar verificación en dos pasos",
    description: "Confirma tu contraseña para empezar. Después vas a escanear un código QR con tu app de autenticación.",
    confirm: "Continuar",
  },
  disable: {
    title: "Desactivar verificación en dos pasos",
    description: "Tu cuenta volverá a pedir solo la contraseña al iniciar sesión. Tus códigos de respaldo dejarán de servir.",
    confirm: "Desactivar",
  },
  regenerate: {
    title: "Generar códigos nuevos",
    description: "Los códigos de respaldo que tienes ahora dejarán de servir.",
    confirm: "Generar",
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Seguridad (Perfil → Seguridad, T-50): por ahora la verificación en dos pasos con una app de
 * autenticación (API de T-47). Las sesiones activas y el cambio de contraseña irán en su propio `MenuGroup`.
 */
export default function SecurityScreen() {
  const theme = useTheme();
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [view, setView] = useState<View_>({ kind: "status" });
  // La acción se conserva al cerrar para que el texto del diálogo no cambie mientras desaparece.
  const [action, setAction] = useState<PasswordAction>("enable");
  const [askingPassword, setAskingPassword] = useState(false);

  function askPassword(next: PasswordAction) {
    setAction(next);
    setAskingPassword(true);
  }

  // El estado solo se actualiza cuando responde la API (al abrir, al reintentar y después de cada cambio).
  const load = useCallback(
    () =>
      getTwoFactorStatus()
        .then((next) => {
          setStatus(next);
          setLoadError(null);
        })
        .catch((e: unknown) => {
          setLoadError(e instanceof ApiError ? e.message : "No se pudo cargar la configuración de seguridad.");
        }),
    [],
  );

  useEffect(() => {
    void load();
  }, [load]);

  async function handlePassword(password: string) {
    if (action === "enable") {
      const setup = await startTwoFactor(password);
      setView({ kind: "setup", setup });
    } else if (action === "disable") {
      await disableTwoFactor(password);
      showToast({ title: "Verificación en dos pasos desactivada", tone: "success" });
      await load();
    } else {
      setView({ kind: "codes", codes: await regenerateRecoveryCodes(password) });
    }
    setAskingPassword(false);
  }

  function backToStatus() {
    setView({ kind: "status" });
    load();
  }

  function renderContent() {
    if (view.kind === "setup") {
      return (
        <TwoFactorSetup
          setup={view.setup}
          onConfirmed={(codes) => {
            showToast({ title: "Verificación en dos pasos activada", tone: "success" });
            setView({ kind: "codes", codes });
          }}
          // El secreto queda pendiente en el backend; al volver a activar se genera uno nuevo.
          onCancel={backToStatus}
        />
      );
    }

    if (view.kind === "codes") return <RecoveryCodes codes={view.codes} onDone={backToStatus} />;

    if (loadError) {
      return (
        <View style={styles.center}>
          <ThemedText type="small" themeColor="danger" style={styles.centerText}>
            {loadError}
          </ThemedText>
          <Button title="Reintentar" variant="secondary" size="small" onPress={load} />
        </View>
      );
    }

    if (!status) {
      return (
        <View style={styles.center}>
          <ActivityIndicator color={theme.accent} />
        </View>
      );
    }

    return status.enabled ? (
      <MenuGroup
        title="Verificación en dos pasos"
        footer={
          status.confirmed_at
            ? `Activa desde el ${formatDate(status.confirmed_at)}. Al iniciar sesión te pedimos el código de tu app.`
            : "Al iniciar sesión te pedimos el código de tu app."
        }
      >
        <MenuRow
          icon={{ ios: "key", android: "key", web: "key" }}
          label="Códigos de respaldo"
          value={
            status.recovery_codes_left === 1
              ? "Te queda 1 código"
              : `Te quedan ${status.recovery_codes_left} códigos`
          }
          onPress={() => askPassword("regenerate")}
        />
        <MenuRow
          icon={{ ios: "lock.slash", android: "lock_open", web: "lock_open" }}
          label="Desactivar verificación en dos pasos"
          destructive
          onPress={() => askPassword("disable")}
        />
      </MenuGroup>
    ) : (
      <MenuGroup
        title="Verificación en dos pasos"
        footer="Además de tu contraseña, al iniciar sesión te pediremos un código de una app de autenticación en tu celular."
      >
        <MenuRow
          icon={{ ios: "lock.shield", android: "shield", web: "shield" }}
          label="Activar verificación en dos pasos"
          value={status.pending_confirmation ? "No terminaste de activarla" : "Desactivada"}
          onPress={() => askPassword("enable")}
        />
      </MenuGroup>
    );
  }

  return (
    <SafeAreaView edges={["top", "left", "right", "bottom"]} style={[styles.flex, { backgroundColor: theme.background }]}>
      <StackHeader title="Seguridad" fallback="/profile" />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.inner}>{renderContent()}</View>
      </ScrollView>

      <PasswordDialog
        visible={askingPassword}
        title={PasswordCopy[action].title}
        description={PasswordCopy[action].description}
        confirmLabel={PasswordCopy[action].confirm}
        onClose={() => setAskingPassword(false)}
        onSubmit={handlePassword}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.five,
  },
  inner: {
    width: "100%",
    maxWidth: MaxFormWidth,
    alignSelf: "center",
    gap: Spacing.four,
  },
  center: {
    alignItems: "center",
    gap: Spacing.three,
    paddingVertical: Spacing.five,
  },
  centerText: {
    textAlign: "center",
  },
});
