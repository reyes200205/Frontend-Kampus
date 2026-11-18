/**
 * Lista paginada de Laravel con páginas numeradas, para las tablas del panel de gestión (T-44).
 * El estado vive en la pantalla. La pantalla llama a `reload` al enfocarse (`useFocusEffect`) y,
 * si cambia la consulta (otro filtro → otro `fetchPage`), la lista vuelve a la página 1.
 */

import { useCallback, useRef, useState } from "react";

import { ApiError } from "@/services/api";
import type { Paginated } from "@/types/api";

type Status = "loading" | "ready" | "error";

export function usePaginated<T>(fetchPage: (page: number) => Promise<Paginated<T>>, errorMessage: string) {
  const [items, setItems] = useState<T[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [page, setPageState] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const currentPage = useRef(1);
  // Evita que una respuesta vieja (otra página u otro filtro) pise a la más reciente.
  const request = useRef(0);
  // Con qué `fetchPage` se cargó la lista: si cambia, la lista anterior ya no sirve.
  const loadedWith = useRef<typeof fetchPage | null>(null);

  const load = useCallback(
    async (target: number) => {
      const id = ++request.current;
      if (loadedWith.current !== fetchPage) {
        loadedWith.current = fetchPage;
        target = 1;
        setItems([]);
      }
      currentPage.current = target;
      setPageState(target);
      setStatus("loading");
      setError(null);
      try {
        let res = await fetchPage(target);
        // Si se vació la última página (p. ej. se revisó su único grupo), se pasa a la que ahora es la última.
        if (res.data.length === 0 && target > 1 && res.meta.last_page < target) {
          target = Math.max(1, res.meta.last_page);
          res = await fetchPage(target);
        }
        if (id !== request.current) return;
        currentPage.current = target;
        setPageState(target);
        setItems(res.data);
        setLastPage(res.meta.last_page);
        setTotal(res.meta.total);
        setStatus("ready");
      } catch (e) {
        if (id !== request.current) return;
        setError(e instanceof ApiError ? e.message : errorMessage);
        setStatus("error");
      }
    },
    [fetchPage, errorMessage],
  );

  /** Vuelve a pedir la página actual (o la 1 si cambió la consulta). */
  const reload = useCallback(() => load(currentPage.current), [load]);

  return { items, setItems, status, error, page, lastPage, total, setPage: load, reload };
}
