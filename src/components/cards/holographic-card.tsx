"use client";

import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { useCallback, useEffect, useRef } from "react";

import {
  useCardEffectsPreference,
  useCardEffectStylePreference,
} from "@/hooks/use-card-effects-preference";

import styles from "./holographic-card.module.css";

interface MotionValues {
  rotateX: number;
  rotateY: number;
  pointerX: number;
  pointerY: number;
  backgroundX: number;
  backgroundY: number;
  opacity: number;
  scale: number;
}

const IDLE_VALUES: MotionValues = {
  rotateX: 0,
  rotateY: 0,
  pointerX: 50,
  pointerY: 50,
  backgroundX: 50,
  backgroundY: 50,
  opacity: 0,
  scale: 1,
};

const MOTION_KEYS = Object.keys(IDLE_VALUES) as Array<keyof MotionValues>;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function writeMotionStyles(element: HTMLDivElement, values: MotionValues) {
  const opacity = clamp(values.opacity, 0, 1);
  element.style.setProperty("--holo-rotate-x", `${values.rotateX.toFixed(3)}deg`);
  element.style.setProperty("--holo-rotate-y", `${values.rotateY.toFixed(3)}deg`);
  element.style.setProperty("--holo-pointer-x", `${clamp(values.pointerX, -8, 108).toFixed(2)}%`);
  element.style.setProperty("--holo-pointer-y", `${clamp(values.pointerY, -8, 108).toFixed(2)}%`);
  element.style.setProperty("--holo-background-x", `${clamp(values.backgroundX, 25, 75).toFixed(2)}%`);
  element.style.setProperty("--holo-background-y", `${clamp(values.backgroundY, 25, 75).toFixed(2)}%`);
  element.style.setProperty("--holo-opacity", opacity.toFixed(3));
  element.style.setProperty("--holo-scale", clamp(values.scale, 1, 1.025).toFixed(4));
  element.style.setProperty("--holo-shadow-x", `${(-values.rotateY * 1.35).toFixed(2)}px`);
  element.style.setProperty("--holo-shadow-y", `${(15 + values.rotateX * 0.65).toFixed(2)}px`);
  element.style.setProperty("--holo-shadow-opacity", (0.14 + opacity * 0.24).toFixed(3));
  element.style.setProperty("--holo-glow", `${(opacity * 24).toFixed(2)}px`);
}

function supportsInteractiveEffects(pointerType: string) {
  if (pointerType && pointerType !== "mouse" && pointerType !== "pen") return false;

  return (
    window.matchMedia("(any-hover: hover) and (any-pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function HolographicCard({ children }: { children: ReactNode }) {
  const effectsEnabled = useCardEffectsPreference();
  const effectStyle = useCardEffectStylePreference();
  const sceneRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const boundsRef = useRef<DOMRect | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number | null>(null);
  const currentRef = useRef<MotionValues>({ ...IDLE_VALUES });
  const targetRef = useRef<MotionValues>({ ...IDLE_VALUES });
  const velocityRef = useRef<MotionValues>({
    rotateX: 0,
    rotateY: 0,
    pointerX: 0,
    pointerY: 0,
    backgroundX: 0,
    backgroundY: 0,
    opacity: 0,
    scale: 0,
  });

  const startAnimation = useCallback(() => {
    if (frameRef.current !== null) return;

    const tick = (timestamp: number) => {
      const element = surfaceRef.current;
      if (!element) {
        frameRef.current = null;
        lastFrameTimeRef.current = null;
        return;
      }

      const elapsedSeconds = lastFrameTimeRef.current === null
        ? 1 / 60
        : clamp((timestamp - lastFrameTimeRef.current) / 1000, 1 / 240, 1 / 30);
      lastFrameTimeRef.current = timestamp;
      let moving = false;

      for (const key of MOTION_KEYS) {
        const delta = targetRef.current[key] - currentRef.current[key];
        const acceleration = delta * 165 - velocityRef.current[key] * 21;
        const velocity = velocityRef.current[key] + acceleration * elapsedSeconds;
        velocityRef.current[key] = velocity;
        currentRef.current[key] += velocity * elapsedSeconds;

        const tolerance = key === "scale" ? 0.0001 : 0.01;
        if (Math.abs(delta) > tolerance || Math.abs(velocity) > tolerance * 8) moving = true;
      }

      writeMotionStyles(element, currentRef.current);

      if (moving) {
        frameRef.current = window.requestAnimationFrame(tick);
      } else {
        currentRef.current = { ...targetRef.current };
        velocityRef.current = {
          rotateX: 0,
          rotateY: 0,
          pointerX: 0,
          pointerY: 0,
          backgroundX: 0,
          backgroundY: 0,
          opacity: 0,
          scale: 0,
        };
        writeMotionStyles(element, currentRef.current);
        frameRef.current = null;
        lastFrameTimeRef.current = null;
      }
    };

    frameRef.current = window.requestAnimationFrame(tick);
  }, []);

  const resetCard = useCallback(() => {
    if (surfaceRef.current) surfaceRef.current.dataset.active = "false";
    boundsRef.current = null;
    targetRef.current = { ...IDLE_VALUES };
    startAnimation();
  }, [startAnimation]);

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!effectsEnabled || !supportsInteractiveEffects(event.pointerType)) {
      resetCard();
      return;
    }

    const bounds = boundsRef.current ?? event.currentTarget.getBoundingClientRect();
    boundsRef.current = bounds;
    const x = clamp((event.clientX - bounds.left) / bounds.width, 0, 1);
    const y = clamp((event.clientY - bounds.top) / bounds.height, 0, 1);
    const centeredX = x - 0.5;
    const centeredY = y - 0.5;

    if (surfaceRef.current) surfaceRef.current.dataset.active = "true";
    targetRef.current = {
      rotateX: centeredY * -18,
      rotateY: centeredX * 18,
      pointerX: x * 100,
      pointerY: y * 100,
      backgroundX: 42 + x * 16,
      backgroundY: 42 + y * 16,
      opacity: 1,
      scale: 1.016,
    };
    startAnimation();
  }, [effectsEnabled, resetCard, startAnimation]);

  const handlePointerEnter = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    boundsRef.current = event.currentTarget.getBoundingClientRect();
    handlePointerMove(event);
  }, [handlePointerMove]);

  useEffect(() => {
    if (!effectsEnabled) resetCard();
  }, [effectsEnabled, resetCard]);

  useEffect(() => {
    const reset = () => resetCard();
    const invalidateBounds = () => {
      boundsRef.current = null;
    };
    const resizeObserver = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(invalidateBounds);

    window.addEventListener("blur", reset);
    window.addEventListener("resize", invalidateBounds);
    window.addEventListener("scroll", invalidateBounds, true);
    document.addEventListener("visibilitychange", reset);
    if (sceneRef.current) resizeObserver?.observe(sceneRef.current);

    return () => {
      window.removeEventListener("blur", reset);
      window.removeEventListener("resize", invalidateBounds);
      window.removeEventListener("scroll", invalidateBounds, true);
      document.removeEventListener("visibilitychange", reset);
      resizeObserver?.disconnect();
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      lastFrameTimeRef.current = null;
    };
  }, [resetCard]);

  return (
    <div
      ref={sceneRef}
      className={styles.scene}
      data-effects={effectsEnabled ? "enabled" : "disabled"}
      data-holo-style={effectStyle}
      onPointerEnter={effectsEnabled ? handlePointerEnter : undefined}
      onPointerMove={effectsEnabled ? handlePointerMove : undefined}
      onPointerLeave={effectsEnabled ? resetCard : undefined}
      onPointerCancel={effectsEnabled ? resetCard : undefined}
    >
      <div ref={surfaceRef} className={styles.surface} data-active="false">
        {children}
        <span className={styles.foil} aria-hidden="true" />
        <span className={styles.prism} aria-hidden="true" />
        <span className={styles.glare} aria-hidden="true" />
        <span className={styles.edge} aria-hidden="true" />
      </div>
    </div>
  );
}
