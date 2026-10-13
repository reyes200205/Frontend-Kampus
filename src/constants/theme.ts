/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import "@/global.css";

import { Platform } from "react-native";

/** Colores neutros de cada modo: fondos, textos, bordes y error. */
const BaseColors = {
  light: {
    text: "#000000",
    background: "#ffffff",
    backgroundElement: "#F0F0F3",
    backgroundSelected: "#E0E1E6",
    textSecondary: "#60646C",
    placeholder: "#8B8D98",
    border: "#E0E1E6",
    danger: "#D93036",
  },
  dark: {
    text: "#F5F5F6",
    background: "#09090B",
    backgroundElement: "#141416",
    backgroundSelected: "#1F1F23",
    textSecondary: "#9A9AA2",
    placeholder: "#5E5E66",
    border: "#26262B",
    danger: "#FF5A5F",
  },
};

/**
 * Color de marca de cada tema, por modo.
 * - `accent`: botones primarios, enlaces, casillas marcadas.
 * - `onAccent`: texto encima de `accent`.
 * - `glow`: brillo del degradado superior de las pantallas de acceso.
 */
const Accents = {
  yellow: {
    light: { accent: "#D4A20B", onAccent: "#1A1A1E", glow: "rgba(245, 197, 24, 0.35)" },
    dark: { accent: "#cdca1cff", onAccent: "#ffffff", glow: "rgba(230, 208, 11, 0.92)" },
  },
  blue: {
    light: { accent: "#2563EB", onAccent: "#ffffff", glow: "rgba(37, 99, 235, 0.18)" },
    dark: { accent: "#3B82F6", onAccent: "#ffffff", glow: "rgba(59, 130, 246, 0.6)" },
  },
  green: {
    light: { accent: "#16A34A", onAccent: "#ffffff", glow: "rgba(22, 163, 74, 0.18)" },
    dark: { accent: "#22C55E", onAccent: "#06120A", glow: "rgba(34, 197, 94, 0.6)" },
  },
};

export type ThemeMode = keyof typeof BaseColors;
export type ThemeAccent = keyof typeof Accents;
export type ThemeName = `${ThemeMode}-${ThemeAccent}`;
export type Palette = (typeof BaseColors)[ThemeMode] & (typeof Accents)[ThemeAccent][ThemeMode];

function createTheme(mode: ThemeMode, accent: ThemeAccent): Palette {
  return { ...BaseColors[mode], ...Accents[accent][mode] };
}

/** Los 6 temas disponibles: `light-*` y `dark-*` en azul, amarillo y verde. */
export const Themes: Record<ThemeName, Palette> = {
  "light-yellow": createTheme("light", "yellow"),
  "light-blue": createTheme("light", "blue"),
  "light-green": createTheme("light", "green"),
  "dark-yellow": createTheme("dark", "yellow"),
  "dark-blue": createTheme("dark", "blue"),
  "dark-green": createTheme("dark", "green"),
};

/**
 * Tema que usa toda la app. Cámbialo aquí para probar otro:
 * "light-yellow" | "light-blue" | "light-green" | "dark-yellow" | "dark-blue" | "dark-green"
 */
export const ActiveTheme: ThemeName = "dark-yellow";

/** Modo del tema activo, para la barra de estado y la navegación. */
export const ActiveThemeMode: ThemeMode = ActiveTheme.startsWith("light") ? "light" : "dark";

/** Familias de Sora cargadas en `src/app/_layout.tsx`. */
export const FontFamily = {
  regular: "Sora_400Regular",
  medium: "Sora_500Medium",
  semibold: "Sora_600SemiBold",
  bold: "Sora_700Bold",
} as const;

export type ThemeColor = keyof Palette;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  small: 8,
  medium: 12,
  large: 24,
  full: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
