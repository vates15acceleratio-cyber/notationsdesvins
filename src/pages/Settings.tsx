import { useState } from "react";
import { Link } from "react-router-dom";
import { DATA_REPO } from "../config";
import { useSync } from "../context/SyncContext";
import { useUser } from "../context/UserContext";
import { getToken, setToken } from "../lib/sync";

export function Settings() {
  const { profile, setPseudo } = useUser();
  const { onTokenChanged } = useSync();
  const [pseudo, setPseudoInput] = useState(profile?.pseudo ?? "");
  const [token, setTokenInput] = useState("");
  const [hasToken, setHasToken] = useState(() => !!getToken());
  const [saved, setSaved] = useState<string | null>(null);

  async function savePseudo() {
    const trimmed = pseudo.trim();
    if (trimmed.length < 2 || trimmed === profile?.pseudo) return;
    await setPseudo(trimmed);
    setSaved("Pseudo enregistré ✓ (publie pour le partager)");
  }

  function saveToken() {
    if (!token.trim()) return;
    setToken(token);
    setTokenInput("");
    setHasToken(true);
    onTokenChanged();
    setSaved("Clé enregistrée sur ce téléphone ✓");
  }

  function removeToken() {
    setToken(null);
    setHasToken(false);
    onTokenChanged();
    setSaved("Clé retirée de ce téléphone");
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg pb-16">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-wine-100 bg-wine-50/90 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur">
        <Link to="/" className="text-xl text-wine-700">
          ←
        </Link>
        <h1 className="font-serif text-xl font-semibold text-wine-900">Réglages</h1>
      </header>

      <div className="flex flex-col gap-4 px-4 py-5">
        {saved && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{saved}</p>}

        <section className="rounded-2xl bg-white p-4 shadow-sm shadow-wine-900/5">
          <p className="mb-2 text-sm font-semibold text-wine-800">Mon pseudo</p>
          <div className="flex gap-2">
            <input
              value={pseudo}
              onChange={(e) => setPseudoInput(e.target.value)}
              maxLength={30}
              className="input flex-1"
            />
            <button onClick={savePseudo} className="rounded-lg bg-wine-700 px-4 py-2 font-medium text-white">
              OK
            </button>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm shadow-wine-900/5">
          <p className="text-sm font-semibold text-wine-800">Clé de publication</p>
          <p className="mt-1 text-sm text-wine-700/70">
            Sans clé, tu peux tout lire et noter sur ton téléphone. La clé sert seulement à{" "}
            <strong>publier</strong> tes notes pour que les autres les voient.
          </p>
          {hasToken ? (
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="text-sm text-green-700">✓ Clé enregistrée sur ce téléphone</span>
              <button onClick={removeToken} className="text-sm text-red-600/80">
                Retirer
              </button>
            </div>
          ) : (
            <div className="mt-3 flex gap-2">
              <input
                type="password"
                value={token}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="github_pat_…"
                autoComplete="off"
                className="input flex-1"
              />
              <button onClick={saveToken} className="rounded-lg bg-wine-700 px-4 py-2 font-medium text-white">
                OK
              </button>
            </div>
          )}
          <details className="mt-3 text-xs text-wine-700/70">
            <summary className="cursor-pointer font-medium">Comment obtenir la clé ?</summary>
            <p className="mt-2">
              Demande-la à la personne qui gère le carnet. Elle la crée sur GitHub (Settings → Developer settings →
              Fine-grained tokens), limitée au seul dépôt <code>{DATA_REPO.repo}</code> avec la permission «
              Contents : Read and write ». La clé reste uniquement sur ce téléphone.
            </p>
          </details>
        </section>

        <p className="text-center text-xs text-wine-700/50">
          Données publiées sur github.com/{DATA_REPO.owner}/{DATA_REPO.repo} (public)
        </p>
      </div>
    </div>
  );
}
