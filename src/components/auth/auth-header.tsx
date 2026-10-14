import { StyleSheet, View } from "react-native";

import { KampusLogo } from "@/components/kampus-logo";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";

export type AuthHeaderProps = {
  withLogo?: boolean;
  title: string;
  subtitle: string;
};

export function AuthHeader({ title, subtitle, withLogo = true }: AuthHeaderProps) {
  return (
    <View style={styles.container}>
      {withLogo && <KampusLogo />}
      <View style={styles.texts}>
        <ThemedText type="subtitle" accessibilityRole="header" style={styles.center}>
          {title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
          {subtitle}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: Spacing.four,
  },
  texts: {
    alignItems: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
  center: {
    textAlign: "center",
  },
});
