"use client";

import { Check, Share2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { getPathname } from "@/i18n/navigation";

export function ShareProfileButton({
  displayName,
  username,
  compactOnMobile = false,
}: {
  displayName: string;
  username: string;
  compactOnMobile?: boolean;
}) {
  const t = useTranslations("Profile.actions");
  const locale = useLocale();
  const [copied, setCopied] = useState(false);

  async function copyUrl(url: string) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return;
    }
    const input = document.createElement("textarea");
    input.value = url;
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    input.remove();
  }

  async function share() {
    const publicPath = getPathname({
      href: `/user/@${username}`,
      locale,
    });
    const url = new URL(publicPath, window.location.origin).toString();
    try {
      if (navigator.share) {
        await navigator.share({ title: displayName, url });
        return;
      }
      await copyUrl(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2_000);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      await copyUrl(url).catch(() => undefined);
    }
  }

  const label = copied ? t("copied") : t("share");

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      onClick={() => void share()}
      aria-label={label}
      title={label}
      className={compactOnMobile ? "px-2.5 sm:px-3" : undefined}
    >
      {copied ? <Check aria-hidden="true" /> : <Share2 aria-hidden="true" />}
      <span className={compactOnMobile ? "sr-only sm:not-sr-only" : undefined}>{label}</span>
    </Button>
  );
}
