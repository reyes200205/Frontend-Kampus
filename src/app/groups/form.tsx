import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { pickGroupImage } from "@/components/groups/pick-group-image";
import { FormScreen } from "@/components/layout/form-screen";
import { ThemedText } from "@/components/themed-text";
import { ChoiceField } from "@/components/ui/choice-field";
import { TextField } from "@/components/ui/text-field";
import { showToast } from "@/components/ui/toast";
import { GroupCategoryOptions } from "@/constants/management";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { ApiError } from "@/services/api";
import { createGroup, getGroup, updateGroup, uploadGroupImage } from "@/services/groups";
import type { Group, GroupCategory, GroupImageFile } from "@/types/groups";

/** Límites iguales a `StoreGroupRequest` del backend. */
const MaxNameLength = 120;
const MaxDescriptionLength = 1000;

type Errors = Partial<Record<"name" | "description" | "category" | "image" | "form", string>>;

/**
 * Crear o editar un grupo a pantalla completa, como en Facebook (T-18, RF-11): portada opcional, nombre,
 * categoría y descripción. Con `?groupId=` edita ese grupo (solo sus administradores). El grupo de un alumno
 * queda "En revisión" hasta que lo aprueba un moderador de su universidad (RF-23).
 */
export default function GroupFormScreen() {
  const params = useLocalSearchParams<{ groupId?: string }>();
  const groupId = params.groupId ? Number(params.groupId) : null;
  const [group, setGroup] = useState<Group | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (groupId === null) return;
    getGroup(groupId)
      .then(setGroup)
      .catch((e: unknown) => setLoadError(e instanceof ApiError ? e.message : "No pudimos cargar el grupo."));
  }, [groupId]);

  if (groupId !== null && !group) {
    return <LoadingForm error={loadError} />;
  }
  // Con `key`, el formulario arranca con los datos del grupo ya cargado.
  return <GroupForm key={group?.id ?? "new"} group={group ?? undefined} />;
}

function LoadingForm({ error }: { error: string | null }) {
  const theme = useTheme();
  return (
    <FormScreen title="Editar grupo" fallback="/groups" submitLabel="Guardar" onSubmit={() => undefined} canSubmit={false}>
      {error ? (
        <ThemedText type="small" themeColor="danger">
          {error}
        </ThemedText>
      ) : (
        <ActivityIndicator color={theme.accent} />
      )}
    </FormScreen>
  );
}

function GroupForm({ group }: { group?: Group }) {
  const theme = useTheme();
  const editing = group !== undefined;
  const [name, setName] = useState(group?.name ?? "");
  const [category, setCategory] = useState<GroupCategory | null>(group?.category ?? null);
  const [description, setDescription] = useState(group?.description ?? "");
  const [image, setImage] = useState<{ file: GroupImageFile; previewUri: string } | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const coverUri = image?.previewUri ?? group?.image_url ?? null;

  async function chooseImage() {
    const picked = await pickGroupImage();
    if (picked.kind === "invalid") setErrors((current) => ({ ...current, image: picked.message }));
    if (picked.kind === "picked") {
      setErrors((current) => ({ ...current, image: undefined }));
      setImage({ file: picked.file, previewUri: picked.previewUri });
    }
  }

  async function submit() {
    if (!name.trim() || !category) return;
    setErrors({});
    setSaving(true);

    const body = { name: name.trim(), description: description.trim() || null, category };
    let saved: Group;
    try {
      saved = editing ? await updateGroup(group.id, body) : await createGroup(body);
    } catch (e) {
      if (e instanceof ApiError) {
        setErrors({
          name: e.field("name"),
          description: e.field("description"),
          category: e.field("category"),
          form: Object.keys(e.fieldErrors).length === 0 ? e.message : undefined,
        });
      } else {
        setErrors({ form: "No se pudo guardar el grupo. Intenta de nuevo." });
      }
      setSaving(false);
      return;
    }

    if (image) {
      try {
        saved = await uploadGroupImage(saved.id, image.file);
      } catch (e) {
        // El grupo ya quedó guardado: se avisa y se sigue; la portada se puede cambiar desde "Editar".
        showToast({
          title: "El grupo se guardó, pero la portada no",
          message: e instanceof ApiError ? (e.field("image") ?? e.message) : "Intenta subirla de nuevo.",
          tone: "danger",
        });
      }
    }

    if (editing) {
      showToast({ title: "Cambios guardados", tone: "success" });
      router.back();
    } else {
      showToast({
        title: "Grupo creado",
        message: "Un moderador de tu universidad lo revisará. Mientras, lo ves en Tus grupos.",
      });
      // Reemplaza el formulario por el grupo nuevo: "atrás" regresa a Grupos, no al formulario.
      router.replace({ pathname: "/groups/[groupId]", params: { groupId: String(saved.id) } });
    }
  }

  return (
    <FormScreen
      title={editing ? "Editar grupo" : "Crear grupo"}
      fallback="/groups"
      submitLabel={editing ? "Guardar" : "Crear"}
      onSubmit={submit}
      canSubmit={name.trim().length > 0 && category !== null}
      loading={saving}
    >
      {/* Portada, como la de un grupo de Facebook. */}
      <View style={styles.field}>
        <Pressable
          onPress={chooseImage}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel={coverUri ? "Cambiar portada" : "Agregar portada"}
          style={({ pressed }) => [
            styles.cover,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            pressed && styles.pressed,
          ]}
        >
          {coverUri ? (
            <Image source={{ uri: coverUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : null}
          <View style={[styles.coverButton, { backgroundColor: theme.backgroundSelected }]}>
            <SymbolView name={{ ios: "photo", android: "image", web: "image" }} size={18} tintColor={theme.text} />
            <ThemedText type="smallBold">{coverUri ? "Cambiar portada" : "Agregar portada"}</ThemedText>
          </View>
        </Pressable>
        <ThemedText type="caption" themeColor={errors.image ? "danger" : "textSecondary"}>
          {errors.image ?? "Opcional. JPG, PNG o WebP de hasta 5 MB."}
        </ThemedText>
      </View>

      <TextField
        label="Nombre"
        placeholder="Asigna un nombre al grupo"
        value={name}
        onChangeText={setName}
        maxLength={MaxNameLength}
        error={errors.name}
      />

      <ChoiceField
        label="Categoría"
        options={GroupCategoryOptions}
        value={category}
        onChange={setCategory}
        error={errors.category}
      />

      <TextField
        label="Descripción (opcional)"
        placeholder="¿De qué trata el grupo y quién puede unirse?"
        value={description}
        onChangeText={setDescription}
        maxLength={MaxDescriptionLength}
        multiline
        error={errors.description}
      />

      {!editing && (
        <View style={[styles.note, { backgroundColor: theme.backgroundElement }]}>
          <SymbolView
            name={{ ios: "checkmark.shield", android: "verified_user", web: "verified_user" }}
            size={20}
            tintColor={theme.textSecondary}
          />
          <ThemedText type="small" themeColor="textSecondary" style={styles.flex}>
            Tu grupo quedará en revisión hasta que un moderador de tu universidad lo apruebe. Mientras, solo lo ven
            sus integrantes.
          </ThemedText>
        </View>
      )}

      {errors.form && (
        <ThemedText type="small" themeColor="danger">
          {errors.form}
        </ThemedText>
      )}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  field: {
    gap: Spacing.two,
  },
  cover: {
    width: "100%",
    aspectRatio: 16 / 9,
    maxHeight: 240,
    borderRadius: Radius.large,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  coverButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.full,
  },
  pressed: {
    opacity: 0.8,
  },
  note: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.medium,
  },
});
