import { Link, type Href } from "expo-router";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type AuthFooterProps = {
  question: string;
  linkText: string;
  href: Href;
};

export function AuthFooter({ question, linkText, href }: AuthFooterProps) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <ThemedText type="small" themeColor="textSecondary">
        {question}
      </ThemedText>
      <Link href={href} replace>
        <ThemedText type="smallBold" style={{ color: theme.accent }}>
          {linkText}
        </ThemedText>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.one,
  },
});
