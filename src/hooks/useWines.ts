import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Profile, Tasting, Wine } from "../types";

export interface WineWithStats extends Wine {
  tastings: (Tasting & { pseudo: string })[];
  averageNote: number | null;
}

export function useWines() {
  const [wines, setWines] = useState<WineWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchAll() {
    const [{ data: wineRows }, { data: tastingRows }, { data: profileRows }] = await Promise.all([
      supabase.from("wines").select("*").order("created_at", { ascending: false }),
      supabase.from("tastings").select("*"),
      supabase.from("profiles").select("*"),
    ]);

    const profileMap = new Map<string, Profile>((profileRows ?? []).map((p) => [p.id, p]));

    const combined: WineWithStats[] = (wineRows ?? []).map((wine) => {
      const wineTastings = (tastingRows ?? [])
        .filter((t) => t.wine_id === wine.id)
        .map((t) => ({ ...t, pseudo: profileMap.get(t.user_id)?.pseudo ?? "?" }));
      const notes = wineTastings.map((t) => t.note).filter((n): n is number => n != null);
      const averageNote = notes.length ? notes.reduce((a, b) => a + b, 0) / notes.length : null;
      return { ...wine, tastings: wineTastings, averageNote };
    });

    setWines(combined);
    setLoading(false);
  }

  useEffect(() => {
    fetchAll();

    const channel = supabase
      .channel("wines-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "wines" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "tastings" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, fetchAll)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { wines, loading, refetch: fetchAll };
}
