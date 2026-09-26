"use client";

import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "@/i18n/navigation";

export function CommunitySearch({ initialQuery }: { initialQuery: string }) {
  const t = useTranslations("Community.search");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialQuery);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const normalized = value.trim();
      if (normalized === initialQuery) return;
      const params = new URLSearchParams(searchParams.toString());
      params.delete("cursor");
      if (normalized.length >= 3) params.set("q", normalized);
      else params.delete("q");
      startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [initialQuery, pathname, router, searchParams, value]);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={t("placeholder")}
        aria-label={t("label")}
        className="h-12 w-full rounded-xl border bg-card pr-12 pl-11 text-sm outline-none transition placeholder:text-muted-foreground/65 focus:border-ring focus:ring-3 focus:ring-ring/20"
      />
      {pending ? (
        <span className="absolute top-1/2 right-4 size-4 -translate-y-1/2 animate-pulse rounded-full bg-safir/40" />
      ) : value ? (
        <Button type="button" size="icon-sm" variant="ghost" className="absolute top-1/2 right-2 -translate-y-1/2" onClick={() => setValue("")}>
          <X /><span className="sr-only">{t("clear")}</span>
        </Button>
      ) : null}
    </div>
  );
}

