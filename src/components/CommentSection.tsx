import { useState } from "react";
import { useUser } from "../context/UserContext";
import { addComment } from "../lib/data";
import type { Comment, Profile } from "../types";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  return `il y a ${d} j`;
}

export function CommentSection({
  wineId,
  comments,
  profiles,
}: {
  wineId: string;
  comments: Comment[];
  profiles: Record<string, Profile>;
}) {
  const { userId, profile } = useUser();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !userId) return;
    setSending(true);
    try {
      await addComment(wineId, userId, trimmed);
      setText("");
      setError(null);
    } catch (err) {
      setError(`Commentaire non enregistré : ${(err as Error).message}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm shadow-wine-900/5">
      <p className="mb-3 text-sm font-semibold text-wine-800">Commentaires</p>

      <div className="flex flex-col gap-3">
        {comments.length === 0 && (
          <p className="text-sm text-wine-700/50">Aucun commentaire pour l'instant.</p>
        )}
        {comments.map((c) => {
          const isMe = c.user_id === userId;
          const pseudo = isMe ? profile?.pseudo ?? "Moi" : profiles[c.user_id]?.pseudo ?? "?";
          return (
            <div key={c.id} className="flex gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-wine-100 text-xs font-semibold text-wine-700">
                {pseudo.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1 rounded-xl bg-wine-50 px-3 py-2">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-wine-900">{pseudo}</span>
                  <span className="shrink-0 text-xs text-wine-700/40">{timeAgo(c.created_at)}</span>
                </div>
                <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-wine-900/90">
                  {c.content}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ajouter un commentaire…"
          className="input flex-1"
          maxLength={1000}
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="rounded-lg bg-wine-700 px-4 py-2 font-medium text-white disabled:opacity-40"
        >
          Envoyer
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
