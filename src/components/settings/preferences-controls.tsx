"use client";

import { Laptop, Moon, Sparkles, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";

import { LanguageSwitcher } from "@/components/language-switcher";
import {
  setCardEffectsPreference,
  useCardEffectsPreference,
} from "@/hooks/use-card-effects-preference";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => undefined;

export function PreferencesControls({ showCardEffects = true }: { showCardEffects?: boolean }) {
  const t = useTranslations("Settings.preferences");
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const { theme, setTheme } = useTheme();
  const cardEffectsEnabled = useCardEffectsPreference();
  const selectedTheme = mounted ? theme ?? "system" : "system";
  const themes = [
    { key: "system", icon: Laptop },
    { key: "light", icon: Sun },
    { key: "dark", icon: Moon },
  ] as const;

  return (
    <div className="space-y-7">
      <div>
        <p className="text-sm font-semibold">{t("languageTitle")}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{t("languageDescription")}</p>
        <div className="mt-3 inline-flex rounded-xl border bg-background p-1">
          <LanguageSwitcher align="start" />
        </div>
      </div>
      <div className="border-t pt-6">
        <p className="text-sm font-semibold">{t("themeTitle")}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{t("themeDescription")}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {themes.map(({ key, icon: Icon }) => (
            <button
              key={key}
              type="button"
              aria-pressed={selectedTheme === key}
              onClick={() => setTheme(key)}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-4 text-left text-sm font-semibold transition",
                selectedTheme === key
                  ? "border-safir/40 bg-safir/8 text-safir ring-2 ring-safir/10"
                  : "hover:bg-muted/45",
              )}
            >
              <Icon className="size-4" aria-hidden="true" /> {t(`themes.${key}`)}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{t("savedLocally")}</p>
      </div>
      {showCardEffects ? (
        <div className="border-t pt-6">
          <p className="text-sm font-semibold">{t("cardEffectsTitle")}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{t("cardEffectsDescription")}</p>
          <div className="mt-4 flex items-center gap-3 rounded-2xl border bg-muted/20 p-4 sm:gap-4">
            <span
              className={cn(
                "grid size-11 shrink-0 place-items-center rounded-xl border transition",
                cardEffectsEnabled
                  ? "border-safir/25 bg-[linear-gradient(135deg,color-mix(in_oklch,var(--safir)_16%,transparent),color-mix(in_oklch,var(--mineral)_13%,transparent))] text-safir shadow-[0_10px_30px_-18px_color-mix(in_oklch,var(--safir)_80%,transparent)]"
                  : "bg-background text-muted-foreground",
              )}
            >
              <Sparkles className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">
                {cardEffectsEnabled ? t("cardEffectsStates.enabled") : t("cardEffectsStates.disabled")}
              </p>
              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{t("cardEffectsHint")}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={cardEffectsEnabled}
              aria-label={t("cardEffectsTitle")}
              onClick={() => setCardEffectsPreference(!cardEffectsEnabled)}
              className={cn(
                "relative h-8 w-14 shrink-0 rounded-full border p-1 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                cardEffectsEnabled
                  ? "border-safir/35 bg-[linear-gradient(100deg,var(--safir),var(--mineral))]"
                  : "bg-muted",
              )}
            >
              <span
                className={cn(
                  "block size-5 rounded-full bg-white shadow-sm transition-transform",
                  cardEffectsEnabled ? "translate-x-6" : "translate-x-0",
                )}
              />
            </button>
          </div>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">{t("cardEffectsFootnote")}</p>
        </div>
      ) : null}
    </div>
  );
}
