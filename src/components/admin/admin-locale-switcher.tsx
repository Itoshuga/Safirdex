"use client";

import { Languages } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  LOCALE_CONFIG,
  SUPPORTED_LOCALES,
  type AppLocale,
} from "@/lib/i18n/locales";

const ADMIN_LOCALE_COOKIE = "safir_admin_locale";

export function AdminLocaleSwitcher({ locale }: { locale: AppLocale }) {
  const router = useRouter();

  return (
    <label className="relative flex items-center text-muted-foreground" title="Interface language">
      <Languages className="pointer-events-none absolute left-2.5 size-4" />
      <select
        className="h-9 appearance-none rounded-lg border bg-background pr-2.5 pl-8 text-xs font-semibold text-foreground outline-none focus:border-ring focus:ring-3 focus:ring-ring/20"
        value={locale}
        aria-label="Interface language"
        onChange={(event) => {
          document.cookie = `${ADMIN_LOCALE_COOKIE}=${event.target.value}; path=/; max-age=31536000; samesite=lax`;
          router.refresh();
        }}
      >
        {SUPPORTED_LOCALES.map((supportedLocale) => (
          <option key={supportedLocale} value={supportedLocale}>
            {LOCALE_CONFIG[supportedLocale].shortLabel}
          </option>
        ))}
      </select>
    </label>
  );
}
