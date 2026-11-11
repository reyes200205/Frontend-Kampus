import { Redirect, router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { InterestPicker } from "@/components/profile/interest-picker";
import { PhotoEditor } from "@/components/profile/photo-editor";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { DateField } from "@/components/ui/date-field";
import { TextField } from "@/components/ui/text-field";
import {
  GenderOptions,
  latestBirthdate,
  MaxBioLength,
  MaxCareerLength,
  MaxSemester,
  MinAge,
  MinInterests,
  validateBirthdate,
} from "@/constants/profile";
import { MaxFormWidth, MinTouchSize, Radius, Spacing } from "@/constants/theme";
import { endSession } from "@/hooks/end-session";
import { loadProfile, setProfile, useProfile } from "@/hooks/use-profile";
import { updateSessionUser, useSession } from "@/hooks/use-session";
import { useTheme } from "@/hooks/use-theme";
import { ApiError } from "@/services/api";
import { getInterests, updateInterests, updateProfile } from "@/services/profile";
import type { Gender, Interest, Profile, ProfileStep } from "@/types/profile";

/** Pasos obligatorios, en el orden que manda el backend en `completion.missing` (T-49). */
const Steps: { key: ProfileStep; title: string; subtitle: string }[] = [
  { key: "basics", title: "¿Cómo te llamas?", subtitle: "Así te verán los demás estudiantes." },
  { key: "gender", title: "¿Cómo te identificas?", subtitle: "Solo se muestra en tu perfil." },
  { key: "studies", title: "¿Qué estudias?", subtitle: "Ayuda a que te encuentren compañeros de tu carrera." },
  { key: "interests", title: "¿Qué te gusta?", subtitle: `Elige al menos ${MinInterests} intereses.` },
  { key: "photos", title: "Agrega tus fotos", subtitle: "La primera es la que verán en Descubrir. Sube al menos una." },
  { key: "bio", title: "Cuéntanos de ti", subtitle: "Unas líneas sobre lo que te gusta hacer." },
];

/** Límite inferior razonable del selector de fecha. */
const MinBirthdate = new Date(1940, 0, 1);

type Errors = Partial<Record<"name" | "birthdate" | "gender" | "career" | "semester" | "interests" | "bio" | "form", string>>;

/** Primer paso pendiente; si no falta nada, `null`. */
function firstMissing(profile: Profile | null): number | null {
  const missing = profile?.profile?.completion.missing ?? Steps.map((step) => step.key);
  const index = Steps.findIndex((step) => missing.includes(step.key));
  return index === -1 ? null : index;
}

/**
 * Perfil obligatorio por pasos (T-49). Al entrar con el perfil incompleto, la app trae aquí al
 * estudiante y no lo deja usar Descubrir hasta terminar. Cada paso se guarda en cuanto se continúa,
 * así que si cierra la app, al volver sigue en el primer paso que le falta.
 */
export default function OnboardingScreen() {
  const theme = useTheme();
  const { isSignedIn, user } = useSession();
  const { profile, loading, error: loadError } = useProfile();

  const [step, setStep] = useState<number | "done" | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [catalog, setCatalog] = useState<Interest[] | null>(null);

  const [name, setName] = useState(user?.name ?? "");
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [career, setCareer] = useState("");
  const [semester, setSemester] = useState<number | null>(null);
  const [interestIds, setInterestIds] = useState<number[]>([]);
  const [bio, setBio] = useState("");

  const prefilled = useRef(false);
  // Se espera la respuesta nueva: el perfil en memoria puede ser de antes de este inicio de sesión.
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    void loadProfile().then(() => setFetched(true));
  }, []);

  // Con el perfil cargado: se llenan los campos con lo que ya tenía y se abre el primer paso pendiente.
  useEffect(() => {
    if (!fetched || !profile || prefilled.current) return;
    prefilled.current = true;
    const details = profile.profile;
    setName(profile.user.name);
    setBirthdate(details?.birthdate ?? "");
    setGender(details?.gender ?? null);
    setCareer(details?.career ?? "");
    setSemester(details?.semester ?? null);
    setInterestIds(details?.interests.map((interest) => interest.id) ?? []);
    setBio(details?.bio ?? "");
    setStep(firstMissing(profile) ?? "done");
  }, [fetched, profile]);

  useEffect(() => {
    if (step === 3 && catalog === null) {
      getInterests()
        .then(setCatalog)
        .catch(() => setErrors({ form: "No se pudo cargar el catálogo de intereses." }));
    }
  }, [step, catalog]);

  if (!isSignedIn) return <Redirect href="/auth/login" />;

  /** Después de guardar: siguiente paso pendiente o la pantalla final. */
  function advance(updated: Profile, current: number) {
    if (updated.profile?.completion.completed) {
      setStep("done");
      return;
    }
    const missing = updated.profile?.completion.missing ?? [];
    const next = Steps.findIndex((item, index) => index > current && missing.includes(item.key));
    setStep(next !== -1 ? next : (firstMissing(updated) ?? "done"));
  }

  async function save(current: number, action: () => Promise<Profile>) {
    setSaving(true);
    setErrors({});
    try {
      const updated = await action();
      setProfile(updated);
      advance(updated, current);
    } catch (e) {
      if (e instanceof ApiError && e.status === 422) {
        setErrors({
          name: e.field("name"),
          birthdate: e.field("birthdate"),
          gender: e.field("gender"),
          career: e.field("career"),
          semester: e.field("semester"),
          interests: e.field("interest_ids"),
          bio: e.field("bio"),
          form: Object.keys(e.fieldErrors).length === 0 ? e.message : undefined,
        });
      } else {
        setErrors({ form: e instanceof ApiError ? e.message : "No se pudo guardar. Intenta de nuevo." });
      }
    } finally {
      setSaving(false);
    }
  }

  function handleContinue() {
    if (typeof step !== "number") return;
    const key = Steps[step].key;
    const next: Errors = {};

    if (key === "basics") {
      if (name.trim().length < 2) next.name = "Escribe tu nombre.";
      if (!birthdate.trim()) next.birthdate = "Elige tu fecha de nacimiento.";
      else next.birthdate = validateBirthdate(birthdate);
    }
    if (key === "gender" && !gender) next.gender = "Elige una opción.";
    if (key === "studies") {
      if (!career.trim()) next.career = "Escribe tu carrera.";
      if (semester === null) next.semester = "Elige tu semestre.";
    }
    if (key === "interests" && interestIds.length < MinInterests) {
      next.interests = `Elige al menos ${MinInterests} intereses.`;
    }
    if (key === "bio" && !bio.trim()) next.bio = "Escribe algo sobre ti.";

    const clean = Object.fromEntries(Object.entries(next).filter(([, value]) => value)) as Errors;
    setErrors(clean);
    if (Object.keys(clean).length > 0) return;

    if (key === "basics") void save(step, () => updateProfile({ name: name.trim(), birthdate: birthdate.trim() }));
    if (key === "gender" && gender) void save(step, () => updateProfile({ gender }));
    if (key === "studies") void save(step, () => updateProfile({ career: career.trim(), semester }));
    if (key === "interests") void save(step, () => updateInterests(interestIds));
    if (key === "bio") void save(step, () => updateProfile({ bio: bio.trim() }));
    if (key === "photos" && profile) {
      // Las fotos se guardan al subirlas (PhotoEditor); aquí solo se revisa que haya al menos una.
      if ((profile.profile?.photos.length ?? 0) === 0) {
        setErrors({ form: "Sube al menos una foto para continuar." });
        return;
      }
      advance(profile, step);
    }
  }

  async function handleSignOut() {
    await endSession({ revoke: true });
    router.replace("/auth/login");
  }

  function finish() {
    updateSessionUser({ profile_completed: true });
    router.replace("/");
  }

  if (step === null) {
    return (
      <SafeAreaView style={[styles.flex, styles.centered, { backgroundColor: theme.background }]}>
        {loadError && !loading ? (
          <View style={styles.loadError}>
            <ThemedText type="small" themeColor="danger" style={styles.center}>
              {loadError}
            </ThemedText>
            <Button title="Reintentar" variant="secondary" onPress={() => void loadProfile()} />
          </View>
        ) : (
          <ActivityIndicator color={theme.accent} size="large" />
        )}
      </SafeAreaView>
    );
  }

  if (step === "done") {
    const firstName = (profile?.user.name ?? name).split(" ")[0];
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]}>
        <View style={[styles.inner, styles.doneContent]}>
          <View style={[styles.doneIcon, { backgroundColor: theme.accent }]}>
            <SymbolView
              name={{ ios: "checkmark", android: "check", web: "check" }}
              size={40}
              tintColor={theme.onAccent}
            />
          </View>
          <ThemedText type="title" style={styles.center}>
            ¡Listo, {firstName}!
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.center}>
            Tu perfil está completo. Ya puedes descubrir a otros estudiantes de tu campus.
          </ThemedText>
          <Button title="Empezar a descubrir" onPress={finish} style={styles.stretch} />
        </View>
      </SafeAreaView>
    );
  }

  const current = Steps[step];
  const photos = profile?.profile?.photos ?? [];

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <View style={styles.header}>
          <Pressable
            onPress={() => setStep(step - 1)}
            disabled={step === 0 || saving}
            accessibilityRole="button"
            accessibilityLabel="Paso anterior"
            hitSlop={Spacing.two}
            style={({ pressed }) => [styles.headerButton, step === 0 && styles.hidden, pressed && styles.pressed]}
          >
            <SymbolView
              name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }}
              size={22}
              tintColor={theme.text}
            />
          </Pressable>
          <View style={styles.progress} accessibilityLabel={`Paso ${step + 1} de ${Steps.length}`}>
            {Steps.map((item, index) => (
              <View
                key={item.key}
                style={[
                  styles.segment,
                  { backgroundColor: index <= step ? theme.accent : theme.backgroundSelected },
                ]}
              />
            ))}
          </View>
          <Pressable
            onPress={() => void handleSignOut()}
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
            hitSlop={Spacing.two}
            style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
          >
            <ThemedText type="caption" themeColor="textSecondary">
              Salir
            </ThemedText>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.inner}>
            <View style={styles.titles}>
              <ThemedText type="caption" themeColor="accentText">
                PASO {step + 1} DE {Steps.length}
              </ThemedText>
              <ThemedText type="title" accessibilityRole="header">
                {current.title}
              </ThemedText>
              <ThemedText themeColor="textSecondary">{current.subtitle}</ThemedText>
            </View>

            {current.key === "basics" && (
              <>
                <TextField
                  label="Nombre completo"
                  icon={{ ios: "person", android: "person", web: "person" }}
                  value={name}
                  onChangeText={setName}
                  error={errors.name}
                  autoCapitalize="words"
                  autoComplete="name"
                  maxLength={255}
                />
                <DateField
                  label="Fecha de nacimiento"
                  placeholder="Elige tu fecha de nacimiento"
                  value={birthdate}
                  onChange={setBirthdate}
                  hint={`Solo se muestra tu edad. Debes tener al menos ${MinAge} años.`}
                  error={errors.birthdate}
                  minimumDate={MinBirthdate}
                  maximumDate={latestBirthdate()}
                />
              </>
            )}

            {current.key === "gender" && (
              <Field error={errors.gender}>
                {GenderOptions.map((option) => (
                  <Option
                    key={option.value}
                    label={option.label}
                    selected={gender === option.value}
                    onPress={() => setGender(option.value)}
                  />
                ))}
              </Field>
            )}

            {current.key === "studies" && (
              <>
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
                <Field label="Semestre" error={errors.semester}>
                  <View style={styles.chips}>
                    {Array.from({ length: MaxSemester }, (_, index) => index + 1).map((value) => (
                      <Chip
                        key={value}
                        label={String(value)}
                        selected={semester === value}
                        onPress={() => setSemester(value)}
                      />
                    ))}
                  </View>
                </Field>
              </>
            )}

            {current.key === "interests" &&
              (catalog === null ? (
                <ActivityIndicator color={theme.accent} />
              ) : (
                <InterestPicker
                  interests={catalog}
                  selected={interestIds}
                  onChange={setInterestIds}
                  error={errors.interests}
                />
              ))}

            {current.key === "photos" && <PhotoEditor photos={photos} />}

            {current.key === "bio" && (
              <TextField
                label="Sobre mí"
                placeholder="Ej. Me gusta el fútbol, el café y aprender idiomas."
                value={bio}
                onChangeText={setBio}
                hint={`${bio.length}/${MaxBioLength}`}
                error={errors.bio}
                multiline
                maxLength={MaxBioLength}
              />
            )}

            {errors.form && (
              <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
                {errors.form}
              </ThemedText>
            )}
          </View>
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
          <View style={styles.inner}>
            <Button
              title={step === Steps.length - 1 ? "Terminar" : "Continuar"}
              onPress={handleContinue}
              loading={saving}
              disabled={current.key === "photos" && photos.length === 0}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, error, children }: { label?: string; error?: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      {label && <ThemedText type="small">{label}</ThemedText>}
      {children}
      {error && (
        <ThemedText type="caption" themeColor="danger" accessibilityRole="alert">
          {error}
        </ThemedText>
      )}
    </View>
  );
}

/** Opción de una sola respuesta, con el círculo de selección a la derecha. */
function Option({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.option,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: selected ? theme.accent : theme.border,
        },
        pressed && styles.pressed,
      ]}
    >
      <ThemedText style={styles.flex}>{label}</ThemedText>
      <View style={[styles.radio, { borderColor: selected ? theme.accent : theme.border }]}>
        {selected && <View style={[styles.radioDot, { backgroundColor: theme.accent }]} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    textAlign: "center",
  },
  loadError: {
    gap: Spacing.three,
    padding: Spacing.four,
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  headerButton: {
    minWidth: MinTouchSize,
    height: MinTouchSize,
    alignItems: "center",
    justifyContent: "center",
  },
  hidden: {
    opacity: 0,
  },
  pressed: {
    opacity: 0.7,
  },
  progress: {
    flex: 1,
    flexDirection: "row",
    gap: Spacing.one,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: Radius.full,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
  },
  inner: {
    width: "100%",
    maxWidth: MaxFormWidth,
    alignSelf: "center",
    gap: Spacing.four,
  },
  titles: {
    gap: Spacing.two,
  },
  field: {
    gap: Spacing.two,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    minHeight: MinTouchSize + 12,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: 1.5,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: Radius.full,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: Radius.full,
  },
  footer: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  stretch: {
    alignSelf: "stretch",
  },
  doneContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.four,
  },
  doneIcon: {
    width: 88,
    height: 88,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
