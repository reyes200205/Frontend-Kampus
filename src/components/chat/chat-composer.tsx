import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { FontFamily, FontSize, MinTouchSize, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/** Límite de la API (`StoreMessageRequest`). */
const MaxLength = 5000;

export type ChatComposerProps = {
  onSend: (body: string) => void;
  disabled?: boolean;
};

/** Campo para escribir y botón de enviar, abajo de la conversación. */
export function ChatComposer({ onSend, disabled }: ChatComposerProps) {
  const theme = useTheme();
  const [text, setText] = useState("");
  const body = text.trim();
  const canSend = body !== "" && !disabled;

  function send() {
    if (!canSend) return;
    onSend(body);
    setText("");
  }

  return (
    <View style={[styles.bar, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Escribe un mensaje"
        placeholderTextColor={theme.placeholder}
        selectionColor={theme.accent}
        cursorColor={theme.accent}
        accessibilityLabel="Mensaje"
        multiline
        maxLength={MaxLength}
        editable={!disabled}
        // En web, Enter envía y Shift+Enter hace un salto de línea.
        onKeyPress={(e) => {
          const event = e.nativeEvent as { key: string; shiftKey?: boolean };
          if (event.key === "Enter" && !event.shiftKey && "preventDefault" in e) {
            (e as unknown as { preventDefault: () => void }).preventDefault();
            send();
          }
        }}
        style={[
          styles.input,
          { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.border },
        ]}
      />
      <Pressable
        onPress={send}
        disabled={!canSend}
        accessibilityRole="button"
        accessibilityLabel="Enviar mensaje"
        accessibilityState={{ disabled: !canSend }}
        style={({ pressed }) => [
          styles.send,
          { backgroundColor: canSend ? theme.accent : theme.backgroundSelected },
          pressed && styles.pressed,
        ]}
      >
        <SymbolView
          name={{ ios: "paperplane.fill", android: "send", web: "send" }}
          size={20}
          tintColor={canSend ? theme.onAccent : theme.placeholder}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    minHeight: MinTouchSize,
    maxHeight: 140,
    paddingHorizontal: Spacing.three,
    paddingTop: 12,
    paddingBottom: 12,
    borderRadius: Radius.large,
    borderWidth: 1,
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    // En web el navegador dibuja su propio contorno al enfocar.
    outlineWidth: 0,
  },
  send: {
    width: MinTouchSize,
    height: MinTouchSize,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.7,
  },
});
