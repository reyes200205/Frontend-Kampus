import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { useEffect, useState } from "react";
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActionButton } from "@/components/discover/action-button";
import { PhotoBars } from "@/components/discover/photo-bars";
import { sortedPhotos } from "@/components/discover/swipe-card";
import { ThemedText } from "@/components/themed-text";
import { Chip } from "@/components/ui/chip";
import { FontFamily, MaxFormWidth, MinTouchSize, Radius, Spacing } from "@/constants/theme";
import { loadProfile, useProfile } from "@/hooks/use-profile";
import { useTheme } from "@/hooks/use-theme";
import type { DiscoveryCard } from "@/types/discovery";

/** La galería no pasa de este alto para que se alcancen a ver los datos sin hacer scroll. */
const MaxGalleryHeight = 560;

export type ExpandedProfileProps = {
  /** Perfil abierto, o `null` si está cerrado. */
  card: DiscoveryCard | null;
  onClose: () => void;
  onDecide: (liked: boolean) => void;
};

/**
 * Perfil expandido en Descubrir (T-31, RF-21): galería con todas las fotos (la tarjeta solo muestra la principal), datos institucionales, "Sobre mí" e
 * intereses (los que tienen en común, resaltados). "Pasar" y "Me interesa" quedan siempre a la vista.
 */
export function ExpandedProfile({ card, onClose, onDecide }: ExpandedProfileProps) {
  const theme = useTheme();

  return (
    <Modal
      visible={card !== null}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.flex, { backgroundColor: theme.background }]}>
        {card && <Content key={card.id} card={card} onClose={onClose} onDecide={onDecide} />}
      </View>
    </Modal>
  );
}

function Content({ card, onClose, onDecide }: Omit<ExpandedProfileProps, "card"> & { card: DiscoveryCard }) {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const { profile } = useProfile();
  const photos = sortedPhotos(card);
  const [index, setIndex] = useState(0);

  const contentWidth = Math.min(width, MaxFormWidth + Spacing.six * 2);
  const galleryHeight = Math.min(MaxGalleryHeight, contentWidth * 1.25, height * 0.62);
  const photo = photos[index]?.temporary_url;

  // Intereses en común primero, si ya se conoce el perfil propio.
  const mine = new Set((profile?.profile?.interests ?? []).map((interest) => interest.id));
  const interests = [...card.interests].sort((a, b) => Number(mine.has(b.id)) - Number(mine.has(a.id)));

  // Para resaltar los intereses en común hace falta el perfil propio (si no se ha abierto Perfil aún).
  useEffect(() => {
    if (!profile) void loadProfile();
  }, [profile]);

  // En web, Esc cierra el perfil.
  useEffect(() => {
    if (Platform.OS !== "web") return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function showPhoto(step: 1 | -1) {
    setIndex((current) => Math.max(0, Math.min(photos.length - 1, current + step)));
  }

  return (
    <SafeAreaView edges={["top", "bottom", "left", "right"]} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.column, { width: contentWidth }]}>
          <View style={[styles.gallery, { height: galleryHeight, backgroundColor: theme.backgroundSelected }]}>
            {photo ? (
              <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
            ) : (
              <View style={[StyleSheet.absoluteFill, styles.noPhoto]}>
                <Text style={[styles.initial, { color: theme.textSecondary }]}>
                  {card.name.trim().charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <LinearGradient
              colors={["rgba(0, 0, 0, 0.35)", "transparent"]}
              locations={[0, 0.25]}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />

            {photos.length > 1 && (
              <View style={StyleSheet.absoluteFill}>
                <View style={styles.taps}>
                  <Pressable
                    style={styles.flex}
                    onPress={() => showPhoto(-1)}
                    accessibilityRole="button"
                    accessibilityLabel="Foto anterior"
                  />
                  <Pressable
                    style={styles.flex}
                    onPress={() => showPhoto(1)}
                    accessibilityRole="button"
                    accessibilityLabel="Foto siguiente"
                  />
                </View>
              </View>
            )}

            <PhotoBars count={photos.length} index={index} />

            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cerrar perfil"
              hitSlop={Spacing.two}
              style={({ pressed }) => [
                styles.close,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                pressed && styles.pressed,
              ]}
            >
              <SymbolView
                name={{ ios: "chevron.down", android: "keyboard_arrow_down", web: "keyboard_arrow_down" }}
                size={22}
                tintColor={theme.text}
              />
            </Pressable>
          </View>

          <View style={styles.body}>
            <View style={styles.header}>
              <View style={styles.nameRow}>
                <ThemedText type="title" accessibilityRole="header" style={styles.name}>
                  {card.name}
                  {card.age ? `, ${card.age}` : ""}
                </ThemedText>
                <View
                  style={[styles.verified, { backgroundColor: theme.accent }]}
                  accessibilityLabel="Correo institucional verificado"
                >
                  <SymbolView
                    name={{ ios: "checkmark", android: "check", web: "check" }}
                    size={14}
                    tintColor={theme.onAccent}
                  />
                </View>
              </View>
              {card.shared_interests > 0 && (
                <ThemedText type="small" themeColor="accentText">
                  {card.shared_interests === 1
                    ? "1 interés en común"
                    : `${card.shared_interests} intereses en común`}
                </ThemedText>
              )}
            </View>

            {card.bio && (
              <Section title="Sobre mí">
                <ThemedText selectable>{card.bio}</ThemedText>
              </Section>
            )}

            <Section title="Datos institucionales">
              <View style={[styles.facts, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                <Fact
                  icon={{ ios: "building.columns", android: "account_balance", web: "account_balance" }}
                  label="Universidad"
                  value={card.university?.name ?? "Sin universidad"}
                />
                {card.career && (
                  <Fact icon={{ ios: "graduationcap", android: "school", web: "school" }} label="Carrera" value={card.career} />
                )}
                {card.semester && (
                  <Fact
                    icon={{ ios: "calendar", android: "calendar_month", web: "calendar_month" }}
                    label="Semestre"
                    value={`${card.semester}º semestre`}
                  />
                )}
                <Fact
                  icon={{ ios: "checkmark.seal", android: "verified", web: "verified" }}
                  label="Cuenta"
                  value="Correo institucional verificado"
                  last
                />
              </View>
            </Section>

            {interests.length > 0 && (
              <Section title="Intereses">
                <View style={styles.chips}>
                  {interests.map((interest) => (
                    <Chip key={interest.id} label={interest.name} selected={mine.has(interest.id)} />
                  ))}
                </View>
                {mine.size > 0 && card.shared_interests > 0 && (
                  <ThemedText type="caption" themeColor="textSecondary">
                    Resaltados, los que tienen en común.
                  </ThemedText>
                )}
              </Section>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Las acciones quedan siempre a la vista, aunque se haga scroll (RF-21). */}
      <View style={[styles.actions, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
        <ActionButton
          label="Pasar"
          icon={{ ios: "xmark", android: "close", web: "close" }}
          onPress={() => onDecide(false)}
        />
        <ActionButton
          label="Me interesa"
          icon={{ ios: "heart.fill", android: "favorite", web: "favorite" }}
          primary
          onPress={() => onDecide(true)}
        />
      </View>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold" themeColor="textSecondary" accessibilityRole="header">
        {title}
      </ThemedText>
      {children}
    </View>
  );
}

function Fact({
  icon,
  label,
  value,
  last,
}: {
  icon: SymbolViewProps["name"];
  label: string;
  value: string;
  last?: boolean;
}) {
  const theme = useTheme();

  return (
    <View
      style={[styles.fact, !last && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
      accessible
      accessibilityLabel={`${label}: ${value}`}
    >
      <View style={[styles.factIcon, { backgroundColor: theme.backgroundSelected }]}>
        <SymbolView name={icon} size={18} tintColor={theme.accent} />
      </View>
      <View style={styles.flex}>
        <ThemedText type="caption" themeColor="textSecondary">
          {label}
        </ThemedText>
        <ThemedText type="small">{value}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    alignItems: "center",
    paddingBottom: Spacing.four,
  },
  column: {
    maxWidth: "100%",
  },
  gallery: {
    width: "100%",
    overflow: "hidden",
    borderBottomLeftRadius: Radius.large,
    borderBottomRightRadius: Radius.large,
  },
  noPhoto: {
    alignItems: "center",
    justifyContent: "center",
  },
  initial: {
    fontSize: 120,
    fontFamily: FontFamily.bold,
  },
  taps: {
    flex: 1,
    flexDirection: "row",
  },
  close: {
    position: "absolute",
    top: Spacing.four,
    left: Spacing.three,
    width: MinTouchSize,
    height: MinTouchSize,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.7,
  },
  body: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.four,
  },
  header: {
    gap: Spacing.one,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  name: {
    flexShrink: 1,
  },
  verified: {
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    gap: Spacing.two,
  },
  facts: {
    borderRadius: Radius.medium,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
  },
  fact: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    paddingVertical: Spacing.two + Spacing.one,
  },
  factIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.six - Spacing.two,
    paddingVertical: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
