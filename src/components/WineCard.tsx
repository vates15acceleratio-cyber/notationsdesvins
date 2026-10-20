import { Link } from "react-router-dom";
import { usePhotoUrl } from "../lib/photos";
import type { WineWithStats } from "../hooks/useWines";
import { WineTypeBadge } from "./WineTypeBadge";

export function WineCard({ wine }: { wine: WineWithStats }) {
  const photoUrl = usePhotoUrl(wine.photo_path);
  return (
    <Link
      to={`/vins/${wine.id}`}
      className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm shadow-wine-900/5 transition hover:shadow-md hover:shadow-wine-900/10 active:scale-[0.99]"
    >
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-wine-100">
        {photoUrl ? (
          <img src={photoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl">🍷</div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-serif text-lg font-semibold text-wine-900">
              {wine.name}
            </h3>
            {wine.averageNote != null && (
              <span className="shrink-0 rounded-full bg-gold-500/15 px-2 py-0.5 text-sm font-semibold text-gold-500">
                {wine.averageNote.toFixed(1)} ★
              </span>
            )}
          </div>
          <p className="truncate text-sm text-wine-700/70">
            {[wine.producer, wine.vintage].filter(Boolean).join(" · ") || "Détails à compléter"}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <WineTypeBadge type={wine.type} />
          <span className="text-xs text-wine-700/60">
            {wine.tastings.length} avis
          </span>
        </div>
      </div>
    </Link>
  );
}
