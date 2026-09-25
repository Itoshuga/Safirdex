"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";

const emptySubscribe = () => () => undefined;

export function ThemeToggle() {
  const t = useTranslations("Common.theme");
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const { resolvedTheme, setTheme } = useTheme();

  const isDark = mounted ? resolvedTheme === "dark" : true;
  const label = isDark ? t("light") : t("dark");

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-lg"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={label}
      title={label}
      className="rounded-lg text-muted-foreground hover:text-foreground"
    >
      {isDark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </Button>
  );
}
