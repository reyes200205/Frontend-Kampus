import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { StyleSheet, View } from "react-native";

import { Radius } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { Group } from "@/types/groups";

type Props = {
  group: Pick<Group, "id" | "image_url">;
  size: number;
};

/** Imagen del grupo o, si no tiene, un ícono de grupo sobre el fondo elevado. */
export function GroupAvatar({ group, size }: Props) {
  const theme = useTheme();
  const box = { width: size, height: size, borderRadius: size >= 96 ? Radius.large : Radius.medium };

  if (group.image_url) {
    return (
      <Image
        source={{ uri: group.image_url }}
        // La URL firmada cambia en cada respuesta; la clave por id evita descargar otra vez la misma imagen.
        recyclingKey={`group-${group.id}`}
        style={[box, { backgroundColor: theme.backgroundSelected }]}
        contentFit="cover"
        transition={150}
        accessibilityIgnoresInvertColors
      />
    );
  }

  return (
    <View style={[box, styles.placeholder, { backgroundColor: theme.backgroundSelected }]}>
      <SymbolView
        name={{ ios: "person.3", android: "groups", web: "groups" }}
        size={size * 0.45}
        tintColor={theme.textSecondary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
  },
});
