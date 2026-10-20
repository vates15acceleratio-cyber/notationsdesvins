import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db";
import type { Tasting, Wine } from "../types";

export interface WineWithStats extends Wine {
  tastings: (Tasting & { pseudo: string })[];
  averageNote: number | null;
}

export function useWines() {
  // useLiveQuery se relance tout seul à chaque modification de la base locale
  // (saisie sur ce téléphone ou fusion d'une mise à jour venue de GitHub).
  const wines = useLiveQuery(async () => {
    const [wineRows, tastingRows, profileRows] = await Promise.all([
      db.wines.orderBy("created_at").reverse().filter((w) => !w.deleted).toArray(),
      db.tastings.filter((t) => !t.deleted).toArray(),
      db.profiles.toArray(),
    ]);
    const pseudoOf = new Map(profileRows.map((p) => [p.id, p.pseudo]));

    return wineRows.map((wine): WineWithStats => {
      const wineTastings = tastingRows
        .filter((t) => t.wine_id === wine.id)
        .map((t) => ({ ...t, pseudo: pseudoOf.get(t.user_id) ?? "?" }));
      const notes = wineTastings.map((t) => t.note).filter((n): n is number => n != null);
      const averageNote = notes.length ? notes.reduce((a, b) => a + b, 0) / notes.length : null;
      return { ...wine, tastings: wineTastings, averageNote };
    });
  }, []);

  return { wines: wines ?? [], loading: wines === undefined };
}
