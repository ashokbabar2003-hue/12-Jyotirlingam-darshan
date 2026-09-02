import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import Lenis from "lenis";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/hooks/use-gsap";
import { SmoothScrollContext } from "@/hooks/use-lenis";

interface SmoothScrollProviderProps {
  children: React.ReactNode;
}

export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  const [lenisInstance, setLenisInstance] = useState<Lenis | null>(null);
  const location = useLocation();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isReducedMotion = prefersReducedMotion();

    // If user prefers reduced motion, do not initialize inertial damping
    if (isReducedMotion) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Smooth exponential deceleration
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.5,
      autoResize: true,
    });

    lenisRef.current = lenis;
    setLenisInstance(lenis);

    // 1. Sync Lenis scroll events with GSAP ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    // 2. Drive Lenis through GSAP ticker for a unified, single RAF render loop
    const updateTicker = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateTicker);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(updateTicker);
      lenis.destroy();
      lenisRef.current = null;
      setLenisInstance(null);
    };
  }, []);

  // Handle route changes: scroll to top and refresh ScrollTrigger
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Reset scroll position on route change if not a hash link
    if (!window.location.hash) {
      if (lenisRef.current) {
        lenisRef.current.scrollTo(0, { immediate: true });
      } else {
        window.scrollTo(0, 0);
      }
    }

    // Refresh ScrollTrigger instances after DOM has settled
    const rafId = requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });

    return () => cancelAnimationFrame(rafId);
  }, [location.pathname]);

  // Guarantee scroll position 0 and clear stale hash on initial page load at "/"
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.location.pathname === "/") {
      if (window.location.hash) {
        try {
          window.history.replaceState(null, "", "/");
        } catch (e) {
          /* ignore */
        }
      }

      // Scroll to top immediately
      window.scrollTo(0, 0);
      if (lenisRef.current) {
        lenisRef.current.scrollTo(0, { immediate: true });
      }

      // Re-apply over subsequent animation frames to override browser native anchor jumping
      const handleScroll = () => {
        window.scrollTo(0, 0);
        if (lenisRef.current) {
          lenisRef.current.scrollTo(0, { immediate: true });
        }
      };

      const raf1 = requestAnimationFrame(handleScroll);
      const raf2 = requestAnimationFrame(() => requestAnimationFrame(handleScroll));
      const timer1 = setTimeout(handleScroll, 50);
      const timer2 = setTimeout(handleScroll, 150);

      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [lenisInstance]);

  const scrollTo = (
    target: string | number | HTMLElement,
    options?: {
      offset?: number;
      immediate?: boolean;
      duration?: number;
      easing?: (t: number) => number;
    },
  ) => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, options);
    } else if (typeof window !== "undefined") {
      if (typeof target === "number") {
        window.scrollTo({ top: target, behavior: options?.immediate ? "auto" : "smooth" });
      } else if (typeof target === "string") {
        const el = document.querySelector(target);
        el?.scrollIntoView({ behavior: options?.immediate ? "auto" : "smooth" });
      } else if (target instanceof HTMLElement) {
        target.scrollIntoView({ behavior: options?.immediate ? "auto" : "smooth" });
      }
    }
  };

  return (
    <SmoothScrollContext.Provider value={{ lenis: lenisInstance, scrollTo }}>
      {children}
    </SmoothScrollContext.Provider>
  );
}
