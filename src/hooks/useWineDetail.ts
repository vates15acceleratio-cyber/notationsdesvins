import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db";
import type { Profile } from "../types";

export function useWineDetail(wineId: string | undefined) {
  const data = useLiveQuery(async () => {
    if (!wineId) return null;
    const [wine, tastings, comments, profileRows] = await Promise.all([
      db.wines.get(wineId),
      db.tastings.where("wine_id").equals(wineId).filter((t) => !t.deleted).toArray(),
      db.comments.where("wine_id").equals(wineId).filter((c) => !c.deleted).sortBy("created_at"),
      db.profiles.toArray(),
    ]);
    return {
      wine: wine && !wine.deleted ? wine : null,
      tastings,
      comments,
      profiles: Object.fromEntries(profileRows.map((p) => [p.id, p])) as Record<string, Profile>,
    };
  }, [wineId]);

  return {
    wine: data?.wine ?? null,
    tastings: data?.tastings ?? [],
    comments: data?.comments ?? [],
    profiles: data?.profiles ?? {},
    loading: data === undefined,
  };
}
