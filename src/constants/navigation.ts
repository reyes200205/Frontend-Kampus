import type { Href } from "expo-router";
import type { AndroidSymbol, SFSymbol } from "expo-symbols";

import type { UserRole } from "@/types/auth";

export type TabItem = {
  /** Nombre de la ruta dentro de la carpeta del layout (`(tabs)/` o `management/(panel)/`). */
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

/** Pestaña ya lista para dibujar: con su contador y oculta si el rol no tiene acceso. */
export type NavTab = TabItem & {
  /** Contador (p. ej. chats sin leer). Sin valor, la pestaña no lleva contador. */
  badge?: number;
  /** Oculta y sin acceso (p. ej. Staff para un moderador). */
  hidden?: boolean;
};

export type ManagementTabItem = TabItem & {
  /** Roles que ven la sección. El backend aplica la misma regla y responde `403` al resto. */
  roles: UserRole[];
};

/** Sección que todavía no tiene API: se muestra deshabilitada con "Pronto" en la barra lateral. */
export type ManagementSoonItem = {
  label: string;
  md: AndroidSymbol;
  roles: UserRole[];
  /** Tarea que la habilita. */
  task: string;
};

export type ManagementSection = {
  title: string;
  items: (ManagementTabItem | ManagementSoonItem)[];
};

export function isSoonItem(item: ManagementTabItem | ManagementSoonItem): item is ManagementSoonItem {
  return "task" in item;
}

/**
 * Barra lateral del panel de gestión del staff (T-44), por secciones. Reportes y Usuarios se
 * habilitan con T-37 y T-43; hasta entonces aparecen como "Pronto".
 */
export const ManagementSections: ManagementSection[] = [
  {
    title: "Moderación",
    items: [
      {
        name: "index",
        href: "/management",
        label: "Grupos",
        sf: { default: "checkmark.shield", selected: "checkmark.shield.fill" },
        md: "fact_check",
        roles: ["moderator", "admin"],
      },
      { label: "Reportes", md: "flag", roles: ["moderator", "admin"], task: "T-37" },
      { label: "Usuarios", md: "group", roles: ["moderator", "admin"], task: "T-43" },
    ],
  },
  {
    title: "Administración",
    items: [
      {
        name: "staff",
        href: "/management/staff",
        label: "Staff",
        sf: { default: "person.badge.key", selected: "person.badge.key.fill" },
        md: "admin_panel_settings",
        roles: ["admin"],
      },
    ],
  },
];

/** Cuenta del staff: abajo de la barra lateral, con su nombre y correo. */
export const ManagementAccountItem: ManagementTabItem = {
  name: "account",
  href: "/management/account",
  label: "Cuenta",
  sf: { default: "person.crop.circle", selected: "person.crop.circle.fill" },
  md: "account_circle",
  roles: ["moderator", "admin"],
};

/** Las secciones con ruta, en orden: son las pestañas en iOS, Android y web angosta. */
export const ManagementTabItems: ManagementTabItem[] = [
  ...ManagementSections.flatMap((section) =>
    section.items.filter((item): item is ManagementTabItem => !isSoonItem(item)),
  ),
  ManagementAccountItem,
];
