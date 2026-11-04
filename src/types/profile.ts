/** Perfil, intereses y fotos del estudiante (T-07 en el backend, T-08 en el frontend, RF-03). */

import type { User } from "@/types/auth";

/** Datos de la cuenta que acompañan al perfil. */
export type ProfileUser = Pick<User, "id" | "name" | "email">;

export type Interest = { id: number; name: string; category: string };

export type ProfilePhoto = {
  id: number;
  /** Del 1 al 5; la 1 es la principal. */
  position: number;
  /** URL firmada que caduca a los 15 minutos; se renueva al volver a pedir el perfil. */
  temporary_url: string;
};

export type ProfileDetails = {
  career: string | null;
  semester: number | null;
  /** Fecha `AAAA-MM-DD`. */
  birthdate: string | null;
  bio: string | null;
  zone_id: number | null;
  nearby_enabled: boolean;
  interests: Interest[];
  photos: ProfilePhoto[];
};

/** Respuesta de `GET /profile` y de todas las rutas que cambian el perfil. */
export type Profile = {
  user: ProfileUser;
  /** `null` hasta que el estudiante guarda su perfil por primera vez. */
  profile: ProfileDetails | null;
};

/** Cuerpo de `PATCH /profile`: solo se mandan los campos que cambian. */
export type ProfileUpdate = Partial<
  Pick<ProfileUser, "name"> & Pick<ProfileDetails, "career" | "semester" | "birthdate" | "bio">
>;

/** Archivo de una foto elegida: en web un `File`; en el celular la `uri` local con su nombre y tipo. */
export type PhotoFile = File | { uri: string; name: string; type: string };
