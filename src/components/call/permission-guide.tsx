import { SymbolView } from "expo-symbols";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/** En qué navegador está la persona, para darle los pasos que le tocan. */
export type BrowserKind = "ios" | "android" | "desktop";

/**
 * Por qué no se pudo usar la cámara:
 * - `denied`: la persona (o el navegador) bloqueó el permiso.
 * - `no-device`: no hay cámara o micrófono.
 * - `in-use`: otra app o pestaña está usando la cámara.
 * - `insecure`: la página no es https ni localhost, y el navegador no deja pedir la cámara.
 */
export type PermissionProblem = "denied" | "no-device" | "in-use" | "insecure";

/** Pasos para dar el permiso en cada navegador. `devices` es «Cámara y Micrófono» o solo «Micrófono». */
function deniedSteps(browser: BrowserKind, devices: string): string[] {
  switch (browser) {
    case "ios":
      return [
        "En Safari, toca el botón «aA» (o el ícono de ajustes) junto a la dirección.",
        `Entra a «Configuración del sitio web» y pon ${devices} en «Permitir».`,
        `Si no aparece, abre Ajustes del iPhone › Apps › Safari › ${devices} y elige «Preguntar» o «Permitir».`,
        "Vuelve a Kampus y toca «Reintentar».",
      ];
    case "android":
      return [
        "En Chrome, toca el ícono a la izquierda de la dirección.",
        `Entra a «Permisos» y activa ${devices}.`,
        `Si sigue bloqueado, abre Ajustes del teléfono › Apps › Chrome › Permisos y permite ${devices}.`,
        "Vuelve a Kampus y toca «Reintentar».",
      ];
    default:
      return [
        "Haz clic en el ícono a la izquierda de la dirección (candado o ajustes).",
        `Pon ${devices} en «Permitir».`,
        "Si tu computadora lo bloquea, revisa la privacidad del sistema: en Windows, Configuración › Privacidad; en macOS, Ajustes del Sistema › Privacidad y seguridad.",
        "Toca «Reintentar». Si no funciona, recarga la página.",
      ];
  }
}

function copyFor(problem: PermissionProblem, audioOnly: boolean): { title: string; message: string } {
  switch (problem) {
    case "denied":
      return audioOnly
        ? {
            title: "Kampus no tiene acceso a tu micrófono",
            message: "Para la llamada de voz necesitamos tu micrófono. Puedes darle permiso así:",
          }
        : {
            title: "Kampus no tiene acceso a tu cámara",
            message: "Para la videollamada necesitamos tu cámara y tu micrófono. Puedes darle permiso así:",
          };
    case "no-device":
      return audioOnly
        ? {
            title: "No encontramos tu micrófono",
            message: "Conecta un micrófono (o usa tu celular) y vuelve a intentar.",
          }
        : {
            title: "No encontramos tu cámara o micrófono",
            message: "Conecta una cámara y un micrófono (o usa tu celular) y vuelve a intentar.",
          };
    case "in-use":
      return audioOnly
        ? {
            title: "Tu micrófono está ocupado",
            message: "Otra app o pestaña está usando el micrófono. Ciérrala y vuelve a intentar.",
          }
        : {
            title: "Tu cámara está ocupada",
            message: "Otra app o pestaña está usando la cámara o el micrófono. Ciérrala y vuelve a intentar.",
          };
    case "insecure": {
      const device = audioOnly ? "el micrófono" : "la cámara";
      return {
        title: `Esta conexión no permite usar ${device}`,
        message: `Los navegadores solo dejan usar ${device} en páginas seguras (https) o en localhost. Abre Kampus desde su dirección https.`,
      };
    }
  }
}

export type PermissionGuideProps = {
  problem: PermissionProblem;
  browser: BrowserKind;
  /** Llamada de voz: solo hace falta el micrófono. */
  audioOnly?: boolean;
  onRetry?: () => void;
  onCancel: () => void;
};

/** Qué pasó con el permiso de cámara o micrófono y cómo arreglarlo en el navegador de la persona (T-20). */
export function PermissionGuide({ problem, browser, audioOnly = false, onRetry, onCancel }: PermissionGuideProps) {
  const theme = useTheme();
  const { title, message } = copyFor(problem, audioOnly);
  const steps = problem === "denied" ? deniedSteps(browser, audioOnly ? "Micrófono" : "Cámara y Micrófono") : [];

  return (
    <View style={styles.container} accessibilityRole="alert">
      <View style={[styles.iconCircle, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <SymbolView
          name={
            audioOnly
              ? { ios: "mic.slash.fill", android: "mic_off", web: "mic_off" }
              : { ios: "video.slash.fill", android: "videocam_off", web: "videocam_off" }
          }
          size={32}
          tintColor={theme.accent}
        />
      </View>
      <View style={styles.texts}>
        <ThemedText type="heading" style={styles.center}>
          {title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
          {message}
        </ThemedText>
      </View>
      {steps.length > 0 && (
        <View style={[styles.steps, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          {steps.map((step, index) => (
            <View key={step} style={styles.step}>
              <View style={[styles.number, { backgroundColor: theme.accent }]}>
                <ThemedText type="caption" style={{ color: theme.onAccent }}>
                  {index + 1}
                </ThemedText>
              </View>
              <ThemedText type="small" style={styles.flex}>
                {step}
              </ThemedText>
            </View>
          ))}
        </View>
      )}
      <View style={styles.actions}>
        {onRetry && problem !== "insecure" && <Button title="Reintentar" onPress={onRetry} />}
        <Button title="Volver al chat" variant="ghost" onPress={onCancel} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.four,
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.three,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  texts: {
    maxWidth: 400,
    gap: Spacing.two,
  },
  center: {
    textAlign: "center",
  },
  steps: {
    width: "100%",
    maxWidth: 440,
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: 1,
  },
  step: {
    flexDirection: "row",
    gap: Spacing.two,
    alignItems: "flex-start",
  },
  number: {
    width: 22,
    height: 22,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  flex: {
    flex: 1,
  },
  actions: {
    alignItems: "center",
    gap: Spacing.two,
  },
});
