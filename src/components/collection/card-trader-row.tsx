"use client";

import { Check, Copy, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ProfileAvatar } from "@/components/community/profile-avatar";
import { Button } from "@/components/ui/button";
import type { CardTraderView } from "@/features/collection/types";
import { Link } from "@/i18n/navigation";

export function CardTraderRow({ trader }: { trader: CardTraderView }) {
  const t = useTranslations("Collection.traders");
  const [copied, setCopied] = useState(false);
  async function copyDiscord() {
    if (!trader.discord) return;
    await navigator.clipboard.writeText(trader.discord);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3">
      <ProfileAvatar src={trader.avatarUrl} name={trader.displayName} className="size-10" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{trader.displayName}</p>
        <p className="truncate text-[0.68rem] text-muted-foreground">@{trader.username} · {t("copies", { count: trader.tradeQuantity })}</p>
      </div>
      <div className="flex items-center gap-1.5">
        {trader.discord ? (
          <Button type="button" size="sm" variant="outline" onClick={() => void copyDiscord()} aria-label={t("copyDiscord")}>
            {copied ? <Check /> : <Copy />} <span className="hidden sm:inline">{copied ? t("copied") : trader.discord}</span>
          </Button>
        ) : null}
        <Button size="icon-sm" variant="ghost" nativeButton={false} render={<Link href={trader.profileUrl} aria-label={t("profile")} />}>
          <ExternalLink />
        </Button>
      </div>
    </li>
  );
}
