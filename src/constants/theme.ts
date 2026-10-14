/**
 * Sistema de diseño de Kampus: colores, tipografía, espaciados, radios y breakpoints.
 * La paleta oficial es la del anteproyecto (sección 15.2): tema oscuro con acento amarillo.
 * Todos los pares texto-fondo cumplen el contraste WCAG AA (4.5:1) (RNF-10).
 */

import "@/global.css";

import { Platform } from "react-native";

/** Colores neutros de cada modo: fondos, textos, bordes y error. */
const BaseColors = {
  light: {
    text: "#121215",
    background: "#FFFFFF",
    backgroundElement: "#F4F4F5",
    backgroundSelected: "#E4E4E7",
    textSecondary: "#60646C",
    placeholder: "#71717A",
    border: "#E4E4E7",
    danger: "#D93036",
  },
  dark: {
    /** Texto principal: 18.7:1 sobre `background`. */
    text: "#FFFFFF",
    /** Fondo principal de las pantallas. */
    background: "#121215",
    /** Tarjetas, campos de texto y barras de navegación. */
    backgroundElement: "#1A1A1E",
    /** Elementos elevados o seleccionados (chips activos, pestaña activa). */
    backgroundSelected: "#2C2C33",
    /** Texto de apoyo: 7.3:1 sobre `background`. */
    textSecondary: "#A1A1AA",
    /** Placeholder de los campos: 5.1:1 sobre `backgroundElement`. */
    placeholder: "#8B8B94",
    border: "#2C2C33",
    danger: "#FF6B6B",
  },
};

/**
 * Color de marca de cada tema, por modo.
 * - `accent`: relleno de botones primarios, casillas marcadas, pestaña activa, marcadores del mapa.
 * - `onAccent`: texto e íconos encima de `accent`.
 * - `accentText`: enlaces y texto con color de marca sobre `background`.
 * - `glow`: brillo del degradado superior de las pantallas de acceso.
 */
const Accents = {
  yellow: {
    light: {
      accent: "#F5C518",
      onAccent: "#121215",
      accentText: "#8A6500",
      glow: "rgba(245, 197, 24, 0.35)",
    },
    dark: {
      accent: "#F5C518",
      onAccent: "#121215",
      accentText: "#F5C518",
      glow: "rgba(245, 197, 24, 0.22)",
    },
  },
  blue: {
    light: {
      accent: "#2563EB",
      onAccent: "#FFFFFF",
      accentText: "#2563EB",
      glow: "rgba(37, 99, 235, 0.18)",
    },
    dark: {
      accent: "#3B82F6",
      onAccent: "#FFFFFF",
      accentText: "#3B82F6",
      glow: "rgba(59, 130, 246, 0.6)",
    },
  },
  green: {
    light: {
      accent: "#16A34A",
      onAccent: "#FFFFFF",
      accentText: "#15803D",
      glow: "rgba(22, 163, 74, 0.18)",
    },
    dark: {
      accent: "#22C55E",
      onAccent: "#06120A",
      accentText: "#22C55E",
      glow: "rgba(34, 197, 94, 0.6)",
    },
  },
};

export type ThemeMode = keyof typeof BaseColors;
export type ThemeAccent = keyof typeof Accents;
export type ThemeName = `${ThemeMode}-${ThemeAccent}`;
export type Palette = (typeof BaseColors)[ThemeMode] &
  (typeof Accents)[ThemeAccent][ThemeMode];

function createTheme(mode: ThemeMode, accent: ThemeAccent): Palette {
  return { ...BaseColors[mode], ...Accents[accent][mode] };
}

/** Los 6 temas disponibles: `light-*` y `dark-*` en amarillo, azul y verde. */
export const Themes: Record<ThemeName, Palette> = {
  "light-yellow": createTheme("light", "yellow"),
  "light-blue": createTheme("light", "blue"),
  "light-green": createTheme("light", "green"),
  "dark-yellow": createTheme("dark", "yellow"),
  "dark-blue": createTheme("dark", "blue"),
  "dark-green": createTheme("dark", "green"),
};

/**
 * Tema que usa toda la app. `dark-yellow` es la identidad oficial de Kampus;
 * los demás sirven para probar variantes:
 * "light-yellow" | "light-blue" | "light-green" | "dark-yellow" | "dark-blue" | "dark-green"
 */
export const ActiveTheme: ThemeName = "dark-yellow";

/** Modo del tema activo, para la barra de estado y la navegación. */
export const ActiveThemeMode: ThemeMode = ActiveTheme.startsWith("light")
  ? "light"
  : "dark";

/** Familias de Sora cargadas en `src/app/_layout.tsx`. */
export const FontFamily = {
  regular: "Sora_400Regular",
  medium: "Sora_500Medium",
  semibold: "Sora_600SemiBold",
  bold: "Sora_700Bold",
} as const;

/**
 * Escala tipográfica modular 1.25 (anteproyecto 15.3): base de 16 px, mínimo 12 px.
 * `ThemedText` la usa en sus variantes (`title`, `subtitle`, `heading`, `default`, `small`, `caption`).
 */
export const FontSize = {
  h1: 32,
  h2: 25,
  h3: 20,
  body: 16,
  small: 14,
  caption: 12,
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

/** Tamaño táctil mínimo de cualquier control (RNF-10). */
export const MinTouchSize = 44;

/**
 * Anchos a partir de los cuales cambia el layout (RNF-01: de 360 px a 1920 px).
 * - `tablet`: el contenido se centra con un ancho máximo.
 * - `desktop`: la navegación pasa de barra inferior a barra lateral.
 */
export const Breakpoints = {
  tablet: 768,
  desktop: 1024,
} as const;

/** Ancho de la barra lateral de navegación en escritorio (web). */
export const SidebarWidth = 240;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
/** Ancho máximo de formularios y tarjetas centradas (acceso, ajustes). */
export const MaxFormWidth = 440;
