import type { Table } from "dexie";
import { DATA_REPO } from "../config";
import type { Comment, Profile, Tasting, Wine } from "../types";
import { db, getMeta, setMeta, now } from "./db";

// Format d'un fichier data/<userId>.json : l'instantané complet de la base locale
// de son auteur (y compris les suppressions). La fusion de tous les fichiers,
// enregistrement par enregistrement, garde la version la plus récente.
export interface Snapshot {
  version: 1;
  author: { id: string; pseudo: string };
  published_at: string;
  profiles: Profile[];
  wines: Wine[];
  tastings: Tasting[];
  comments: Comment[];
}

const TOKEN_KEY = "nosvins.githubToken";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token.trim());
  else localStorage.removeItem(TOKEN_KEY);
}

const API = `https://api.github.com/repos/${DATA_REPO.owner}/${DATA_REPO.repo}`;

async function gh(path: string, init: RequestInit = {}, accept = "application/vnd.github+json") {
  const token = getToken();
  const res = await fetch(`${API}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: accept,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (!res.ok && res.status !== 404) {
    if (res.status === 401) throw new Error("Clé GitHub invalide ou expirée (réglages).");
    if (res.status === 403 && res.headers.get("x-ratelimit-remaining") === "0")
      throw new Error("Trop de requêtes vers GitHub, réessaie dans quelques minutes.");
    if (res.status === 403) throw new Error("La clé GitHub n'a pas le droit d'écrire dans le dépôt de données.");
    throw new Error(`GitHub a répondu ${res.status}.`);
  }
  return res;
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

interface RemoteFile {
  name: string;
  path: string;
  sha: string;
}

async function listDataFiles(): Promise<RemoteFile[]> {
  const res = await gh("/contents/data");
  if (res.status === 404) return [];
  const files = (await res.json()) as RemoteFile[];
  return files.filter((f) => f.name.endsWith(".json"));
}

function isNewer(a: { updated_at: string }, b: { updated_at: string } | undefined) {
  // || 0 : les dates importées de Supabase (6 décimales) peuvent être illisibles
  // pour Safari ; elles perdent alors face à toute modification récente.
  return !b || (Date.parse(a.updated_at) || 0) > (Date.parse(b.updated_at) || 0);
}

async function mergeInto<T extends { id: string; updated_at: string }, I>(
  table: Table<T, string, I>,
  incoming: T[]
) {
  if (!incoming?.length) return;
  const existing = await table.bulkGet(incoming.map((r) => r.id));
  const toPut = incoming.filter((r, i) => isNewer(r, existing[i]));
  if (toPut.length) await table.bulkPut(toPut as unknown as I[]);
}

async function mergeSnapshot(s: Snapshot) {
  await db.transaction("rw", [db.profiles, db.wines, db.tastings, db.comments], async () => {
    await mergeInto(db.profiles, s.profiles);
    await mergeInto(db.wines, s.wines);
    await mergeInto(db.tastings, s.tastings);
    await mergeInto(db.comments, s.comments);
  });
}

// Récupère les fichiers publiés par tout le monde et les fusionne en local.
// Renvoie la liste des fichiers distants (utile à la publication pour le sha).
export async function pull(): Promise<RemoteFile[]> {
  const files = await listDataFiles();
  const seen = await getMeta<Record<string, string>>("seenShas", {});
  for (const f of files) {
    if (seen[f.path] === f.sha) continue;
    // Lecture par sha (contenu immuable) : jamais de version en cache périmée.
    const res = await gh(`/git/blobs/${f.sha}`, {}, "application/vnd.github.raw+json");
    await mergeSnapshot((await res.json()) as Snapshot);
    seen[f.path] = f.sha;
  }
  await setMeta("seenShas", seen);
  await setMeta("lastPullAt", now());
  return files;
}

async function putFile(path: string, contentBase64: string, message: string, author: Snapshot["author"], sha?: string) {
  const res = await gh(`/contents/${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      content: contentBase64,
      branch: DATA_REPO.branch,
      committer: { name: author.pseudo, email: `${author.id}@nosvins.invalid` },
      ...(sha ? { sha } : {}),
    }),
  });
  if (res.status === 404) throw new Error("Dépôt de données introuvable, ou clé sans accès à ce dépôt.");
  return (await res.json()) as { content: { sha: string } };
}

// Envoie les photos en attente puis l'instantané complet de la base locale.
export async function publish(author: Snapshot["author"]) {
  if (!getToken()) throw new Error("Ajoute d'abord la clé GitHub dans les réglages.");

  // On fusionne d'abord ce que les autres ont publié, pour republier un état à jour.
  const files = await pull();

  const dirtyAtStart = await getMeta("dirty", 0);
  const pendingPhotos = await db.photos.filter((p) => p.pending).toArray();
  for (const photo of pendingPhotos) {
    const bytes = new Uint8Array(await photo.blob.arrayBuffer());
    try {
      await putFile(photo.path, toBase64(bytes), `Photo (${author.pseudo})`, author);
    } catch (err) {
      // 422 = le fichier existe déjà (envoi précédent interrompu) : rien à refaire.
      if (!(err instanceof Error && err.message.includes("422"))) throw err;
    }
    await db.photos.update(photo.path, { pending: false });
  }

  const snapshot: Snapshot = {
    version: 1,
    author,
    published_at: now(),
    profiles: await db.profiles.toArray(),
    wines: await db.wines.toArray(),
    tastings: await db.tastings.toArray(),
    comments: await db.comments.toArray(),
  };
  const path = `data/${author.id}.json`;
  const json = new TextEncoder().encode(JSON.stringify(snapshot, null, 1));
  const current = files.find((f) => f.path === path);
  const result = await putFile(path, toBase64(json), `Notes de ${author.pseudo}`, author, current?.sha);

  const seen = await getMeta<Record<string, string>>("seenShas", {});
  seen[path] = result.content.sha;
  await setMeta("seenShas", seen);
  // Les modifications faites pendant la publication restent à publier.
  await setMeta("dirty", Math.max(0, (await getMeta("dirty", 0)) - dirtyAtStart));
  await setMeta("lastPublishAt", now());
}
