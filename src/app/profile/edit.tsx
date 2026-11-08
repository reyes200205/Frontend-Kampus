import { Redirect, router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { Screen } from "@/components/layout/screen";
import { InterestPicker } from "@/components/profile/interest-picker";
import { PhotoEditor } from "@/components/profile/photo-editor";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { DateField } from "@/components/ui/date-field";
import { TextField } from "@/components/ui/text-field";
import {
  MaxBioLength,
  MaxCareerLength,
  MaxSemester,
  latestBirthdate,
  MinInterests,
  validateBirthdate,
} from "@/constants/profile";
import { FontFamily, Spacing } from "@/constants/theme";
import { loadProfile, setProfile, useProfile } from "@/hooks/use-profile";
import { useSession } from "@/hooks/use-session";
import { useTheme } from "@/hooks/use-theme";
import { ApiError } from "@/services/api";
import { getInterests, updateInterests, updateProfile } from "@/services/profile";
import type { Interest, Profile, ProfileUpdate } from "@/types/profile";

/** Límite inferior razonable del selector; el superior es la edad mínima de 17 años (T-49). */
const MinBirthdate = new Date(1940, 0, 1);

type FormErrors = Partial<
  Record<"name" | "career" | "semester" | "birthdate" | "bio" | "interests" | "form", string>
>;

/** Editar perfil: fotos, datos e intereses (T-08, RF-03). */
export default function EditProfileScreen() {
  const theme = useTheme();
  const { isSignedIn } = useSession();
  const { profile, error } = useProfile();

  // Si se abre la ruta directo (p. ej. al recargar en web), todavía no hay perfil cargado.
  useEffect(() => {
    if (isSignedIn && !profile) loadProfile();
  }, [isSignedIn, profile]);

  // Está fuera de (tabs), así que repite su protección: sin sesión se va al inicio de sesión.
  if (!isSignedIn) return <Redirect href="/auth/login" />;

  if (!profile) {
    return (
      <Screen title="Editar perfil">
        <Card style={styles.state}>
          {error ? (
            <ThemedText type="small" themeColor="danger">
              {error}
            </ThemedText>
          ) : (
            <ActivityIndicator color={theme.accent} />
          )}
        </Card>
      </Screen>
    );
  }

  return <EditProfileForm profile={profile} />;
}

function EditProfileForm({ profile }: { profile: Profile }) {
  const details = profile.profile;
  const [name, setName] = useState(profile.user.name);
  const [career, setCareer] = useState(details?.career ?? "");
  const [semester, setSemester] = useState<number | null>(details?.semester ?? null);
  const [birthdate, setBirthdate] = useState(details?.birthdate ?? "");
  const [bio, setBio] = useState(details?.bio ?? "");
  const initialInterests = (details?.interests ?? []).map((interest) => interest.id);
  const [interestIds, setInterestIds] = useState<number[]>(initialInterests);
  const [catalog, setCatalog] = useState<Interest[] | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getInterests()
      .then(setCatalog)
      .catch(() => {
        setCatalog([]);
        setErrors((current) => ({ ...current, interests: "No se pudieron cargar los intereses." }));
      });
  }, []);

  const interestsChanged =
    interestIds.length !== initialInterests.length ||
    interestIds.some((id) => !initialInterests.includes(id));

  function validate() {
    const next: FormErrors = {};
    if (!name.trim()) next.name = "Escribe tu nombre.";
    next.birthdate = validateBirthdate(birthdate);
    if (bio.length > MaxBioLength) next.bio = `Usa máximo ${MaxBioLength} caracteres.`;
    if (interestsChanged && interestIds.length < MinInterests)
      next.interests = `Elige al menos ${MinInterests} intereses.`;
    return Object.fromEntries(Object.entries(next).filter(([, value]) => value)) as FormErrors;
  }

  async function handleSave() {
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const body: ProfileUpdate = {
      name: name.trim(),
      career: career.trim() || null,
      semester,
      birthdate: birthdate.trim() || null,
      bio: bio.trim() || null,
    };

    setSaving(true);
    try {
      let updated = await updateProfile(body);
      if (interestsChanged) updated = await updateInterests(interestIds);
      // El perfil compartido se actualiza con la respuesta: la pestaña Perfil lo muestra al instante.
      setProfile(updated);
      router.back();
    } catch (e) {
      if (!(e instanceof ApiError)) {
        setErrors({ form: "Ocurrió un error inesperado." });
      } else if (e.status === 422) {
        setErrors({
          name: e.field("name"),
          career: e.field("career"),
          semester: e.field("semester"),
          birthdate: e.field("birthdate"),
          bio: e.field("bio"),
          interests: e.field("interest_ids") ?? e.field("interest_ids.0"),
          form: Object.keys(e.fieldErrors).length === 0 ? e.message : undefined,
        });
      } else {
        setErrors({ form: e.message });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen
      title="Editar perfil"
      action={<Button title="Cancelar" variant="ghost" onPress={() => router.back()} />}
    >
      <Section title="Fotos" description="La primera es la que verán los demás en Descubrir.">
        <PhotoEditor photos={details?.photos ?? []} />
      </Section>

      <Section title="Datos">
        <TextField
          label="Nombre"
          icon={{ ios: "person", android: "person", web: "person" }}
          value={name}
          onChangeText={setName}
          error={errors.name}
          autoCapitalize="words"
          autoComplete="name"
          maxLength={255}
        />
        <TextField
          label="Carrera"
          icon={{ ios: "graduationcap", android: "school", web: "school" }}
          placeholder="Ej. Ingeniería en Software"
          value={career}
          onChangeText={setCareer}
          error={errors.career}
          autoCapitalize="sentences"
          maxLength={MaxCareerLength}
        />
        <View style={styles.field}>
          <ThemedText type="small" style={styles.label}>
            Semestre
          </ThemedText>
          <View style={styles.chips}>
            {Array.from({ length: MaxSemester }, (_, index) => index + 1).map((value) => (
              <Chip
                key={value}
                label={String(value)}
                selected={semester === value}
                onPress={() => setSemester(semester === value ? null : value)}
              />
            ))}
          </View>
          {errors.semester && (
            <ThemedText type="caption" themeColor="danger">
              {errors.semester}
            </ThemedText>
          )}
        </View>
        <DateField
          label="Fecha de nacimiento"
          placeholder="Elige tu fecha de nacimiento"
          value={birthdate}
          onChange={setBirthdate}
          hint="Solo se muestra tu edad."
          error={errors.birthdate}
          minimumDate={MinBirthdate}
          maximumDate={latestBirthdate()}
        />
        <TextField
          label="Sobre mí"
          placeholder="Cuéntales a otros estudiantes qué te gusta hacer."
          value={bio}
          onChangeText={setBio}
          hint={`${bio.length}/${MaxBioLength}`}
          error={errors.bio}
          multiline
          maxLength={MaxBioLength}
        />
      </Section>

      <Section title="Intereses" description="Te ayudan a encontrar estudiantes afines.">
        {catalog === null ? (
          <ActivityIndicator />
        ) : (
          <InterestPicker
            interests={catalog}
            selected={interestIds}
            onChange={setInterestIds}
            error={errors.interests}
          />
        )}
      </Section>

      {errors.form && (
        <ThemedText type="small" themeColor="danger" style={styles.center}>
          {errors.form}
        </ThemedText>
      )}

      <Button title="Guardar cambios" onPress={handleSave} loading={saving} />
    </Screen>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card style={styles.section}>
      <View>
        <ThemedText type="heading" accessibilityRole="header">
          {title}
        </ThemedText>
        {description && (
          <ThemedText type="caption" themeColor="textSecondary">
            {description}
          </ThemedText>
        )}
      </View>
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  state: {
    alignItems: "center",
    paddingVertical: Spacing.five,
  },
  section: {
    gap: Spacing.three,
  },
  field: {
    gap: Spacing.two,
  },
  label: {
    fontFamily: FontFamily.medium,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  center: {
    textAlign: "center",
  },
});
