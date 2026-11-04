import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { MaxProfilePhotos } from "@/constants/profile";
import { MinTouchSize, Radius, Spacing } from "@/constants/theme";
import { setProfile } from "@/hooks/use-profile";
import { useTheme } from "@/hooks/use-theme";
import { ApiError } from "@/services/api";
import { deleteProfilePhoto, uploadProfilePhoto } from "@/services/profile";
import type { PhotoFile, ProfilePhoto } from "@/types/profile";

/** Peso máximo que acepta el backend (5 MB). */
const MaxPhotoBytes = 5 * 1024 * 1024;
const AcceptedTypes = ["image/jpeg", "image/png", "image/webp"];
/** Espacios por fila. */
const Columns = 3;

/**
 * Cuadrícula de 5 espacios para subir y borrar fotos del perfil. Cada cambio se guarda de inmediato
 * en el backend y actualiza el perfil compartido, así que se ve al instante en la pestaña Perfil.
 */
export function PhotoEditor({ photos }: { photos: ProfilePhoto[] }) {
  const theme = useTheme();
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string>();
  // Ancho medido de la cuadrícula: con porcentajes y aspectRatio, React Native Web estira la segunda fila.
  const [gridWidth, setGridWidth] = useState(0);
  // `onLayout` redondea el ancho (324.8 → 325): se resta 1 px y se redondea hacia abajo para que
  // la tercera columna siempre quepa y no baje de fila.
  const slotWidth =
    gridWidth > 0 ? Math.floor((gridWidth - 1 - Spacing.two * (Columns - 1)) / Columns) : 0;
  const slotSize = { width: slotWidth, height: (slotWidth * 5) / 4 };

  const sorted = [...photos].sort((a, b) => a.position - b.position);
  const canAdd = sorted.length < MaxProfilePhotos;
  const busy = uploading || deletingId !== null;

  async function handleAdd() {
    setError(undefined);
    // En web el selector se abre solo como respuesta directa a un toque, por eso va aquí.
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: Platform.OS !== "web",
      aspect: [4, 5],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const type = asset.mimeType ?? asset.file?.type ?? "image/jpeg";
    if (!AcceptedTypes.includes(type)) {
      setError("Usa una foto JPG, PNG o WebP.");
      return;
    }
    const size = asset.fileSize ?? asset.file?.size;
    if (size && size > MaxPhotoBytes) {
      setError("La foto pesa más de 5 MB. Elige una más ligera.");
      return;
    }

    const file: PhotoFile = asset.file ?? {
      uri: asset.uri,
      name: asset.fileName ?? `foto.${type.split("/")[1]}`,
      type,
    };

    setUploading(true);
    try {
      setProfile(await uploadProfilePhoto(file));
    } catch (e) {
      setError(
        e instanceof ApiError ? (e.field("photo") ?? e.message) : "No se pudo subir la foto.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(photo: ProfilePhoto) {
    setError(undefined);
    setDeletingId(photo.id);
    try {
      setProfile(await deleteProfilePhoto(photo.id));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo borrar la foto.");
    } finally {
      setDeletingId(null);
    }
  }

  const slots = Array.from({ length: MaxProfilePhotos }, (_, index) => sorted[index] ?? null);
  const firstEmpty = slots.findIndex((slot) => slot === null);

  return (
    <View style={styles.container}>
      <View style={styles.grid} onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}>
        {slots.map((photo, index) => {
          if (photo) {
            const deleting = deletingId === photo.id;
            return (
              <View
                key={photo.id}
                style={[styles.slot, slotSize, { backgroundColor: theme.backgroundSelected }]}
              >
                <Image source={{ uri: photo.temporary_url }} style={styles.image} contentFit="cover" />
                {index === 0 && (
                  <View style={[styles.badge, { backgroundColor: theme.accent }]}>
                    <ThemedText type="caption" style={{ color: theme.onAccent }}>
                      Principal
                    </ThemedText>
                  </View>
                )}
                <Pressable
                  onPress={() => handleDelete(photo)}
                  disabled={busy}
                  accessibilityRole="button"
                  accessibilityLabel={`Borrar foto ${index + 1}`}
                  hitSlop={(MinTouchSize - 28) / 2}
                  style={[styles.remove, { backgroundColor: theme.background }]}
                >
                  {deleting ? (
                    <ActivityIndicator size="small" color={theme.text} />
                  ) : (
                    <SymbolView
                      name={{ ios: "xmark", android: "close", web: "close" }}
                      size={14}
                      tintColor={theme.text}
                    />
                  )}
                </Pressable>
              </View>
            );
          }

          const isNext = canAdd && index === firstEmpty;
          return (
            <Pressable
              key={`empty-${index}`}
              onPress={isNext ? handleAdd : undefined}
              disabled={!isNext || busy}
              accessibilityRole={isNext ? "button" : undefined}
              accessibilityLabel={isNext ? "Agregar foto" : undefined}
              style={({ pressed }) => [
                styles.slot,
                slotSize,
                styles.empty,
                {
                  borderColor: isNext ? theme.accent : theme.border,
                  backgroundColor: theme.backgroundElement,
                },
                pressed && styles.pressed,
              ]}
            >
              {isNext &&
                (uploading ? (
                  <ActivityIndicator color={theme.accent} />
                ) : (
                  <SymbolView
                    name={{ ios: "plus", android: "add", web: "add" }}
                    size={24}
                    tintColor={theme.accent}
                  />
                ))}
            </Pressable>
          );
        })}
      </View>

      <ThemedText type="caption" themeColor={error ? "danger" : "textSecondary"}>
        {error ??
          `${sorted.length} de ${MaxProfilePhotos} fotos. JPG, PNG o WebP de hasta 5 MB; se borra la ubicación de la foto antes de guardarla.`}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  slot: {
    borderRadius: Radius.medium,
    overflow: "hidden",
  },
  empty: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  badge: {
    position: "absolute",
    left: Spacing.one,
    bottom: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.full,
  },
  remove: {
    position: "absolute",
    top: Spacing.one,
    right: Spacing.one,
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.7,
  },
});
