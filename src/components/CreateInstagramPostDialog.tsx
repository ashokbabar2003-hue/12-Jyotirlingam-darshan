import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  ImageIcon,
  Layers,
  Video,
  Upload,
  ArrowUp,
  ArrowDown,
  Trash2,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  uploadSocialMediaFile,
  createUploadedSocialPost,
  updateUploadedSocialPost,
  generateAICaptionAssistance,
  generateDirectImageForPrompt,
  type SocialPost,
} from "@/lib/social.functions";

interface UploadedMediaItem {
  id?: string;
  storage_path: string;
  public_url: string;
  media_type: "image" | "video";
  sort_order: number;
  fileName?: string;
  previewUrl?: string;
}

interface CreateInstagramPostDialogProps {
  postToEdit?: SocialPost | null;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function CreateInstagramPostDialog({
  postToEdit,
  onSuccess,
  trigger,
}: CreateInstagramPostDialogProps) {
  const [open, setOpen] = useState(false);
  const [postType, setPostType] = useState<"image" | "carousel" | "reel">(
    postToEdit?.post_type || "image",
  );
  const [shrineSlug] = useState<string>(postToEdit?.jyotirlinga_slug || "general");
  const [caption, setCaption] = useState<string>(postToEdit?.caption || "");
  const [imagePrompt, setImagePrompt] = useState<string>(postToEdit?.image_prompt || "");
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Original Media captured when opening or editing
  const getInitialOriginalMedia = (): UploadedMediaItem | null => {
    if (postToEdit?.media && postToEdit.media.length > 0) {
      const m = postToEdit.media[0];
      return {
        id: m.id,
        storage_path: m.storage_path,
        public_url: m.public_url,
        media_type: (m.media_type as "image" | "video") || "image",
        sort_order: 0,
      };
    }
    if (postToEdit?.image_url) {
      return {
        storage_path: "",
        public_url: postToEdit.image_url,
        media_type: "image",
        sort_order: 0,
      };
    }
    return null;
  };

  const [originalMedia, setOriginalMedia] = useState<UploadedMediaItem | null>(
    getInitialOriginalMedia,
  );
  const [candidateMedia, setCandidateMedia] = useState<UploadedMediaItem | null>(null);
  const [selectedSource, setSelectedSource] = useState<"original" | "candidate">("original");

  // Initial media items for carousel
  const [mediaList, setMediaList] = useState<UploadedMediaItem[]>(() => {
    if (postToEdit?.media && postToEdit.media.length > 0) {
      return postToEdit.media.map((m, idx) => ({
        id: m.id,
        storage_path: m.storage_path,
        public_url: m.public_url,
        media_type: m.media_type,
        sort_order: m.sort_order ?? idx,
      }));
    }
    if (postToEdit?.image_url) {
      return [
        {
          storage_path: "",
          public_url: postToEdit.image_url,
          media_type: "image",
          sort_order: 0,
        },
      ];
    }
    return [];
  });

  const uploadFn = useServerFn(uploadSocialMediaFile);
  const createFn = useServerFn(createUploadedSocialPost);
  const updateFn = useServerFn(updateUploadedSocialPost);
  const aiAssistFn = useServerFn(generateAICaptionAssistance);
  const generateImgFn = useServerFn(generateDirectImageForPrompt);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setPostType(postToEdit?.post_type || "image");
      setCaption(postToEdit?.caption || "");
      setImagePrompt(postToEdit?.image_prompt || "");

      const initOrig = getInitialOriginalMedia();
      setOriginalMedia(initOrig);
      setCandidateMedia(null);
      setSelectedSource("original");

      if (postToEdit?.media && postToEdit.media.length > 0) {
        setMediaList(
          postToEdit.media.map((m, idx) => ({
            id: m.id,
            storage_path: m.storage_path,
            public_url: m.public_url,
            media_type: m.media_type,
            sort_order: m.sort_order ?? idx,
          })),
        );
      } else if (postToEdit?.image_url) {
        setMediaList([
          {
            storage_path: "",
            public_url: postToEdit.image_url,
            media_type: "image",
            sort_order: 0,
          },
        ]);
      } else {
        setMediaList([]);
      }
    }
  };

  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newItems: UploadedMediaItem[] = [...mediaList];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate type for Reel vs Image
        if (postType === "reel" && !file.type.startsWith("video/")) {
          toast.error(`File '${file.name}' is not a video. Reels require an MP4 or video format.`);
          continue;
        }
        if (postType !== "reel" && file.type.startsWith("video/")) {
          toast.error(`File '${file.name}' is a video. Select 'Reel' post type for video posts.`);
          continue;
        }

        // Convert file to base64
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(",")[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Upload file to Supabase Storage via server function
        const uploadRes = await uploadFn({
          data: {
            fileName: file.name,
            fileType: file.type,
            base64Data,
          },
        });

        const isVideo = file.type.startsWith("video/");
        const newItem: UploadedMediaItem = {
          storage_path: uploadRes.storagePath,
          public_url: uploadRes.publicUrl,
          media_type: isVideo ? "video" : "image",
          sort_order: newItems.length,
          fileName: file.name,
        };

        if (postType === "image" || postType === "reel") {
          if (!originalMedia) {
            setOriginalMedia(newItem);
            setSelectedSource("original");
          } else {
            setCandidateMedia(newItem);
            setSelectedSource("candidate");
          }
          break;
        } else {
          newItems.push(newItem);
        }
      }

      setMediaList(newItems);
      toast.success("Media uploaded successfully.");
    } catch (err: unknown) {
      console.error("Upload failed:", err);
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleRegenerateImage() {
    console.log("[REGEN DEBUG 1] Button clicked");
    const promptToUse = imagePrompt.trim();
    if (!promptToUse) {
      toast.error("Please enter an image prompt before regenerating.");
      return;
    }

    const slug = shrineSlug !== "general" ? shrineSlug : "jyotirlinga";
    console.log("[REGEN DEBUG 2] Prompt received", { promptLength: promptToUse.length, slug });

    setIsRegenerating(true);
    try {
      const res = await generateImgFn({
        data: {
          prompt: promptToUse,
          slug,
        },
      });

      console.log("[REGEN DEBUG 9] Candidate returned to client", { imageUrl: res?.imageUrl });

      if (res?.imageUrl) {
        const newCandidate: UploadedMediaItem = {
          storage_path: res.imageUrl,
          public_url: res.imageUrl,
          media_type: "image",
          sort_order: 0,
          fileName: "AI Generated Image",
        };
        setCandidateMedia(newCandidate);
        setSelectedSource("candidate");
        console.log("[REGEN DEBUG 10] generatedMedia React state updated", {
          hasCandidateMedia: true,
          candidateUrl: newCandidate.public_url,
          selectedSource: "candidate",
        });
        toast.success("New AI image generated! Compare with Original and select your preference.");
      } else {
        toast.error("No image URL returned from generation.");
      }
    } catch (err: unknown) {
      console.error("Image generation failed:", err);
      toast.error(
        err instanceof Error
          ? err.message
          : "Image generation failed. Your original image has been preserved.",
      );
    } finally {
      setIsRegenerating(false);
    }
  }

  function handleSelectCandidate(imageUrl: string) {
    setMediaList([
      {
        storage_path: imageUrl,
        public_url: imageUrl,
        media_type: "image",
        sort_order: 0,
      },
    ]);
    toast.success("Active preview updated to selected asset.");
  }

  function handleMove(index: number, direction: "up" | "down") {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === mediaList.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...mediaList];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Recalculate sort order
    const reordered = updated.map((item, idx) => ({ ...item, sort_order: idx }));
    setMediaList(reordered);
  }

  function handleRemove(index: number) {
    const updated = mediaList.filter((_, idx) => idx !== index);
    const reordered = updated.map((item, idx) => ({ ...item, sort_order: idx }));
    setMediaList(reordered);
  }

  async function handleAIAssist(action: "suggest" | "improve" | "hashtags") {
    setIsAILoading(true);
    try {
      const res = await aiAssistFn({
        data: {
          action,
          caption: caption,
          shrineSlug: shrineSlug !== "general" ? shrineSlug : undefined,
        },
      });

      if (res.result) {
        if (action === "hashtags") {
          setCaption((prev) => `${prev.trim()}\n\n${res.result}`);
        } else {
          setCaption(res.result);
        }
        toast.success("AI caption suggestion applied.");
      }
    } catch (err: unknown) {
      console.warn("AI caption assist failed or unavailable:", err);
      toast.error("AI assistance unavailable. You can continue typing manually.");
    } finally {
      setIsAILoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!caption.trim()) {
      toast.error("Please provide a caption.");
      return;
    }

    let finalMedia: UploadedMediaItem[] = [];
    if (postType === "image" || postType === "reel") {
      const chosen =
        selectedSource === "candidate" && candidateMedia ? candidateMedia : originalMedia;
      if (chosen) {
        finalMedia = [chosen];
      }
    } else {
      finalMedia = mediaList;
    }

    if (finalMedia.length === 0) {
      toast.error("Please upload or select at least one media file.");
      return;
    }

    if (postType === "carousel" && finalMedia.length < 2) {
      toast.error("Carousel posts require at least 2 images.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (postToEdit?.id) {
        await updateFn({
          data: {
            id: postToEdit.id,
            caption: caption.trim(),
            image_prompt: imagePrompt.trim() || null,
            media: finalMedia.map((m, idx) => ({
              id: m.id,
              storage_path: m.storage_path,
              public_url: m.public_url,
              media_type: m.media_type,
              sort_order: idx,
            })),
          },
        });
        toast.success("Draft saved successfully.");
      } else {
        await createFn({
          data: {
            jyotirlinga_slug: shrineSlug || "general",
            post_type: postType,
            caption: caption.trim(),
            media: finalMedia.map((m, idx) => ({
              storage_path: m.storage_path,
              public_url: m.public_url,
              media_type: m.media_type,
              sort_order: idx,
            })),
          },
        });
        toast.success("Draft saved successfully.");
      }

      setOpen(false);
      onSuccess?.();
    } catch (err: unknown) {
      console.error("Submit failed:", err);
      toast.error(
        `Draft could not be saved: ${err instanceof Error ? err.message : "Failed to save post."}`,
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="default" className="gap-2">
            <Upload className="size-4" />
            Create Instagram Post
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {postToEdit ? "Edit Instagram Post" : "Create Instagram Post"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-2">
          {/* 1. Post Type Selector */}
          {!postToEdit && (
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Select Post Type
              </Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setPostType("image");
                    setMediaList([]);
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border text-sm transition-all ${
                    postType === "image"
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <ImageIcon className="size-5 mb-1" />
                  Single Image
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPostType("carousel");
                    setMediaList([]);
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border text-sm transition-all ${
                    postType === "carousel"
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <Layers className="size-5 mb-1" />
                  Carousel
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPostType("reel");
                    setMediaList([]);
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border text-sm transition-all ${
                    postType === "reel"
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <Video className="size-5 mb-1" />
                  Reel / Video
                </button>
              </div>
            </div>
          )}

          {/* AI Image Generation & Prompt Section */}
          {postType === "image" && (
            <div className="rounded-lg border border-border/80 bg-muted/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-accent" />
                  AI Image Generation & Prompt
                </Label>
                <span className="text-[11px] text-muted-foreground italic">
                  Generate or refine image using Gemini AI
                </span>
              </div>

              <Textarea
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="Describe the visual composition, divine lighting, and spiritual aesthetic to generate a new image..."
                className="min-h-[80px] font-sans text-sm bg-background"
              />

              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-muted-foreground">
                  {imagePrompt.trim()
                    ? "Click below to generate a new AI image candidate without altering your original image."
                    : "Enter an image prompt to enable AI image generation."}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isRegenerating || !imagePrompt.trim()}
                  onClick={handleRegenerateImage}
                  className="text-xs gap-1.5 shrink-0"
                >
                  {isRegenerating ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Generating Image...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="size-3.5 text-accent" />
                      {originalMedia || candidateMedia ? "Regenerate Image" : "Generate Image"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* IMAGE COMPARISON / SELECTION */}
          {postType === "image" && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <div className="flex items-center gap-2">
                  <ImageIcon className="size-4 text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Image Comparison & Selection
                  </h3>
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                  Selected:{" "}
                  {selectedSource === "candidate" && candidateMedia ? "New AI Image" : "Original"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* ORIGINAL CARD */}
                <div
                  className={`rounded-lg border p-3 flex flex-col justify-between transition-all ${
                    selectedSource === "original"
                      ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                      : "border-border/80 bg-muted/20 hover:border-border"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                        ORIGINAL
                      </span>
                      {selectedSource === "original" && (
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Check className="size-3" /> Selected
                        </span>
                      )}
                    </div>

                    {originalMedia?.public_url ? (
                      <div className="relative rounded-md overflow-hidden border border-border/50 bg-black/5 aspect-square max-h-52 flex items-center justify-center">
                        <img
                          src={originalMedia.public_url}
                          alt="Original Post Asset"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : postToEdit ? (
                      <div className="rounded-md border border-destructive/20 p-6 text-center text-xs text-destructive aspect-square max-h-52 flex flex-col items-center justify-center gap-2 bg-destructive/10">
                        <AlertCircle className="size-8 opacity-80 mb-1" />
                        <span className="font-bold">AI IMAGE UNAVAILABLE</span>
                        <span>Gemini image-generation quota is currently 0.</span>
                      </div>
                    ) : (
                      <div className="rounded-md border border-dashed border-border/70 p-6 text-center text-xs text-muted-foreground aspect-square max-h-52 flex flex-col items-center justify-center gap-1 bg-muted/30">
                        <ImageIcon className="size-8 opacity-40 mb-1" />
                        <span>No original image present</span>
                      </div>
                    )}
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant={selectedSource === "original" ? "default" : "outline"}
                    className={`mt-3 w-full text-xs font-medium h-9 ${
                      selectedSource === "original"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "border-border hover:bg-muted"
                    }`}
                    onClick={() => setSelectedSource("original")}
                    disabled={!originalMedia}
                  >
                    {selectedSource === "original" ? (
                      <>
                        <Check className="mr-1.5 size-3.5" /> Keep Original
                      </>
                    ) : (
                      "Keep Original"
                    )}
                  </Button>
                </div>

                {/* NEW AI IMAGE / CANDIDATE CARD */}
                <div
                  className={`rounded-lg border p-3 flex flex-col justify-between transition-all ${
                    selectedSource === "candidate"
                      ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                      : "border-border/80 bg-muted/20 hover:border-border"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                        <Sparkles className="size-3.5 text-amber-500" />
                        NEW AI IMAGE
                      </span>
                      {selectedSource === "candidate" && candidateMedia && (
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Check className="size-3" /> Selected
                        </span>
                      )}
                    </div>

                    {candidateMedia?.public_url ? (
                      <div className="relative rounded-md overflow-hidden border border-border/50 bg-black/5 aspect-square max-h-52 flex items-center justify-center">
                        <img
                          src={candidateMedia.public_url}
                          alt="New Generated Asset"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div className="rounded-md border border-dashed border-border/70 p-4 text-center text-xs text-muted-foreground aspect-square max-h-52 flex flex-col items-center justify-center gap-2 bg-muted/10">
                        <Sparkles className="size-7 text-amber-500/60" />
                        <p className="font-medium text-foreground/80">No new image generated yet</p>
                        <p className="text-[11px] text-muted-foreground max-w-[200px] leading-tight">
                          Enter an image prompt above and click "Regenerate Image" to create a
                          comparison candidate.
                        </p>
                      </div>
                    )}
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant={selectedSource === "candidate" ? "default" : "outline"}
                    className={`mt-3 w-full text-xs font-medium h-9 ${
                      selectedSource === "candidate"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "border-border hover:bg-muted"
                    }`}
                    onClick={() => setSelectedSource("candidate")}
                    disabled={!candidateMedia}
                  >
                    {selectedSource === "candidate" ? (
                      <>
                        <Check className="mr-1.5 size-3.5" /> Use This Image
                      </>
                    ) : (
                      "Use This Image"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* 2. Local Media Upload Zone */}
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                {postType === "image" ? "Upload Replacement Image (Optional)" : "Media File(s)"}
              </Label>
              {postType === "carousel" && (
                <span className="text-xs text-muted-foreground">
                  {mediaList.length} item(s) selected
                </span>
              )}
            </div>

            <div className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                id="media-file-input"
                className="hidden"
                accept={
                  postType === "reel" ? "video/mp4,video/*" : "image/jpeg,image/png,image/webp"
                }
                multiple={postType === "carousel"}
                onChange={(e) => handleFileUpload(e.target.files)}
                disabled={isUploading}
              />
              <label
                htmlFor="media-file-input"
                className="cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                {isUploading ? (
                  <Loader2 className="size-8 animate-spin text-primary" />
                ) : (
                  <Upload className="size-8 text-muted-foreground" />
                )}
                <span className="text-sm font-medium text-foreground">
                  {isUploading
                    ? "Uploading media to Supabase Storage..."
                    : `Click to select ${
                        postType === "reel"
                          ? "MP4 video"
                          : postType === "carousel"
                            ? "multiple images"
                            : "image"
                      } from local computer`}
                </span>
                <span className="text-xs text-muted-foreground">
                  {postType === "reel"
                    ? "Supports MP4, MOV. Video will be validated before Instagram publishing."
                    : "Supports JPG, PNG, WEBP."}
                </span>
              </label>
            </div>

            {/* Media Items Preview List */}
            {mediaList.length > 0 && (
              <div className="mt-4 space-y-3">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Selected Media Preview & Order
                </Label>
                <div className="grid gap-3">
                  {mediaList.map((item, idx) => (
                    <div
                      key={item.public_url + idx}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/80 bg-card/60 gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex items-center justify-center size-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                          {idx + 1}
                        </span>
                        {item.media_type === "video" ? (
                          <video
                            src={item.public_url}
                            className="size-16 object-cover rounded bg-black shrink-0"
                            controls={false}
                          />
                        ) : (
                          <img
                            src={item.public_url}
                            alt={`Preview ${idx + 1}`}
                            className="size-16 object-cover rounded shrink-0 bg-muted"
                          />
                        )}
                        <div className="min-w-0 text-xs">
                          <p className="font-medium text-foreground truncate max-w-[200px] sm:max-w-[300px]">
                            {item.fileName || `Media #${idx + 1}`}
                          </p>
                          <a
                            href={item.public_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline truncate block max-w-[200px] sm:max-w-[300px]"
                          >
                            {item.public_url}
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {postType === "carousel" && (
                          <>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="size-8"
                              disabled={idx === 0}
                              onClick={() => handleMove(idx, "up")}
                              title="Move Up"
                            >
                              <ArrowUp className="size-4" />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="size-8"
                              disabled={idx === mediaList.length - 1}
                              onClick={() => handleMove(idx, "down")}
                              title="Move Down"
                            >
                              <ArrowDown className="size-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="size-8 text-destructive hover:text-destructive"
                          onClick={() => handleRemove(idx)}
                          title="Remove item"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 4. Caption Editor */}
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Instagram Caption
              </Label>
              <span className="text-xs text-muted-foreground">
                {caption.length} / 2200 characters
              </span>
            </div>
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write your devout caption here..."
              className="mt-2 min-h-[120px] font-sans text-sm"
              maxLength={2200}
            />

            {/* Optional AI Assistance */}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isAILoading}
                onClick={() => handleAIAssist("suggest")}
                className="text-xs gap-1"
              >
                {isAILoading ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Sparkles className="size-3 text-amber-500" />
                )}
                Suggest Caption
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isAILoading || !caption.trim()}
                onClick={() => handleAIAssist("improve")}
                className="text-xs gap-1"
              >
                {isAILoading ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Sparkles className="size-3 text-amber-500" />
                )}
                Improve Caption
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isAILoading}
                onClick={() => handleAIAssist("hashtags")}
                className="text-xs gap-1"
              >
                {isAILoading ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Sparkles className="size-3 text-amber-500" />
                )}
                Suggest Hashtags
              </Button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Uploading...
                </>
              ) : isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Saving Draft...
                </>
              ) : postToEdit ? (
                "Save Changes"
              ) : (
                "Save Draft Post"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
