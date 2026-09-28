import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Comment, Profile, Tasting, Wine } from "../types";

export function useWineDetail(wineId: string | undefined) {
  const [wine, setWine] = useState<Wine | null>(null);
  const [tastings, setTastings] = useState<Tasting[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);

  async function fetchAll() {
    if (!wineId) return;
    const [{ data: wineRow }, { data: tastingRows }, { data: commentRows }, { data: profileRows }] =
      await Promise.all([
        supabase.from("wines").select("*").eq("id", wineId).maybeSingle(),
        supabase.from("tastings").select("*").eq("wine_id", wineId),
        supabase.from("comments").select("*").eq("wine_id", wineId).order("created_at", { ascending: true }),
        supabase.from("profiles").select("*"),
      ]);

    setWine(wineRow ?? null);
    setTastings(tastingRows ?? []);
    setComments(commentRows ?? []);
    setProfiles(Object.fromEntries((profileRows ?? []).map((p) => [p.id, p])));
    setLoading(false);
  }

  useEffect(() => {
    setLoading(true);
    fetchAll();
    if (!wineId) return;

    const channel = supabase
      .channel(`wine-detail-${wineId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "wines", filter: `id=eq.${wineId}` },
        fetchAll
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tastings", filter: `wine_id=eq.${wineId}` },
        fetchAll
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments", filter: `wine_id=eq.${wineId}` },
        fetchAll
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wineId]);

  return { wine, tastings, comments, profiles, loading, refetch: fetchAll };
}
