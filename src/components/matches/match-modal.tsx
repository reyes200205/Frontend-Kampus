import { useEffect } from "react";
import { Modal, StyleSheet, View } from "react-native";

import { Avatar } from "@/components/matches/avatar";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { MaxFormWidth, Spacing } from "@/constants/theme";
import { loadProfile, useProfile } from "@/hooks/use-profile";
import { useSession } from "@/hooks/use-session";
import { useTheme } from "@/hooks/use-theme";
import type { Match } from "@/types/discovery";

export type MatchModalProps = {
  /** El match recién creado, o `null` para ocultar la pantalla. */
  match: Match | null;
  onClose: () => void;
  onSeeMatches: () => void;
};

const AvatarSize = 112;

/** Pantalla "Es un match" (T-12, RF-07): aparece en cuanto un swipe crea el match. */
export function MatchModal({ match, onClose, onSeeMatches }: MatchModalProps) {
  const theme = useTheme();
  const { user } = useSession();
  const { profile, loading } = useProfile();

  // La foto propia sale del perfil; si todavía no se pidió (no se ha abierto la pestaña Perfil), se pide.
  useEffect(() => {
    if (match && !profile && !loading) void loadProfile();
  }, [match, profile, loading]);

  const myPhoto =
    [...(profile?.profile?.photos ?? [])].sort((a, b) => a.position - b.position)[0]?.temporary_url ?? null;
  const theirFirstName = match?.user.name.split(" ")[0] ?? "";

  return (
    <Modal visible={match !== null} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.backdrop, { backgroundColor: theme.background }]}>
        {match && (
          <View style={styles.content} accessibilityViewIsModal>
            <View style={styles.avatars}>
              <View style={styles.leftAvatar}>
                <Avatar uri={myPhoto} name={user?.name ?? "Tú"} size={AvatarSize} ring />
              </View>
              <Avatar uri={match.user.photo_url} name={match.user.name} size={AvatarSize} ring />
            </View>

            <View style={styles.texts}>
              <ThemedText type="title" themeColor="accentText" accessibilityRole="header" style={styles.center}>
                ¡Es un match!
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.center}>
                Tú y {match.user.name}
                {match.user.university ? ` (${match.user.university.short_name})` : ""} se interesaron
                mutuamente.
              </ThemedText>
            </View>

            <View style={styles.actions}>
              <Button
                title={`Ver a ${theirFirstName} en mis matches`}
                icon={{ ios: "bubble.left.and.bubble.right", android: "forum", web: "forum" }}
                onPress={onSeeMatches}
              />
              <Button title="Seguir descubriendo" variant="ghost" onPress={onClose} />
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.four,
  },
  content: {
    width: "100%",
    maxWidth: MaxFormWidth,
    alignItems: "center",
    gap: Spacing.five,
  },
  avatars: {
    flexDirection: "row",
    alignItems: "center",
  },
  leftAvatar: {
    // Las dos fotos se enciman un poco, como en la tarjeta del wireframe.
    marginRight: -Spacing.four,
    zIndex: 1,
  },
  texts: {
    gap: Spacing.two,
  },
  center: {
    textAlign: "center",
  },
  actions: {
    alignSelf: "stretch",
    gap: Spacing.two,
  },
});
