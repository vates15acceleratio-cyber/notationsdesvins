import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState } from "react";
import { DATA_REPO } from "../config";
import { db } from "./db";

const MAX_SIDE = 1280;

// Réduit une photo de téléphone (3 à 8 Mo) à ~150 Ko avant de la stocker.
export async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Compression impossible"))), "image/jpeg", 0.8)
  );
}

// Enregistre la photo localement (à publier plus tard) et renvoie son chemin.
export async function saveLabelPhoto(file: File, wineId: string): Promise<string> {
  const blob = await compressImage(file);
  const path = `photos/${wineId}-${Date.now()}.jpg`;
  await db.photos.put({ path, blob, pending: true });
  return path;
}

export function remotePhotoUrl(path: string) {
  const { owner, repo, branch } = DATA_REPO;
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
}

// Photo locale si on l'a (prise sur ce téléphone), sinon celle publiée sur GitHub.
export function usePhotoUrl(path: string | null): string | null {
  // undefined = lecture en cours, null = pas de copie locale
  const local = useLiveQuery(async () => (path ? (await db.photos.get(path)) ?? null : null), [path]);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!local) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(local.blob);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [local]);

  if (!path || local === undefined) return null;
  if (local) return objectUrl;
  return remotePhotoUrl(path);
}
