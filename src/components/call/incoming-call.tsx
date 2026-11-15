import { router } from "expo-router";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Avatar } from "@/components/matches/avatar";
import { ThemedText } from "@/components/themed-text";
import { MaxFormWidth, Radius, Spacing } from "@/constants/theme";
import { useSession } from "@/hooks/use-session";
import { useTheme } from "@/hooks/use-theme";
import { dismissIncomingCall, useCallRealtime, useVideoCall } from "@/hooks/use-video-call";
import { endCall } from "@/services/video-call";

const AnswerGreen = "#22C55E";
const RejectRed = "#EF4444";

/**
 * Llamada entrante (T-20): aparece arriba de cualquier pantalla cuando llega `call.started`.
 * Contestar abre la pantalla de llamada; rechazar cierra la sala y le avisa a quien llama.
 * Se monta una vez en el layout raíz.
 */
export function IncomingCall() {
  const theme = useTheme();
  const { isSignedIn, user } = useSession();
  const canCall = isSignedIn && user?.role === "student" && user.profile_completed;
  useCallRealtime(canCall ? user.id : null);
  const { incoming } = useVideoCall();

  if (!incoming || !canCall) return null;

  const { match_id: matchId, caller } = incoming;

  function answer() {
    dismissIncomingCall();
    router.push({ pathname: "/call/[matchId]", params: { matchId: String(matchId), answer: "1" } });
  }

  function reject() {
    dismissIncomingCall();
    void endCall(matchId).catch(() => undefined);
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.wrapper} pointerEvents="box-none">
      <View
        accessibilityRole="alert"
        accessibilityLabel={`Videollamada entrante de ${caller.name}`}
        style={[styles.card, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}
      >
        <Avatar uri={caller.photo_url} name={caller.name} size={48} />
        <View style={styles.texts}>
          <ThemedText type="smallBold" numberOfLines={1}>
            {caller.name}
          </ThemedText>
          <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
            Videollamada entrante…
          </ThemedText>
        </View>
        <RoundButton
          label="Rechazar"
          icon={{ ios: "phone.down.fill", android: "call_end", web: "call_end" }}
          color={RejectRed}
          onPress={reject}
        />
        <RoundButton
          label="Contestar"
          icon={{ ios: "video.fill", android: "videocam", web: "videocam" }}
          color={AnswerGreen}
          onPress={answer}
        />
      </View>
    </SafeAreaView>
  );
}

type RoundButtonProps = {
  label: string;
  icon: SymbolViewProps["name"];
  color: string;
  onPress: () => void;
};

function RoundButton({ label, icon, color, onPress }: RoundButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.round, { backgroundColor: color }, pressed && styles.pressed]}
    >
      <SymbolView name={icon} size={22} tintColor="#FFFFFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: Spacing.three,
  },
  card: {
    width: "100%",
    maxWidth: MaxFormWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    marginTop: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.large,
    borderWidth: 1,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  texts: {
    flex: 1,
    gap: Spacing.half,
  },
  round: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
});
