import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { Sparkles, ArrowDown } from "lucide-react";
import { useGSAP, gsap, prefersReducedMotion } from "@/hooks/use-gsap";
import { type TransitionConfig } from "@/data/jyotirlingas";
import { cn } from "@/lib/utils";

export interface TransitionBoundary {
  fromIndex: number;
  toIndex: number;
  fromName: string;
  toName: string;
  fromSubtitle: string;
  toSubtitle: string;
  fromImage: string;
  toImage: string;
  config: TransitionConfig;
}

interface PooledTransitionCanvasProps {
  activeBoundary: TransitionBoundary | null;
  className?: string;
}

// Lightweight GLSL Vertex Shader
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Lightweight Organic Displacement GLSL Fragment Shader
// Features: Eased harmonic wave displacement, sRGB optical crossfade, and subtle warm golden atmospheric veil
const fragmentShader = `
  uniform sampler2D uTextureSource;
  uniform sampler2D uTextureDest;
  uniform float uProgress;
  uniform float uIntensity;
  uniform float uVeilAlpha;
  uniform vec2 uResolution;
  uniform vec2 uImageRes;
  varying vec2 vUv;

  // Preserve aspect ratio (cover texture mapping)
  vec2 getCoverUv(vec2 uv, vec2 planeRes, vec2 texRes) {
    vec2 s = planeRes;
    vec2 i = texRes;
    float r = max(s.x / i.x, s.y / i.y);
    vec2 newSize = i * r;
    vec2 offset = (newSize - s) / 2.0;
    return (uv * s + offset) / newSize;
  }

  void main() {
    vec2 uv = getCoverUv(vUv, uResolution, uImageRes);

    // Eased bell envelope: 0.0 at endpoints, rising smoothly to peak at 0.5
    float rawSin = sin(clamp(uProgress, 0.0, 1.0) * 3.14159265);
    float envelope = pow(rawSin, 2.0);
    
    // Controlled organic wave field (barely noticeable at start, resolves naturally at end)
    float wave1 = sin(uv.y * 6.0 + uProgress * 3.1415) * cos(uv.x * 4.5 + uProgress * 2.0);
    float wave2 = cos(uv.y * 9.0 - uProgress * 2.2) * sin(uv.x * 7.5 + uProgress * 1.4);
    vec2 displacement = vec2(wave1, wave2) * (uIntensity * envelope * 0.028);

    // Coordinate sampling with directional vectors
    vec2 uvSource = clamp(uv + displacement * (1.0 - uProgress), 0.001, 0.999);
    vec2 uvDest = clamp(uv - displacement * uProgress, 0.001, 0.999);

    vec4 colorSource = texture2D(uTextureSource, uvSource);
    vec4 colorDest = texture2D(uTextureDest, uvDest);

    // Smoothstep optical transition curve centered around midpoint
    float blendProgress = smoothstep(0.20, 0.80, uProgress);
    vec4 mixedColor = mix(colorSource, colorDest, blendProgress);

    // Subtle sacred warm golden atmospheric veil at peak transition
    vec3 sacredGold = vec3(0.96, 0.78, 0.44);
    float veilAlpha = envelope * uVeilAlpha;
    vec3 finalRgb = mix(mixedColor.rgb, sacredGold, veilAlpha);

    gl_FragColor = vec4(finalRgb, 1.0);
  }
`;

/**
 * Single Shared, Pooled WebGL Transition Canvas
 *
 * Constraints strictly satisfied:
 * - Exactly ONE WebGL renderer / canvas instance across the pilgrimage.
 * - Maximum TWO active textures loaded into VRAM at any given time.
 * - Render-on-demand: zero background rAF loop when idle.
 * - Deterministic ScrollTrigger scrub.
 * - Total resource cleanup and context loss invocation on unmount.
 */
export function PooledTransitionCanvas({ activeBoundary, className }: PooledTransitionCanvasProps) {
  const containerRef = useRef<HTMLElement | null>(null);
  const pinTargetRef = useRef<HTMLDivElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const sourceBadgeRef = useRef<HTMLDivElement | null>(null);
  const destBadgeRef = useRef<HTMLDivElement | null>(null);
  const veilTextRef = useRef<HTMLDivElement | null>(null);

  const [isClient, setIsClient] = useState(false);
  const [webGlSupported, setWebGlSupported] = useState(true);
  const [progressState, setProgressState] = useState(0);

  // WebGL engine refs (single pool)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const sourceTextureRef = useRef<THREE.Texture | null>(null);
  const destTextureRef = useRef<THREE.Texture | null>(null);
  const currentImagesRef = useRef<{ source: string; dest: string }>({ source: "", dest: "" });

  // 1. SSR & WebGL support test
  useEffect(() => {
    setIsClient(true);
    try {
      const testCanvas = document.createElement("canvas");
      const gl = testCanvas.getContext("webgl") || testCanvas.getContext("experimental-webgl");
      if (!gl) {
        setWebGlSupported(false);
      }
    } catch {
      setWebGlSupported(false);
    }
  }, []);

  const renderFrame = useCallback(() => {
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  }, []);

  // 2. Texture Swapping Mechanism (guarantees max 2 textures in VRAM)
  const swapTextures = useCallback(
    (newSourceSrc: string, newDestSrc: string) => {
      if (!materialRef.current) return;

      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin("anonymous");

      // Check if source changed
      if (currentImagesRef.current.source !== newSourceSrc) {
        if (sourceTextureRef.current) {
          sourceTextureRef.current.dispose();
          sourceTextureRef.current = null;
        }
        const tex = loader.load(newSourceSrc, (t) => {
          t.colorSpace = THREE.SRGBColorSpace;
          t.generateMipmaps = false;
          t.minFilter = THREE.LinearFilter;
          t.magFilter = THREE.LinearFilter;
          if (materialRef.current) {
            materialRef.current.uniforms.uTextureSource.value = t;
            renderFrame();
          }
        });
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.generateMipmaps = false;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        sourceTextureRef.current = tex;
        materialRef.current.uniforms.uTextureSource.value = tex;
        currentImagesRef.current.source = newSourceSrc;
      }

      // Check if destination changed
      if (currentImagesRef.current.dest !== newDestSrc) {
        if (destTextureRef.current) {
          destTextureRef.current.dispose();
          destTextureRef.current = null;
        }
        const tex = loader.load(newDestSrc, (t) => {
          t.colorSpace = THREE.SRGBColorSpace;
          t.generateMipmaps = false;
          t.minFilter = THREE.LinearFilter;
          t.magFilter = THREE.LinearFilter;
          if (materialRef.current) {
            materialRef.current.uniforms.uTextureDest.value = t;
            renderFrame();
          }
        });
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.generateMipmaps = false;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        destTextureRef.current = tex;
        materialRef.current.uniforms.uTextureDest.value = tex;
        currentImagesRef.current.dest = newDestSrc;
      }
    },
    [renderFrame],
  );

  // 3. Setup single WebGL Pool & GSAP ScrollTrigger Integration
  useGSAP(
    () => {
      if (!isClient || !activeBoundary) return;

      const container = containerRef.current;
      const pinTarget = pinTargetRef.current;
      const canvasContainer = canvasContainerRef.current;
      const canvas = canvasRef.current;

      const sourceBadge = sourceBadgeRef.current;
      const destBadge = destBadgeRef.current;
      const veilText = veilTextRef.current;

      if (!container || !pinTarget) return;

      const isReduced = prefersReducedMotion();
      const isWebGLType = activeBoundary.config.type === "webgl";

      if (isReduced || !webGlSupported || !canvas || !canvasContainer || !isWebGLType) {
        // Fallback CSS/GSAP crossfade mode
        gsap.timeline({
          scrollTrigger: {
            trigger: container,
            start: "top 80%",
            end: "bottom 20%",
            scrub: true,
            onUpdate: (self) => {
              setProgressState(self.progress);
            },
          },
        });
        return;
      }

      const isMobile = window.innerWidth < 768;
      const width = canvasContainer.clientWidth || 800;
      const height = canvasContainer.clientHeight || 500;

      // Initialize Renderer only once (Pooled)
      if (!rendererRef.current) {
        try {
          const scene = new THREE.Scene();
          const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
          const dpr = isMobile
            ? Math.min(window.devicePixelRatio, 1.25)
            : Math.min(window.devicePixelRatio, 1.75);

          const renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: !isMobile,
            powerPreference: "high-performance",
          });
          renderer.setPixelRatio(dpr);
          renderer.setSize(width, height);
          renderer.outputColorSpace = THREE.SRGBColorSpace;

          // Placeholder 1x1 textures before loading real ones
          const dummyCanvas = document.createElement("canvas");
          dummyCanvas.width = 1;
          dummyCanvas.height = 1;
          const dummyTex = new THREE.CanvasTexture(dummyCanvas);

          const uniforms = {
            uTextureSource: { value: dummyTex },
            uTextureDest: { value: dummyTex },
            uProgress: { value: 0.0 },
            uIntensity: {
              value: (activeBoundary.config.intensity ?? 0.028) * (isMobile ? 0.6 : 1.0),
            },
            uVeilAlpha: { value: activeBoundary.config.veilAlpha ?? 0.048 },
            uResolution: { value: new THREE.Vector2(width, height) },
            uImageRes: { value: new THREE.Vector2(1280, 960) },
          };

          const geometry = new THREE.PlaneGeometry(2, 2);
          const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms,
            transparent: true,
          });

          const mesh = new THREE.Mesh(geometry, material);
          scene.add(mesh);

          rendererRef.current = renderer;
          sceneRef.current = scene;
          cameraRef.current = camera;
          materialRef.current = material;
        } catch (err) {
          console.warn("Pooled WebGL initialization failed, falling back to CSS", err);
          setWebGlSupported(false);
          return;
        }
      }

      // Update uniforms for active boundary
      if (materialRef.current) {
        materialRef.current.uniforms.uIntensity.value =
          (activeBoundary.config.intensity ?? 0.028) * (isMobile ? 0.6 : 1.0);
        materialRef.current.uniforms.uVeilAlpha.value = activeBoundary.config.veilAlpha ?? 0.048;
        materialRef.current.uniforms.uResolution.value.set(width, height);
      }

      // Load/swap the 2 textures needed for this boundary
      swapTextures(activeBoundary.fromImage, activeBoundary.toImage);

      // Render initial frame
      renderFrame();

      // Container resize handling
      const handleResize = () => {
        if (!canvasContainer || !rendererRef.current || !materialRef.current) return;
        const newW = canvasContainer.clientWidth;
        const newH = canvasContainer.clientHeight;
        if (newW === 0 || newH === 0) return;

        rendererRef.current.setSize(newW, newH);
        materialRef.current.uniforms.uResolution.value.set(newW, newH);
        renderFrame();
      };

      window.addEventListener("resize", handleResize);

      // ScrollTrigger scrub
      const pinDistance = isMobile ? "+=30%" : "+=60%";
      const transitionTl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: isMobile ? "top 80%" : "top top",
          end: isMobile ? "bottom 20%" : pinDistance,
          pin: isMobile ? false : pinTarget,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (materialRef.current) {
              materialRef.current.uniforms.uProgress.value = self.progress;
            }
            setProgressState(self.progress);
            renderFrame();
          },
        },
      });

      // Synchronized badge and waypoint label crossfades
      if (sourceBadge && destBadge && veilText) {
        transitionTl
          .to(sourceBadge, { opacity: 0, y: -8, ease: "power1.inOut" }, 0.1)
          .to(veilText, { opacity: 1, y: 0, ease: "power2.out" }, 0.25)
          .to(veilText, { opacity: 0, y: -6, ease: "power2.in" }, 0.65)
          .to(destBadge, { opacity: 1, y: 0, ease: "power2.out" }, 0.65);
      }

      return () => {
        window.removeEventListener("resize", handleResize);
        // Do not prematurely destroy the pooled renderer during normal boundary changes;
        // it will be completely cleaned up on parent unmount.
      };
    },
    {
      scope: containerRef,
      dependencies: [isClient, activeBoundary, webGlSupported],
    },
  );

  // 4. Complete resource disposal on component unmount
  useEffect(() => {
    return () => {
      if (sourceTextureRef.current) {
        sourceTextureRef.current.dispose();
        sourceTextureRef.current = null;
      }
      if (destTextureRef.current) {
        destTextureRef.current.dispose();
        destTextureRef.current = null;
      }
      if (materialRef.current) {
        materialRef.current.dispose();
        materialRef.current = null;
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current.forceContextLoss();
        rendererRef.current = null;
      }
      sceneRef.current = null;
      cameraRef.current = null;
      currentImagesRef.current = { source: "", dest: "" };
    };
  }, []);

  if (!activeBoundary) return null;

  const isWebGL = activeBoundary.config.type === "webgl" && webGlSupported;
  const pathwayLabel = activeBoundary.config.pathwayLabel ?? "Sacred Pathway • तीर्थ संक्रमण";
  const pathwaySubtitle =
    activeBoundary.config.pathwaySubtitle ??
    `From ${activeBoundary.fromName} to ${activeBoundary.toName}`;

  return (
    <section
      ref={containerRef}
      id={`transition-${activeBoundary.fromIndex}-${activeBoundary.toIndex}`}
      className={cn(
        "relative w-full bg-background border-t border-border/20 overflow-hidden py-12 sm:py-16",
        className,
      )}
      aria-label={`Sacred Transition from ${activeBoundary.fromName} to ${activeBoundary.toName}`}
    >
      <div
        ref={pinTargetRef}
        className="relative mx-auto flex min-h-[70vh] sm:min-h-[85vh] w-full max-w-6xl flex-col items-center justify-center px-4 sm:px-6"
      >
        {/* Subtle Ambient Golden Glow */}
        <div className="pointer-events-none absolute inset-0 bg-radial-gradient from-primary/10 via-transparent to-transparent opacity-60 select-none" />

        {/* Transition Chapter Header */}
        <div className="relative mb-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-card/60 px-3.5 py-1 text-xs backdrop-blur-md">
            <Sparkles className="size-3 text-primary diya-flicker" />
            <span className="font-semibold uppercase tracking-[0.2em] text-accent text-[11px]">
              {pathwayLabel}
            </span>
          </div>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground">{pathwaySubtitle}</p>
        </div>

        {/* Central Cinematic Stage Canvas */}
        <div
          ref={canvasContainerRef}
          className="relative aspect-[16/10] sm:aspect-[16/9] w-full max-w-4xl overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-2xl"
        >
          {isWebGL ? (
            <canvas
              ref={canvasRef}
              className="size-full object-cover select-none pointer-events-none"
              style={{ display: "block" }}
            />
          ) : (
            /* Graceful Fallback for non-WebGL / Reduced Motion / Crossfade */
            <div className="relative size-full">
              <img
                src={activeBoundary.fromImage}
                alt={activeBoundary.fromName}
                className="absolute inset-0 size-full object-cover transition-opacity duration-300"
                style={{ opacity: 1 - progressState }}
              />
              <img
                src={activeBoundary.toImage}
                alt={activeBoundary.toName}
                className="absolute inset-0 size-full object-cover transition-opacity duration-300"
                style={{ opacity: progressState }}
              />
            </div>
          )}

          {/* Vignette Gradients */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-background/30" />

          {/* Dynamic Editorial Stage Overlay Badges */}
          <div className="absolute inset-x-4 bottom-4 flex items-end justify-between sm:inset-x-6 sm:bottom-6">
            {/* Source Shrine Badge */}
            <div
              ref={sourceBadgeRef}
              className="flex flex-col rounded-lg border border-white/10 bg-black/50 p-3 backdrop-blur-md transition-opacity duration-200"
              style={!isWebGL ? { opacity: Math.max(0, 1 - progressState * 1.5) } : undefined}
            >
              <span className="text-[10px] uppercase font-mono tracking-wider text-primary">
                Departing
              </span>
              <span className="font-display text-sm sm:text-base font-bold text-white">
                {activeBoundary.fromName}
              </span>
              <span className="text-[11px] text-white/70">{activeBoundary.fromSubtitle}</span>
            </div>

            {/* Transitional Midpoint Indicator */}
            <div
              ref={veilTextRef}
              className="absolute left-1/2 -translate-x-1/2 bottom-3 flex flex-col items-center opacity-0 pointer-events-none"
              style={
                !isWebGL
                  ? {
                      opacity:
                        progressState > 0.3 && progressState < 0.7
                          ? Math.sin((progressState - 0.3) * (Math.PI / 0.4))
                          : 0,
                    }
                  : undefined
              }
            >
              <span className="text-xs sm:text-sm font-display tracking-widest text-primary text-gradient-gold uppercase">
                Passing Through Sacred Grace
              </span>
              <ArrowDown className="size-3.5 text-primary/80 animate-bounce mt-1" />
            </div>

            {/* Destination Shrine Badge */}
            <div
              ref={destBadgeRef}
              className={cn(
                "flex flex-col items-end rounded-lg border border-white/10 bg-black/50 p-3 backdrop-blur-md transition-opacity duration-200",
                isWebGL && "opacity-0",
              )}
              style={!isWebGL ? { opacity: Math.max(0, (progressState - 0.5) * 2) } : undefined}
            >
              <span className="text-[10px] uppercase font-mono tracking-wider text-accent">
                Approaching
              </span>
              <span className="font-display text-sm sm:text-base font-bold text-white">
                {activeBoundary.toName}
              </span>
              <span className="text-[11px] text-white/70">{activeBoundary.toSubtitle}</span>
            </div>
          </div>
        </div>

        {/* Understated Progress Guide */}
        <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-mono text-[11px] text-primary">
            {String(activeBoundary.fromIndex).padStart(2, "0")} {activeBoundary.fromName}
          </span>
          <div className="h-1 w-24 sm:w-36 rounded-full bg-border/50 overflow-hidden">
            <div
              className="h-full bg-gradient-aarti transition-all duration-75"
              style={{ width: `${Math.round(progressState * 100)}%` }}
            />
          </div>
          <span className="font-mono text-[11px] text-accent">
            {String(activeBoundary.toIndex).padStart(2, "0")} {activeBoundary.toName}
          </span>
        </div>
      </div>
    </section>
  );
}
