import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View, type StyleProp, type ViewStyle } from "react-native";

import { webNoOutline } from "@/components/ui/web-no-outline";
import { FontFamily, FontSize, MinTouchSize, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type SearchFieldProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
};

/** Buscador compacto para la barra de herramientas de una tabla. */
export function SearchField({ value, onChangeText, placeholder = "Buscar", style }: SearchFieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.field,
        { backgroundColor: theme.backgroundElement, borderColor: focused ? theme.accent : theme.border },
        style,
      ]}
    >
      <SymbolView
        name={{ ios: "magnifyingglass", android: "search", web: "search" }}
        size={18}
        tintColor={theme.placeholder}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.placeholder}
        selectionColor={theme.accent}
        accessibilityLabel={placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[styles.input, { color: theme.text }, webNoOutline]}
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => onChangeText("")}
          accessibilityRole="button"
          accessibilityLabel="Borrar búsqueda"
          hitSlop={Spacing.two}
        >
          <SymbolView name={{ ios: "xmark", android: "close", web: "close" }} size={16} tintColor={theme.placeholder} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    height: MinTouchSize,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.three - 4,
    borderRadius: Radius.medium,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    outlineWidth: 0,
  },
});
