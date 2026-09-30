"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "safirdex:card-effects";
const STYLE_STORAGE_KEY = "safirdex:card-effect-style";
const CHANGE_EVENT = "safirdex:card-effects-change";
const DEFAULT_VALUE = true;

export const CARD_EFFECT_STYLES = [
  "none",
  "light",
  "classic",
  "aurora",
  "cosmos",
  "radiant",
] as const;
export type CardEffectStyle = (typeof CARD_EFFECT_STYLES)[number];

const DEFAULT_STYLE: CardEffectStyle = "none";

let memoryValue: boolean | null = null;
let memoryStyle: CardEffectStyle | null = null;

function isCardEffectStyle(value: string | null): value is CardEffectStyle {
  return CARD_EFFECT_STYLES.some((style) => style === value);
}

function readPreference() {
  if (typeof window === "undefined") return DEFAULT_VALUE;

  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    if (storedValue === "enabled") return true;
    if (storedValue === "disabled") return false;
  } catch {
    // Keep the preference usable for the current tab when storage is unavailable.
  }

  return memoryValue ?? DEFAULT_VALUE;
}

function readStylePreference() {
  if (typeof window === "undefined") return DEFAULT_STYLE;

  try {
    const storedValue = window.localStorage.getItem(STYLE_STORAGE_KEY);
    if (isCardEffectStyle(storedValue)) return storedValue;
  } catch {
    // Keep the preference usable for the current tab when storage is unavailable.
  }

  return memoryStyle ?? DEFAULT_STYLE;
}

function subscribe(callback: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      memoryValue = event.newValue === "enabled" ? true : event.newValue === "disabled" ? false : null;
    } else if (event.key === STYLE_STORAGE_KEY) {
      memoryStyle = isCardEffectStyle(event.newValue) ? event.newValue : null;
    } else {
      return;
    }

    callback();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

export function useCardEffectsPreference() {
  return useSyncExternalStore(subscribe, readPreference, () => DEFAULT_VALUE);
}

export function useCardEffectStylePreference() {
  return useSyncExternalStore(subscribe, readStylePreference, () => DEFAULT_STYLE);
}

export function setCardEffectsPreference(enabled: boolean) {
  memoryValue = enabled;

  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? "enabled" : "disabled");
  } catch {
    // The in-memory value still keeps the setting functional for this tab.
  }

  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function setCardEffectStylePreference(style: CardEffectStyle) {
  memoryStyle = style;

  try {
    window.localStorage.setItem(STYLE_STORAGE_KEY, style);
  } catch {
    // The in-memory value still keeps the setting functional for this tab.
  }

  window.dispatchEvent(new Event(CHANGE_EVENT));
}
