"use client";

import { Check, ChevronDown, Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getPathname, usePathname } from "@/i18n/navigation";
import {
  LOCALE_CONFIG,
  SUPPORTED_LOCALES,
  type AppLocale,
} from "@/lib/i18n/locales";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({
  align = "end",
  compact = false,
}: {
  align?: "start" | "center" | "end";
  compact?: boolean;
}) {
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("Navigation");
  const [pending, setPending] = useState(false);

  function changeLocale(nextLocale: AppLocale) {
    if (nextLocale === locale) return;

    const localizedPathname = getPathname({
      href: pathname,
      locale: nextLocale,
    });
    const query = searchParams.toString();
    const hash = window.location.hash;

    // A locale is a root layout parameter. Next.js keeps root layouts mounted
    // during soft navigation, while next-themes' bootstrap script must run on a
    // document load. A full navigation prevents React from trying to recreate
    // that script on the client and also preserves the active theme.
    setPending(true);
    window.location.replace(
      `${localizedPathname}${query ? `?${query}` : ""}${hash}`,
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size={compact ? "icon" : "lg"}
            className={cn(
              "rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground",
              !compact && "px-3 tracking-[0.08em]",
            )}
            disabled={pending}
          />
        }
        aria-label={t("changeLanguage")}
      >
        <Languages aria-hidden="true" />
        {compact ? null : LOCALE_CONFIG[locale].shortLabel}
        {compact ? null : <ChevronDown aria-hidden="true" className="size-3" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} sideOffset={8} className="min-w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("language")}</DropdownMenuLabel>
          {SUPPORTED_LOCALES.map((option) => (
            <DropdownMenuItem
              key={option}
              onClick={() => changeLocale(option)}
              className="justify-between px-2.5 py-2"
            >
              <span>
                {LOCALE_CONFIG[option].nativeName}
                <span className="ml-2 text-xs text-muted-foreground">
                  {LOCALE_CONFIG[option].shortLabel}
                </span>
              </span>
              {option === locale ? (
                <Check aria-hidden="true" className="size-3.5 text-safir" />
              ) : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
