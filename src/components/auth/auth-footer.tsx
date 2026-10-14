import { Link, type Href } from "expo-router";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";

export type AuthFooterProps = {
  question: string;
  linkText: string;
  href: Href;
};

export function AuthFooter({ question, linkText, href }: AuthFooterProps) {
  return (
    <View style={styles.row}>
      <ThemedText type="small" themeColor="textSecondary">
        {question}
      </ThemedText>
      <Link href={href} replace>
        <ThemedText type="link">{linkText}</ThemedText>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.one,
  },
});
