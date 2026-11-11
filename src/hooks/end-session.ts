/**
 * Fin de la sesión en un solo lugar: borra el token guardado, los datos en memoria de la cuenta
 * (perfil, ubicación, matches y chats) y la conexión en tiempo real, para que la siguiente cuenta
 * no vea nada de la anterior.
 */

import { clearChats } from "@/hooks/use-chat";
import { clearLocation } from "@/hooks/use-location";
import { clearMatches } from "@/hooks/use-matches";
import { clearProfile } from "@/hooks/use-profile";
import { signOut } from "@/hooks/use-session";
import { setUnauthorizedHandler } from "@/services/api";
import { logout } from "@/services/auth";
import { disconnectRealtime } from "@/services/realtime";

/**
 * Cierra la sesión. Con `revoke`, primero revoca el token en el backend (botón "Cerrar sesión");
 * si eso falla (sin red, token vencido) igual se cierra la sesión local.
 */
export async function endSession({ revoke = false }: { revoke?: boolean } = {}) {
  if (revoke) await logout().catch(() => undefined);
  clearProfile();
  clearLocation();
  clearMatches();
  clearChats();
  disconnectRealtime();
  signOut();
}

// Si la API rechaza el token (venció o se cerró esa sesión desde otro dispositivo), se cierra aquí
// también y las pantallas protegidas mandan al inicio de sesión.
setUnauthorizedHandler(() => void endSession());
