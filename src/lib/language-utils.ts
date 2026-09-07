import type React from "react";
import type { Lang } from "@/hooks/use-language";

/**
 * Returns the explicit font class associated with each language code.
 * Ensures 'hi' always uses 'font-hindi' and 'mr' always uses 'font-marathi'
 * regardless of active application locale.
 */
export function getLanguageOptionFontClass(code: Lang | string): string {
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

/**
 * Returns explicit inline style to guarantee font-family cannot be overridden
 * by global html[data-lang] typography rules.
 */
export function getLanguageOptionStyle(code: Lang | string): React.CSSProperties {
  switch (code) {
    case "hi":
      return { fontFamily: '"Yatra One", serif' };
    case "mr":
      return { fontFamily: '"Noto Serif Devanagari", serif' };
    case "gu":
      return { fontFamily: '"Noto Sans Gujarati", sans-serif' };
    case "te":
      return { fontFamily: '"Noto Sans Telugu", sans-serif' };
    case "ta":
      return { fontFamily: '"Noto Sans Tamil", sans-serif' };
    case "en":
    default:
      return { fontFamily: '"Inter", sans-serif' };
  }
}
