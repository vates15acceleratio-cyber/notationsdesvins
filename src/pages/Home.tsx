import { useState } from "react";
import { Link } from "react-router-dom";
import { WineCard } from "../components/WineCard";
import { useUser } from "../context/UserContext";
import { useWines } from "../hooks/useWines";
import { WINE_TYPE_LABELS, type WineType } from "../types";

export function Home() {
  const { wines, loading } = useWines();
  const { profile } = useUser();
  const [filter, setFilter] = useState<WineType | "tous">("tous");

  const filtered = filter === "tous" ? wines : wines.filter((w) => w.type === filter);

  return (
    <div className="mx-auto min-h-dvh max-w-lg pb-24">
      <header className="sticky top-0 z-10 border-b border-wine-100 bg-wine-50/90 px-4 pb-3 pt-6 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-wine-900">Nos Vins</h1>
            <p className="text-sm text-wine-700/60">Salut {profile?.pseudo} 👋</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-wine-700 text-lg text-white">
            🍇
          </div>
        </div>
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
          {(["tous", "rouge", "blanc", "rose", "gris", "petillant", "liquoreux"] as const).map(
            (t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  filter === t
                    ? "bg-wine-700 text-white"
                    : "bg-white text-wine-700/70 hover:bg-wine-100"
                }`}
              >
                {t === "tous" ? "Tous" : WINE_TYPE_LABELS[t]}
              </button>
            )
          )}
        </div>
      </header>

      <main className="flex flex-col gap-2.5 px-4 pt-4">
        {loading && <p className="py-10 text-center text-wine-700/50">Chargement…</p>}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center text-wine-700/60">
            <span className="text-4xl">🍷</span>
            <p>Aucun vin pour l'instant.</p>
            <p className="text-sm">Ajoute le premier avec le bouton +</p>
          </div>
        )}
        {filtered.map((wine) => (
          <WineCard key={wine.id} wine={wine} />
        ))}
      </main>

      <Link
        to="/nouveau"
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-wine-700 text-3xl text-white shadow-lg shadow-wine-900/30 transition hover:bg-wine-800 active:scale-95"
        aria-label="Ajouter un vin"
      >
        +
      </Link>
    </div>
  );
}
