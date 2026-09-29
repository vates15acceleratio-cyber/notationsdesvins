import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import type { Profile } from "../types";

interface UserContextValue {
  userId: string | null;
  profile: Profile | null;
  loading: boolean;
  connectionError: string | null;
  setPseudo: (pseudo: string) => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

// Partagé au niveau du module : évite que deux montages concurrents (ex. React
// StrictMode en dev) ne déclenchent chacun leur propre connexion anonyme, ce qui
// créerait deux sessions différentes et désynchroniserait l'état de l'app.
let anonymousSignInPromise: ReturnType<typeof supabase.auth.signInAnonymously> | null = null;

function ensureAnonymousSession() {
  if (!anonymousSignInPromise) {
    anonymousSignInPromise = supabase.auth.signInAnonymously();
  }
  return anonymousSignInPromise;
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const loadedUserIds = useRef(new Set<string>());

  async function loadProfileFor(uid: string) {
    setUserId(uid);
    const { data: existingProfile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .maybeSingle();

    if (profileError) {
      console.error("Échec du chargement du profil :", profileError.message);
      setConnectionError(profileError.message);
    } else {
      setConnectionError(null);
    }
    setProfile(existingProfile ?? null);
    setLoading(false);
    loadedUserIds.current.add(uid);
  }

  useEffect(() => {
    let cancelled = false;

    // Source de vérité unique : on ne dérive jamais l'utilisateur courant d'une
    // session capturée localement, toujours de la session réellement active
    // côté client Supabase au moment de l'évènement.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled || !session) return;
      if (loadedUserIds.current.has(session.user.id)) return;
      loadProfileFor(session.user.id);
    });

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) {
        loadProfileFor(data.session.user.id);
        return;
      }
      const { data: signInData, error } = await ensureAnonymousSession();
      if (cancelled) return;
      if (error) {
        console.error("Échec de la connexion anonyme :", error.message);
        setConnectionError(error.message);
        setLoading(false);
        return;
      }
      if (signInData.session) {
        loadProfileFor(signInData.session.user.id);
      }
    })();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setPseudo(pseudo: string) {
    // Toujours repartir de la session réellement active côté client, pas de l'état
    // React (qui pourrait être temporairement désynchronisé le temps d'un refresh).
    const { data } = await supabase.auth.getSession();
    const activeUserId = data.session?.user.id ?? userId;
    if (!activeUserId) {
      throw new Error(
        connectionError ?? "Pas de connexion au serveur. Vérifie ta configuration Supabase (.env) et recharge la page."
      );
    }
    const { data: updated, error } = await supabase
      .from("profiles")
      .upsert({ id: activeUserId, pseudo }, { onConflict: "id" })
      .select()
      .single();
    if (error) throw new Error(error.message);
    setUserId(activeUserId);
    setProfile(updated);
  }

  return (
    <UserContext.Provider value={{ userId, profile, loading, connectionError, setPseudo }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser doit être utilisé dans un UserProvider");
  return ctx;
}
