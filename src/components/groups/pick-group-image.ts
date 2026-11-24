import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

import type { GroupImageFile } from "@/types/groups";

/** Mismos límites que el backend (`ImageUpload`): JPG, PNG o WebP de hasta 5 MB. */
const MaxImageBytes = 5 * 1024 * 1024;
const AcceptedTypes = ["image/jpeg", "image/png", "image/webp"];

export type PickedGroupImage =
  | { kind: "picked"; file: GroupImageFile; previewUri: string }
  | { kind: "invalid"; message: string }
  | { kind: "canceled" };

/**
 * Abre la galería para la imagen del grupo (cuadrada en el celular). En web el selector se abre solo como
 * respuesta directa a un toque, así que se llama desde el `onPress`.
 */
export async function pickGroupImage(): Promise<PickedGroupImage> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: Platform.OS !== "web",
    aspect: [1, 1],
    quality: 0.8,
  });
  if (result.canceled || !result.assets?.[0]) return { kind: "canceled" };

  const asset = result.assets[0];
  const type = asset.mimeType ?? asset.file?.type ?? "image/jpeg";
  if (!AcceptedTypes.includes(type)) return { kind: "invalid", message: "Usa una imagen JPG, PNG o WebP." };
  const size = asset.fileSize ?? asset.file?.size;
  if (size && size > MaxImageBytes) {
    return { kind: "invalid", message: "La imagen pesa más de 5 MB. Elige una más ligera." };
  }

  const file: GroupImageFile = asset.file ?? {
    uri: asset.uri,
    name: asset.fileName ?? `grupo.${type.split("/")[1]}`,
    type,
  };
  return { kind: "picked", file, previewUri: asset.uri };
}
