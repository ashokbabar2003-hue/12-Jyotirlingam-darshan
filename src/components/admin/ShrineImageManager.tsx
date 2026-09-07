import { useState, useEffect } from "react";
import { jyotirlingas, type Jyotirlinga } from "@/data/jyotirlingas";
import {
  shrineImages,
  getShrineImageOverrides,
  saveShrineImageOverride,
  clearShrineImageOverrides,
  type ShrineImageConfig,
} from "@/data/shrine-images";
import {
  ExternalLink,
  RefreshCw,
  Check,
  Image as ImageIcon,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export function ShrineImageManager() {
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [editInputs, setEditInputs] = useState<Record<string, string>>({});
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);

  useEffect(() => {
    const loaded = getShrineImageOverrides();
    setOverrides(loaded);
    const initialInputs: Record<string, string> = {};
    for (const j of jyotirlingas) {
      const config = shrineImages[j.slug];
      initialInputs[j.slug] = loaded[j.slug] || config?.image || `/images/shrines/${j.slug}.jpg`;
    }
    setEditInputs(initialInputs);
  }, []);

  const handleInputChange = (slug: string, val: string) => {
    setEditInputs((prev) => ({ ...prev, [slug]: val }));
  };

  const handlePreview = (slug: string) => {
    const val = editInputs[slug]?.trim();
    if (val) {
      setPreviewUrls((prev) => ({ ...prev, [slug]: val }));
    }
  };

  const handleSave = (slug: string) => {
    const val = editInputs[slug]?.trim();
    const config = shrineImages[slug];
    const defaultVal = config?.image || `/images/shrines/${slug}.jpg`;

    if (!val || val === defaultVal) {
      // Revert to default
      const copy = { ...overrides };
      delete copy[slug];
      setOverrides(copy);
      saveShrineImageOverride(slug, defaultVal);
    } else {
      saveShrineImageOverride(slug, val);
      setOverrides((prev) => ({ ...prev, [slug]: val }));
    }

    setSavedSuccess(slug);
    setTimeout(() => setSavedSuccess(null), 3000);
  };

  const handleResetSingle = (slug: string) => {
    const config = shrineImages[slug];
    const defaultVal = config?.image || `/images/shrines/${slug}.jpg`;
    const copy = { ...overrides };
    delete copy[slug];
    setOverrides(copy);
    setEditInputs((prev) => ({ ...prev, [slug]: defaultVal }));
    setPreviewUrls((prev) => {
      const next = { ...prev };
      delete next[slug];
      return next;
    });
    saveShrineImageOverride(slug, defaultVal);
    setSavedSuccess(slug);
    setTimeout(() => setSavedSuccess(null), 3000);
  };

  const handleResetAll = () => {
    if (
      window.confirm(
        "Reset all 12 shrine images back to the verified authentic temple photographs?",
      )
    ) {
      clearShrineImageOverrides();
      setOverrides({});
      const resetInputs: Record<string, string> = {};
      for (const j of jyotirlingas) {
        const config = shrineImages[j.slug];
        resetInputs[j.slug] = config?.image || `/images/shrines/${j.slug}.jpg`;
      }
      setEditInputs(resetInputs);
      setPreviewUrls({});
      setSavedSuccess("ALL");
      setTimeout(() => setSavedSuccess(null), 3000);
    }
  };

  const handleCopyJson = () => {
    const currentAssignments: Record<string, unknown> = {};
    for (const j of jyotirlingas) {
      const config = shrineImages[j.slug];
      currentAssignments[j.slug] = {
        name: j.name,
        activeImage: overrides[j.slug] || config?.image,
        defaultImage: config?.image,
        templeName: config?.templeName,
        source: config?.source,
        credit: config?.credit,
        license: config?.license,
      };
    }
    navigator.clipboard.writeText(JSON.stringify(currentAssignments, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl text-foreground">Shrine Image Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage authentic temple photography for all 12 Jyotirlingas. All defaults are verified,
            high-resolution photographs with established Creative Commons or Public Domain
            licensing.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={handleCopyJson}>
            {copiedJson ? (
              <Check className="mr-1.5 size-4 text-emerald-500" />
            ) : (
              <ImageIcon className="mr-1.5 size-4" />
            )}
            {copiedJson ? "Copied JSON" : "Export JSON"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetAll}
            className="text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="mr-1.5 size-4" />
            Reset All
          </Button>
        </div>
      </div>

      {savedSuccess && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-600 dark:text-emerald-400">
          <Check className="size-4 shrink-0" />
          <span>
            {savedSuccess === "ALL"
              ? "All shrine images have been reset to verified default photographs."
              : `Image assignment for ${shrineImages[savedSuccess]?.name || savedSuccess} saved successfully.`}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {jyotirlingas.map((j) => {
          const config = shrineImages[j.slug];
          const hasOverride = !!overrides[j.slug] && overrides[j.slug] !== config?.image;
          const currentUrl =
            previewUrls[j.slug] ||
            overrides[j.slug] ||
            config?.image ||
            `/images/shrines/${j.slug}.jpg`;
          const inputVal = editInputs[j.slug] ?? config?.image ?? "";

          return (
            <div
              key={j.slug}
              className="flex flex-col justify-between overflow-hidden rounded-xl border border-border/60 bg-card p-5 shadow-sm space-y-4"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {j.number}
                      </span>
                      <h3 className="font-display text-lg font-medium text-foreground">{j.name}</h3>
                      {hasOverride && (
                        <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                          Custom Override
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {config?.templeName || `${j.name} Temple`}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[11px] font-normal shrink-0">
                    {j.state}
                  </Badge>
                </div>

                {/* Image Preview Card */}
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border border-border/40 bg-muted/30">
                  <img
                    src={currentUrl}
                    alt={`${j.name} temple`}
                    className="size-full object-cover transition-opacity duration-300"
                    loading="lazy"
                    onError={(e) => {
                      if (config?.fallbackImage && e.currentTarget.src !== config.fallbackImage) {
                        e.currentTarget.src = config.fallbackImage;
                      }
                    }}
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 text-white text-xs">
                    <p className="font-medium truncate">
                      {config?.credit ? `Photo: ${config.credit}` : "Verified Real Photo"}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-white/80 mt-0.5">
                      <span>License: {config?.license || "Public domain / CC"}</span>
                      {config?.source && (
                        <a
                          href={config.source}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:underline text-primary-foreground/90"
                        >
                          Source <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Verification notes */}
                {config?.verificationNotes && (
                  <p className="text-xs text-muted-foreground/80 italic leading-relaxed">
                    {config.verificationNotes}
                  </p>
                )}
              </div>

              {/* Edit Controls */}
              <div className="space-y-3 pt-2 border-t border-border/40">
                <div className="space-y-1.5">
                  <Label
                    htmlFor={`input-${j.slug}`}
                    className="text-xs font-medium text-foreground"
                  >
                    Image Path or URL
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id={`input-${j.slug}`}
                      value={inputVal}
                      onChange={(e) => handleInputChange(j.slug, e.target.value)}
                      placeholder="/images/shrines/somnath.jpg or https://..."
                      className="h-8 text-xs font-mono"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(j.slug)}
                      className="h-8 px-2.5 text-xs shrink-0"
                    >
                      Preview
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  {hasOverride ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleResetSingle(j.slug)}
                      className="h-7 text-xs text-muted-foreground hover:text-foreground px-2"
                    >
                      <RotateCcw className="mr-1 size-3" /> Revert to Verified Photo
                    </Button>
                  ) : (
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Check className="size-3 text-emerald-500" /> Authentic verified photo active
                    </span>
                  )}

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleSave(j.slug)}
                    className="h-7 text-xs px-3 ml-auto"
                  >
                    Save
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
