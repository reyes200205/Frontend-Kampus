import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { FontFamily, Radius } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type AvatarProps = {
  /** URL firmada de la foto, o `null` si la persona no tiene fotos. */
  uri: string | null;
  name: string;
  size?: number;
  /** Borde de marca, para resaltar un match nuevo. */
  ring?: boolean;
};

/** Foto redonda de una persona; sin foto, muestra sus iniciales. */
export function Avatar({ uri, name, size = 56, ring }: AvatarProps) {
  const theme = useTheme();
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

  return (
    <View
      accessibilityLabel={`Foto de ${name}`}
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          backgroundColor: theme.backgroundSelected,
          borderColor: ring ? theme.accent : theme.border,
          borderWidth: ring ? 2.5 : 1,
        },
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
      ) : (
        <ThemedText style={{ fontFamily: FontFamily.semibold, fontSize: size * 0.36 }}>{initials}</ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    borderRadius: Radius.full,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
});
