"use client";

import gsap from "gsap";
import { Icon } from "@iconify/react";
import { useMotionContext } from "@/app/contexts/MotionContext";
import { useState, useEffect } from "react";
import { STYLE_CFG, NRX, NRY } from "@/lib/animation-core";
import type { ScriptFn, EditorPanelProps, MotionTemplate, MotionStyle, AnimMode } from "@/types/motion.types";

// ─── Internal variant type ────────────────────────────────────────────────────
interface CameraVariant {
  id: string;
  label: string;
  description: string;
  icon: string;
  /** Suggested default animMode for this variant */
  defaultAnimMode: AnimMode;
  /** Duration in ms for the entry animation */
  entryDuration: number;
  /** Duration in ms for the exit animation */
  exitDuration: number;
  /** Entry: dramatic pose → REST (NRX/NRY). Must end at REST. */
  entryScript: ScriptFn;
  /** Exit: REST (NRX/NRY) → dramatic pose. */
  exitScript: ScriptFn;
  /** Kept for backwards compat with one-shot preview */
  script: ScriptFn;
}
// POSE DE REPOSO COMPARTIDA — todos terminan aquí (ligeramente más girado que showcase)
// showcase usa: { rx: NRX + 15*a, ry: -35*a, tx: 30*a, ty: -10*a, sc: 0.92 }
// todos los demás usan: { rx: NRX + 15*a, ry: -42*a, tx: 33*a, ty: -10*a, sc: 0.92 }

// ─── LOOPS SCRIPTS ────────────────────────────────────────────────────────────

const sweepScript: ScriptFn = (av, intensity, durMs, style, onUpdate) => {
  const c = durMs / 1000;
  const { amp, e1, e2, e3 } = STYLE_CFG[style];
  const a = intensity * amp;
  return gsap.timeline()
    .set(av, { rx: NRX - 38 * a, ry: -50 * a, tx: 30 * a, ty: 4 * a, sc: 1.00 })
    .to(av,  { rx: NRX + 18 * a, ry: -58 * a, tx: 36 * a, ty: -14 * a, sc: 0.95, duration: c * 0.12, ease: "sine.inOut", onUpdate })
    .to(av,  { rx: NRX,          ry: NRY,      tx: 0,       ty: 0,       sc: 1.04, duration: c * 0.22, ease: e2, onUpdate })
    .to(av,  { rx: NRX + 14 * a, ry: NRY - 50 * a, tx: 36 * a, ty: -18 * a, sc: 0.98, duration: c * 0.20, ease: e3, onUpdate })
    .to(av,  { rx: NRX +  6 * a, ry: NRY + 32 * a, tx: -24 * a, ty: 10 * a, sc: 1.02, duration: c * 0.20, ease: e3, onUpdate })
    .to(av,  { rx: NRX - 38 * a, ry: -50 * a, tx: 30 * a, ty: 4 * a, sc: 1.00, duration: c * 0.26, ease: "power3.in", onUpdate });
};

// 1. HERO REVEAL (Respeta tu pose personalizada: ry: 50*a)
const heroRevealScript: ScriptFn = (av, intensity, durMs, style, onUpdate) => {
  const c = durMs / 1000;
  const { amp, e1, e2 } = STYLE_CFG[style];
  const a = intensity * amp;
  return gsap.timeline()
    .set(av, { rx: NRX - 38 * a, ry: 50 * a, tx: 33 * a, ty: 4 * a, sc: 1.00 })
    .to(av,  { rx: NRX + 18 * a, ry: -58 * a, tx: 36 * a, ty: -14 * a, sc: 0.90, duration: c * 0.10, ease: "sine.inOut", onUpdate })
    .to(av,  { rx: NRX + 10 * a, ry: -28 * a, tx: 14 * a, ty:  6 * a,  sc: 0.94, duration: c * 0.16, ease: "power3.out", onUpdate })
    .to(av,  { rx: NRX,          ry: NRY,      tx: 0,       ty: 0,       sc: 1.00, duration: c * 0.18, ease: e1, onUpdate })
    .to(av,  { rx: NRX -  4 * a, ry: NRY +  8 * a, tx: -3 * a, ty: -5 * a, sc: 1.00, duration: c * 0.18, ease: "sine.inOut", onUpdate })
    .to(av,  { rx: NRX +  6 * a, ry: NRY - 30 * a, tx: 18 * a, ty: -10 * a, sc: 0.97, duration: c * 0.16, ease: e2, onUpdate })
    .to(av,  { rx: NRX - 38 * a, ry: 50 * a, tx: 33 * a, ty: 4 * a, sc: 1.00, duration: c * 0.22, ease: "power3.in", onUpdate });
};

// 2. ORBIT (Ajustado para no achicarse tanto)
const orbitScript: ScriptFn = (av, intensity, durMs, style, onUpdate) => {
  const c = durMs / 1000;
  const { amp, e1, e2 } = STYLE_CFG[style];
  const a = intensity * amp;
  return gsap.timeline()
    .set(av, { rx: NRX - 38 * a, ry: -50 * a, tx: 30 * a, ty: 4 * a, sc: 1.00 })
    .to(av,  { rx: NRX -  4 * a, ry: NRY + 10 * a, tx: -5 * a, ty: -4 * a, sc: 1.00, duration: c * 0.16, ease: e1, onUpdate })
    .to(av,  { rx: NRX +  8 * a, ry:  62 * a,       tx: -12 * a, ty:  6 * a, sc: 0.95, duration: c * 0.20, ease: e2, onUpdate })
    .to(av,  { rx: NRX + 10 * a, ry:  66 * a,       tx: -14 * a, ty:  8 * a, sc: 0.94, duration: c * 0.08, ease: "sine.inOut", onUpdate })
    .to(av,  { rx: NRX,          ry: NRY,            tx: 0,        ty: 0,      sc: 1.00, duration: c * 0.12, ease: e1, onUpdate })
    .to(av,  { rx: NRX +  8 * a, ry: -62 * a,       tx:  12 * a, ty:  6 * a, sc: 0.95, duration: c * 0.20, ease: e2, onUpdate })
    .to(av,  { rx: NRX + 10 * a, ry: -66 * a,       tx:  14 * a, ty:  8 * a, sc: 0.94, duration: c * 0.08, ease: "sine.inOut", onUpdate })
    .to(av,  { rx: NRX - 38 * a, ry: -50 * a, tx: 30 * a, ty: 4 * a, sc: 1.00, duration: c * 0.16, ease: "expo.out", onUpdate });
};

// 3. SHOWCASE
const showcaseScript: ScriptFn = (av, intensity, durMs, style, onUpdate) => {
  const c = durMs / 1000;
  const { amp, e1, e2 } = STYLE_CFG[style];
  const a = intensity * amp;
  return gsap.timeline()
    .set(av, { rx: NRX - 38 * a, ry: -50 * a, tx: 30 * a, ty: 4 * a, sc: 1.00 })
    .to(av, { rx: NRX + 18 * a, ry: -55 * a, tx: 35 * a, ty: -14 * a, sc: 0.90, duration: c * 0.12, ease: "sine.inOut", onUpdate })
    .to(av, { rx: NRX,          ry: 0,         tx: 0,       ty: 0,       sc: 1.08, duration: c * 0.22, ease: e2, onUpdate })
    .to(av, { rx: NRX -  6 * a, ry:  6 * a,   tx: -4 * a, ty: -8 * a,  sc: 1.00, duration: c * 0.18, ease: "expo.out", onUpdate })
    .to(av, { rx: NRX -  4 * a, ry: 10 * a,   tx: -6 * a, ty: -4 * a,  sc: 1.00, duration: c * 0.15, ease: "sine.inOut", onUpdate })
    .to(av, { rx: NRX - 20 * a, ry: 58 * a,   tx: -38 * a, ty: 12 * a, sc: 0.88, duration: c * 0.18, ease: e1, onUpdate })
    .to(av, { rx: NRX - 22 * a, ry: 62 * a,   tx: -40 * a, ty: 14 * a, sc: 0.87, duration: c * 0.08, ease: "sine.inOut", onUpdate })
    .to(av, { rx: NRX - 38 * a, ry: -50 * a, tx: 30 * a, ty: 4 * a, sc: 1.00, duration: c * 0.07, ease: "power3.inOut", onUpdate });
};

// 4. STAGE ENTRY (Corregido zoom-out excesivo al entrar/rebotar)
const stageEntryScript: ScriptFn = (av, intensity, durMs, style, onUpdate) => {
  const c = durMs / 1000;
  const { amp } = STYLE_CFG[style];
  const a = intensity * amp;
  return gsap.timeline()
    .set(av, { rx: NRX - 38 * a, ry: -50 * a, tx: 30 * a, ty: 4 * a, sc: 1.00 })
    .to(av,  { rx: NRX + 18 * a, ry: -58 * a, tx: 36 * a, ty: -14 * a, sc: 0.90, duration: c * 0.08, ease: "sine.inOut", onUpdate })
    .to(av,  { rx: NRX +  6 * a, ry: NRY - 18 * a, tx: 0, ty: 50 * a, sc: 0.90, duration: c * 0.10, ease: "power2.in", onUpdate })
    .to(av,  { rx: NRX +  3 * a, ry: NRY -  6 * a, tx: 0, ty: 16 * a, sc: 0.95, duration: c * 0.20, ease: "expo.out", onUpdate })
    .to(av,  { rx: NRX,          ry: NRY,            tx: 0, ty: -8 * a, sc: 1.05, duration: c * 0.12, ease: "back.out(1.8)", onUpdate })
    .to(av,  { rx: NRX,          ry: NRY,            tx: 0, ty: 0,      sc: 1.00, duration: c * 0.08, ease: "power2.out", onUpdate })
    .to(av,  { rx: NRX -  5 * a, ry: NRY - 16 * a, tx: 8 * a, ty: -5 * a, sc: 1.00, duration: c * 0.18, ease: "sine.inOut", onUpdate })
    .to(av,  { rx: NRX +  4 * a, ry: NRY + 12 * a, tx: -6 * a, ty:  4 * a, sc: 1.00, duration: c * 0.14, ease: "sine.inOut", onUpdate })
    .to(av,  { rx: NRX - 38 * a, ry: -50 * a, tx: 30 * a, ty: 4 * a, sc: 1.00, duration: c * 0.10, ease: "power4.in", onUpdate });
};

// 5. TILT SHIFT
const tiltShiftScript: ScriptFn = (av, intensity, durMs, style, onUpdate) => {
  const c = durMs / 1000;
  const { amp, e1, e3 } = STYLE_CFG[style];
  const a = intensity * amp;
  return gsap.timeline()
    .set(av, { rx: NRX - 38 * a, ry: -50 * a, tx: 30 * a, ty: 4 * a, sc: 1.00 })
    .to(av,  { rx: NRX + 20 * a, ry: -66 * a, tx: 40 * a, ty: -14 * a, sc: 0.93, duration: c * 0.16, ease: e3, onUpdate })
    .to(av,  { rx: NRX,          ry: 0,        tx: 0,       ty: 0,       sc: 1.06, duration: c * 0.18, ease: e1, onUpdate })
    .to(av,  { rx: NRX -  3 * a, ry: 5 * a,   tx: 0,       ty: -4 * a,  sc: 1.00, duration: c * 0.10, ease: "expo.out", onUpdate })
    .to(av,  { rx: NRX - 18 * a, ry: 62 * a,  tx: -36 * a, ty: 10 * a,  sc: 0.91, duration: c * 0.20, ease: e3, onUpdate })
    .to(av,  { rx: NRX - 20 * a, ry: 66 * a,  tx: -38 * a, ty: 12 * a,  sc: 0.91, duration: c * 0.08, ease: "sine.inOut", onUpdate })
    .to(av,  { rx: NRX,          ry: NRY,      tx: 0,       ty: 0,       sc: 1.00, duration: c * 0.12, ease: e1, onUpdate })
    .to(av,  { rx: NRX - 38 * a, ry: -50 * a, tx: 30 * a, ty: 4 * a, sc: 1.00, duration: c * 0.16, ease: "power2.in", onUpdate });
};

// 6. GRAVITY DROP (Minimizado el salto hacia atrás)
const gravityDropScript: ScriptFn = (av, intensity, durMs, style, onUpdate) => {
  const c = durMs / 1000;
  const { amp } = STYLE_CFG[style];
  const a = intensity * amp;
  return gsap.timeline()
    .set(av, { rx: NRX - 38 * a, ry: -50 * a, tx: 30 * a, ty: 4 * a, sc: 1.00 })
    .to(av,  { rx: NRX -  4 * a, ry: NRY - 20 * a, tx: 0, ty: -100 * a, sc: 0.88, duration: c * 0.08, ease: "power2.in", onUpdate })
    .to(av,  { rx: NRX +  4 * a, ry: NRY,           tx: 0, ty:   16 * a, sc: 1.05, duration: c * 0.20, ease: "power3.in", onUpdate })
    .to(av,  { rx: NRX,          ry: NRY,            tx: 0, ty:  -14 * a, sc: 1.00, duration: c * 0.10, ease: "power2.out", onUpdate })
    .to(av,  { rx: NRX +  2 * a, ry: NRY,            tx: 0, ty:    4 * a, sc: 1.00, duration: c * 0.06, ease: "power2.in", onUpdate })
    .to(av,  { rx: NRX,          ry: NRY,            tx: 0, ty:   -2 * a, sc: 1.00, duration: c * 0.04, ease: "power2.out", onUpdate })
    .to(av,  { rx: NRX,          ry: NRY,            tx: 0, ty: 0,        sc: 1.00, duration: c * 0.06, ease: "power2.inOut", onUpdate })
    .to(av,  { rx: NRX -  5 * a, ry: NRY - 16 * a, tx: 10 * a, ty: -6 * a, sc: 1.00, duration: c * 0.20, ease: "sine.inOut", onUpdate })
    .to(av,  { rx: NRX +  4 * a, ry: NRY + 12 * a, tx: -7 * a, ty:  5 * a, sc: 1.00, duration: c * 0.16, ease: "sine.inOut", onUpdate })
    .to(av,  { rx: NRX - 38 * a, ry: -50 * a, tx: 30 * a, ty: 4 * a, sc: 1.00, duration: c * 0.10, ease: "power4.in", onUpdate });
};

// 7. SIGNATURE (Respeta tu pose personalizada: ry: -45*a)
const signatureScript: ScriptFn = (av, intensity, durMs, style, onUpdate) => {
  const c = durMs / 1000;
  const { amp, e1, e2 } = STYLE_CFG[style];
  const a = intensity * amp;
  return gsap.timeline()
    .set(av, { rx: NRX - 38 * a, ry: -45 * a, tx: 12 * a, ty: 4 * a, sc: 1.00 })
    .to(av,  { rx: NRX -  4 * a, ry: NRY - 10 * a, tx:  5 * a, ty: -5 * a, sc: 1.00, duration: c * 0.16, ease: e1, onUpdate })
    .to(av,  { rx: NRX -  4 * a, ry: NRY - 12 * a, tx:  6 * a, ty: -5 * a, sc: 1.00, duration: c * 0.16, ease: "sine.inOut", onUpdate })
    .to(av,  { rx: NRX +  4 * a, ry: NRY + 10 * a, tx: -5 * a, ty:  4 * a, sc: 1.00, duration: c * 0.16, ease: "sine.inOut", onUpdate })
    .to(av,  { rx: NRX + 10 * a, ry:  58 * a,       tx: -14 * a, ty:  6 * a, sc: 0.88, duration: c * 0.16, ease: e2, onUpdate })
    .to(av,  { rx: NRX + 12 * a, ry:  62 * a,       tx: -16 * a, ty:  8 * a, sc: 0.87, duration: c * 0.10, ease: "sine.inOut", onUpdate })
    .to(av,  { rx: NRX +  4 * a, ry:  18 * a,       tx: -4 * a,  ty:  2 * a, sc: 0.96, duration: c * 0.12, ease: e1, onUpdate })
    .to(av,  { rx: NRX - 38 * a, ry: -45 * a, tx: 12 * a, ty: 4 * a, sc: 1.00, duration: c * 0.14, ease: "expo.out", onUpdate });
};

// 8. CINEMATIC IN (Corregido achicamiento masivo sc:0.78 -> 0.92)
const cinematicInScript: ScriptFn = (av, intensity, durMs, _style, onUpdate) => {
  const c = Math.min(durMs / 1000, 4.0);
  const a = intensity;
  return gsap.timeline()
    .set(av, { rx: NRX - 38 * a, ry: -50 * a, tx: 30 * a, ty: 4 * a, sc: 1.00 })
    .to(av,  { rx: NRX +  8 * a, ry: -28 * a, tx: -18 * a, ty: -20 * a, sc: 0.92, duration: c * 0.40, ease: "power4.out", onUpdate })
    .to(av,  { rx: NRX +  2 * a, ry:   0,     tx: 0,        ty: 0,       sc: 1.06, duration: c * 0.30, ease: "expo.out", onUpdate })
    .to(av,  { rx: NRX,          ry: NRY,      tx: 0,        ty: -3 * a,  sc: 1.00, duration: c * 0.18, ease: "back.out(1.3)", onUpdate })
    .to(av,  { rx: NRX - 38 * a, ry: -50 * a, tx: 30 * a, ty: 4 * a, sc: 1.00, duration: c * 0.12, ease: "sine.inOut", onUpdate });
};

// 9. CINEMATIC OUT (Corregido achicamiento masivo sc:0.58 -> 0.85)
const cinematicOutScript: ScriptFn = (av, intensity, durMs, _style, onUpdate) => {
  const c = Math.min(durMs / 1000, 3.5);
  const a = intensity;
  return gsap.timeline()
    .set(av, { rx: NRX - 38 * a, ry: -50 * a, tx: 30 * a, ty: 4 * a, sc: 1.00 })
    .to(av,  { rx: NRX,          ry: NRY,      tx: 0,       ty: 0,       sc: 1.00, duration: c * 0.18, ease: "power2.out", onUpdate })
    .to(av,  { rx: NRX -  3 * a, ry: NRY -  6 * a, tx: 3 * a, ty: -4 * a, sc: 1.02, duration: c * 0.14, ease: "sine.inOut", onUpdate })
    .to(av,  { rx: NRX + 14 * a, ry:    -52 * a,   tx: -26 * a, ty: -72 * a, sc: 0.85, duration: c * 0.68, ease: "power3.in", onUpdate });
};

// ─── ENTRY / EXIT scripts ─────────────────────────────────────────────────────

const heroRevealEntry: ScriptFn = (av, intensity, durMs, style, onUpdate) => {
  const c = durMs / 1000, { amp, e1 } = STYLE_CFG[style], a = intensity * amp;
  return gsap.timeline()
    .set(av, { rx: NRX - 38 * a, ry: -58 * a, tx: 36 * a, ty: 12 * a, sc: 1.00 })
    .to(av,  { rx: NRX - 35 * a, ry: -28 * a, tx: 14 * a, ty:  6 * a, sc: 1.00, duration: c * 0.35, ease: "power3.out", onUpdate })
    .to(av,  { rx: NRX,          ry: NRY,     tx: 0,       ty:  0,      sc: 1.00, duration: c * 0.35, ease: e1, onUpdate })
    .to(av,  { rx: NRX - 38 * a, ry:  50 * a, tx: 33 * a,  ty:  4 * a,  sc: 1.00, duration: c * 0.30, ease: "sine.out", onUpdate });
};

const heroRevealExit: ScriptFn = (av, intensity, durMs, _style, onUpdate) => {
  const c = durMs / 1000, { amp, e2 } = STYLE_CFG[_style], a = intensity * amp;
  return gsap.timeline()
    .set(av, { rx: NRX - 38 * a, ry:  50 * a, tx: 33 * a, ty:  4 * a, sc: 1.00 })
    .to(av,  { rx: NRX - 30 * a, ry: -30 * a, tx: 18 * a, ty: -10 * a, sc: 1.00, duration: c * 0.45, ease: e2, onUpdate })
    .to(av,  { rx: NRX - 38 * a, ry: -58 * a, tx: 36 * a, ty: 12 * a, sc: 1.00, duration: c * 0.55, ease: "power3.in", onUpdate });
};
const orbitEntry: ScriptFn = (av, intensity, durMs, _style, onUpdate) => {
  const c = durMs / 1000, { amp } = STYLE_CFG[_style], a = intensity * amp;
  return gsap.timeline()
    .set(av, { rx: NRX - 30 * a, ry: -64 * a, tx: 14 * a, ty:  6 * a, sc: 1.00 }) 
    .to(av,  { rx: NRX - 30 * a, ry: -28 * a, tx:  6 * a, ty: -4 * a, sc: 1.00, duration: c * 0.50, ease: "power2.out", onUpdate })
    .to(av,  { rx: NRX,          ry:  -35 * a, tx: 30 * a, ty:  4 * a, sc: 1.00, duration: c * 0.50, ease: "expo.out", onUpdate });
};

const orbitExit: ScriptFn = (av, intensity, durMs, style, onUpdate) => {
  const c = durMs / 1000, { amp } = STYLE_CFG[style], a = intensity * amp;
  return gsap.timeline()
    .set(av, { rx: NRX,          ry:  -35 * a, tx: 30 * a, ty:  4 * a, sc: 1.00 }) 
    .to(av,  { rx: NRX - 30 * a, ry: -40 * a,  tx: -12 * a, ty:  5 * a, sc: 1.00, duration: c * 0.50, ease: "power2.in", onUpdate }) 
    .to(av,  { rx: NRX - 30 * a, ry:  40 * a,  tx: -18 * a, ty:  9 * a, sc: 0.95, duration: c * 0.50, ease: "power4.in", onUpdate });
};


const showcaseEntry: ScriptFn = (av, intensity, durMs, style, onUpdate) => {
  const c = durMs / 1000, { amp, e2 } = STYLE_CFG[style], a = intensity * amp;
  return gsap.timeline()
    .set(av, { rx: NRX - 55 * a, ry: -55 * a, tx: 35 * a, ty: 12 * a, sc: 1.00 })
    .to(av,  { rx: NRX,          ry: 0,        tx: 0,       ty: 0,       sc: 1.00, duration: c * 0.55, ease: e2, onUpdate })
    .to(av,  { rx: NRX - 38 * a, ry: -50 * a,  tx: 30 * a,  ty: 4 * a,   sc: 1.00, duration: c * 0.45, ease: "expo.out", onUpdate });
};

const showcaseExit: ScriptFn = (av, intensity, durMs, style, onUpdate) => {
  const c = durMs / 1000, { amp, e1 } = STYLE_CFG[style], a = intensity * amp;
  return gsap.timeline()
    .set(av, { rx: NRX - 38 * a, ry: -50 * a, tx: 30 * a, ty: 4 * a, sc: 1.00 })
    .to(av,  { rx: NRX - 30 * a, ry: -20 * a, tx: -36 * a, ty: 6 * a, sc: 1.00, duration: c * 0.55, ease: e1, onUpdate })
    .to(av,  { rx: NRX - 20 * a, ry: 40 * a,  tx: -44 * a, ty: 15 * a, sc: 0.95, duration: c * 0.45, ease: "power4.in", onUpdate });
};
const stageEntryEntry: ScriptFn = (av, intensity, durMs, _style, onUpdate) => {
  const c = durMs / 1000, { amp } = STYLE_CFG[_style], a = intensity * amp;
  return gsap.timeline()
    .set(av, { rx: NRX - 55 * a, ry: -55 * a, tx: 35 * a, ty: 12 * a, sc: 1.00 })
    .to(av,  { rx: NRX,          ry: 0,        tx: 0,       ty: 0,       sc: 1.00, duration: c * 0.55, ease: "power2.out", onUpdate })
    .to(av,  { rx: NRX - 38 * a, ry: -50 * a,  tx: 30 * a,  ty: 4 * a,   sc: 1.00, duration: c * 0.45, ease: "expo.out", onUpdate });
};

const stageEntryExit: ScriptFn = (av, intensity, durMs, style, onUpdate) => {
  const c = durMs / 1000, { amp } = STYLE_CFG[style], a = intensity * amp;
  return gsap.timeline()
    .set(av, { rx: NRX - 38 * a, ry: -50 * a, tx: 30 * a, ty: 4 * a, sc: 1.00 })
    .to(av,  { rx: NRX - 30 * a, ry: -20 * a, tx: -36 * a, ty: 6 * a, sc: 1.00, duration: c * 0.55, ease: "power3.in", onUpdate })
    .to(av,  { rx: NRX - 20 * a, ry: 40 * a,  tx: -44 * a, ty: 15 * a, sc: 0.95, duration: c * 0.45, ease: "power4.in", onUpdate });
};

const tiltShiftEntry: ScriptFn = (av, intensity, durMs, style, onUpdate) => {
  const c = durMs / 1000;
  const { amp, e1 } = STYLE_CFG[style];
  const a = intensity * amp;
  return gsap.timeline()
    .set(av, { rx: NRX + 20 * a, ry: -66 * a, tx: 40 * a, ty: -14 * a, sc: 0.93 })
    .to(av,  { rx: NRX,          ry: 0,        tx: 0,       ty: 0,       sc: 1.06, duration: c * 0.55, ease: e1, onUpdate })
    .to(av,  { rx: NRX - 38 * a, ry: -50 * a, tx: 30 * a, ty: 4 * a, sc: 1.00, duration: c * 0.45, ease: "expo.out", onUpdate });
};

const tiltShiftExit: ScriptFn = (av, intensity, durMs, style, onUpdate) => {
  const c = durMs / 1000;
  const { amp, e3 } = STYLE_CFG[style];
  const a = intensity * amp;
  return gsap.timeline()
    .set(av, { rx: NRX - 38 * a, ry: -50 * a, tx: 30 * a, ty: 4 * a, sc: 1.00 })
    .to(av,  { rx: NRX - 18 * a, ry: 62 * a, tx: -36 * a, ty: 10 * a,  sc: 0.91, duration: c * 0.55, ease: e3, onUpdate })
    .to(av,  { rx: NRX - 20 * a, ry: 76 * a, tx: -46 * a, ty: 14 * a,  sc: 0.88, duration: c * 0.45, ease: "power4.in", onUpdate });
};

const gravityDropEntry: ScriptFn = (av, intensity, durMs, _style, onUpdate) => {
  const c = durMs / 1000, { amp } = STYLE_CFG[_style], a = intensity * amp;
  return gsap.timeline()
    .set(av, { rx: NRX - 45 * a, ry: NRY - 20 * a, tx: 0, ty: -100 * a, sc: 1.00 }) 
    .to(av,  { rx: NRX - 30 * a, ry: NRY,          tx: 0, ty:   16 * a, sc: 1.00, duration: c * 0.45, ease: "power3.in", onUpdate }) 
    .to(av,  { rx: NRX - 38 * a, ry: -50 * a, tx: 30 * a, ty:  -35 * a, sc: 1.00, duration: c * 0.55, ease: "expo.out", onUpdate });
};

const gravityDropExit: ScriptFn = (av, intensity, durMs, style, onUpdate) => {
  const c = durMs / 1000, { amp } = STYLE_CFG[style], a = intensity * amp;
  return gsap.timeline()
    .set(av, { rx: NRX - 38 * a, ry: -50 * a, tx: 30 * a, ty:  -35 * a, sc: 1.00 })
    .to(av,  { rx: NRX - 30 * a, ry: NRY - 12 * a, tx: 0, ty: -36 * a,  sc: 0.92, duration: c * 0.40, ease: "power2.in", onUpdate })
    .to(av,  { rx: NRX - 45 * a, ry: NRY - 20 * a, tx: 0, ty: -100 * a, sc: 0.85, duration: c * 0.60, ease: "power4.in", onUpdate });
};

const signatureEntry: ScriptFn = (av, intensity, durMs, style, onUpdate) => {
  const c = durMs / 1000, { amp, e1 } = STYLE_CFG[style], a = intensity * amp;
  return gsap.timeline()
    .set(av, { rx: NRX - 55 * a, ry: -60 * a, tx: 16 * a, ty: 12 * a, sc: 1.00 })
    .to(av,  { rx: NRX - 40 * a, ry: -35 * a, tx:  8 * a, ty:  6 * a, sc: 1.00, duration: c * 0.45, ease: "power2.out", onUpdate })
    .to(av,  { rx: NRX,          ry: NRY,     tx:  0,       ty:  0,       sc: 1.00, duration: c * 0.35, ease: "back.out(1.2)", onUpdate })
    .to(av,  { rx: NRX - 38 * a, ry: -45 * a, tx: 12 * a, ty:  4 * a, sc: 1.00, duration: c * 0.20, ease: "power3.out", onUpdate });
};

const signatureExit: ScriptFn = (av, intensity, durMs, style, onUpdate) => {
  const c = durMs / 1000, { amp, e2 } = STYLE_CFG[style], a = intensity * amp;
  return gsap.timeline()
    .set(av, { rx: NRX - 38 * a, ry: -45 * a, tx: 12 * a, ty:  4 * a, sc: 1.00 })
    .to(av,  { rx: NRX - 30 * a, ry: -20 * a, tx: -14 * a, ty:  6 * a, sc: 1.00, duration: c * 0.50, ease: e2, onUpdate })
    .to(av,  { rx: NRX - 20 * a, ry: 40 * a,  tx: -30 * a, ty: 15 * a, sc: 0.95, duration: c * 0.50, ease: "power4.in", onUpdate });
};
const cinematicInEntry: ScriptFn = (av, intensity, durMs, _style, onUpdate) => {
  const c = Math.min(durMs / 1000, 4.0), a = intensity;
  return gsap.timeline()
    .set(av, { rx: NRX - 55 * a, ry: -55 * a, tx: 35 * a, ty: 12 * a, sc: 1.00 }) 
    .to(av,  { rx: NRX - 35 * a, ry: -28 * a, tx: 14 * a, ty:  6 * a, sc: 1.00, duration: c * 0.40, ease: "power4.out", onUpdate }) 
    .to(av,  { rx: NRX - 38 * a, ry: 0,        tx: 0,       ty:  0,     sc: 1.06, duration: c * 0.30, ease: "expo.out", onUpdate }) 
    .to(av,  { rx: NRX - 38 * a, ry: NRY,      tx: 0,       ty: -3 * a, sc: 1.00, duration: c * 0.18, ease: "back.out(1.3)", onUpdate })
    .to(av,  { rx: NRX - 38 * a, ry: -50 * a,  tx: 30 * a,  ty:  4 * a, sc: 1.00, duration: c * 0.12, ease: "sine.inOut", onUpdate }); 
};

const cinematicOutExit: ScriptFn = (av, intensity, durMs, _style, onUpdate) => {
  const c = Math.min(durMs / 1000, 3.5), a = intensity;
  return gsap.timeline()
    .set(av, { rx: NRX - 38 * a, ry: -50 * a, tx: 30 * a, ty: 4 * a, sc: 1.00 }) 
    .to(av,  { rx: NRX - 35 * a, ry: NRY - 6 * a, tx: 3 * a, ty: -4 * a, sc: 1.02, duration: c * 0.18, ease: "sine.inOut", onUpdate }) 
    .to(av,  { rx: NRX - 20 * a, ry: 40 * a,  tx: -44 * a, ty: 15 * a, sc: 0.95, duration: c * 0.82, ease: "power3.in", onUpdate }); 
};

// ─── Variant registry ─────────────────────────────────────────────────────────

export const DEFAULT_VARIANT_ID = "heroReveal";

export const CAMERA_VARIANTS: CameraVariant[] = [
  {
    id: "heroReveal", label: "Hero Reveal", description: "Entrada lateral, pausa al frente, loop suave",
    icon: "ph:sparkle-bold", defaultAnimMode: "entry+exit",
    entryDuration: 2800, exitDuration: 1800,
    entryScript: heroRevealEntry, exitScript: heroRevealExit, script: heroRevealScript,
  },
  {
    id: "orbit", label: "Orbit", description: "Gira de cara a cara por ambos laterales",
    icon: "ph:arrows-clockwise-bold", defaultAnimMode: "entry+exit",
    entryDuration: 2400, exitDuration: 1600,
    entryScript: orbitEntry, exitScript: orbitExit, script: orbitScript,
  },
  {
    id: "showcase", label: "Showcase", description: "Dos poses con giro entre ellas — look Stripe",
    icon: "ph:intersect-bold", defaultAnimMode: "entry+exit",
    entryDuration: 2200, exitDuration: 1800,
    entryScript: showcaseEntry, exitScript: showcaseExit, script: showcaseScript,
  },
  {
    id: "stageEntry", label: "Stage Entry", description: "Aparece desde abajo con bounce, de cara siempre",
    icon: "ph:rocket-launch-bold", defaultAnimMode: "entry",
    entryDuration: 2500, exitDuration: 1500,
    entryScript: stageEntryEntry, exitScript: stageEntryExit, script: stageEntryScript,
  },
  {
    id: "tiltShift", label: "Tilt Shift", description: "Inclinaciones profundas — muestra los laterales",
    icon: "ph:arrows-left-right-bold", defaultAnimMode: "entry+exit",
    entryDuration: 2000, exitDuration: 1600,
    entryScript: tiltShiftEntry, exitScript: tiltShiftExit, script: tiltShiftScript,
  },
  {
    id: "gravityDrop", label: "Gravity Drop", description: "Caída física con rebote natural",
    icon: "ph:arrow-fat-down-bold", defaultAnimMode: "entry",
    entryDuration: 2200, exitDuration: 1400,
    entryScript: gravityDropEntry, exitScript: gravityDropExit, script: gravityDropScript,
  },
  {
    id: "signature", label: "Signature", description: "Drift suave + lateral lento, look brand",
    icon: "ph:seal-bold", defaultAnimMode: "entry+exit",
    entryDuration: 3200, exitDuration: 2200,
    entryScript: signatureEntry, exitScript: signatureExit, script: signatureScript,
  },
  {
    id: "cinematicIn", label: "Cinematic In", description: "Entrada cinematográfica desde arriba lateral",
    icon: "ph:film-slate-bold", defaultAnimMode: "entry",
    entryDuration: 3500, exitDuration: 1800,
    entryScript: cinematicInEntry, exitScript: cinematicOutExit, script: cinematicInScript,
  },
  {
    id: "cinematicOut", label: "Cinematic Out", description: "Pausa al frente y sale hacia arriba lateral",
    icon: "ph:arrow-fat-line-right-bold", defaultAnimMode: "exit",
    entryDuration: 2500, exitDuration: 2800,
    entryScript: cinematicInEntry, exitScript: cinematicOutExit, script: cinematicOutScript,
  },
];

// ─── Resolve the active script from a variant ID ──────────────────────────────
export function resolvePhoneScript(variantId: string): ScriptFn {
  return CAMERA_VARIANTS.find((v) => v.id === variantId)?.script ?? sweepScript;
}

// The exported ScriptFn used by Phone3DViewer — reads variant from context
// via a closure: the context value is passed in at call-site in PhoneTemplate.
export const phoneScript: ScriptFn = (av, intensity, durMs, style, onUpdate) => {
  // Default — Phone3DViewer calls this; the variant-aware version is built below.
  return sweepScript(av, intensity, durMs, style, onUpdate);
};

// ─── Easing picker ────────────────────────────────────────────────────────────
const EASING_OPTIONS: { id: MotionStyle; label: string; path: string }[] = [
  { id: "smooth",    label: "Suave",  path: "M 0 48 C 16 44 32 4 48 0" },
  { id: "normal",    label: "Normal", path: "M 0 48 C 12 36 36 12 48 0" },
  { id: "cinematic", label: "Cine",   path: "M 0 48 C 2 46 6 2 48 0" },
];

function EasingPicker() {
  const { motionStyle, setMotionStyle } = useMotionContext();
  return (
    <div className="flex gap-1.5">
      {EASING_OPTIONS.map((opt) => {
        const active = motionStyle === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => setMotionStyle(opt.id)}
            className={`flex flex-col items-center gap-0 p-0 rounded-lg transition-colors flex-1 ${
              active ? "ring-1 ring-blue-500/60" : "hover:bg-white/[0.04]"
            }`}
          >
            <svg
              viewBox="0 -12 48 72"
              className={`w-full aspect-square rounded-t-lg ${active ? "bg-blue-500/10" : "bg-white/[0.04]"}`}
            >
              <line x1="0" y1="48" x2="48" y2="0" stroke="currentColor" opacity="0.08" strokeWidth="1" />
              <path
                d={opt.path} fill="none"
                stroke={active ? "#60a5fa" : "currentColor"}
                strokeWidth="2" strokeLinecap="round"
                opacity={active ? 1 : 0.35}
              />
            </svg>
            <span className={`text-[9px] font-medium truncate w-full text-center py-1 ${active ? "text-blue-300" : "text-white/30"}`}>
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Camera variant picker ────────────────────────────────────────────────────
function VariantPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {CAMERA_VARIANTS.map((v) => {
        const active = value === v.id;
        return (
          <button
            key={v.id}
            type="button"
            title={v.description}
            onClick={() => onChange(v.id)}
            className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border transition-all duration-150 text-left ${
              active
                ? "border-blue-500/60 bg-blue-500/10 text-blue-300"
                : "border-white/[0.08] text-white/35 hover:border-white/20 hover:text-white/60 bg-white/[0.02]"
            }`}
          >
            <Icon icon={v.icon} width="13" className="shrink-0" />
            <span className="text-[10px] font-medium truncate">{v.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────
function SectionHeader({ label }: { label: string }) {
  return (
    <div className="text-[9px] uppercase tracking-[0.2em] text-white/25 font-bold px-0.5">
      {label}
    </div>
  );
}

function SliderRow({
  icon, label, value, min, max, step = 1, suffix = "", onChange,
}: {
  icon: string; label: string; value: number;
  min: number; max: number; step?: number; suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 w-20 shrink-0">
        <Icon icon={icon} width="13" className="text-white/30 shrink-0" />
        <span className="text-[10px] text-white/50 truncate">{label}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-1 appearance-none bg-white/10 rounded-full outline-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-white/30"
      />
      <span className="text-[10px] font-mono text-white/40 w-6 text-right shrink-0">
        {value}{suffix}
      </span>
    </div>
  );
}

// ─── Editor panel ─────────────────────────────────────────────────────────────
export function PhoneEditorPanel({ template }: EditorPanelProps) {
  const {
    motionDuration, setMotionDuration,
    motionIntensity, setMotionIntensity,
    motionVariantId, setMotionVariantId,
    motionAnimMode, setMotionAnimMode,
    setMotionImageUrl,
  } = useMotionContext();

  const [imageUrl, setImageUrl]   = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setMotionImageUrl(imageUrl);
  }, [imageUrl]);

  const readImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setImageUrl(e.target?.result as string ?? null);
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">

      {/* Image upload */}
      <div className="space-y-2">
        <SectionHeader label="Imagen en pantalla" />
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault(); setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file?.type.startsWith("image/")) readImageFile(file);
          }}
          className={`relative rounded-xl border-2 border-dashed transition-all duration-200 overflow-hidden ${
            isDragging ? "border-blue-500/60 bg-blue-500/5" : "border-white/[0.1] hover:border-white/20 bg-[#0d0d10]"
          }`}
        >
          {imageUrl ? (
            <div className="relative aspect-video">
              <img src={imageUrl} alt="Source" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <label className="flex items-center gap-1.5 text-[10px] font-medium text-white bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1.5 rounded-lg cursor-pointer transition-colors">
                  <Icon icon="ph:swap-bold" width="11" />
                  Cambiar
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) readImageFile(f); }} />
                </label>
                <button
                  onClick={() => setImageUrl(null)}
                  className="flex items-center gap-1.5 text-[10px] font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Icon icon="ph:trash-bold" width="11" />
                  Quitar
                </button>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-3 py-8 cursor-pointer">
              <div className="size-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Icon icon="ph:image-square-bold" width="16" className="text-white/30" />
              </div>
              <div className="text-center">
                <p className="text-[10px] text-white/50 font-medium">Suelta una imagen o haz clic</p>
                <p className="text-[9px] text-white/20 mt-0.5">PNG, JPG, WebP — máx 10 MB</p>
              </div>
              <input type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) readImageFile(f); }} />
            </label>
          )}
        </div>
        <p className="text-[9px] text-white/20 leading-relaxed">
          Sin imagen se muestra el video del canvas en la pantalla del teléfono.
        </p>
      </div>

      {/* Camera path */}
      <div className="space-y-2.5 border-t border-white/[0.05] pt-3">
        <SectionHeader label="Recorrido de cámara" />
        <VariantPicker
          value={motionVariantId ?? DEFAULT_VARIANT_ID}
          onChange={setMotionVariantId}
        />
        <p className="text-[9px] text-white/20 leading-relaxed pt-0.5">
          {CAMERA_VARIANTS.find((v) => v.id === (motionVariantId ?? DEFAULT_VARIANT_ID))?.description ?? ""}
        </p>
      </div>

      {/* Animation mode */}
      <div className="space-y-2 border-t border-white/[0.05] pt-3">
        <SectionHeader label="Animación" />
        <div className="grid grid-cols-4 gap-1">
          {(["entry", "exit", "entry+exit", "none"] as AnimMode[]).map((m) => {
            const labels: Record<AnimMode, string> = { "entry": "Entrada", "exit": "Salida", "entry+exit": "Ambas", "none": "Ninguna" };
            const icons: Record<AnimMode, string> = { "entry": "ph:arrow-line-down-bold", "exit": "ph:arrow-line-up-bold", "entry+exit": "ph:arrows-vertical-bold", "none": "ph:minus-bold" };
            const active = motionAnimMode === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMotionAnimMode(m)}
                title={labels[m]}
                className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border transition-all duration-150 ${
                  active
                    ? "border-blue-500/60 bg-blue-500/10 text-blue-300"
                    : "border-white/[0.08] text-white/35 hover:border-white/20 hover:text-white/60 bg-white/[0.02]"
                }`}
              >
                <Icon icon={icons[m]} width="13" className="shrink-0" />
                <span className="text-[9px] font-medium truncate w-full text-center leading-tight">{labels[m]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Motion controls */}
      <div className="space-y-3 border-t border-white/[0.05] pt-3">
        <SectionHeader label="Movimiento" />
        <SliderRow
          icon="ph:waves-bold" label="Intensidad"
          value={motionIntensity} min={0} max={100} suffix="%"
          onChange={setMotionIntensity}
        />
        <SliderRow
          icon="ph:timer-bold" label="Duración"
          value={motionDuration / 1000} min={1} max={16} step={0.5} suffix="s"
          onChange={(v) => setMotionDuration(v * 1000)}
        />
      </div>

      {/* Easing style */}
      <div className="space-y-2 border-t border-white/[0.05] pt-3">
        <SectionHeader label="Estilo de curva" />
        <EasingPicker />
      </div>

    </div>
  );
}

// ─── Template definition ──────────────────────────────────────────────────────
export const phoneTemplate: MotionTemplate = {
  id:              "phone",
  title:           "Phone",
  description:     "Recorridos cinemáticos de cámara en 3D",
  accentColor:     "#22d3ee",
  icon:            "ph:film-strip-bold",
  tags:            ["UI", "Editor"],
  defaultDuration: 4000,
  showPhone:       true,
  script:          phoneScript,
  EditorPanel:     PhoneEditorPanel,
};