import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { TextField } from "@/components/ui/text-field";
import { Spacing } from "@/constants/theme";
import { ApiError } from "@/services/api";

type Props = {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onClose: () => void;
  /** Hace la petición con la contraseña; si falla, el diálogo muestra el error y sigue abierto. */
  onSubmit: (password: string) => Promise<void>;
};

/**
 * Pide la contraseña actual antes de un cambio de seguridad (activar o desactivar la verificación en dos
 * pasos, regenerar los códigos de respaldo). La API la revisa y responde `422` en `password` si no coincide.
 */
export function PasswordDialog({ visible, title, description, confirmLabel, onClose, onSubmit }: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Al cerrar (cancelar o terminar bien) se limpia: la contraseña no se queda en memoria entre acciones.
  function reset() {
    setPassword("");
    setError(null);
  }

  function close() {
    reset();
    onClose();
  }

  async function handleSubmit() {
    if (!password) {
      setError("Escribe tu contraseña.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await onSubmit(password);
      reset();
    } catch (e) {
      setError(e instanceof ApiError ? (e.field("password") ?? e.message) : "Ocurrió un error inesperado.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      visible={visible}
      title={title}
      description={description}
      onClose={close}
      busy={busy}
      footer={
        <>
          <Button title="Cancelar" variant="ghost" size="small" onPress={close} disabled={busy} />
          <Button title={confirmLabel} size="small" onPress={handleSubmit} loading={busy} />
        </>
      }
    >
      <View style={styles.body}>
        <TextField
          label="Contraseña actual"
          icon={{ ios: "lock", android: "lock", web: "lock" }}
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          password
          autoComplete="current-password"
          textContentType="password"
          autoFocus
          onSubmitEditing={handleSubmit}
        />
        {error && (
          <ThemedText type="small" themeColor="danger">
            {error}
          </ThemedText>
        )}
      </View>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: Spacing.two,
  },
});
