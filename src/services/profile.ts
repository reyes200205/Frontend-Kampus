/** Perfil, intereses y fotos (T-08, RF-03). Cada cambio devuelve el perfil completo actualizado. */

import { apiRequest } from "@/services/api";
import type { ApiResource } from "@/types/api";
import type { Interest, PhotoFile, Profile, ProfileUpdate } from "@/types/profile";

export function getProfile() {
  return apiRequest<ApiResource<Profile>>("/profile").then((res) => res.data);
}

export function updateProfile(body: ProfileUpdate) {
  return apiRequest<ApiResource<Profile>>("/profile", { method: "PATCH", body }).then(
    (res) => res.data,
  );
}

export function getInterests() {
  return apiRequest<ApiResource<Interest[]>>("/interests").then((res) => res.data);
}

export function updateInterests(interestIds: number[]) {
  return apiRequest<ApiResource<Profile>>("/profile/interests", {
    method: "PUT",
    body: { interest_ids: interestIds },
  }).then((res) => res.data);
}

export function uploadProfilePhoto(photo: PhotoFile) {
  const form = new FormData();
  // En React Native, FormData acepta `{ uri, name, type }` para mandar un archivo local.
  form.append("photo", photo as unknown as Blob);
  return apiRequest<ApiResource<Profile>>("/profile/photos", { method: "POST", body: form }).then(
    (res) => res.data,
  );
}

export function deleteProfilePhoto(photoId: number) {
  return apiRequest<ApiResource<Profile>>(`/profile/photos/${photoId}`, { method: "DELETE" }).then(
    (res) => res.data,
  );
}
