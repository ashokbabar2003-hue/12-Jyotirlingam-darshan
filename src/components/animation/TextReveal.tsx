import React, { useRef } from "react";
import { useGSAP, gsap, prefersReducedMotion } from "@/hooks/use-gsap";
import { cn } from "@/lib/utils";

interface TextRevealProps {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";
  className?: string;
  delay?: number;
  duration?: number;
  stagger?: number;
  triggerOnScroll?: boolean;
  threshold?: number;
}

export function TextReveal({
  children,
  as: Component = "div",
  className,
  delay = 0,
  duration = 1.0,
  triggerOnScroll = true,
}: TextRevealProps) {
  const containerRef = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      const el = containerRef.current;
      if (!el || prefersReducedMotion()) return;

      if (triggerOnScroll) {
        gsap.fromTo(
          el,
          {
            opacity: 0,
            y: 24,
          },
          {
            opacity: 1,
            y: 0,
            duration,
            delay,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              toggleActions: "play none none none",
              once: true,
            },
          },
        );
      } else {
        gsap.fromTo(
          el,
          {
            opacity: 0,
            y: 24,
          },
          {
            opacity: 1,
            y: 0,
            duration,
            delay,
            ease: "power3.out",
          },
        );
      }
    },
    { scope: containerRef, dependencies: [delay, duration, triggerOnScroll] },
  );

  return (
    // @ts-expect-error Polymorphic component ref typing
    <Component ref={containerRef} className={cn("transition-opacity duration-300", className)}>
      {children}
    </Component>
  );
}
