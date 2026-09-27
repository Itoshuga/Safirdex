"use client";

import { ArrowRight, LoaderCircle, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";

import { ProfileAvatar } from "@/components/community/profile-avatar";
import { Button } from "@/components/ui/button";
import { searchCommunityUsersAction } from "@/features/community/server/actions";
import type { CommunityUserResult } from "@/features/community/types";
import { Link, useRouter } from "@/i18n/navigation";

export function CommunitySearch({
  initialQuery = "",
}: {
  initialQuery?: string;
}) {
  const t = useTranslations("Community.search");
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const [results, setResults] = useState<CommunityUserResult[]>([]);
  const [focused, setFocused] = useState(false);
  const [pending, startTransition] = useTransition();
  const requestId = useRef(0);
  const normalized = value.trim();
  const searchableValue = normalized.replace(/^@/, "");

  useEffect(() => {
    const currentRequest = ++requestId.current;
    if (searchableValue.length < 2) return;

    const timer = window.setTimeout(() => {
      startTransition(async () => {
        const nextResults = await searchCommunityUsersAction(normalized);
        if (requestId.current === currentRequest) setResults(nextResults);
      });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [normalized, searchableValue.length]);

  const resultsHref = `/community/people?q=${encodeURIComponent(normalized)}`;
  const showResults = focused && searchableValue.length >= 2;

  return (
    <div className="relative z-20">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          if (searchableValue.length >= 2) router.push(resultsHref);
        }}
      >
        <Search
          className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          value={value}
          onChange={(event) => {
            const nextValue = event.target.value;
            setValue(nextValue);
            if (nextValue.trim().replace(/^@/, "").length < 2) setResults([]);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 150)}
          placeholder={t("placeholder")}
          aria-label={t("label")}
          autoComplete="off"
          className="h-14 w-full rounded-2xl border border-border/70 bg-background/92 pr-24 pl-12 text-sm shadow-sm outline-none transition placeholder:text-muted-foreground/65 focus:border-safir/45 focus:ring-4 focus:ring-safir/10 sm:h-16 sm:text-base"
        />
        <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1">
          {pending ? (
            <span className="grid size-9 place-items-center text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              <span className="sr-only">{t("loading")}</span>
            </span>
          ) : value ? (
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={() => {
                setValue("");
                setResults([]);
              }}
            >
              <X aria-hidden="true" />
              <span className="sr-only">{t("clear")}</span>
            </Button>
          ) : null}
          <Button type="submit" size="icon-sm" disabled={searchableValue.length < 2}>
            <ArrowRight aria-hidden="true" />
            <span className="sr-only">{t("submit")}</span>
          </Button>
        </div>
      </form>

      {showResults ? (
        <div
          id="community-search-results"
          aria-live="polite"
          className="absolute inset-x-0 top-[calc(100%+0.5rem)] overflow-hidden rounded-2xl border bg-popover p-2 text-popover-foreground shadow-2xl shadow-black/15"
        >
          {results.length ? (
            <div className="space-y-1">
              {results.map((user) => (
                <Link
                  key={user.username}
                  href={user.isSelf ? "/account" : `/user/@${user.username}`}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                >
                  <ProfileAvatar
                    src={user.avatarUrl}
                    name={user.displayName}
                    className="size-10 border-2"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {user.displayName}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      @{user.username}
                    </span>
                  </span>
                  <ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" />
                </Link>
              ))}
              <Link
                href={resultsHref}
                className="flex items-center justify-between rounded-xl border-t px-3 py-3 text-xs font-semibold text-safir transition hover:bg-muted"
              >
                {t("viewAll")}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          ) : pending ? (
            <p className="px-4 py-5 text-center text-sm text-muted-foreground">
              {t("loading")}
            </p>
          ) : (
            <p className="px-4 py-5 text-center text-sm text-muted-foreground">
              {t("noResults", { query: normalized })}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
