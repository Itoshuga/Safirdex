"use client";

import { Check, ChevronDown, Languages } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AppLocale } from "@/lib/i18n/locales";

interface LanguageMenuProps {
  currentLocale: AppLocale;
  label: string;
  align?: "start" | "center" | "end";
}

const localeOptions: { locale: AppLocale; label: string; shortLabel: string }[] = [
  { locale: "en", label: "English", shortLabel: "EN" },
  { locale: "fr", label: "Français", shortLabel: "FR" },
];

export function LanguageMenu({
  currentLocale,
  label,
  align = "end",
}: LanguageMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="lg"
            className="rounded-lg px-3 text-xs font-semibold tracking-[0.08em] text-muted-foreground hover:text-foreground"
          />
        }
        aria-label={label}
      >
        <Languages aria-hidden="true" />
        {currentLocale.toUpperCase()}
        <ChevronDown aria-hidden="true" className="size-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} sideOffset={8} className="min-w-40">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{label}</DropdownMenuLabel>
          {localeOptions.map((option) => (
            <DropdownMenuItem
              key={option.locale}
              render={<Link href={`/?lang=${option.locale}`} />}
              className="justify-between px-2.5 py-2"
            >
              <span>
                {option.label}
                <span className="ml-2 text-xs text-muted-foreground">
                  {option.shortLabel}
                </span>
              </span>
              {option.locale === currentLocale ? (
                <Check aria-hidden="true" className="size-3.5 text-safir" />
              ) : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
