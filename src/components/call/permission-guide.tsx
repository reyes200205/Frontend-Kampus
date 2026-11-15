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

const DeniedSteps: Record<BrowserKind, string[]> = {
  ios: [
    "En Safari, toca el botón «aA» (o el ícono de ajustes) junto a la dirección.",
    "Entra a «Configuración del sitio web» y pon Cámara y Micrófono en «Permitir».",
    "Si no aparece, abre Ajustes del iPhone › Apps › Safari › Cámara y Micrófono y elige «Preguntar» o «Permitir».",
    "Vuelve a Kampus y toca «Reintentar».",
  ],
  android: [
    "En Chrome, toca el ícono a la izquierda de la dirección.",
    "Entra a «Permisos» y activa Cámara y Micrófono.",
    "Si siguen bloqueados, abre Ajustes del teléfono › Apps › Chrome › Permisos y permite Cámara y Micrófono.",
    "Vuelve a Kampus y toca «Reintentar».",
  ],
  desktop: [
    "Haz clic en el ícono a la izquierda de la dirección (candado o ajustes).",
    "Pon Cámara y Micrófono en «Permitir».",
    "Si tu computadora los bloquea, revisa la privacidad del sistema: en Windows, Configuración › Privacidad › Cámara y Micrófono; en macOS, Ajustes del Sistema › Privacidad y seguridad.",
    "Toca «Reintentar». Si no funciona, recarga la página.",
  ],
};

const Copy: Record<PermissionProblem, { title: string; message: string }> = {
  denied: {
    title: "Kampus no tiene acceso a tu cámara",
    message: "Para la videollamada necesitamos tu cámara y tu micrófono. Puedes darle permiso así:",
  },
  "no-device": {
    title: "No encontramos tu cámara o micrófono",
    message: "Conecta una cámara y un micrófono (o usa tu celular) y vuelve a intentar.",
  },
  "in-use": {
    title: "Tu cámara está ocupada",
    message: "Otra app o pestaña está usando la cámara o el micrófono. Ciérrala y vuelve a intentar.",
  },
  insecure: {
    title: "Esta conexión no permite usar la cámara",
    message:
      "Los navegadores solo dejan usar la cámara en páginas seguras (https) o en localhost. Abre Kampus desde su dirección https.",
  },
};

export type PermissionGuideProps = {
  problem: PermissionProblem;
  browser: BrowserKind;
  onRetry?: () => void;
  onCancel: () => void;
};

/** Qué pasó con el permiso de cámara y micrófono y cómo arreglarlo en el navegador de la persona (T-20). */
export function PermissionGuide({ problem, browser, onRetry, onCancel }: PermissionGuideProps) {
  const theme = useTheme();
  const { title, message } = Copy[problem];
  const steps = problem === "denied" ? DeniedSteps[browser] : [];

  return (
    <View style={styles.container} accessibilityRole="alert">
      <View style={[styles.iconCircle, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <SymbolView
          name={{ ios: "video.slash.fill", android: "videocam_off", web: "videocam_off" }}
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
