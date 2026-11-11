import { StyleSheet, View } from "react-native";

import { Radius, Spacing } from "@/constants/theme";

export type PhotoBarsProps = {
  count: number;
  index: number;
};

/** Barras sobre la foto que indican cuántas fotos hay y cuál se ve. Con una sola foto no se muestran. */
export function PhotoBars({ count, index }: PhotoBarsProps) {
  if (count < 2) return null;

  return (
    <View style={styles.bars} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[styles.bar, { backgroundColor: i === index ? "#FFFFFF" : "rgba(255, 255, 255, 0.35)" }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bars: {
    position: "absolute",
    top: Spacing.two,
    left: Spacing.three,
    right: Spacing.three,
    flexDirection: "row",
    gap: Spacing.one,
  },
  bar: {
    flex: 1,
    height: 3,
    borderRadius: Radius.full,
  },
});
