import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isLocalAdmin: boolean;
  signInAsLocalAdmin: (name: string) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  isLocalAdmin: false,
  signInAsLocalAdmin: () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLocalAdmin, setIsLocalAdmin] = useState(false);

  useEffect(() => {
    const local = localStorage.getItem("local_admin_session");
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (parsed && parsed.user) {
          setSession(parsed);
          setIsLocalAdmin(true);
          setLoading(false);
          return;
        }
      } catch (e) {
        // ignore
      }
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (localStorage.getItem("local_admin_session")) return;
      setSession(s);
      setIsLocalAdmin(false);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (localStorage.getItem("local_admin_session")) return;
      setSession(data.session);
      setIsLocalAdmin(false);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signInAsLocalAdmin = (adminName: string) => {
    const name = adminName.trim() || "Local Admin";
    const fakeSession = {
      access_token: "local-admin-bypass-token",
      token_type: "bearer",
      expires_in: 3600,
      refresh_token: "local-admin-refresh-token",
      user: {
        id: "00000000-0000-0000-0000-000000000000",
        app_metadata: {},
        user_metadata: { display_name: name },
        aud: "authenticated",
        email: "admin@local",
        created_at: new Date().toISOString(),
      } as unknown as User,
    };
    localStorage.setItem("local_admin_session", JSON.stringify(fakeSession));
    setSession(fakeSession as unknown as Session);
    setIsLocalAdmin(true);
  };

  const signOut = async () => {
    localStorage.removeItem("local_admin_session");
    setIsLocalAdmin(false);
    setSession(null);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        session,
        loading,
        isLocalAdmin,
        signInAsLocalAdmin,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
