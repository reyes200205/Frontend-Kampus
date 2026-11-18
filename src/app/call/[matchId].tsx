import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";

import { CallView } from "@/components/call/call-view";
import { loadMatches, useMatches } from "@/hooks/use-matches";
import { useSession } from "@/hooks/use-session";

/**
 * Llamada 1 a 1 con un match (T-20, RF-10). `?answer=1` contesta una llamada entrante; sin él, llama.
 * `?type=audio` es llamada de voz; sin él, videollamada. La llamada en sí vive en `CallView` (LiveKit en web;
 * aviso en nativo).
 */
export default function CallScreen() {
  const params = useLocalSearchParams<{ matchId: string; answer?: string; type?: string }>();
  const matchId = Number(params.matchId);
  const mode = params.answer === "1" ? "answer" : "start";
  const type = params.type === "audio" ? "audio" : "video";
  const { isSignedIn } = useSession();
  const { matches, status } = useMatches();
  const match = matches.find((item) => item.id === matchId) ?? null;

  // Si se abre directo (recarga en web), se trae el match para mostrar nombre y foto.
  useEffect(() => {
    if (!match && status === "idle") void loadMatches();
  }, [match, status]);

  if (!isSignedIn) return <Redirect href="/auth/login" />;
  if (!Number.isInteger(matchId) || matchId <= 0) return <Redirect href="/chats" />;

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace({ pathname: "/chat/[matchId]", params: { matchId: String(matchId) } });
  }

  return <CallView matchId={matchId} mode={mode} type={type} peer={match?.user ?? null} onClose={close} />;
}
