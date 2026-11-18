import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { TextField } from "@/components/ui/text-field";
import { ApiError } from "@/services/api";

export type ReasonDialogProps = {
  visible: boolean;
  title: string;
  description?: string;
  label: string;
  placeholder?: string;
  hint?: string;
  confirmTitle: string;
  maxLength: number;
  /** Se llama con el motivo ya sin espacios. Si lanza un `ApiError`, su mensaje se muestra aquí. */
  onConfirm: (reason: string) => Promise<void>;
  onClose: () => void;
};

/**
 * Confirmación con motivo obligatorio de una acción de moderación (rechazar un grupo, desactivar una
 * cuenta). El motivo queda en la bitácora `moderation_actions`.
 */
export function ReasonDialog(props: ReasonDialogProps) {
  // Se monta de nuevo cada vez que se abre, así el formulario empieza vacío.
  return props.visible ? <ReasonDialogContent {...props} /> : null;
}

function ReasonDialogContent({
  title,
  description,
  label,
  placeholder,
  hint,
  confirmTitle,
  maxLength,
  onConfirm,
  onClose,
}: ReasonDialogProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  async function submit() {
    const value = reason.trim();
    if (!value) {
      setError("Escribe el motivo.");
      return;
    }
    setSaving(true);
    setError(undefined);
    try {
      await onConfirm(value);
    } catch (e) {
      setError(e instanceof ApiError ? (e.field("reason") ?? e.message) : "No se pudo guardar. Intenta de nuevo.");
      setSaving(false);
    }
  }

  return (
    <Dialog
      visible
      title={title}
      description={description}
      onClose={onClose}
      busy={saving}
      footer={
        <>
          <Button title="Cancelar" variant="ghost" size="small" onPress={onClose} disabled={saving} />
          <Button title={confirmTitle} size="small" onPress={submit} loading={saving} />
        </>
      }
    >
      <TextField
        label={label}
        placeholder={placeholder}
        hint={hint ?? `Hasta ${maxLength} caracteres.`}
        error={error}
        value={reason}
        onChangeText={setReason}
        maxLength={maxLength}
        multiline
        autoFocus
      />
    </Dialog>
  );
}
