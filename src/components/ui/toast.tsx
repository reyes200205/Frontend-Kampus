/**
 * Avisos breves después de una acción ("Grupo aprobado", "Cuenta desactivada"). Se muestran con
 * `showToast` desde cualquier lugar y los dibuja un único `<Toaster />` en el layout.
 */

import { SymbolView } from "expo-symbols";
import { useEffect, useSyncExternalStore } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useTheme } from "@/hooks/use-theme";

type ToastTone = "success" | "danger";

type Toast = { id: number; title: string; message?: string; tone: ToastTone };

const DurationMs = 4000;

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function showToast(toast: { title: string; message?: string; tone?: ToastTone }) {
  // Como máximo tres a la vez: el más viejo se va.
  toasts = [...toasts.slice(-2), { id: nextId++, tone: "success", ...toast }];
  emit();
}

function dismiss(id: number) {
  toasts = toasts.filter((toast) => toast.id !== id);
  emit();
}

export function Toaster() {
  const items = useSyncExternalStore(subscribe, () => toasts, () => toasts);
  const { isTablet } = useBreakpoint();
  const insets = useSafeAreaInsets();

  if (items.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.container,
        isTablet ? styles.containerWide : styles.containerNarrow,
        { bottom: insets.bottom + Spacing.four },
      ]}
    >
      {items.map((toast) => (
        <ToastCard key={toast.id} toast={toast} />
      ))}
    </View>
  );
}

function ToastCard({ toast }: { toast: Toast }) {
  const theme = useTheme();
  const color = toast.tone === "danger" ? theme.danger : theme.success;

  useEffect(() => {
    const timer = setTimeout(() => dismiss(toast.id), DurationMs);
    return () => clearTimeout(timer);
  }, [toast.id]);

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.toast, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}
    >
      <View style={[styles.icon, { borderColor: `${color}66`, backgroundColor: `${color}1F` }]}>
        <SymbolView
          name={
            toast.tone === "danger"
              ? { ios: "exclamationmark", android: "priority_high", web: "priority_high" }
              : { ios: "checkmark", android: "check", web: "check" }
          }
          size={16}
          tintColor={color}
        />
      </View>
      <View style={styles.texts}>
        <ThemedText type="smallBold">{toast.title}</ThemedText>
        {toast.message && (
          <ThemedText type="caption" themeColor="textSecondary">
            {toast.message}
          </ThemedText>
        )}
      </View>
      <Pressable
        onPress={() => dismiss(toast.id)}
        accessibilityRole="button"
        accessibilityLabel="Cerrar aviso"
        hitSlop={Spacing.two}
      >
        <SymbolView name={{ ios: "xmark", android: "close", web: "close" }} size={18} tintColor={theme.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    gap: Spacing.two,
  },
  containerWide: {
    right: Spacing.four,
    width: 380,
  },
  containerNarrow: {
    left: Spacing.three,
    right: Spacing.three,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  texts: {
    flex: 1,
    gap: Spacing.half,
  },
});
