import type { Href } from "expo-router";
import type { AndroidSymbol, SFSymbol } from "expo-symbols";

export type TabItem = {
  /** Nombre de la ruta dentro de `src/app/(tabs)/`. */
  name: string;
  href: Href;
  label: string;
  /** Ícono de iOS (SF Symbols), sin rellenar y relleno cuando la pestaña está activa. */
  sf: { default: SFSymbol; selected: SFSymbol };
  /** Ícono de Android y web (Material Symbols). */
  md: AndroidSymbol;
};

/**
 * Las cuatro secciones de la navegación principal (anteproyecto 12.2).
 * En celular se muestran como barra inferior; en escritorio, como barra lateral.
 */
export const TabItems: TabItem[] = [
  {
    name: "index",
    href: "/",
    label: "Descubrir",
    sf: { default: "rectangle.stack", selected: "rectangle.stack.fill" },
    md: "style",
  },
  {
    name: "chats",
    href: "/chats",
    label: "Chats",
    sf: { default: "bubble.left.and.bubble.right", selected: "bubble.left.and.bubble.right.fill" },
    md: "forum",
  },
  {
    name: "groups",
    href: "/groups",
    label: "Grupos",
    sf: { default: "person.3", selected: "person.3.fill" },
    md: "groups",
  },
  {
    name: "profile",
    href: "/profile",
    label: "Perfil",
    sf: { default: "person.crop.circle", selected: "person.crop.circle.fill" },
    md: "account_circle",
  },
];
