import { Image } from "expo-image";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { sortedPhotos } from "@/components/discover/swipe-card";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { FontFamily, MinTouchSize, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { NearbyUser } from "@/types/discovery";

const PhotoSize = 72;

export type NearbyCardProps = {
  user: NearbyUser;
  onOpenProfile: () => void;
  onDecide: (liked: boolean) => void;
  onClose: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Ficha rápida de alguien en el mapa de Cerca (T-30, RF-19): foto, nombre, estudios, distancia aproximada
 * e intereses en común. "Ver perfil" abre el perfil expandido (T-31); "Pasar" y "Me interesa" registran el
 * swipe igual que en Descubrir.
 */
export function NearbyCard({ user, onOpenProfile, onDecide, onClose, style }: NearbyCardProps) {
  const theme = useTheme();
  const photo = sortedPhotos(user)[0]?.temporary_url;
  const studies = [user.university?.short_name, user.career].filter(Boolean).join(" · ");

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }, style]}>
      <View style={styles.top}>
        <Pressable
          onPress={onOpenProfile}
          accessibilityRole="button"
          accessibilityLabel={`Ver el perfil de ${user.name}`}
          style={({ pressed }) => [styles.photo, { backgroundColor: theme.backgroundSelected }, pressed && styles.pressed]}
        >
          {photo ? (
            <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} contentFit="cover" transition={120} />
          ) : (
            <Text style={[styles.initial, { color: theme.textSecondary }]}>
              {user.name.trim().charAt(0).toUpperCase()}
            </Text>
          )}
        </Pressable>

        <View style={styles.info}>
          <ThemedText type="heading" numberOfLines={1}>
            {user.name.split(" ")[0]}
            {user.age ? `, ${user.age}` : ""}
          </ThemedText>
          {studies.length > 0 && (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {studies}
            </ThemedText>
          )}
          <View style={styles.tags}>
            <View style={[styles.tag, { backgroundColor: theme.backgroundSelected }]}>
              <SymbolView
                name={{ ios: "location.fill", android: "near_me", web: "near_me" }}
                size={12}
                tintColor={theme.accent}
              />
              <ThemedText type="caption">{user.nearby.distance_label}</ThemedText>
            </View>
            {user.shared_interests > 0 && (
              <ThemedText type="caption" themeColor="accentText" numberOfLines={1}>
                {user.shared_interests === 1 ? "1 interés en común" : `${user.shared_interests} intereses en común`}
              </ThemedText>
            )}
          </View>
        </View>

        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Cerrar ficha"
          hitSlop={(MinTouchSize - 24) / 2}
          style={({ pressed }) => [styles.close, pressed && styles.pressed]}
        >
          <SymbolView name={{ ios: "xmark", android: "close", web: "close" }} size={18} tintColor={theme.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.actions}>
        <RoundButton
          label={`Pasar a ${user.name}`}
          icon={{ ios: "xmark", android: "close", web: "close" }}
          onPress={() => onDecide(false)}
        />
        <Button title="Ver perfil" variant="secondary" onPress={onOpenProfile} style={styles.profileButton} />
        <RoundButton
          label={`Me interesa ${user.name}`}
          icon={{ ios: "heart.fill", android: "favorite", web: "favorite" }}
          primary
          onPress={() => onDecide(true)}
        />
      </View>
    </View>
  );
}

function RoundButton({
  label,
  icon,
  primary,
  onPress,
}: {
  label: string;
  icon: SymbolViewProps["name"];
  primary?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.round,
        primary
          ? { backgroundColor: theme.accent }
          : { backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1.5 },
        pressed && styles.pressed,
      ]}
    >
      <SymbolView name={icon} size={22} tintColor={primary ? theme.onAccent : theme.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.large,
    borderWidth: 1,
    // Sombra para despegarla del mapa.
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
  photo: {
    width: PhotoSize,
    height: PhotoSize,
    borderRadius: Radius.medium,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  initial: {
    fontFamily: FontFamily.bold,
    fontSize: 28,
  },
  info: {
    flex: 1,
    gap: Spacing.half,
  },
  tags: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.full,
  },
  close: {
    alignSelf: "flex-start",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
  profileButton: {
    flex: 1,
  },
  round: {
    width: 52,
    height: 52,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.85,
  },
});
