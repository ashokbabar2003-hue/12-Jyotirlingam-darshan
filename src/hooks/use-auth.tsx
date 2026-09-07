import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = () => {};

    const logAuthState = (event: string, s: Session | null) => {
      const hasSession = Boolean(s);
      const hasUser = Boolean(s?.user);
      const userIdPresent = Boolean(s?.user?.id);
      const origin = typeof window !== "undefined" ? window.location.origin : "ssr";

      console.info("[Supabase Auth State]", {
        hasSession,
        event,
        hasUser,
        userIdPresent,
        origin,
      });

      if (typeof window !== "undefined") {
        let hasPersisted = false;
        try {
          hasPersisted = Object.keys(localStorage).some(
            (k) => k.startsWith("sb-") && k.endsWith("-auth-token"),
          );
        } catch (err) {
          void err;
        }
        console.info("[Supabase Persisted Session]", {
          hasPersistedSession: hasPersisted,
        });
      }
    };

    const cleanHashIfSessionEstablished = (s: Session | null) => {
      if (
        s &&
        typeof window !== "undefined" &&
        window.location.hash &&
        (window.location.hash.includes("access_token") ||
          window.location.hash.includes("refresh_token"))
      ) {
        try {
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
        } catch (err) {
          void err;
        }
      }
    };

    try {
      const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
        logAuthState(event, s);
        setSession(s);
        setLoading(false);
        cleanHashIfSessionEstablished(s);
      });
      if (sub?.subscription) {
        unsubscribe = () => sub.subscription.unsubscribe();
      }
    } catch {
      setLoading(false);
    }

    supabase.auth
      .getSession()
      .then(({ data }) => {
        const s = data?.session ?? null;
        logAuthState("INITIAL_GET_SESSION", s);
        setSession(s);
        setLoading(false);
        cleanHashIfSessionEstablished(s);
      })
      .catch(() => {
        setLoading(false);
      });

    return () => {
      unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setSession(null);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        session,
        loading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
