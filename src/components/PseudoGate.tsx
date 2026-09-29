import { useState, type ReactNode } from "react";
import { useUser } from "../context/UserContext";

export function PseudoGate({ children }: { children: ReactNode }) {
  const { profile, loading, connectionError, setPseudo } = useUser();
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-wine-50">
        <p className="text-wine-700">Chargement…</p>
      </div>
    );
  }

  if (profile) return <>{children}</>;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed.length < 2) {
      setError("Choisis un pseudo d'au moins 2 caractères.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await setPseudo(trimmed);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setError(`Impossible d'enregistrer ce pseudo : ${message}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-wine-50 px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg shadow-wine-900/5"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-wine-700 text-2xl">
            🍷
          </div>
          <h1 className="font-serif text-2xl font-semibold text-wine-800">Nos Vins</h1>
          <p className="mt-1 text-sm text-wine-700/70">
            Carnet de dégustation partagé. Choisis ton pseudo pour commencer.
          </p>
        </div>
        {connectionError && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            Connexion au serveur impossible : {connectionError}
          </p>
        )}
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ton prénom ou pseudo"
          maxLength={30}
          className="w-full rounded-lg border border-wine-200 px-4 py-2.5 text-wine-900 outline-none focus:border-wine-600 focus:ring-2 focus:ring-wine-600/20"
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="mt-4 w-full rounded-lg bg-wine-700 py-2.5 font-medium text-white transition hover:bg-wine-800 disabled:opacity-60"
        >
          {submitting ? "…" : "Continuer"}
        </button>
      </form>
    </div>
  );
}
