import { useState } from "react";

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { ChoiceField } from "@/components/ui/choice-field";
import { Dialog } from "@/components/ui/dialog";
import { TextField } from "@/components/ui/text-field";
import { MaxReasonLength, StaffRoleOptions, Universities } from "@/constants/management";
import { createStaff } from "@/services/admin";
import { ApiError } from "@/services/api";
import type { StaffMember, StaffRole } from "@/types/admin";

type Field = "name" | "email" | "role" | "university_id" | "password" | "password_confirmation" | "reason";
type Errors = Partial<Record<Field | "form", string>>;

const Fields: Field[] = ["name", "email", "role", "university_id", "password", "password_confirmation", "reason"];

export type StaffCreateDialogProps = {
  visible: boolean;
  onClose: () => void;
  onCreated: (member: StaffMember) => void;
};

/**
 * Alta de un moderador o administrador (T-41, RF-22). Solo administradores. La cuenta se crea ya
 * verificada; la contraseña inicial se le comunica a la persona por un medio seguro.
 */
export function StaffCreateDialog(props: StaffCreateDialogProps) {
  // Se monta de nuevo cada vez que se abre, así el formulario empieza vacío.
  return props.visible ? <StaffCreateForm {...props} /> : null;
}

function StaffCreateForm({ onClose, onCreated }: StaffCreateDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("moderator");
  const [universityId, setUniversityId] = useState<number | null>(null);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const moderator = role === "moderator";

  async function submit() {
    const next: Errors = {};
    if (!name.trim()) next.name = "Escribe el nombre.";
    if (!email.trim()) next.email = "Escribe el correo institucional.";
    if (moderator && universityId === null) next.university_id = "Elige la universidad que va a moderar.";
    if (!password) next.password = "Escribe la contraseña inicial.";
    if (password !== passwordConfirmation) next.password_confirmation = "Las contraseñas no coinciden.";
    if (!reason.trim()) next.reason = "Escribe el motivo del alta.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      const member = await createStaff({
        name: name.trim(),
        email: email.trim(),
        role,
        // Un administrador no lleva universidad: ve todas.
        ...(moderator && universityId !== null ? { university_id: universityId } : {}),
        password,
        password_confirmation: passwordConfirmation,
        reason: reason.trim(),
      });
      onCreated(member);
    } catch (e) {
      if (e instanceof ApiError) {
        setErrors({
          ...Object.fromEntries(Fields.map((field) => [field, e.field(field)])),
          form: Object.keys(e.fieldErrors).length === 0 ? e.message : undefined,
        });
      } else {
        setErrors({ form: "No se pudo dar de alta la cuenta. Intenta de nuevo." });
      }
      setSaving(false);
    }
  }

  return (
    <Dialog
      visible
      title="Dar de alta"
      description="Crea la cuenta de un moderador o administrador. Queda verificada desde el inicio."
      onClose={onClose}
      busy={saving}
      maxWidth={560}
      footer={
        <>
          <Button title="Cancelar" variant="ghost" size="small" onPress={onClose} disabled={saving} />
          <Button title="Dar de alta" size="small" onPress={submit} loading={saving} />
        </>
      }
    >
      <ChoiceField
        label="Rol"
        options={StaffRoleOptions}
        value={role}
        onChange={setRole}
        hint={
          moderator
            ? "Modera una sola universidad: su correo tiene que ser de esa universidad."
            : "Ve y gestiona todas las universidades."
        }
        error={errors.role}
      />
      {moderator && (
        <ChoiceField
          label="Universidad"
          options={Universities.map((item) => ({ value: item.id, label: item.short_name }))}
          value={universityId}
          onChange={setUniversityId}
          hint="No se puede cambiar después."
          error={errors.university_id}
        />
      )}
      <TextField label="Nombre" value={name} onChangeText={setName} maxLength={255} error={errors.name} />
      <TextField
        label="Correo institucional"
        placeholder="nombre@universidad.edu.mx"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={255}
        error={errors.email}
      />
      <TextField
        label="Contraseña inicial"
        value={password}
        onChangeText={setPassword}
        password
        autoCapitalize="none"
        hint="Mínimo 8 caracteres, con mayúsculas, minúsculas y números."
        error={errors.password}
      />
      <TextField
        label="Confirmar contraseña"
        value={passwordConfirmation}
        onChangeText={setPasswordConfirmation}
        password
        autoCapitalize="none"
        error={errors.password_confirmation}
      />
      <TextField
        label="Motivo"
        placeholder="Por ejemplo: moderación de la UTT para el piloto."
        value={reason}
        onChangeText={setReason}
        maxLength={MaxReasonLength}
        multiline
        hint="Queda en la bitácora de moderación."
        error={errors.reason}
      />
      {errors.form && (
        <ThemedText type="small" themeColor="danger">
          {errors.form}
        </ThemedText>
      )}
    </Dialog>
  );
}
