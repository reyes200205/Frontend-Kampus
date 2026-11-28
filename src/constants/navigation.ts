
import type { Href } from "expo-router";
import type { AndroidSymbol, SFSymbol } from "expo-symbols";

import type { UserRole } from "@/types/auth";

export type TabItem = {
  /** Nombre de la ruta dentro de la carpeta del layout. */
  name: string;
  href: Href;
  label: string;
  /** Ícono de iOS. */
  sf: { default: SFSymbol; selected: SFSymbol };
  /** Ícono de Android y web. */
  md: AndroidSymbol;
};

/**
 * Las cuatro secciones de la navegación principal.
 * En celular se muestran como barra inferior;
 * en escritorio, como barra lateral.
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
    sf: {
      default: "bubble.left.and.bubble.right",
      selected: "bubble.left.and.bubble.right.fill",
    },
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
    sf: {
      default: "person.crop.circle",
      selected: "person.crop.circle.fill",
    },
    md: "account_circle",
  },
];

/** Pestaña lista para dibujar. */
export type NavTab = TabItem & {
  /** Contador, por ejemplo, chats sin leer. */
  badge?: number;
  /** Oculta la pestaña si el rol no tiene acceso. */
  hidden?: boolean;
};

export type ManagementTabItem = TabItem & {
  /** Roles que pueden visualizar la sección. */
  roles: UserRole[];
};

/** Sección que todavía no tiene API. */
export type ManagementSoonItem = {
  label: string;
  md: AndroidSymbol;
  roles: UserRole[];
  task: string;
};

export type ManagementSection = {
  title: string;
  items: (ManagementTabItem | ManagementSoonItem)[];
};

export function isSoonItem(
  item: ManagementTabItem | ManagementSoonItem,
): item is ManagementSoonItem {
  return "task" in item;
}

/**
 * Barra lateral del panel de gestión del staff.
 * Grupos, Reportes y Usuarios están habilitados.
 * Staff está disponible exclusivamente para administradores.
 */
export const ManagementSections: ManagementSection[] = [
  {
    title: "Moderación",
    items: [
      {
        name: "index",
        href: "/management",
        label: "Grupos",
        sf: {
          default: "checkmark.shield",
          selected: "checkmark.shield.fill",
        },
        md: "fact_check",
        roles: ["moderator", "admin"],
      },
      {
        name: "reports",
        href: "/management/reports",
        label: "Reportes",
        sf: {
          default: "flag",
          selected: "flag.fill",
        },
        md: "flag",
        roles: ["moderator", "admin"],
      },
      {
        name: "users",
        href: "/management/users",
        label: "Usuarios",
        sf: {
          default: "person.2",
          selected: "person.2.fill",
        },
        md: "group",
        roles: ["moderator", "admin"],
      },
    ],
  },
  {
    title: "Administración",
    items: [
      {
        name: "staff",
        href: "/management/staff",
        label: "Staff",
        sf: {
          default: "person.badge.key",
          selected: "person.badge.key.fill",
        },
        md: "admin_panel_settings",
        roles: ["admin"],
      },
    ],
  },
];

/** Cuenta del staff, al final de la barra lateral. */
export const ManagementAccountItem: ManagementTabItem = {
  name: "account",
  href: "/management/account",
  label: "Cuenta",
  sf: {
    default: "person.crop.circle",
    selected: "person.crop.circle.fill",
  },
  md: "account_circle",
  roles: ["moderator", "admin"],
};

/**
 * Secciones con ruta, en orden.
 * Son las pestañas en iOS, Android y web angosta.
 */
export const ManagementTabItems: ManagementTabItem[] = [
  ...ManagementSections.flatMap((section) =>
    section.items.filter(
      (item): item is ManagementTabItem => !isSoonItem(item),
    ),
  ),
  ManagementAccountItem,
];
