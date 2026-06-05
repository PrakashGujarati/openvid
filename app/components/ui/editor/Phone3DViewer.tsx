"use client";

/**
 * Phone3DViewer
 *
 * Architecture: ONE master timeline per sequence.
 * Entry + snap + drift are all added to a single gsap.timeline() so there
 * are zero gaps, zero competing tweens, and zero onComplete chains.
 *
 * Phase machine:
 *   idle → entry → hold → exit → done
 *
 * The hold drift uses repeat:-1 yoyo on a sub-timeline added to the master.
 * The exit is scheduled with gsap.delayedCall (not onComplete) so killMotion
 * can cancel it cleanly without race conditions.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import gsap from "gsap";
import phoneGltfData from "@/public/models/phone-gltf.json";
import { NRX, NRY, idleScript } from "@/lib/animation-core";
import { TEMPLATES } from "@/lib/template-registry";
import { AV, MotionStyle } from "@/types/motion.types";
import { CAMERA_VARIANTS, DEFAULT_VARIANT_ID } from "./templates-motion/Phone";
import type { AnimMode } from "@/types/motion.types";

// ─── Canvas dimensions ────────────────────────────────────────────────────────
const PHONE_W = 231;
const PHONE_H = 469;
const RENDER_W = 595;
const RENDER_H = 765;
const CAM_FOV = 20;
const CAM_Z = 14;

const RX = (PHONE_W - RENDER_W) / 2;
const RY = (PHONE_H - RENDER_H) / 2;

// ─── GLTF cache ───────────────────────────────────────────────────────────────
const GLTF_STR = JSON.stringify(phoneGltfData);
let gltfCachePromise: Promise<THREE.Group> | null = null;

function loadGltfGroup(): Promise<THREE.Group> {
  if (!gltfCachePromise) {
    gltfCachePromise = new Promise((resolve, reject) =>
      new GLTFLoader().parse(GLTF_STR, "", (gltf) => resolve(gltf.scene as THREE.Group), reject)
    );
  }
  return gltfCachePromise;
}

// Per-URL GLTF cache for external GLB files
const gltfUrlCache = new Map<string, Promise<THREE.Group>>();

function loadGltfFromUrl(url: string): Promise<THREE.Group> {
  if (!gltfUrlCache.has(url)) {
    gltfUrlCache.set(url, new Promise((resolve, reject) =>
      new GLTFLoader().load(url, (gltf) => resolve(gltf.scene as THREE.Group), undefined, reject)
    ));
  }
  return gltfUrlCache.get(url)!;
}

function cloneGroup(src: THREE.Group): THREE.Group {
  const clone = src.clone(true);
  clone.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.material = Array.isArray(child.material)
        ? (child.material as THREE.Material[]).map((m) => m.clone())
        : (child.material as THREE.Material).clone();
    }
  });
  return clone;
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  videoElement?: HTMLVideoElement | null;
  canvasElement?: HTMLCanvasElement | null;
  imageUrl?: string | null;
  isPlaying?: boolean;
  animDuration?: number;
  intensity?: number;
  templateId?: string | null;
  motionStyle?: MotionStyle;
  variantId?: string | null;
  animMode?: AnimMode;
  /** If true, drag releases keep the final rotation (no spring-back). Default false */
  keepRotation?: boolean;
  /** Initial 3D rotation offset (degrees) to restore after remount */
  initialRotationX?: number;
  initialRotationY?: number;
  /** Called on pointer-up with final rotation offsets */
  onRotationChange?: (rx: number, ry: number) => void;
  /** Called once the WebGL canvas is ready — used by parent to capture a snapshot for export */
  onMount?: (canvas: HTMLCanvasElement) => void;
  /** External GLB model URL (e.g. '/models/iphone-15-pro-max.glb'). When omitted, uses the default phone-gltf.json */
  modelUrl?: string;
}

// ─── helpers ──────────────────────────────────────────────────────────────────
/** Shortest arc in degrees from curRy to targetRy, result in [-180, 180] */
function shortArc(curRy: number, targetRy: number): number {
  return ((targetRy - curRy) % 360 + 540) % 360 - 180;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function Phone3DViewer({
  videoElement = null,
  canvasElement = null,
  imageUrl = null,
  isPlaying = false,
  animDuration = 8000,
  intensity = 70,
  templateId = null,
  motionStyle = "normal",
  variantId = null,
  animMode = "entry+exit",
  keepRotation = false,
  initialRotationX = 0,
  initialRotationY = 0,
  onRotationChange,
  onMount,
  modelUrl,
}: Props) {
  const webglRef   = useRef<HTMLDivElement>(null);
  const rendererRef  = useRef<THREE.WebGLRenderer | null>(null);
  const phoneGroupRef = useRef<THREE.Group | null>(null);
  const screenMeshRef = useRef<THREE.Mesh | null>(null);
  const rootRef    = useRef<HTMLDivElement>(null);

  // ── Animation state ──────────────────────────────────────────────────────────
  // Single master timeline — killed atomically by stopAll()
  const masterTlRef  = useRef<gsap.core.Timeline | null>(null);
  // delayedCall for exit scheduling — killed atomically by stopAll()
  const exitTimerRef = useRef<gsap.core.Tween | null>(null);
  // Monotonically-increasing token; stale callbacks bail out immediately
  const tokenRef     = useRef(0);

  type Phase = "idle" | "entry" | "hold" | "exit" | "done";
  const phaseRef         = useRef<Phase>("idle");
  const holdEndEpochRef  = useRef(0);
  const holdRemRef       = useRef(0);
  // Captures the exit launcher so pause/resume can reschedule it
  const scheduleExitRef  = useRef<((delayMs: number) => void) | null>(null);

  const [loaded, setLoaded] = useState(false);
  const [dragging, setDragging] = useState(false);

  const isDraggingRef  = useRef(false);
  const hasEnteredRef  = useRef(false);

  const imageUrlRef          = useRef(imageUrl);
  const lastLoadedImageUrlRef = useRef<string | null>(null);
  const videoElementRef      = useRef<HTMLVideoElement | null>(videoElement);
  const canvasElementRef     = useRef<HTMLCanvasElement | null>(canvasElement);
  const textureCreatedRef    = useRef(false);
  const animDurRef    = useRef(animDuration);
  const intensityRef  = useRef(intensity);
  const templateIdRef = useRef(templateId);
  const motionStyleRef = useRef<MotionStyle>(motionStyle);
  const variantIdRef  = useRef(variantId);
  const animModeRef   = useRef<AnimMode>(animMode);
  const isPlayingRef  = useRef(isPlaying);

  const dragOrigin = useRef({ px: 0, py: 0, rx: 0, ry: 0 });
  const animIdRef  = useRef(0);
  const userOffset = useRef<{ rx: number; ry: number }>({ rx: initialRotationX, ry: initialRotationY });
  const av = useRef<AV>({ rx: NRX, ry: NRY, tx: 0, ty: 0, sc: 1.0 });
  const keepRotationRef = useRef(keepRotation);
  const onRotationChangeRef = useRef(onRotationChange);
  const onMountRef = useRef(onMount);
  const modelUrlRef = useRef(modelUrl);
  useEffect(() => { keepRotationRef.current = keepRotation; }, [keepRotation]);
  useEffect(() => { onRotationChangeRef.current = onRotationChange; }, [onRotationChange]);
  useEffect(() => { onMountRef.current = onMount; }, [onMount]);
  useEffect(() => { modelUrlRef.current = modelUrl; }, [modelUrl]);

  // Animate to new rotation when parent changes initialRotationX/Y (e.g. card click)
  useEffect(() => {
    if (isDraggingRef.current) return;
    gsap.to(userOffset.current, {
      rx: initialRotationX,
      ry: initialRotationY,
      duration: 0.55,
      ease: "power2.out",
      overwrite: "auto",
      onUpdate: updateDOM,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRotationX, initialRotationY]);

  useEffect(() => { imageUrlRef.current       = imageUrl;       }, [imageUrl]);
  useEffect(() => { videoElementRef.current   = videoElement;   }, [videoElement]);
  useEffect(() => { canvasElementRef.current  = canvasElement;  }, [canvasElement]);
  useEffect(() => { animDurRef.current        = animDuration;   }, [animDuration]);
  useEffect(() => { intensityRef.current      = intensity;      }, [intensity]);
  useEffect(() => { templateIdRef.current     = templateId;     }, [templateId]);
  useEffect(() => { motionStyleRef.current    = motionStyle;    }, [motionStyle]);
  useEffect(() => { variantIdRef.current      = variantId;      }, [variantId]);
  useEffect(() => { animModeRef.current       = animMode;       }, [animMode]);
  useEffect(() => { isPlayingRef.current      = isPlaying;      }, [isPlaying]);

  useEffect(() => { textureCreatedRef.current = false; }, [imageUrl, videoElement, canvasElement]);

  // ── updateDOM — applies av to Three.js group + root CSS ───────────────────
  const updateDOM = useCallback(() => {
    const r = rootRef.current;
    if (!r) return;
    const { rx, ry, tx, ty, sc } = av.current;
    const DEG = Math.PI / 180;
    const group = phoneGroupRef.current;
    if (group) group.rotation.set(
      (rx + userOffset.current.rx) * DEG,
      (ry + userOffset.current.ry) * DEG,
      0, "YXZ"
    );
    r.style.transform = `translate(${tx}px, ${ty}px) scale(${sc})`;
  }, []);

  // ── stopAll — kills EVERYTHING, increments token ─────────────────────────
  const stopAll = useCallback(() => {
    tokenRef.current += 1;
    if (exitTimerRef.current)  { exitTimerRef.current.kill();  exitTimerRef.current  = null; }
    if (masterTlRef.current)   { masterTlRef.current.kill();   masterTlRef.current   = null; }
    gsap.killTweensOf(av.current);
    scheduleExitRef.current = null;
  }, []);

  // ── startMotion — the only entry point for launching an animation ─────────
  const startMotion = useCallback((durMs: number, once = false) => {
    // Static mode: no animation, just stay at rest pose
    if (animModeRef.current === "static") return;

    stopAll();
    phaseRef.current      = "idle";
    holdRemRef.current    = 0;
    holdEndEpochRef.current = 0;

    const id         = templateIdRef.current;
    const style      = motionStyleRef.current;
    const i          = intensityRef.current / 100;
    const tpl        = TEMPLATES.find((t) => t.id === id);
    const isPhone    = id === "phone";

    const variant = CAMERA_VARIANTS.find(
      (v) => v.id === (variantIdRef.current ?? DEFAULT_VARIANT_ID)
    ) ?? CAMERA_VARIANTS[0];

    const mode: AnimMode = animModeRef.current;

    // Capture token for this invocation
    const myToken = tokenRef.current;
    const alive = () => tokenRef.current === myToken;

    // ── Non-phone: just run the template script unchanged ──────────────────
    if (!isPhone) {
      const script = tpl?.script ?? idleScript;
      const tl = script(av.current, i, durMs, style, updateDOM);
      masterTlRef.current = tl;
      phaseRef.current = "hold";
      return;
    }

    // ── Phone: compute durations ───────────────────────────────────────────
    const entryDur = (mode === "entry" || mode === "entry+exit") ? variant.entryDuration : 0;
    const exitDur  = (mode === "exit"  || mode === "entry+exit") ? variant.exitDuration  : 0;
    const holdDur  = Math.max(durMs - entryDur - exitDur, 0);

    // ── Compute snap arc from wherever av currently is to hero pose ───────
    // snapDur is proportional to arc magnitude so large rotations glide smoothly
    const curRy    = av.current.ry;
    const arcDelta = shortArc(curRy, NRY);
    const arcDeg   = Math.abs(arcDelta);
    const snapDur  = 0.25 + (arcDeg / 180) * 0.45; // 0.25s – 0.70s

    // ── ONE master timeline for entry + snap ─────────────────────────────
    // Using GSAP's position parameter (">") so snap starts at the END of entry.
    // No separate onComplete chains — everything is one timeline.
    const master = gsap.timeline({ paused: true });

    if (mode === "entry" || mode === "entry+exit") {
      // Add entry sub-timeline at position 0
      const entryTl = variant.entryScript(av.current, i, entryDur, style, updateDOM);
      entryTl.repeat(0);
      master.add(entryTl, 0);

      // Snap tween appended right after entry ends (position ">")
      master.to(av.current, {
        rx: NRX,
        ry: curRy + arcDelta,      // shortest-arc target
        tx: 0, ty: 0, sc: 1.0,
        duration: snapDur,
        ease: "power2.out",
        onUpdate: updateDOM,
      }, ">");

    } else if (mode === "exit" || mode === "none") {
      // No entry: just snap to hero pose first, then hold
      master.to(av.current, {
        rx: NRX, ry: curRy + arcDelta,
        tx: 0, ty: 0, sc: 1.0,
        duration: snapDur,
        ease: "power2.out",
        onUpdate: updateDOM,
      }, 0);
    }

    // When the master finishes (entry + snap), transition to hold
    master.eventCallback("onComplete", () => {
      if (!alive()) return;

      phaseRef.current = "hold";

      // ── Hold: smooth breathing drift, repeat:-1 yoyo ─────────────────
      // This is a NEW standalone timeline (not inside master) so it can
      // be killed independently from the exit.
      const driftTl = gsap.timeline({ repeat: -1, yoyo: true });
      driftTl.to(av.current, {
        rx: NRX - 2 * i,
        ry: NRY - 4 * i,
        tx:  2 * i,
        ty: -3 * i,
        sc: 1.0,
        duration: 2.8,
        ease: "sine.inOut",
        onUpdate: updateDOM,
      });
      masterTlRef.current = driftTl;

      // ── Schedule exit ────────────────────────────────────────────────
      // Build the schedule function here so pause/resume can reuse it
      const doScheduleExit = (delayMs: number) => {
        if (!alive()) return;
        const safe = Math.max(delayMs, 0);
        holdEndEpochRef.current = Date.now() + safe;
        exitTimerRef.current = gsap.delayedCall(safe / 1000, () => {
          exitTimerRef.current = null;
          if (!alive()) return;
          runExit();
        });
      };
      scheduleExitRef.current = doScheduleExit;

      if (mode === "entry+exit" || mode === "exit") {
        doScheduleExit(holdDur);
      }
      // mode "entry" or "none": drift runs indefinitely until video ends/pauses
    });

    // ── runExit ─────────────────────────────────────────────────────────
    const runExit = () => {
      if (!alive()) return;
      phaseRef.current = "exit";

      // Kill the drift
      if (masterTlRef.current) { masterTlRef.current.kill(); masterTlRef.current = null; }
      gsap.killTweensOf(av.current);

      // Snap quickly to clean hero pose before starting the exit script
      // so the exit always starts from a known position
      const preExitArc = shortArc(av.current.ry, NRY);
      const preExitDur = Math.min(0.3, Math.abs(preExitArc) / 360);

      const exitMaster = gsap.timeline();

      if (preExitDur > 0.05) {
        exitMaster.to(av.current, {
          rx: NRX, ry: av.current.ry + preExitArc,
          tx: 0, ty: 0, sc: 1.0,
          duration: preExitDur,
          ease: "power2.out",
          onUpdate: updateDOM,
        });
      }

      const exitTl = variant.exitScript(av.current, i, exitDur, style, updateDOM);
      exitTl.repeat(0);
      exitMaster.add(exitTl, ">");

      exitMaster.eventCallback("onComplete", () => {
        if (alive()) phaseRef.current = "done";
      });

      masterTlRef.current = exitMaster;
    };

    // ── preview (once=true): run the legacy `script` and spring back ─────
    if (once) {
      master.kill(); // don't need the master we built
      const previewDur = Math.min(durMs, 4000);
      const previewTl  = variant.script(av.current, i, previewDur, style, updateDOM);
      previewTl.repeat(0);
      previewTl.eventCallback("onComplete", () => {
        if (!alive()) return;
        phaseRef.current = "done";
        const arc = shortArc(av.current.ry, NRY);
        gsap.to(av.current, {
          rx: NRX, ry: av.current.ry + arc,
          tx: 0, ty: 0, sc: 1.0,
          duration: 0.8 + Math.abs(arc) / 360,
          ease: "power3.out",
          onUpdate: updateDOM,
        });
      });
      masterTlRef.current = previewTl;
      phaseRef.current = "entry";
      return;
    }

    // Play the master (entry + snap → triggers onComplete → hold)
    phaseRef.current = "entry";
    masterTlRef.current = master;
    master.play();

  }, [stopAll, updateDOM]);

  // ── isPlaying effect ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasEnteredRef.current) return;

    if (isPlaying) {
      // Cancel any spring-to-REST from the pause transition
      gsap.killTweensOf(av.current);

      const phase = phaseRef.current;

      if (phase === "hold") {
        // Resume drift without replaying entry
        const i    = intensityRef.current / 100;
        const mode = animModeRef.current;

        const driftTl = gsap.timeline({ repeat: -1, yoyo: true });
        driftTl.to(av.current, {
          rx: NRX - 2 * i, ry: NRY - 4 * i,
          tx: 2 * i, ty: -3 * i, sc: 1.0,
          duration: 2.8, ease: "sine.inOut", onUpdate: updateDOM,
        });
        masterTlRef.current = driftTl;

        // Reschedule exit if applicable
        if ((mode === "entry+exit" || mode === "exit") && scheduleExitRef.current) {
          const remaining = holdRemRef.current > 0
            ? holdRemRef.current
            : Math.max(holdEndEpochRef.current - Date.now(), 0);
          holdRemRef.current = 0;
          if (remaining > 0) {
            scheduleExitRef.current(remaining);
          }
        }

      } else if (phase === "exit") {
        // Mid-exit when paused — restart exit from clean hero pose
        startMotion(animDurRef.current, false);

      } else if (phase === "done") {
        // Video looped or restarted — launch full sequence again
        startMotion(animDurRef.current, false);

      } else {
        // idle or interrupted entry
        startMotion(animDurRef.current, false);
      }

    } else {
      // Pause — save hold remaining before stopping everything
      if (phaseRef.current === "hold") {
        holdRemRef.current = exitTimerRef.current
          ? Math.max(holdEndEpochRef.current - Date.now(), 0)
          : 0;
      }
      stopAll();

      // Gentle spring to hero pose on pause (shortest arc)
      const arc = shortArc(av.current.ry, NRY);
      gsap.to(av.current, {
        rx: NRX, ry: av.current.ry + arc,
        tx: 0, ty: 0, sc: 1.0,
        duration: 0.9, ease: "power3.out",
        onUpdate: updateDOM,
      });
    }
  }, [isPlaying, startMotion, stopAll, updateDOM]);

  // ── Variant / template change → smooth bridge transition ─────────────────
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (!hasEnteredRef.current) return;
    if (!templateId || templateId === "none") return;

    // Increment token manually (we manage the bridge ourselves)
    tokenRef.current += 1;
    const myToken = tokenRef.current;

    // Stop everything without going through stopAll (we want our own bridge)
    if (exitTimerRef.current)  { exitTimerRef.current.kill();  exitTimerRef.current  = null; }
    if (masterTlRef.current)   { masterTlRef.current.kill();   masterTlRef.current   = null; }
    gsap.killTweensOf(av.current);
    scheduleExitRef.current = null;
    phaseRef.current = "idle";
    holdRemRef.current = 0;

    // Bridge: smooth arc to hero pose, then launch new animation
    const arc     = shortArc(av.current.ry, NRY);
    const arcDeg  = Math.abs(arc);
    const bridgeDur = 0.4 + (arcDeg / 180) * 0.4;

    gsap.to(av.current, {
      rx: NRX, ry: av.current.ry + arc,
      tx: 0, ty: 0, sc: 1.0,
      duration: bridgeDur,
      ease: "power2.inOut",
      onUpdate: updateDOM,
      onComplete: () => {
        if (tokenRef.current !== myToken) return;
        // once=true if paused (preview), once=false if playing (full run)
        startMotion(animDurRef.current, !isPlayingRef.current);
      },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, variantId]);

  // ── Intensity/style/duration changes → restart if playing ────────────────
  useEffect(() => {
    if (!hasEnteredRef.current) return;
    if (!isPlayingRef.current) return;
    startMotion(animDurRef.current, false);
  }, [animDuration, intensity, motionStyle, animMode, startMotion]);

  // ── Cinema mount entrance ─────────────────────────────────────────────────
  useEffect(() => {
    const i = intensity / 100;

    // Static mode: no entrance animation — snap to rest pose immediately
    if (animModeRef.current === "static") {
      Object.assign(av.current, { rx: NRX, ry: NRY, tx: 0, ty: 0, sc: 1.0 });
      updateDOM();
      hasEnteredRef.current = true;
      return () => {
        stopAll();
        gsap.killTweensOf(av.current);
      };
    }

    Object.assign(av.current, {
      rx: NRX + 30 * i, ry: NRY + 50 * i,
      tx: 0, ty: -60 * i, sc: 0.7,
    });
    updateDOM();

    gsap.to(av.current, {
      rx: NRX, ry: NRY, tx: 0, ty: 0, sc: 1.0,
      duration: 1.2, ease: "expo.out",
      onUpdate: updateDOM,
      onComplete: () => {
        hasEnteredRef.current = true;
        if (isPlayingRef.current) startMotion(animDurRef.current, false);
      },
    });

    return () => {
      stopAll();
      gsap.killTweensOf(av.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Three.js setup + RAF texture loop ─────────────────────────────────────
  useEffect(() => {
    const container = webglRef.current;
    if (!container) return;

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(CAM_FOV, RENDER_W / RENDER_H, 0.1, 100);
    camera.position.set(0, 0, CAM_Z);

    scene.add(new THREE.AmbientLight(0xffffff, 3.2));
    const dl1 = new THREE.DirectionalLight(0xffffff, 2.6); dl1.position.set(4,  8, 7); scene.add(dl1);
    const dl2 = new THREE.DirectionalLight(0xaabbff, 0.8); dl2.position.set(-5,-2, 4); scene.add(dl2);
    const dl3 = new THREE.DirectionalLight(0xffffff, 1.3); dl3.position.set(0, -6, 6); scene.add(dl3);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(RENDER_W, RENDER_H);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;
    rendererRef.current = renderer;

    const canvas = renderer.domElement;
    canvas.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none";
    container.appendChild(canvas);
    onMountRef.current?.(canvas);

    const loadPromise = modelUrlRef.current
      ? loadGltfFromUrl(modelUrlRef.current)
      : loadGltfGroup();

    loadPromise.then((cached) => {
      const group = cloneGroup(cached);
      const box   = new THREE.Box3().setFromObject(group);
      const center = box.getCenter(new THREE.Vector3());
      const size   = box.getSize(new THREE.Vector3());
      group.position.sub(center);
      const halfH = CAM_Z * Math.tan((CAM_FOV / 2) * Math.PI / 180);
      const sf    = (halfH * 2 * 0.80) / size.y;
      group.scale.setScalar(sf);
      group.position.multiplyScalar(sf);
      scene.add(group);
      phoneGroupRef.current = group;
      group.updateMatrixWorld(true);

      group.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        const matName: string = Array.isArray(child.material)
          ? ((child.material[0] as THREE.Material)?.name ?? "")
          : ((child.material as THREE.Material)?.name ?? "");

        if (matName === "Screen.editable" || child.name === "Screen") {
          screenMeshRef.current = child;
          const mat = (Array.isArray(child.material)
            ? child.material[0] : child.material) as THREE.MeshStandardMaterial;
          mat.color.set(0xffffff);
          mat.roughness = 1.0;
          mat.metalness = 0.0;
          mat.needsUpdate = true;
          child.visible = true;
          return;
        }

        if (!Array.isArray(child.material)) {
          const mat = child.material as THREE.MeshStandardMaterial;
          if (!mat.isMeshStandardMaterial) return;
          if (matName.includes("Body"))    mat.color.set(0x707070);
          if (matName.includes("Bezel"))   mat.color.set(0x808080);
          if (matName.includes("Buttons")) mat.color.set(0x909090);
          if (matName.includes("Lenses"))  {
            mat.color.set(0x060608);
            mat.roughness = 0.06;
            mat.metalness = 0.55;
          }
        }
      });

      setLoaded(true);
    });

    // RAF texture loop
    const tick = () => {
      animIdRef.current = requestAnimationFrame(tick);
      const mesh = screenMeshRef.current;
      if (!mesh) { renderer.render(scene, camera); return; }

      const mat = (Array.isArray(mesh.material)
        ? mesh.material[0] : mesh.material) as THREE.MeshStandardMaterial;
      const currentImageUrl = imageUrlRef.current;

      if (currentImageUrl) {
        if (lastLoadedImageUrlRef.current !== currentImageUrl) {
          new THREE.TextureLoader().load(
            currentImageUrl,
            (tex) => {
              if (mat.map) mat.map.dispose();
              tex.flipY = false;
              tex.colorSpace = THREE.SRGBColorSpace;
              tex.generateMipmaps = false;
              tex.minFilter = tex.magFilter = THREE.LinearFilter;
              tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
              mat.map = tex;
              mat.needsUpdate = true;
              lastLoadedImageUrlRef.current = currentImageUrl;
            },
            undefined,
            () => { lastLoadedImageUrlRef.current = currentImageUrl; }
          );
        }
      } else {
        lastLoadedImageUrlRef.current = null;
        const vid = videoElementRef.current;
        const cvs = canvasElementRef.current;

        if (vid) {
          const ready = vid.videoWidth > 0 && vid.videoHeight > 0 && vid.readyState >= 2;
          if (ready) {
            if (!(mat.map instanceof THREE.VideoTexture)) {
              textureCreatedRef.current = true;
              if (mat.map) mat.map.dispose();
              const vt = new THREE.VideoTexture(vid);
              vt.flipY = false;
              vt.colorSpace = THREE.SRGBColorSpace;
              vt.generateMipmaps = false;
              vt.minFilter = vt.magFilter = THREE.LinearFilter;
              vt.wrapS = vt.wrapT = THREE.ClampToEdgeWrapping;
              mat.map = vt;
              mat.needsUpdate = true;
            }
            mat.map.needsUpdate = true;
          }
        } else if (cvs) {
          const ready = cvs.width > 0 && cvs.height > 0;
          if (ready) {
            if (!(mat.map instanceof THREE.CanvasTexture)) {
              textureCreatedRef.current = true;
              if (mat.map) mat.map.dispose();
              const ct = new THREE.CanvasTexture(cvs);
              ct.flipY = false;
              ct.colorSpace = THREE.SRGBColorSpace;
              ct.generateMipmaps = false;
              ct.minFilter = ct.magFilter = THREE.LinearFilter;
              ct.wrapS = ct.wrapT = THREE.ClampToEdgeWrapping;
              mat.map = ct;
              mat.needsUpdate = true;
            } else {
              (mat.map as THREE.CanvasTexture).needsUpdate = true;
            }
          }
        }
      }

      renderer.render(scene, camera);
    };
    animIdRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animIdRef.current);
      if (phoneGroupRef.current) {
        phoneGroupRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach((m: THREE.Material) => {
              if ((m as THREE.MeshStandardMaterial).map) {
                (m as THREE.MeshStandardMaterial).map!.dispose();
              }
              m.dispose();
            });
          }
        });
      }
      renderer.dispose();
      if (container.contains(canvas)) container.removeChild(canvas);
      rendererRef.current = phoneGroupRef.current = screenMeshRef.current = null;
    };
  }, []);

  // ── Pointer drag ──────────────────────────────────────────────────────────
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    gsap.killTweensOf(userOffset.current);
    isDraggingRef.current = true;
    setDragging(true);
    dragOrigin.current = {
      px: e.clientX, py: e.clientY,
      rx: userOffset.current.rx, ry: userOffset.current.ry,
    };
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    userOffset.current.rx = dragOrigin.current.rx - (e.clientY - dragOrigin.current.py) * 0.45;
    userOffset.current.ry = dragOrigin.current.ry + (e.clientX - dragOrigin.current.px) * 0.65;
    updateDOM();
  }, [updateDOM]);

  const onPointerUp = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setDragging(false);
    if (keepRotationRef.current) {
      // Keep final rotation — just notify parent
      onRotationChangeRef.current?.(userOffset.current.rx, userOffset.current.ry);
    } else {
      gsap.to(userOffset.current, {
        rx: 0, ry: 0, duration: 2.2, ease: "power3.out", onUpdate: updateDOM,
      });
    }
  }, [updateDOM]);

  return (
    <div
      ref={rootRef}
      className="select-none"
      style={{ position: "relative", width: PHONE_W, height: PHONE_H, willChange: "transform" }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        style={{
          position: "absolute", width: 1400, height: 1400,
          left: "50%", top: "50%", transform: "translate(-50%,-50%)",
          background: "radial-gradient(circle,rgba(99,102,241,0.45) 0%,rgba(139,92,246,0.25) 30%,rgba(59,130,246,0.15) 55%,transparent 80%)",
          filter: "blur(140px)",
        }}
      />

      {/* WebGL canvas */}
      <div
        ref={webglRef}
        style={{
          position: "absolute", left: RX, top: RY,
          width: RENDER_W, height: RENDER_H,
          pointerEvents: "none", zIndex: 2,
        }}
      />

      {/* Drag capture */}
      <div
        style={{ position: "absolute", inset: 0, zIndex: 3, cursor: dragging ? "grabbing" : "grab" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      />

      {/* Loading skeleton */}
      {!loaded && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 10, borderRadius: "52px",
          background: "linear-gradient(148deg,#262640 0%,#18182e 45%,#0e0e1c 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          pointerEvents: "none",
        }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.08)",
            borderTop: "2px solid rgba(99,102,241,0.75)",
            animation: "phoneSpin 0.8s linear infinite",
          }} />
          <style>{`@keyframes phoneSpin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}
    </div>
  );
}