import { useState } from "react";

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/date-field";
import { fromIsoDate, toIsoDate } from "@/components/ui/date-field.types";
import { Dialog } from "@/components/ui/dialog";
import { TextField } from "@/components/ui/text-field";
import { ApiError } from "@/services/api";
import { createGroupActivity, updateGroupActivity } from "@/services/groups";
import type { GroupActivity } from "@/types/groups";

/** Límites iguales a `StoreGroupActivityRequest` del backend. */
const MaxTitleLength = 150;
const MaxDescriptionLength = 1000;
const MaxLocationLength = 255;

type Errors = Partial<Record<"title" | "description" | "location" | "date" | "time" | "form", string>>;

export type ActivityFormDialogProps = {
  visible: boolean;
  groupId: number;
  /** Sin actividad, publica una nueva; con actividad, la edita. */
  activity?: GroupActivity;
  onClose: () => void;
  onSaved: (activity: GroupActivity) => void;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

/** "18:30" → [18, 30], o `null` si no es una hora válida de 24 horas. */
function parseTime(value: string): [number, number] | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours < 24 && minutes < 60 ? [hours, minutes] : null;
}

/**
 * Publicar o editar una actividad del grupo (T-18, RF-12): título, fecha y hora (en el futuro), lugar y
 * descripción. Solo los administradores de un grupo aprobado.
 */
export function ActivityFormDialog(props: ActivityFormDialogProps) {
  // Se monta de nuevo cada vez que se abre, así el formulario empieza con los datos actuales.
  return props.visible ? <ActivityForm {...props} /> : null;
}

function ActivityForm({ groupId, activity, onClose, onSaved }: ActivityFormDialogProps) {
  const editing = activity !== undefined;
  const start = activity ? new Date(activity.starts_at) : null;
  const [title, setTitle] = useState(activity?.title ?? "");
  const [date, setDate] = useState(start ? toIsoDate(start) : "");
  const [time, setTime] = useState(start ? `${pad(start.getHours())}:${pad(start.getMinutes())}` : "");
  const [location, setLocation] = useState(activity?.location ?? "");
  const [description, setDescription] = useState(activity?.description ?? "");
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  async function submit() {
    const next: Errors = {};
    if (!title.trim()) next.title = "Escribe el título de la actividad.";
    const day = fromIsoDate(date);
    if (!day) next.date = "Elige la fecha.";
    const clock = parseTime(time);
    if (!clock) next.time = "Escribe la hora en formato 24 h, por ejemplo 18:30.";
    let startsAt: Date | null = null;
    if (day && clock) {
      startsAt = new Date(day.getFullYear(), day.getMonth(), day.getDate(), clock[0], clock[1]);
      if (startsAt.getTime() <= Date.now()) next.time = "La actividad tiene que ser en el futuro.";
    }
    setErrors(next);
    if (Object.keys(next).length > 0 || !startsAt) return;

    setSaving(true);
    const body = {
      title: title.trim(),
      description: description.trim() || null,
      location: location.trim() || null,
      // Hora local del celular convertida a UTC; la API la regresa en ISO 8601.
      starts_at: startsAt.toISOString(),
    };
    try {
      const saved = editing
        ? await updateGroupActivity(groupId, activity.id, body)
        : await createGroupActivity(groupId, body);
      onSaved(saved);
    } catch (e) {
      if (e instanceof ApiError) {
        setErrors({
          title: e.field("title"),
          description: e.field("description"),
          location: e.field("location"),
          time: e.field("starts_at"),
          form: e.field("group") ?? (Object.keys(e.fieldErrors).length === 0 ? e.message : undefined),
        });
      } else {
        setErrors({ form: "No se pudo guardar la actividad. Intenta de nuevo." });
      }
      setSaving(false);
    }
  }

  return (
    <Dialog
      visible
      title={editing ? "Editar actividad" : "Nueva actividad"}
      description={editing ? undefined : "La verán todos los que abran el grupo."}
      onClose={onClose}
      busy={saving}
      maxWidth={560}
      footer={
        <>
          <Button title="Cancelar" variant="ghost" size="small" onPress={onClose} disabled={saving} />
          <Button title={editing ? "Guardar" : "Publicar"} size="small" onPress={submit} loading={saving} />
        </>
      }
    >
      <TextField
        label="Título"
        placeholder="Por ejemplo: Torneo relámpago"
        value={title}
        onChangeText={setTitle}
        maxLength={MaxTitleLength}
        error={errors.title}
      />
      <DateField
        label="Fecha"
        value={date}
        onChange={setDate}
        placeholder="Elige el día"
        minimumDate={new Date()}
        error={errors.date}
      />
      <TextField
        label="Hora"
        icon={{ ios: "clock", android: "schedule", web: "schedule" }}
        placeholder="18:30"
        value={time}
        onChangeText={setTime}
        keyboardType="numbers-and-punctuation"
        maxLength={5}
        hint="En formato de 24 horas."
        error={errors.time}
      />
      <TextField
        label="Lugar (opcional)"
        icon={{ ios: "mappin.and.ellipse", android: "location_on", web: "location_on" }}
        placeholder="Por ejemplo: Cancha principal"
        value={location}
        onChangeText={setLocation}
        maxLength={MaxLocationLength}
        error={errors.location}
      />
      <TextField
        label="Descripción (opcional)"
        placeholder="¿Qué van a hacer y qué hay que llevar?"
        value={description}
        onChangeText={setDescription}
        maxLength={MaxDescriptionLength}
        multiline
        error={errors.description}
      />
      {errors.form && (
        <ThemedText type="small" themeColor="danger">
          {errors.form}
        </ThemedText>
      )}
    </Dialog>
  );
}
