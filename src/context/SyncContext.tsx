import { useLiveQuery } from "dexie-react-hooks";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { db } from "../lib/db";
import { getToken, publish, pull } from "../lib/sync";
import { useUser } from "./UserContext";

type Status = "idle" | "pulling" | "publishing";

interface SyncContextValue {
  status: Status;
  error: string | null;
  message: string | null;
  // Nombre de modifications locales pas encore publiées
  dirty: number;
  canPublish: boolean;
  refresh: () => Promise<void>;
  publishNow: () => Promise<void>;
  clearMessages: () => void;
  onTokenChanged: () => void;
}

const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: { children: ReactNode }) {
  const { profile } = useUser();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [hasToken, setHasToken] = useState(() => !!getToken());
  const dirty = useLiveQuery(async () => ((await db.meta.get("dirty"))?.value as number) ?? 0, []) ?? 0;
  const busy = useRef(false);

  async function run(kind: Exclude<Status, "idle">, task: () => Promise<void>, success: string | null) {
    if (busy.current) return;
    busy.current = true;
    setStatus(kind);
    setError(null);
    setMessage(null);
    try {
      await task();
      setMessage(success);
    } catch (err) {
      const offline = !navigator.onLine || err instanceof TypeError;
      setError(offline ? "Pas de connexion : tes notes restent sur le téléphone." : (err as Error).message);
    } finally {
      busy.current = false;
      setStatus("idle");
    }
  }

  const refresh = () => run("pulling", async () => void (await pull()), "Notes à jour ✓");

  const publishNow = () =>
    run(
      "publishing",
      async () => {
        if (!profile) throw new Error("Choisis d'abord un pseudo.");
        await publish({ id: profile.id, pseudo: profile.pseudo });
      },
      "Notes publiées ✓"
    );

  // Mise à jour silencieuse à l'ouverture de l'app, si on a du réseau.
  useEffect(() => {
    navigator.storage?.persist?.().catch(() => {});
    if (navigator.onLine) run("pulling", async () => void (await pull()), null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SyncContext.Provider
      value={{
        status,
        error,
        message,
        dirty,
        canPublish: hasToken,
        refresh,
        publishNow,
        clearMessages: () => {
          setError(null);
          setMessage(null);
        },
        onTokenChanged: () => setHasToken(!!getToken()),
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useSync doit être utilisé dans un SyncProvider");
  return ctx;
}
