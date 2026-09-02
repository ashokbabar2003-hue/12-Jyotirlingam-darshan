import { Check, Languages } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage, LANGUAGES, type Lang } from "@/hooks/use-language";
import { cn } from "@/lib/utils";

/**
 * Returns the explicit font class associated with each language code.
 * Ensures 'hi' always uses 'font-hindi' and 'mr' always uses 'font-marathi'
 * regardless of active application locale.
 */
function getLanguageOptionFontClass(code: Lang | string): string {
  switch (code) {
    case "hi":
      return "font-hindi";
    case "mr":
      return "font-marathi";
    case "gu":
      return "font-gujarati";
    case "te":
      return "font-telugu";
    case "ta":
      return "font-tamil";
    case "en":
    default:
      return "font-en";
  }
}

interface LanguageSelectorProps {
  className?: string;
}

export function LanguageSelector({ className }: LanguageSelectorProps) {
  const { lang, setLang } = useLanguage();
  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];
  const activeTriggerFontClass = getLanguageOptionFontClass(current.code);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Select language"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/70 px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-card",
            className,
          )}
        >
          <Languages className="size-3.5 shrink-0 text-muted-foreground" />
          <span className={cn("hidden max-w-[7rem] truncate sm:inline", activeTriggerFontClass)}>
            {current.label}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem]">
        <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Language
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LANGUAGES.map((l) => {
          const optionFontClass = getLanguageOptionFontClass(l.code);
          return (
            <DropdownMenuItem
              key={l.code}
              onSelect={() => setLang(l.code as Lang)}
              className={cn("cursor-pointer text-sm", optionFontClass)}
            >
              <span className={cn("flex-1", optionFontClass)}>{l.label}</span>
              {lang === l.code && <Check className="size-3.5 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default LanguageSelector;
