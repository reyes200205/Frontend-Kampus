import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { Screen } from "@/components/layout/screen";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Spacing } from "@/constants/theme";

/** Categorías de grupos (diccionario de datos: `groups.category`). */
const Categories = [
  { value: "all", label: "Todos" },
  { value: "deportivo", label: "Deportivo" },
  { value: "cultural", label: "Cultural" },
  { value: "academico", label: "Académico" },
  { value: "social", label: "Social" },
] as const;

type Category = (typeof Categories)[number]["value"];

// TODO (T-18): lista de grupos desde la API, detalle, crear grupo y actividades.
export default function GroupsScreen() {
  const [category, setCategory] = useState<Category>("all");

  return (
    <Screen title="Grupos" subtitle="Clubes deportivos, culturales y más de tu institución.">
      <View style={styles.categories}>
        {Categories.map((item) => (
          <Chip
            key={item.value}
            label={item.label}
            selected={category === item.value}
            onPress={() => setCategory(item.value)}
          />
        ))}
      </View>

      <EmptyState
        icon={{ ios: "person.3", android: "groups", web: "groups" }}
        title="Todavía no hay grupos"
        message="Aquí encontrarás los clubes de tu campus para unirte a sus actividades."
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
});
