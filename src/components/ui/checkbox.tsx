import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type CheckboxProps = {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

export function Checkbox({ label, value, onValueChange }: CheckboxProps) {
  const theme = useTheme();

  return (
    <Pressable
      style={styles.row}
      onPress={() => onValueChange(!value)}
      hitSlop={Spacing.one}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}
    >
      <View
        style={[
          styles.box,
          value
            ? { backgroundColor: theme.accent, borderColor: theme.accent }
            : { borderColor: theme.placeholder },
        ]}
      >
        {value && (
          <SymbolView
            name={{ ios: "checkmark", android: "check", web: "check" }}
            size={12}
            tintColor={theme.onAccent}
          />
        )}
      </View>
      <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  box: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 13,
  },
});
