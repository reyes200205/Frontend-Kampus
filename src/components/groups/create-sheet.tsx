import { useState } from "react";

import { ActionSheet, ActionSheetItem } from "@/components/ui/action-sheet";
import type { Group } from "@/types/groups";

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Grupos aprobados que administra: solo en esos se pueden publicar actividades. */
  managedGroups: Group[];
  onCreateGroup: () => void;
  onPublishActivity: (group: Group) => void;
};

/**
 * Hoja del "+" de Grupos (como en Facebook): crear un grupo o publicar una actividad. Si administra varios
 * grupos, el segundo paso pregunta en cuál publicar.
 */
export function CreateSheet({ visible, onClose, managedGroups, onCreateGroup, onPublishActivity }: Props) {
  const [choosing, setChoosing] = useState(false);

  function close() {
    setChoosing(false);
    onClose();
  }

  function publish() {
    if (managedGroups.length === 1) {
      close();
      onPublishActivity(managedGroups[0]);
    } else {
      setChoosing(true);
    }
  }

  return (
    <ActionSheet visible={visible} onClose={close} title={choosing ? "¿En qué grupo la publicas?" : undefined}>
      {choosing ? (
        managedGroups.map((group) => (
          <ActionSheetItem
            key={group.id}
            icon={{ ios: "person.3", android: "groups", web: "groups" }}
            title={group.name}
            onPress={() => {
              close();
              onPublishActivity(group);
            }}
          />
        ))
      ) : (
        <>
          <ActionSheetItem
            icon={{ ios: "person.3.fill", android: "group_add", web: "group_add" }}
            title="Crear un grupo"
            description="Lo revisa un moderador de tu universidad."
            onPress={() => {
              close();
              onCreateGroup();
            }}
          />
          <ActionSheetItem
            icon={{ ios: "square.and.pencil", android: "edit_square", web: "edit_square" }}
            title="Publicar una actividad"
            description={
              managedGroups.length > 0
                ? "En un grupo que administras."
                : "Necesitas administrar un grupo aprobado."
            }
            onPress={publish}
            disabled={managedGroups.length === 0}
          />
        </>
      )}
    </ActionSheet>
  );
}
