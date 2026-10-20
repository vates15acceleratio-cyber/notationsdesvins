import Dexie, { type EntityTable } from "dexie";
import type { Comment, Profile, Tasting, Wine } from "../types";

export interface LocalPhoto {
  path: string;
  blob: Blob;
  // true tant que la photo n'a pas été envoyée sur GitHub
  pending: boolean;
}

export interface MetaEntry {
  key: string;
  value: unknown;
}

// Base locale du téléphone : c'est la source de vérité de l'app. GitHub ne sert
// qu'à échanger des instantanés entre personnes.
export const db = new Dexie("nos-vins") as Dexie & {
  profiles: EntityTable<Profile, "id">;
  wines: EntityTable<Wine, "id">;
  tastings: EntityTable<Tasting, "id">;
  comments: EntityTable<Comment, "id">;
  photos: EntityTable<LocalPhoto, "path">;
  meta: EntityTable<MetaEntry, "key">;
};

db.version(1).stores({
  profiles: "id",
  wines: "id, created_at",
  tastings: "id, wine_id, user_id",
  comments: "id, wine_id",
  photos: "path",
  meta: "key",
});

export async function getMeta<T>(key: string, fallback: T): Promise<T> {
  const entry = await db.meta.get(key);
  return entry ? (entry.value as T) : fallback;
}

export function setMeta(key: string, value: unknown) {
  return db.meta.put({ key, value });
}

// Nombre de modifications locales pas encore publiées.
export async function markDirty() {
  await setMeta("dirty", (await getMeta("dirty", 0)) + 1);
}

export function now() {
  return new Date().toISOString();
}
