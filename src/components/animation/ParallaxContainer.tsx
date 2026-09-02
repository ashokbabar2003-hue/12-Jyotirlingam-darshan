import React, { useRef } from "react";
import { useGSAP, gsap, prefersReducedMotion } from "@/hooks/use-gsap";
import { cn } from "@/lib/utils";

interface ParallaxContainerProps {
  children: React.ReactNode;
  className?: string;
  speed?: number; // e.g. -0.2 (slower scroll) to 0.2 (faster scroll)
  direction?: "vertical" | "horizontal";
  overflowHidden?: boolean;
}

export function ParallaxContainer({
  children,
  className,
  speed = 0.15,
  direction = "vertical",
  overflowHidden = false,
}: ParallaxContainerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const targetRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const container = containerRef.current;
      const target = targetRef.current;
      if (!container || !target || prefersReducedMotion()) return;

      const movement = speed * 100;

      if (direction === "vertical") {
        gsap.fromTo(
          target,
          {
            yPercent: -movement / 2,
          },
          {
            yPercent: movement / 2,
            ease: "none",
            scrollTrigger: {
              trigger: container,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      } else {
        gsap.fromTo(
          target,
          {
            xPercent: -movement / 2,
          },
          {
            xPercent: movement / 2,
            ease: "none",
            scrollTrigger: {
              trigger: container,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      }
    },
    { scope: containerRef, dependencies: [speed, direction] },
  );

  return (
    <div
      ref={containerRef}
      className={cn("relative", overflowHidden && "overflow-hidden", className)}
    >
      <div ref={targetRef} className="h-full w-full">
        {children}
      </div>
    </div>
  );
}
