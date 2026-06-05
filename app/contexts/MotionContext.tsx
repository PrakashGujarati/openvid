"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { MotionStyle, AnimMode } from "@/types/motion.types";

interface MotionState {
  selectedTemplateId: string | null;
  setSelectedTemplateId: (id: string | null) => void;

  motionDuration: number;
  setMotionDuration: (d: number) => void;

  motionImageUrl: string | null;
  setMotionImageUrl: (url: string | null) => void;

  motionIntensity: number;
  setMotionIntensity: (i: number) => void;

  motionStyle: MotionStyle;
  setMotionStyle: (s: MotionStyle) => void;

  /** ID of the active camera-path variant within the current template */
  motionVariantId: string | null;
  setMotionVariantId: (id: string) => void;

  /** Which finite animations play: entry, exit, both, or none */
  motionAnimMode: AnimMode;
  setMotionAnimMode: (m: AnimMode) => void;

  // ── Image mode phone mockup state ──────────────────────────────────────────
  /** Whether the phone mockup is active in image mode */
  imagePhoneActive: boolean;
  setImagePhoneActive: (v: boolean) => void;
  /** X offset (px) from canvas center */
  imagePhoneX: number;
  setImagePhoneX: (v: number) => void;
  /** Y offset (px) from canvas center */
  imagePhoneY: number;
  setImagePhoneY: (v: number) => void;
  /** Canvas-level scale of the phone mockup */
  imagePhoneScale: number;
  setImagePhoneScale: (v: number) => void;
  /** Persisted 3D rotation offset (degrees) from user drag */
  imagePhoneRotX: number;
  setImagePhoneRotX: (v: number) => void;
  imagePhoneRotY: number;
  setImagePhoneRotY: (v: number) => void;
  /** Which 3D device model is active: the default phone JSON, iPhone 15 Pro Max or Samsung S25 Ultra */
  imagePhoneDevice: 'phone' | 'iphone' | 'samsung';
  setImagePhoneDevice: (d: 'phone' | 'iphone' | 'samsung') => void;
  imagePhonePresetId: string;
  setImagePhonePresetId: (id: string) => void;
}

const MotionContext = createContext<MotionState | null>(null);

export function MotionProvider({ children }: { children: ReactNode }) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [motionDuration, setMotionDuration] = useState(8000); // era 4000
  const [motionImageUrl, setMotionImageUrl] = useState<string | null>(null);
  const [motionIntensity, setMotionIntensity] = useState(70);
  const [motionStyle, setMotionStyle] = useState<MotionStyle>("normal");
  const [motionVariantId, setMotionVariantId] = useState<string | null>(null);
  const [motionAnimMode, setMotionAnimMode] = useState<AnimMode>("entry+exit");

  // Image mode phone mockup
  const [imagePhoneActive, setImagePhoneActive] = useState(false);
  const [imagePhoneX, setImagePhoneX] = useState(0);
  const [imagePhoneY, setImagePhoneY] = useState(0);
  const [imagePhoneScale, setImagePhoneScale] = useState(1);
  const [imagePhoneRotX, setImagePhoneRotX] = useState(0);
  const [imagePhoneRotY, setImagePhoneRotY] = useState(0);
  const [imagePhoneDevice, setImagePhoneDevice] = useState<'phone' | 'iphone' | 'samsung'>('phone');
const [imagePhonePresetId, setImagePhonePresetId] = useState('front');
  return (
    <MotionContext.Provider value={{
      selectedTemplateId, setSelectedTemplateId,
      motionDuration, setMotionDuration,
      motionImageUrl, setMotionImageUrl,
      motionIntensity, setMotionIntensity,
      motionStyle, setMotionStyle,
      motionVariantId, setMotionVariantId,
      motionAnimMode, setMotionAnimMode,
      imagePhoneActive, setImagePhoneActive,
      imagePhoneX, setImagePhoneX,
      imagePhoneY, setImagePhoneY,
      imagePhoneScale, setImagePhoneScale,
      imagePhoneRotX, setImagePhoneRotX,
      imagePhoneRotY, setImagePhoneRotY,
      imagePhoneDevice, setImagePhoneDevice,
      imagePhonePresetId, setImagePhonePresetId
    }}>
      {children}
    </MotionContext.Provider>
  );
}

export function useMotionContext() {
  const ctx = useContext(MotionContext);
  if (!ctx) throw new Error("useMotionContext must be used inside MotionProvider");
  return ctx;
}