import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — 12 Jyotirlinga Darshan" },
      {
        name: "description",
        content: "Sign in to share your darshan photos and devotional stories.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name.trim() || email.split("@")[0] },
          },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Almost there! Check your email to confirm your account, then sign in.");
          setMode("signin");
          setPassword("");
          return;
        }
        toast.success("Welcome! You are signed in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Har Har Mahadev! You are signed in.");
      }
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  async function googleSignIn() {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err) {
      toast.error("Google sign-in failed. Please try again.");
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-elegant">
        <div className="mb-6 text-center">
          <Flame className="mx-auto size-8 text-primary diya-flicker" />
          <h1 className="mt-3 font-display text-2xl text-foreground">
            {mode === "signin" ? "Welcome back" : "Join the darshan"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to share your photos and stories.
          </p>
        </div>

        <Button variant="outline" className="w-full" onClick={googleSignIn} type="button">
          Continue with Google
        </Button>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="name">Display name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name as shown on posts"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button variant="hero" type="submit" className="w-full" disabled={busy}>
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          {mode === "signin" ? "New here? " : "Already have an account? "}
          <button
            type="button"
            className="text-primary underline"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </div>
      <Link to="/" className="mt-6 text-center text-sm text-muted-foreground hover:text-foreground">
        ← Back to darshan
      </Link>
    </div>
  );
}
