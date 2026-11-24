/**
 * Datos de "Para ti" en Grupos (T-18), al estilo de Facebook: tus grupos, las próximas actividades de tus
 * grupos como publicaciones y grupos recomendados para unirte.
 *
 * La API no tiene un feed: las actividades se piden grupo por grupo (solo los aprobados y como mucho
 * `MaxFeedGroups`), y las recomendaciones son grupos aprobados de tu universidad donde todavía no estás.
 */

import { useCallback, useRef, useState } from "react";

import { ApiError } from "@/services/api";
import { listGroupActivities, listGroups, listMyGroups } from "@/services/groups";
import type { Group, GroupActivity } from "@/types/groups";

/** Tope de grupos a los que se les piden actividades, para no hacer decenas de peticiones. */
const MaxFeedGroups = 10;
const MaxRecommendations = 5;

/** Una actividad con el grupo que la publicó, para mostrarla como publicación en el feed. */
export type GroupPost = { group: Group; activity: GroupActivity };

type Status = "loading" | "ready" | "error";

export function useGroupsHome(universityId: number | null) {
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  /** Actividades próximas por grupo (`meta.total`), para el "• 2 actividades próximas" de la lista. */
  const [upcomingCount, setUpcomingCount] = useState<Record<number, number>>({});
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [recommended, setRecommended] = useState<Group[]>([]);
  const request = useRef(0);

  const load = useCallback(async () => {
    const id = ++request.current;
    setError(null);
    try {
      const [mine, approved] = await Promise.all([
        listMyGroups(1),
        listGroups(1, universityId ? { university_id: universityId } : {}),
      ]);

      const feedGroups = mine.data.filter((group) => group.status === "approved").slice(0, MaxFeedGroups);
      const pages = await Promise.all(
        feedGroups.map((group) =>
          listGroupActivities(group.id)
            .then((res) => ({ group, res }))
            // Si falla un grupo, el resto del feed sigue.
            .catch(() => null),
        ),
      );
      if (id !== request.current) return;

      const counts: Record<number, number> = {};
      const nextPosts: GroupPost[] = [];
      for (const page of pages) {
        if (!page) continue;
        counts[page.group.id] = page.res.meta.total;
        for (const activity of page.res.data) nextPosts.push({ group: page.group, activity });
      }
      // La más cercana primero, como una agenda.
      nextPosts.sort((a, b) => a.activity.starts_at.localeCompare(b.activity.starts_at));

      setMyGroups(mine.data);
      setUpcomingCount(counts);
      setPosts(nextPosts);
      setRecommended(approved.data.filter((group) => group.my_role === null).slice(0, MaxRecommendations));
      setStatus("ready");
    } catch (e) {
      if (id !== request.current) return;
      setError(e instanceof ApiError ? e.message : "No pudimos cargar tus grupos.");
      setStatus("error");
    }
  }, [universityId]);

  /** Quita una recomendación (al unirse o al descartarla) sin volver a pedir todo. */
  const dismissRecommendation = useCallback((groupId: number) => {
    setRecommended((current) => current.filter((group) => group.id !== groupId));
  }, []);

  return { status, error, myGroups, upcomingCount, posts, recommended, load, dismissRecommendation };
}
