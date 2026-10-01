import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type CheckEmailCardProps = {
  email: string;
  onResend: () => void;
};

export function CheckEmailCard({ email, onResend }: CheckEmailCardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: theme.glow }]}>
        <SymbolView
          name={{ ios: "envelope", android: "mail", web: "mail" }}
          size={28}
          tintColor={theme.accent}
        />
      </View>

      <View style={styles.texts}>
        <ThemedText type="subtitle" style={styles.title}>
          Check your email
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
          We sent a verification link to{" "}
          <ThemedText type="smallBold">{email}</ThemedText>
        </ThemedText>
      </View>

      <View style={styles.resend}>
        <ThemedText type="small" themeColor="textSecondary">
          Didn&apos;t get it?
        </ThemedText>
        <Pressable onPress={onResend} hitSlop={Spacing.two}>
          <ThemedText type="smallBold" style={{ color: theme.accent }}>
            Resend email
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Radius.large,
    borderWidth: 1,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  texts: {
    alignItems: "center",
    gap: Spacing.one,
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
  },
  center: {
    textAlign: "center",
  },
  resend: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
  },
});
