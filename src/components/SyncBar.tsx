import { Link } from "react-router-dom";
import { useSync } from "../context/SyncContext";

export function SyncBar() {
  const { status, error, message, dirty, canPublish, refresh, publishNow, clearMessages } = useSync();
  const busy = status !== "idle";

  return (
    <div className="mt-3">
      <div className="flex gap-2">
        <button
          onClick={refresh}
          disabled={busy}
          className="flex-1 rounded-lg bg-white px-3 py-2 text-sm font-medium text-wine-700 shadow-sm shadow-wine-900/5 disabled:opacity-60"
        >
          {status === "pulling" ? "Mise à jour…" : "⟳ Mettre à jour"}
        </button>
        {canPublish ? (
          <button
            onClick={publishNow}
            disabled={busy}
            className="flex-1 rounded-lg bg-wine-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {status === "publishing" ? "Publication…" : `↑ Publier${dirty ? ` (${dirty})` : ""}`}
          </button>
        ) : (
          <Link
            to="/reglages"
            className="flex-1 rounded-lg bg-wine-100 px-3 py-2 text-center text-sm font-medium text-wine-700"
          >
            🔑 Activer la publication
          </Link>
        )}
      </div>
      {(error || message) && (
        <button
          onClick={clearMessages}
          className={`mt-2 w-full rounded-lg px-3 py-1.5 text-left text-xs ${
            error ? "bg-amber-50 text-amber-800" : "bg-green-50 text-green-800"
          }`}
        >
          {error ?? message}
        </button>
      )}
    </div>
  );
}
