"use client";

import { useEffect } from "react";

export function useUnsavedChanges(
  enabled: boolean,
  message = "You have unsaved changes. Leave without saving?",
) {
  useEffect(() => {
    if (!enabled) return;

    const beforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    const linkClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!target || target.getAttribute("target") === "_blank") return;
      const href = target.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (!window.confirm(message)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", linkClick, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", linkClick, true);
    };
  }, [enabled, message]);
}
