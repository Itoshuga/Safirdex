"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "safirdex:card-effects";
const CHANGE_EVENT = "safirdex:card-effects-change";
const DEFAULT_VALUE = true;

let memoryValue: boolean | null = null;

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

function subscribe(callback: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    memoryValue = event.newValue === "enabled" ? true : event.newValue === "disabled" ? false : null;
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

export function setCardEffectsPreference(enabled: boolean) {
  memoryValue = enabled;

  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? "enabled" : "disabled");
  } catch {
    // The in-memory value still keeps the setting functional for this tab.
  }

  window.dispatchEvent(new Event(CHANGE_EVENT));
}
