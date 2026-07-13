import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BookHeart, PenLine } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { submitStory } from "@/lib/darshan.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function SubmitStoryDialog({ slug }: { slug: string }) {
  const { user } = useAuth();
  const submit = useServerFn(submitStory);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  if (!user) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link to="/auth">
          <BookHeart className="size-4" /> Sign in to share
        </Link>
      </Button>
    );
  }

  async function handleSubmit() {
    if (title.trim().length < 2 || body.trim().length < 10) {
      toast.error("Please add a short title and your story.");
      return;
    }
    setBusy(true);
    try {
      await submit({ data: { slug, title: title.trim(), body: body.trim() } });
      toast.success("Thank you! Your story will appear once approved.");
      setOpen(false);
      setTitle("");
      setBody("");
      qc.invalidateQueries({ queryKey: ["stories", slug] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not submit.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="hero" size="sm">
          <PenLine className="size-4" /> Share your story
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share the feeling of your darshan</DialogTitle>
          <DialogDescription>Your story is reviewed before it appears publicly.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="s-title">Title</Label>
            <Input
              id="s-title"
              value={title}
              maxLength={120}
              placeholder="My first darshan…"
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-body">Your experience</Label>
            <Textarea
              id="s-body"
              value={body}
              maxLength={3000}
              rows={6}
              placeholder="What did you feel in the presence of the Lord?"
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="hero" disabled={busy} onClick={handleSubmit}>
            {busy ? "Submitting…" : "Submit for review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
