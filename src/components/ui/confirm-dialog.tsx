import { useState } from "react";

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ApiError } from "@/services/api";

export type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onClose: () => void;
  /** Hace la acción; si falla, el diálogo muestra el mensaje de la API y sigue abierto. */
  onConfirm: () => Promise<void>;
};

/** Confirmación antes de una acción que no se deshace (salir de un grupo, borrarlo, borrar una actividad). */
export function ConfirmDialog(props: ConfirmDialogProps) {
  // Se monta de nuevo cada vez que se abre, así no arrastra el error de la vez anterior.
  return props.visible ? <ConfirmPanel {...props} /> : null;
}

function ConfirmPanel({ title, description, confirmLabel, onClose, onConfirm }: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch (e) {
      // 422 trae el motivo en un campo (p. ej. `group`: "Eres el único integrante…").
      const fields = e instanceof ApiError ? Object.values(e.fieldErrors)[0]?.[0] : undefined;
      setError(e instanceof ApiError ? (fields ?? e.message) : "Ocurrió un error inesperado.");
      setBusy(false);
    }
  }

  return (
    <Dialog
      visible
      title={title}
      description={description}
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <Button title="Cancelar" variant="ghost" size="small" onPress={onClose} disabled={busy} />
          <Button title={confirmLabel} size="small" onPress={confirm} loading={busy} />
        </>
      }
    >
      {error && (
        <ThemedText type="small" themeColor="danger">
          {error}
        </ThemedText>
      )}
    </Dialog>
  );
}
