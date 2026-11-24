import { Platform, type TextStyle } from "react-native";

/**
 * En web, Safari dibuja su propio contorno al enfocar un campo (`outline-style: auto`, que ignora
 * `outlineWidth: 0`) y queda un segundo borde dentro del nuestro. El borde del campo ya marca el foco, así que se
 * apaga. Los tipos de React Native no incluyen `"none"`, por eso el `as`.
 */
export const webNoOutline: TextStyle | undefined =
  Platform.OS === "web" ? ({ outlineStyle: "none" } as unknown as TextStyle) : undefined;
