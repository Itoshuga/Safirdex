"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "safirdex:card-catalogue-navigation";
const CHANGE_EVENT = "safirdex:card-catalogue-navigation-change";

export const CARD_CATALOGUE_NAVIGATION_MODES = [
  "pagination",
  "infinite",
] as const;

export type CardCatalogueNavigationMode =
  (typeof CARD_CATALOGUE_NAVIGATION_MODES)[number];

const DEFAULT_MODE: CardCatalogueNavigationMode = "pagination";

let memoryValue: CardCatalogueNavigationMode | null = null;

function isNavigationMode(
  value: string | null,
): value is CardCatalogueNavigationMode {
  return CARD_CATALOGUE_NAVIGATION_MODES.some((mode) => mode === value);
}

function readPreference() {
  if (typeof window === "undefined") return DEFAULT_MODE;

  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    if (isNavigationMode(storedValue)) return storedValue;
  } catch {
    // Keep the preference usable for the current tab when storage is unavailable.
  }

  return memoryValue ?? DEFAULT_MODE;
}

function subscribe(callback: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    memoryValue = isNavigationMode(event.newValue) ? event.newValue : null;
    callback();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

export function useCardCatalogueNavigationPreference() {
  return useSyncExternalStore(subscribe, readPreference, () => DEFAULT_MODE);
}

export function setCardCatalogueNavigationPreference(
  mode: CardCatalogueNavigationMode,
) {
  memoryValue = mode;

  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // The in-memory value still keeps the setting functional for this tab.
  }

  window.dispatchEvent(new Event(CHANGE_EVENT));
}
