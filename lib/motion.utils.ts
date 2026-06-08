import { ScriptFn, CameraVariant, MotionStyle } from "@/types/motion.types";
import { STYLE_CFG, NRX, NRY } from "./animation-core";
import gsap from "gsap";

export const sweepScript: ScriptFn = (av, intensity, durMs, style, onUpdate) => {
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
export const heroRevealScript: ScriptFn = (av, intensity, durMs, style, onUpdate) => {
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
export const orbitScript: ScriptFn = (av, intensity, durMs, style, onUpdate) => {
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
export const showcaseScript: ScriptFn = (av, intensity, durMs, style, onUpdate) => {
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
export const stageEntryScript: ScriptFn = (av, intensity, durMs, style, onUpdate) => {
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
export const tiltShiftScript: ScriptFn = (av, intensity, durMs, style, onUpdate) => {
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
export const gravityDropScript: ScriptFn = (av, intensity, durMs, style, onUpdate) => {
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
export const signatureScript: ScriptFn = (av, intensity, durMs, style, onUpdate) => {
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
export const cinematicInScript: ScriptFn = (av, intensity, durMs, _style, onUpdate) => {
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
export const cinematicOutScript: ScriptFn = (av, intensity, durMs, _style, onUpdate) => {
  const c = Math.min(durMs / 1000, 3.5);
  const a = intensity;
  return gsap.timeline()
    .set(av, { rx: NRX - 38 * a, ry: -50 * a, tx: 30 * a, ty: 4 * a, sc: 1.00 })
    .to(av,  { rx: NRX,          ry: NRY,      tx: 0,       ty: 0,       sc: 1.00, duration: c * 0.18, ease: "power2.out", onUpdate })
    .to(av,  { rx: NRX -  3 * a, ry: NRY -  6 * a, tx: 3 * a, ty: -4 * a, sc: 1.02, duration: c * 0.14, ease: "sine.inOut", onUpdate })
    .to(av,  { rx: NRX + 14 * a, ry:    -52 * a,   tx: -26 * a, ty: -72 * a, sc: 0.85, duration: c * 0.68, ease: "power3.in", onUpdate });
};

// ─── ENTRY / EXIT scripts ─────────────────────────────────────────────────────

export const heroRevealEntry: ScriptFn = (av, intensity, durMs, style, onUpdate) => {
  const c = durMs / 1000, { amp, e1 } = STYLE_CFG[style], a = intensity * amp;
  return gsap.timeline()
    .set(av, { rx: NRX - 38 * a, ry: -58 * a, tx: 36 * a, ty: 12 * a, sc: 1.00 })
    .to(av,  { rx: NRX - 35 * a, ry: -28 * a, tx: 14 * a, ty:  6 * a, sc: 1.00, duration: c * 0.35, ease: "power3.out", onUpdate })
    .to(av,  { rx: NRX,          ry: NRY,     tx: 0,       ty:  0,      sc: 1.00, duration: c * 0.35, ease: e1, onUpdate })
    .to(av,  { rx: NRX - 38 * a, ry:  50 * a, tx: 33 * a,  ty:  4 * a,  sc: 1.00, duration: c * 0.30, ease: "sine.out", onUpdate });
};

export const heroRevealExit: ScriptFn = (av, intensity, durMs, _style, onUpdate) => {
  const c = durMs / 1000, { amp, e2 } = STYLE_CFG[_style], a = intensity * amp;
  return gsap.timeline()
    .set(av, { rx: NRX - 38 * a, ry:  50 * a, tx: 33 * a, ty:  4 * a, sc: 1.00 })
    .to(av,  { rx: NRX - 30 * a, ry: -30 * a, tx: 18 * a, ty: -10 * a, sc: 1.00, duration: c * 0.45, ease: e2, onUpdate })
    .to(av,  { rx: NRX - 38 * a, ry: -58 * a, tx: 36 * a, ty: 12 * a, sc: 1.00, duration: c * 0.55, ease: "power3.in", onUpdate });
};
export const orbitEntry: ScriptFn = (av, intensity, durMs, _style, onUpdate) => {
  const c = durMs / 1000, { amp } = STYLE_CFG[_style], a = intensity * amp;
  return gsap.timeline()
    .set(av, { rx: NRX - 30 * a, ry: -64 * a, tx: 14 * a, ty:  6 * a, sc: 1.00 }) 
    .to(av,  { rx: NRX - 30 * a, ry: -28 * a, tx:  6 * a, ty: -4 * a, sc: 1.00, duration: c * 0.50, ease: "power2.out", onUpdate })
    .to(av,  { rx: NRX,          ry:  -35 * a, tx: 30 * a, ty:  4 * a, sc: 1.00, duration: c * 0.50, ease: "expo.out", onUpdate });
};

export const orbitExit: ScriptFn = (av, intensity, durMs, style, onUpdate) => {
  const c = durMs / 1000, { amp } = STYLE_CFG[style], a = intensity * amp;
  return gsap.timeline()
    .set(av, { rx: NRX,          ry:  -35 * a, tx: 30 * a, ty:  4 * a, sc: 1.00 }) 
    .to(av,  { rx: NRX - 30 * a, ry: -40 * a,  tx: -12 * a, ty:  5 * a, sc: 1.00, duration: c * 0.50, ease: "power2.in", onUpdate }) 
    .to(av,  { rx: NRX - 30 * a, ry:  40 * a,  tx: -18 * a, ty:  9 * a, sc: 0.95, duration: c * 0.50, ease: "power4.in", onUpdate });
};


export const showcaseEntry: ScriptFn = (av, intensity, durMs, style, onUpdate) => {
  const c = durMs / 1000, { amp, e2 } = STYLE_CFG[style], a = intensity * amp;
  return gsap.timeline()
    .set(av, { rx: NRX - 55 * a, ry: -55 * a, tx: 35 * a, ty: 12 * a, sc: 1.00 })
    .to(av,  { rx: NRX,          ry: 0,        tx: 0,       ty: 0,       sc: 1.00, duration: c * 0.55, ease: e2, onUpdate })
    .to(av,  { rx: NRX - 38 * a, ry: -50 * a,  tx: 30 * a,  ty: 4 * a,   sc: 1.00, duration: c * 0.45, ease: "expo.out", onUpdate });
};

export const showcaseExit: ScriptFn = (av, intensity, durMs, style, onUpdate) => {
  const c = durMs / 1000, { amp, e1 } = STYLE_CFG[style], a = intensity * amp;
  return gsap.timeline()
    .set(av, { rx: NRX - 38 * a, ry: -50 * a, tx: 30 * a, ty: 4 * a, sc: 1.00 })
    .to(av,  { rx: NRX - 30 * a, ry: -20 * a, tx: -36 * a, ty: 6 * a, sc: 1.00, duration: c * 0.55, ease: e1, onUpdate })
    .to(av,  { rx: NRX - 20 * a, ry: 40 * a,  tx: -44 * a, ty: 15 * a, sc: 0.95, duration: c * 0.45, ease: "power4.in", onUpdate });
};
export const stageEntryEntry: ScriptFn = (av, intensity, durMs, _style, onUpdate) => {
  const c = durMs / 1000, { amp } = STYLE_CFG[_style], a = intensity * amp;
  return gsap.timeline()
    .set(av, { rx: NRX - 55 * a, ry: -55 * a, tx: 35 * a, ty: 12 * a, sc: 1.00 })
    .to(av,  { rx: NRX,          ry: 0,        tx: 0,       ty: 0,       sc: 1.00, duration: c * 0.55, ease: "power2.out", onUpdate })
    .to(av,  { rx: NRX - 38 * a, ry: -50 * a,  tx: 30 * a,  ty: 4 * a,   sc: 1.00, duration: c * 0.45, ease: "expo.out", onUpdate });
};

export const stageEntryExit: ScriptFn = (av, intensity, durMs, style, onUpdate) => {
  const c = durMs / 1000, { amp } = STYLE_CFG[style], a = intensity * amp;
  return gsap.timeline()
    .set(av, { rx: NRX - 38 * a, ry: -50 * a, tx: 30 * a, ty: 4 * a, sc: 1.00 })
    .to(av,  { rx: NRX - 30 * a, ry: -20 * a, tx: -36 * a, ty: 6 * a, sc: 1.00, duration: c * 0.55, ease: "power3.in", onUpdate })
    .to(av,  { rx: NRX - 20 * a, ry: 40 * a,  tx: -44 * a, ty: 15 * a, sc: 0.95, duration: c * 0.45, ease: "power4.in", onUpdate });
};

export const tiltShiftEntry: ScriptFn = (av, intensity, durMs, style, onUpdate) => {
  const c = durMs / 1000;
  const { amp, e1 } = STYLE_CFG[style];
  const a = intensity * amp;
  return gsap.timeline()
    .set(av, { rx: NRX + 20 * a, ry: -66 * a, tx: 40 * a, ty: -14 * a, sc: 0.93 })
    .to(av,  { rx: NRX,          ry: 0,        tx: 0,       ty: 0,       sc: 1.06, duration: c * 0.55, ease: e1, onUpdate })
    .to(av,  { rx: NRX - 38 * a, ry: -50 * a, tx: 30 * a, ty: 4 * a, sc: 1.00, duration: c * 0.45, ease: "expo.out", onUpdate });
};

export const tiltShiftExit: ScriptFn = (av, intensity, durMs, style, onUpdate) => {
  const c = durMs / 1000;
  const { amp, e3 } = STYLE_CFG[style];
  const a = intensity * amp;
  return gsap.timeline()
    .set(av, { rx: NRX - 38 * a, ry: -50 * a, tx: 30 * a, ty: 4 * a, sc: 1.00 })
    .to(av,  { rx: NRX - 18 * a, ry: 62 * a, tx: -36 * a, ty: 10 * a,  sc: 0.91, duration: c * 0.55, ease: e3, onUpdate })
    .to(av,  { rx: NRX - 20 * a, ry: 76 * a, tx: -46 * a, ty: 14 * a,  sc: 0.88, duration: c * 0.45, ease: "power4.in", onUpdate });
};

export const gravityDropEntry: ScriptFn = (av, intensity, durMs, _style, onUpdate) => {
  const c = durMs / 1000, { amp } = STYLE_CFG[_style], a = intensity * amp;
  return gsap.timeline()
    .set(av, { rx: NRX - 45 * a, ry: NRY - 20 * a, tx: 0, ty: -100 * a, sc: 1.00 }) 
    .to(av,  { rx: NRX - 30 * a, ry: NRY,          tx: 0, ty:   16 * a, sc: 1.00, duration: c * 0.45, ease: "power3.in", onUpdate }) 
    .to(av,  { rx: NRX - 38 * a, ry: -50 * a, tx: 30 * a, ty:  -35 * a, sc: 1.00, duration: c * 0.55, ease: "expo.out", onUpdate });
};

export const gravityDropExit: ScriptFn = (av, intensity, durMs, style, onUpdate) => {
  const c = durMs / 1000, { amp } = STYLE_CFG[style], a = intensity * amp;
  return gsap.timeline()
    .set(av, { rx: NRX - 38 * a, ry: -50 * a, tx: 30 * a, ty:  -35 * a, sc: 1.00 })
    .to(av,  { rx: NRX - 30 * a, ry: NRY - 12 * a, tx: 0, ty: -36 * a,  sc: 0.92, duration: c * 0.40, ease: "power2.in", onUpdate })
    .to(av,  { rx: NRX - 45 * a, ry: NRY - 20 * a, tx: 0, ty: -100 * a, sc: 0.85, duration: c * 0.60, ease: "power4.in", onUpdate });
};

export const signatureEntry: ScriptFn = (av, intensity, durMs, style, onUpdate) => {
  const c = durMs / 1000, { amp, e1 } = STYLE_CFG[style], a = intensity * amp;
  return gsap.timeline()
    .set(av, { rx: NRX - 55 * a, ry: -60 * a, tx: 16 * a, ty: 12 * a, sc: 1.00 })
    .to(av,  { rx: NRX - 40 * a, ry: -35 * a, tx:  8 * a, ty:  6 * a, sc: 1.00, duration: c * 0.45, ease: "power2.out", onUpdate })
    .to(av,  { rx: NRX,          ry: NRY,     tx:  0,       ty:  0,       sc: 1.00, duration: c * 0.35, ease: "back.out(1.2)", onUpdate })
    .to(av,  { rx: NRX - 38 * a, ry: -45 * a, tx: 12 * a, ty:  4 * a, sc: 1.00, duration: c * 0.20, ease: "power3.out", onUpdate });
};

export const signatureExit: ScriptFn = (av, intensity, durMs, style, onUpdate) => {
  const c = durMs / 1000, { amp, e2 } = STYLE_CFG[style], a = intensity * amp;
  return gsap.timeline()
    .set(av, { rx: NRX - 38 * a, ry: -45 * a, tx: 12 * a, ty:  4 * a, sc: 1.00 })
    .to(av,  { rx: NRX - 30 * a, ry: -20 * a, tx: -14 * a, ty:  6 * a, sc: 1.00, duration: c * 0.50, ease: e2, onUpdate })
    .to(av,  { rx: NRX - 20 * a, ry: 40 * a,  tx: -30 * a, ty: 15 * a, sc: 0.95, duration: c * 0.50, ease: "power4.in", onUpdate });
};
export const cinematicInEntry: ScriptFn = (av, intensity, durMs, _style, onUpdate) => {
  const c = Math.min(durMs / 1000, 4.0), a = intensity;
  return gsap.timeline()
    .set(av, { rx: NRX - 55 * a, ry: -55 * a, tx: 35 * a, ty: 12 * a, sc: 1.00 }) 
    .to(av,  { rx: NRX - 35 * a, ry: -28 * a, tx: 14 * a, ty:  6 * a, sc: 1.00, duration: c * 0.40, ease: "power4.out", onUpdate }) 
    .to(av,  { rx: NRX - 38 * a, ry: 0,        tx: 0,       ty:  0,     sc: 1.06, duration: c * 0.30, ease: "expo.out", onUpdate }) 
    .to(av,  { rx: NRX - 38 * a, ry: NRY,      tx: 0,       ty: -3 * a, sc: 1.00, duration: c * 0.18, ease: "back.out(1.3)", onUpdate })
    .to(av,  { rx: NRX - 38 * a, ry: -50 * a,  tx: 30 * a,  ty:  4 * a, sc: 1.00, duration: c * 0.12, ease: "sine.inOut", onUpdate }); 
};

export const cinematicOutExit: ScriptFn = (av, intensity, durMs, _style, onUpdate) => {
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
export const EASING_OPTIONS: { id: MotionStyle; label: string; path: string }[] = [
  { id: "smooth",    label: "Suave",  path: "M 0 48 C 16 44 32 4 48 0" },
  { id: "normal",    label: "Normal", path: "M 0 48 C 12 36 36 12 48 0" },
  { id: "cinematic", label: "Cine",   path: "M 0 48 C 2 46 6 2 48 0" },
];