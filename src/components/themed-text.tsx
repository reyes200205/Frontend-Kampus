import { Platform, StyleSheet, Text, type TextProps } from "react-native";

import { FontFamily, Fonts, FontSize, ThemeColor } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type ThemedTextProps = TextProps & {
  /**
   * Variante de la escala tipográfica:
   * `title` (H1 32) · `subtitle` (H2 25) · `heading` (H3 20) · `default` (cuerpo 16) ·
   * `small` (14) · `smallBold` (14) · `caption` (12) · `link` (14, color de marca) · `code`.
   */
  type?:
    | "default"
    | "title"
    | "subtitle"
    | "heading"
    | "small"
    | "smallBold"
    | "caption"
    | "link"
    | "code";
  themeColor?: ThemeColor;
};

export function ThemedText({
  style,
  type = "default",
  themeColor,
  ...rest
}: ThemedTextProps) {
  const theme = useTheme();
  const color = theme[themeColor ?? (type === "link" ? "accentText" : "text")];

  return (
    <Text
      style={[
        { color },
        type === "default" && styles.default,
        type === "title" && styles.title,
        type === "subtitle" && styles.subtitle,
        type === "heading" && styles.heading,
        type === "small" && styles.small,
        type === "smallBold" && styles.smallBold,
        type === "caption" && styles.caption,
        type === "link" && styles.link,
        type === "code" && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: FontSize.h1,
    lineHeight: 40,
    fontFamily: FontFamily.bold,
  },
  subtitle: {
    fontSize: FontSize.h2,
    lineHeight: 32,
    fontFamily: FontFamily.semibold,
  },
  heading: {
    fontSize: FontSize.h3,
    lineHeight: 28,
    fontFamily: FontFamily.semibold,
  },
  default: {
    fontSize: FontSize.body,
    lineHeight: 24,
    fontFamily: FontFamily.regular,
  },
  small: {
    fontSize: FontSize.small,
    lineHeight: 20,
    fontFamily: FontFamily.regular,
  },
  smallBold: {
    fontSize: FontSize.small,
    lineHeight: 20,
    fontFamily: FontFamily.semibold,
  },
  caption: {
    fontSize: FontSize.caption,
    lineHeight: 16,
    fontFamily: FontFamily.regular,
  },
  link: {
    fontSize: FontSize.small,
    lineHeight: 20,
    fontFamily: FontFamily.semibold,
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: FontSize.caption,
  },
});
