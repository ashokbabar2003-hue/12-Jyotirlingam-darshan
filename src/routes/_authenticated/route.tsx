import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    if (typeof window !== "undefined") {
      const local = localStorage.getItem("local_admin_session");
      if (local) {
        try {
          const parsed = JSON.parse(local);
          if (parsed && parsed.user) {
            return { user: parsed.user, isLocalAdmin: true };
          }
        } catch (e) {
          // ignore
        }
      }
    }
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: () => <Outlet />,
});
