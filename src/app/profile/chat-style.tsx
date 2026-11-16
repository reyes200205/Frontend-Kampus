import { SymbolView } from "expo-symbols";
import { useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ChatStylePreview, ChatWallpaper } from "@/components/chat/chat-wallpaper";
import { StackHeader } from "@/components/layout/stack-header";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import {
  BubbleColors,
  bubbleColors,
  DefaultChatStyle,
  WallpaperCategories,
  Wallpapers,
} from "@/constants/chat-style";
import { MaxContentWidth, Radius, Spacing } from "@/constants/theme";
import { resetChatStyle, setChatStyle, useChatStyle } from "@/hooks/use-chat-style";
import { useTheme } from "@/hooks/use-theme";

type Mode = "bubble" | "wallpaper";

const TileWidth = 104;

/**
 * Estilo del chat (Perfil → Apariencia → Estilo predeterminado del chat): arriba se elige qué cambiar
 * (burbuja o fondo) y abajo las miniaturas muestran cómo se vería cada opción con lo demás ya elegido.
 * Se aplica al instante en todas las conversaciones.
 */
export default function ChatStyleScreen() {
  const theme = useTheme();
  const chatStyle = useChatStyle();
  const [mode, setMode] = useState<Mode>("wallpaper");
  const mine = bubbleColors(chatStyle.bubble, theme);
  const isDefault =
    chatStyle.bubble === DefaultChatStyle.bubble && chatStyle.wallpaper === DefaultChatStyle.wallpaper;

  return (
    <SafeAreaView edges={["top", "left", "right", "bottom"]} style={[styles.flex, { backgroundColor: theme.background }]}>
      <StackHeader title="Estilo del chat" fallback="/profile/appearance" />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.inner}>
          <View style={styles.modes} accessibilityRole="tablist">
            <ModeButton label="Burbuja de chat" active={mode === "bubble"} onPress={() => setMode("bubble")}>
              <View style={[styles.modeBubble, { backgroundColor: mine.background }]} />
            </ModeButton>
            <ModeButton label="Fondo" active={mode === "wallpaper"} onPress={() => setMode("wallpaper")}>
              <View style={[styles.modeWallpaper, { borderColor: theme.border }]}>
                <ChatWallpaper id={chatStyle.wallpaper} />
              </View>
            </ModeButton>
          </View>

          {mode === "bubble" ? (
            <Section title="Colores">
              {BubbleColors.map((bubble) => (
                <Tile
                  key={bubble.id}
                  label={`Burbuja ${bubble.name}`}
                  selected={bubble.id === chatStyle.bubble}
                  onPress={() => setChatStyle({ bubble: bubble.id })}
                >
                  <ChatStylePreview wallpaper={chatStyle.wallpaper} bubble={bubble.id} width={TileWidth} />
                </Tile>
              ))}
            </Section>
          ) : (
            WallpaperCategories.map((category) => (
              <Section key={category} title={category}>
                {Wallpapers.filter((wallpaper) => wallpaper.category === category).map((wallpaper) => (
                  <Tile
                    key={wallpaper.id}
                    label={`Fondo ${wallpaper.name}`}
                    selected={wallpaper.id === chatStyle.wallpaper}
                    onPress={() => setChatStyle({ wallpaper: wallpaper.id })}
                  >
                    <ChatStylePreview wallpaper={wallpaper.id} bubble={chatStyle.bubble} width={TileWidth} />
                  </Tile>
                ))}
              </Section>
            ))
          )}

          {!isDefault && (
            <Button
              title="Restablecer estilo"
              variant="ghost"
              icon={{ ios: "arrow.counterclockwise", android: "restart_alt", web: "restart_alt" }}
              onPress={resetChatStyle}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/** Botón redondo de arriba para cambiar entre burbuja y fondo. */
function ModeButton({
  label,
  active,
  onPress,
  children,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  children: ReactNode;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [styles.mode, pressed && styles.pressed]}
    >
      <View
        style={[
          styles.modeCircle,
          { backgroundColor: theme.backgroundElement, borderColor: active ? theme.text : theme.backgroundElement },
        ]}
      >
        {children}
      </View>
      <ThemedText type={active ? "smallBold" : "small"} themeColor={active ? "text" : "textSecondary"}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

/** Título gris y tarjeta redondeada con las miniaturas en una fila que se desliza. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  const theme = useTheme();

  return (
    <View style={styles.section}>
      <ThemedText type="heading" themeColor="textSecondary" style={styles.sectionTitle}>
        {title}
      </ThemedText>
      <View style={[styles.sectionCard, { backgroundColor: theme.backgroundElement }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tiles}>
          {children}
        </ScrollView>
      </View>
    </View>
  );
}

function Tile({
  label,
  selected,
  onPress,
  children,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  children: ReactNode;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.tile,
        { borderColor: selected ? theme.text : "transparent" },
        pressed && styles.pressed,
      ]}
    >
      {children}
      {selected && (
        <View style={styles.checkRow} pointerEvents="none">
          <View style={[styles.check, { backgroundColor: theme.text }]}>
            <SymbolView
              name={{ ios: "checkmark", android: "check", web: "check" }}
              size={18}
              tintColor={theme.background}
            />
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  pressed: {
    opacity: 0.8,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
  },
  inner: {
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
    gap: Spacing.four,
  },
  modes: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.five,
  },
  mode: {
    alignItems: "center",
    gap: Spacing.two,
  },
  modeCircle: {
    width: 104,
    height: 80,
    borderRadius: Radius.full,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  modeBubble: {
    width: 64,
    height: 36,
    borderRadius: 18,
    borderBottomRightRadius: 4,
  },
  modeWallpaper: {
    width: 40,
    height: 52,
    borderRadius: Radius.small,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    paddingHorizontal: Spacing.two,
  },
  sectionCard: {
    borderRadius: Radius.large,
    overflow: "hidden",
  },
  tiles: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  tile: {
    padding: 3,
    borderWidth: 3,
    borderRadius: 24,
  },
  checkRow: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: Spacing.three + 6,
    alignItems: "center",
  },
  check: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
