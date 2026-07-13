import { Flame } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-8 text-center">
        <Flame className="size-5 text-primary diya-flicker" />
        <p className="font-display text-sm text-foreground">ॐ नमः शिवाय</p>
        <p className="max-w-md text-xs text-muted-foreground">
          A devotional space to behold all twelve Jyotirlingas, watch live darshan, and share the
          feelings of your pilgrimage. Har Har Mahadev.
        </p>
        <p className="text-xs text-muted-foreground/70">
          © {new Date().getFullYear()} 12 Jyotirlinga Darshan
        </p>
      </div>
    </footer>
  );
}
