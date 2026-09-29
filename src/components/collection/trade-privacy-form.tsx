"use client";

import { CheckCircle2, LoaderCircle, MessagesSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { updateTradeSettingsAction } from "@/features/collection/server/actions";
import type { TradePrivacySettings } from "@/features/collection/types";

export function TradePrivacyForm({ initialSettings }: { initialSettings: TradePrivacySettings }) {
  const t = useTranslations("Collection.privacy");
  const [settings, setSettings] = useState(initialSettings);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("idle");
    startTransition(async () => {
      const result = await updateTradeSettingsAction(settings);
      if (!result.ok) return setStatus("error");
      setSettings(result.settings);
      setStatus("success");
    });
  }

  return (
    <section className="rounded-2xl border bg-card p-5 sm:p-7">
      <h2 className="flex items-center gap-2 font-heading text-2xl font-semibold"><MessagesSquare className="size-5 text-safir" /> {t("title")}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{t("description")}</p>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border p-4 transition hover:bg-muted/35">
          <span><span className="block text-sm font-semibold">{t("publicLabel")}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{t("publicDescription")}</span></span>
          <input type="checkbox" checked={settings.showTradesPublicly} onChange={(event) => setSettings((current) => ({ ...current, showTradesPublicly: event.target.checked, ...(!event.target.checked ? { showDiscordForTrades: false } : {}) }))} className="mt-1 size-4 accent-safir" />
        </label>
        <div className={`space-y-3 rounded-xl border p-4 transition ${settings.showTradesPublicly ? "" : "opacity-55"}`}>
          <label className="block text-sm font-semibold" htmlFor="trade-discord">{t("discord")}</label>
          <input id="trade-discord" value={settings.discord} disabled={!settings.showTradesPublicly} onChange={(event) => setSettings((current) => ({ ...current, discord: event.target.value }))} placeholder={t("discordPlaceholder")} maxLength={64} autoComplete="off" className="h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed" />
          <label className="flex cursor-pointer items-start justify-between gap-4">
            <span><span className="block text-sm font-semibold">{t("discordLabel")}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{t("discordDescription")}</span></span>
            <input type="checkbox" checked={settings.showDiscordForTrades} disabled={!settings.showTradesPublicly || !settings.discord.trim()} onChange={(event) => setSettings((current) => ({ ...current, showDiscordForTrades: event.target.checked }))} className="mt-1 size-4 accent-safir" />
          </label>
        </div>
        {status === "error" ? <p className="admin-error">{t("error")}</p> : null}
        {status === "success" ? <p className="flex items-center gap-2 text-sm text-emerald-600"><CheckCircle2 className="size-4" /> {t("saved")}</p> : null}
        <Button type="submit" size="lg" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" /> : null}{t("save")}</Button>
      </form>
    </section>
  );
}
