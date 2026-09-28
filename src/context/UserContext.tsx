import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import type { Profile } from "../types";

interface UserContextValue {
  userId: string | null;
  profile: Profile | null;
  loading: boolean;
  setPseudo: (pseudo: string) => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const { data: sessionData } = await supabase.auth.getSession();
      let session = sessionData.session;

      if (!session) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) {
          console.error("Échec de la connexion anonyme :", error.message);
          if (!cancelled) setLoading(false);
          return;
        }
        session = data.session;
      }

      if (!session || cancelled) {
        if (!cancelled) setLoading(false);
        return;
      }

      setUserId(session.user.id);

      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!cancelled) {
        setProfile(existingProfile ?? null);
        setLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  async function setPseudo(pseudo: string) {
    if (!userId) return;
    const { data, error } = await supabase
      .from("profiles")
      .upsert({ id: userId, pseudo }, { onConflict: "id" })
      .select()
      .single();
    if (error) throw error;
    setProfile(data);
  }

  return (
    <UserContext.Provider value={{ userId, profile, loading, setPseudo }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser doit être utilisé dans un UserProvider");
  return ctx;
}
