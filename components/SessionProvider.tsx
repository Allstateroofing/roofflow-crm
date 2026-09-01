"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";

type Session = {
  userId: string | null;
  profile: any | null;
  role: string | null;
  loading: boolean;
  reload: () => Promise<void>;
};

const SessionContext = createContext<Session>({
  userId: null,
  profile: null,
  role: null,
  loading: true,
  reload: async () => {},
});

/**
 * Sesioni merret NJE here per gjithe dashboard-in.
 *
 * Perpara, cdo faqe dhe cdo komponent qe donte rolin bente vete nje
 * `auth.getUser()` (nje kerkese rrjeti e plote, ~150ms) plus nje query te
 * `profiles`. Ne nje faqe te vetme kjo behej 3–4 here, njera pas tjetres,
 * dhe pritja vinte nga vertetimi, jo nga te dhenat.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    // `getSession()` e lexon token-in nga cookie-ja, pa dale ne rrjet;
    // `getUser()` ben nje kerkese te plote (~150ms) sa here therritet.
    // Ketu na duhet vetem ID-ja per te marre profilin — dhe cdo te dhene
    // e mbron RLS-ja, e cila e verifikon vete token-in ne server. Nje token
    // i falsifikuar nuk merr dot asgje, sado qe klienti ta besoje.
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user ?? null;

    if (!user) {
      setUserId(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    setUserId(user.id);

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    setProfile(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SessionContext.Provider
      value={{
        userId,
        profile,
        role: profile?.role ?? null,
        loading,
        reload: load,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
