import { useLiveQuery } from "dexie-react-hooks";
import { createContext, useContext, useState, type ReactNode } from "react";
import { setProfilePseudo } from "../lib/data";
import { db } from "../lib/db";
import type { Profile } from "../types";

interface UserContextValue {
  userId: string | null;
  profile: Profile | null;
  loading: boolean;
  // Crée une nouvelle identité avec ce pseudo
  createProfile: (pseudo: string) => Promise<void>;
  // Reprend une identité déjà publiée (nouveau téléphone, navigateur vidé…)
  claimProfile: (id: string) => void;
  setPseudo: (pseudo: string) => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

const USER_KEY = "nosvins.userId";

function readStoredUserId(): string | null {
  try {
    return localStorage.getItem(USER_KEY);
  } catch {
    return null;
  }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(readStoredUserId);
  // null = pas de profil local, undefined = lecture en cours
  const profile = useLiveQuery(async () => (userId ? (await db.profiles.get(userId)) ?? null : null), [userId]);

  function remember(id: string) {
    localStorage.setItem(USER_KEY, id);
    setUserId(id);
  }

  async function createProfile(pseudo: string) {
    const id = crypto.randomUUID();
    await setProfilePseudo(id, pseudo);
    remember(id);
  }

  async function setPseudo(pseudo: string) {
    if (!userId) throw new Error("Aucune identité active.");
    await setProfilePseudo(userId, pseudo);
  }

  return (
    <UserContext.Provider
      value={{
        userId,
        profile: profile ?? null,
        loading: profile === undefined,
        createProfile,
        claimProfile: remember,
        setPseudo,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser doit être utilisé dans un UserProvider");
  return ctx;
}
