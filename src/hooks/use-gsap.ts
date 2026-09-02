import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Ensure GSAP plugins are registered safely on the client
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Checks if the user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export interface UseGSAPOptions {
  scope?: React.RefObject<HTMLElement | null>;
  dependencies?: React.DependencyList;
  revertOnUpdate?: boolean;
}

/**
 * SSR-safe, React 18/19 compatible hook for GSAP animations with automatic cleanup via gsap.context()
 */
export function useGSAP(
  callback: (context: gsap.Context, isReducedMotion: boolean) => void | (() => void),
  options: UseGSAPOptions = {},
) {
  const { scope, dependencies = [], revertOnUpdate = true } = options;
  const savedCallback = useRef(callback);
  savedCallback.current = callback;

  useIsomorphicLayoutEffect(() => {
    if (typeof window === "undefined") return;

    const isReduced = prefersReducedMotion();
    const ctx = gsap.context((self) => {
      return savedCallback.current(self, isReduced);
    }, scope?.current || undefined);

    return () => {
      if (revertOnUpdate) {
        ctx.revert();
      }
    };
  }, dependencies);
}

export { gsap, ScrollTrigger };
