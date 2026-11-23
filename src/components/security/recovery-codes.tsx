import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Fonts, Spacing } from "@/constants/theme";

type Props = {
  codes: string[];
  onDone: () => void;
};

/**
 * Códigos de respaldo recién generados (al activar o al regenerarlos). La API no los vuelve a mostrar,
 * así que se pide guardarlos antes de salir. Cada uno sirve una sola vez para entrar sin la app.
 */
export function RecoveryCodes({ codes, onDone }: Props) {
  return (
    <Card style={styles.card}>
      <View style={styles.text}>
        <ThemedText type="smallBold">Guarda tus códigos de respaldo</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Si pierdes tu celular, puedes entrar con uno de estos códigos. Cada uno sirve una sola vez y no se
          vuelven a mostrar: anótalos o guárdalos en un lugar seguro.
        </ThemedText>
      </View>

      <View style={styles.grid}>
        {codes.map((code) => (
          <ThemedText key={code} selectable style={styles.code}>
            {code}
          </ThemedText>
        ))}
      </View>

      <Button title="Ya los guardé" onPress={onDone} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.four,
  },
  text: {
    gap: Spacing.two,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: Spacing.two,
  },
  code: {
    width: "50%",
    fontFamily: Fonts?.mono,
    letterSpacing: 1,
  },
});
