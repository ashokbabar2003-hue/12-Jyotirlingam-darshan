import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Images, Upload } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { submitGalleryImage } from "@/lib/darshan.functions";
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

export function SubmitGalleryDialog({ slug }: { slug: string }) {
  const { user } = useAuth();
  const submit = useServerFn(submitGalleryImage);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  if (!user) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link to="/auth">
          <Images className="size-4" /> Sign in to add a photo
        </Link>
      </Button>
    );
  }

  async function handleSubmit() {
    if (!file || !user) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image must be under 8 MB.");
      return;
    }
    setBusy(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("darshan-gallery")
        .upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      await submit({
        data: {
          slug,
          path,
          caption: caption.trim() || undefined,
          note: note.trim() || undefined,
        },
      });
      toast.success("Thank you! Your photo will appear once approved.");
      setOpen(false);
      setFile(null);
      setCaption("");
      setNote("");
      qc.invalidateQueries({ queryKey: ["gallery", slug] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="hero" size="sm">
          <Upload className="size-4" /> Add your photo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share a darshan photo</DialogTitle>
          <DialogDescription>
            Your photo is reviewed before it appears in the public gallery.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="g-file">Photo</Label>
            <Input
              id="g-file"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="g-caption">Caption (optional)</Label>
            <Input
              id="g-caption"
              value={caption}
              maxLength={200}
              placeholder="A few words about this moment"
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="g-note">Your note or story (optional)</Label>
            <Textarea
              id="g-note"
              value={note}
              maxLength={3000}
              rows={4}
              placeholder="Share the feeling or story behind this darshan…"
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="hero" disabled={!file || busy} onClick={handleSubmit}>
            {busy ? "Uploading…" : "Submit for review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
