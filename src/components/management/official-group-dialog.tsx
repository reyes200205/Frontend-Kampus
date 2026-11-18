import { useState } from "react";

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { ChoiceField } from "@/components/ui/choice-field";
import { Dialog } from "@/components/ui/dialog";
import { TextField } from "@/components/ui/text-field";
import { GroupCategoryOptions, Universities } from "@/constants/management";
import { createOfficialGroup } from "@/services/admin";
import { ApiError } from "@/services/api";
import type { AdminGroup, GroupCategory } from "@/types/admin";

const MaxNameLength = 120;
const MaxDescriptionLength = 1000;

/** `0` en el selector = grupo interinstitucional (sin universidad). */
const AllUniversities = 0;

type Errors = Partial<Record<"name" | "description" | "category" | "university_id" | "form", string>>;

export type OfficialGroupDialogProps = {
  visible: boolean;
  /** Solo un administrador elige la universidad; el grupo de un moderador es de la suya. */
  canChooseUniversity: boolean;
  onClose: () => void;
  onCreated: (group: AdminGroup) => void;
};

/** Grupo oficial (T-42, RF-12): lo crea el staff, se publica sin revisión y lleva la insignia "Oficial". */
export function OfficialGroupDialog(props: OfficialGroupDialogProps) {
  // Se monta de nuevo cada vez que se abre, así el formulario empieza vacío.
  return props.visible ? <OfficialGroupForm {...props} /> : null;
}

function OfficialGroupForm({ canChooseUniversity, onClose, onCreated }: OfficialGroupDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<GroupCategory | null>(null);
  const [universityId, setUniversityId] = useState<number>(AllUniversities);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  async function submit() {
    const next: Errors = {};
    if (!name.trim()) next.name = "Escribe el nombre del grupo.";
    if (!category) next.category = "Elige una categoría.";
    setErrors(next);
    if (Object.keys(next).length > 0 || !category) return;

    setSaving(true);
    try {
      const group = await createOfficialGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        // Un moderador no puede mandar `university_id`: el backend usa la suya.
        ...(canChooseUniversity ? { university_id: universityId === AllUniversities ? null : universityId } : {}),
      });
      onCreated(group);
    } catch (e) {
      if (e instanceof ApiError) {
        setErrors({
          name: e.field("name"),
          description: e.field("description"),
          category: e.field("category"),
          university_id: e.field("university_id"),
          form: Object.keys(e.fieldErrors).length === 0 ? e.message : undefined,
        });
      } else {
        setErrors({ form: "No se pudo crear el grupo. Intenta de nuevo." });
      }
      setSaving(false);
    }
  }

  return (
    <Dialog
      visible
      title="Grupo oficial"
      description="Se publica sin revisión y lleva la insignia “Oficial”."
      onClose={onClose}
      busy={saving}
      maxWidth={560}
      footer={
        <>
          <Button title="Cancelar" variant="ghost" size="small" onPress={onClose} disabled={saving} />
          <Button title="Crear grupo" size="small" onPress={submit} loading={saving} />
        </>
      }
    >
      <TextField
        label="Nombre"
        placeholder="Por ejemplo: Club de Robótica"
        value={name}
        onChangeText={setName}
        maxLength={MaxNameLength}
        error={errors.name}
      />
      <TextField
        label="Descripción (opcional)"
        placeholder="¿De qué trata el grupo?"
        value={description}
        onChangeText={setDescription}
        maxLength={MaxDescriptionLength}
        multiline
        error={errors.description}
      />
      <ChoiceField
        label="Categoría"
        options={GroupCategoryOptions}
        value={category}
        onChange={setCategory}
        error={errors.category}
      />
      {canChooseUniversity && (
        <ChoiceField
          label="Universidad"
          options={[
            { value: AllUniversities, label: "Todas" },
            ...Universities.map((item) => ({ value: item.id, label: item.short_name })),
          ]}
          value={universityId}
          onChange={setUniversityId}
          hint="Con “Todas”, el grupo es interinstitucional."
          error={errors.university_id}
        />
      )}
      {errors.form && (
        <ThemedText type="small" themeColor="danger">
          {errors.form}
        </ThemedText>
      )}
    </Dialog>
  );
}
