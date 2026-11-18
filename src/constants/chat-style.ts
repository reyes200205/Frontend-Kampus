/**
 * Catálogo del estilo predeterminado del chat (Perfil → Apariencia): color de las burbujas propias y
 * fondo de las conversaciones. Es una preferencia del dispositivo; se guarda con `use-chat-style`.
 *
 * Los fondos son oscuros (el tema oficial es oscuro) para que las burbujas ajenas, la fecha y el texto
 * sigan cumpliendo contraste AA (RNF-10). Cada color de burbuja trae su color de texto con 4.5:1.
 */

import type { Palette } from "@/constants/theme";

export type BubbleColor = {
  id: string;
  name: string;
  /** `null`: usa el color de marca del tema (`accent` / `onAccent`). */
  background: string | null;
  text: string | null;
};

export const BubbleColors: readonly BubbleColor[] = [
  { id: "kampus", name: "Kampus", background: null, text: null },
  { id: "verde", name: "Verde", background: "#176B47", text: "#FFFFFF" },
  { id: "turquesa", name: "Turquesa", background: "#0F766E", text: "#FFFFFF" },
  { id: "azul", name: "Azul", background: "#2563EB", text: "#FFFFFF" },
  { id: "morado", name: "Morado", background: "#7C3AED", text: "#FFFFFF" },
  { id: "rosa", name: "Rosa", background: "#BE185D", text: "#FFFFFF" },
  { id: "rojo", name: "Rojo", background: "#C81E3A", text: "#FFFFFF" },
  { id: "naranja", name: "Naranja", background: "#F97316", text: "#121215" },
  { id: "gris", name: "Gris", background: "#3F3F46", text: "#FFFFFF" },
];

export type Wallpaper = {
  id: string;
  name: string;
  category: WallpaperCategory;
  /**
   * Un color = fondo sólido; dos o más = degradado de arriba a abajo.
   * `null`: el fondo normal de la app.
   */
  colors: readonly string[] | null;
};

export const WallpaperCategories = ["Destacados", "Degradados", "Colores sólidos"] as const;
export type WallpaperCategory = (typeof WallpaperCategories)[number];

export const Wallpapers: readonly Wallpaper[] = [
  { id: "kampus", name: "Kampus", category: "Destacados", colors: null },
  { id: "medianoche", name: "Medianoche", category: "Destacados", colors: ["#0B1026", "#1B2A5C"] },
  { id: "aurora", name: "Aurora", category: "Destacados", colors: ["#07131A", "#0E3B3A", "#1C5D4B"] },
  { id: "galaxia", name: "Galaxia", category: "Destacados", colors: ["#120B24", "#2E1A4F", "#0B0B14"] },

  { id: "atardecer", name: "Atardecer", category: "Degradados", colors: ["#2B1020", "#5A2135", "#7A3428"] },
  { id: "oceano", name: "Océano", category: "Degradados", colors: ["#06202B", "#0B3D5B"] },
  { id: "bosque", name: "Bosque", category: "Degradados", colors: ["#0C1A12", "#1E3B26"] },
  { id: "lavanda", name: "Lavanda", category: "Degradados", colors: ["#1B1530", "#3A2D5E"] },

  { id: "carbon", name: "Carbón", category: "Colores sólidos", colors: ["#1C1C21"] },
  { id: "marino", name: "Azul marino", category: "Colores sólidos", colors: ["#0F1B33"] },
  { id: "vino", name: "Vino", category: "Colores sólidos", colors: ["#2A0F1A"] },
  { id: "musgo", name: "Musgo", category: "Colores sólidos", colors: ["#16241A"] },
  { id: "cafe", name: "Café", category: "Colores sólidos", colors: ["#2A1E16"] },
];

export type ChatStyle = {
  bubble: string;
  wallpaper: string;
};

export const DefaultChatStyle: ChatStyle = { bubble: "kampus", wallpaper: "kampus" };

export function findBubble(id: string) {
  return BubbleColors.find((bubble) => bubble.id === id) ?? BubbleColors[0];
}

export function findWallpaper(id: string) {
  return Wallpapers.find((wallpaper) => wallpaper.id === id) ?? Wallpapers[0];
}

/** Colores reales de la burbuja propia con el tema activo. */
export function bubbleColors(id: string, theme: Palette) {
  const bubble = findBubble(id);
  return {
    background: bubble.background ?? theme.accent,
    text: bubble.text ?? theme.onAccent,
  };
}

/** Colores reales del fondo: siempre al menos uno. */
export function wallpaperColors(id: string, theme: Palette): readonly string[] {
  return findWallpaper(id).colors ?? [theme.background];
}

/** Descarta ids que ya no existen (p. ej. un fondo que se quitó del catálogo). */
export function sanitizeChatStyle(value: unknown): ChatStyle {
  const raw = (value && typeof value === "object" ? value : {}) as Partial<Record<keyof ChatStyle, unknown>>;
  return {
    bubble:
      typeof raw.bubble === "string" && BubbleColors.some((b) => b.id === raw.bubble)
        ? raw.bubble
        : DefaultChatStyle.bubble,
    wallpaper:
      typeof raw.wallpaper === "string" && Wallpapers.some((w) => w.id === raw.wallpaper)
        ? raw.wallpaper
        : DefaultChatStyle.wallpaper,
  };
}
