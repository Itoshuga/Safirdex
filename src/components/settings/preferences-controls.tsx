"use client";

import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";

import { LanguageSwitcher } from "@/components/language-switcher";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => undefined;

export function PreferencesControls() {
  const t = useTranslations("Settings.preferences");
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const { theme, setTheme } = useTheme();
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
    </div>
  );
}
