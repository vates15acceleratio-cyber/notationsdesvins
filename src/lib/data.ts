import type { Comment, Tasting, Wine } from "../types";
import { db, markDirty, now } from "./db";

export type WineFields = Omit<Wine, "id" | "created_by" | "created_at" | "updated_at" | "deleted">;
export type TastingFields = Omit<Tasting, "id" | "wine_id" | "user_id" | "created_at" | "updated_at" | "deleted">;

export async function createWine(fields: WineFields, userId: string): Promise<Wine> {
  const t = now();
  const wine: Wine = { ...fields, id: crypto.randomUUID(), created_by: userId, created_at: t, updated_at: t, deleted: false };
  await db.wines.add(wine);
  await markDirty();
  return wine;
}

export async function updateWine(id: string, changes: Partial<WineFields>) {
  await db.wines.update(id, { ...changes, updated_at: now() });
  await markDirty();
}

// Suppression « douce » : la fiche est marquée supprimée pour que la suppression
// se propage aux autres à la prochaine publication.
export async function deleteWine(id: string) {
  await db.wines.update(id, { deleted: true, updated_at: now() });
  await markDirty();
}

export async function saveTasting(wineId: string, userId: string, fields: TastingFields) {
  const t = now();
  const existing = await db.tastings
    .where("wine_id")
    .equals(wineId)
    .filter((x) => x.user_id === userId && !x.deleted)
    .first();
  if (existing) {
    await db.tastings.update(existing.id, { ...fields, updated_at: t });
  } else {
    await db.tastings.add({
      ...fields,
      id: crypto.randomUUID(),
      wine_id: wineId,
      user_id: userId,
      created_at: t,
      updated_at: t,
      deleted: false,
    });
  }
  await markDirty();
}

export async function addComment(wineId: string, userId: string, content: string) {
  const t = now();
  const comment: Comment = {
    id: crypto.randomUUID(),
    wine_id: wineId,
    user_id: userId,
    content,
    created_at: t,
    updated_at: t,
    deleted: false,
  };
  await db.comments.add(comment);
  await markDirty();
}

export async function setProfilePseudo(id: string, pseudo: string) {
  const t = now();
  const existing = await db.profiles.get(id);
  await db.profiles.put({ id, pseudo, created_at: existing?.created_at ?? t, updated_at: t });
  await markDirty();
}
