"use client";

import {
  AlertCircle,
  CheckCircle2,
  FileJson,
  LoaderCircle,
  Upload,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  cardJsonImportRowSchema,
  INITIAL_CARD_IMPORT_STATE,
  MAX_CARD_IMPORT_BYTES,
  MAX_CARD_IMPORT_ROWS,
  parseCardJsonImportText,
} from "@/features/cards/card-json-import";
import { importCardsAction } from "@/features/cards/server/import-actions";

interface ReferenceOption {
  id: string;
  label: string;
  slug: string;
}

interface Preview {
  total: number;
  ready: number;
  ignored: number;
  missingRarity: number;
  unknownRarities: string[];
  unknownTypes: string[];
  unknownFactions: string[];
  rows: Array<{ number: number; name: string; rarity: string }>;
}

function buildPreview(
  rawRows: unknown[],
  fallbackRarityId: string,
  rarities: ReferenceOption[],
  types: ReferenceOption[],
  factions: ReferenceOption[],
): Preview {
  const raritySlugs = new Set(rarities.map(({ slug }) => slug.toLowerCase()));
  const typeSlugs = new Set(types.map(({ slug }) => slug.toLowerCase()));
  const factionSlugs = new Set(factions.map(({ slug }) => slug.toLowerCase()));
  const seenNumbers = new Set<number>();
  const unknownRarities = new Set<string>();
  const unknownTypes = new Set<string>();
  const unknownFactions = new Set<string>();
  const rows: Preview["rows"] = [];
  let ready = 0;
  let missingRarity = 0;

  for (const rawRow of rawRows) {
    const parsed = cardJsonImportRowSchema.safeParse(rawRow);
    if (!parsed.success) continue;
    const card = parsed.data;
    let valid = true;

    if (seenNumbers.has(card.number)) valid = false;
    seenNumbers.add(card.number);

    if (!card.rarity_slug) {
      missingRarity += 1;
      if (!fallbackRarityId) valid = false;
    } else if (!raritySlugs.has(card.rarity_slug.toLowerCase())) {
      unknownRarities.add(card.rarity_slug);
      valid = false;
    }

    for (const slug of card.type_slugs) {
      if (!typeSlugs.has(slug.toLowerCase())) {
        unknownTypes.add(slug);
        valid = false;
      }
    }

    const rowFactionSlugs = [
      ...(card.faction_slug ? [card.faction_slug] : []),
      ...(card.faction_slugs ?? []),
    ];
    for (const slug of rowFactionSlugs) {
      if (!factionSlugs.has(slug.toLowerCase())) {
        unknownFactions.add(slug);
        valid = false;
      }
    }

    if (valid) ready += 1;
    if (rows.length < 5) {
      rows.push({
        number: card.number,
        name: card.name,
        rarity: card.rarity_slug ?? "—",
      });
    }
  }

  return {
    total: rawRows.length,
    ready,
    ignored: rawRows.length - ready,
    missingRarity,
    unknownRarities: [...unknownRarities],
    unknownTypes: [...unknownTypes],
    unknownFactions: [...unknownFactions],
    rows,
  };
}

export function CardJsonImportForm({
  seasons,
  rarities,
  types,
  factions,
}: {
  seasons: Array<{ id: string; label: string }>;
  rarities: ReferenceOption[];
  types: ReferenceOption[];
  factions: ReferenceOption[];
}) {
  const t = useTranslations("Admin.cards.import");
  const [state, formAction, pending] = useActionState(importCardsAction, INITIAL_CARD_IMPORT_STATE);
  const [seasonId, setSeasonId] = useState("");
  const [fallbackRarityId, setFallbackRarityId] = useState("");
  const [fileName, setFileName] = useState("");
  const [rawRows, setRawRows] = useState<unknown[]>([]);
  const [fileError, setFileError] = useState("");
  const [hideResult, setHideResult] = useState(false);

  const preview = useMemo(
    () => rawRows.length
      ? buildPreview(rawRows, fallbackRarityId, rarities, types, factions)
      : null,
    [factions, fallbackRarityId, rarities, rawRows, types],
  );

  useEffect(() => {
    if (state.status === "idle") return;
    const timer = window.setTimeout(() => setHideResult(false), 0);
    return () => window.clearTimeout(timer);
  }, [state]);

  async function readFile(file: File | undefined) {
    setHideResult(true);
    setFileName(file?.name ?? "");
    setRawRows([]);
    setFileError("");

    if (!file) return;
    if (file.size > MAX_CARD_IMPORT_BYTES) {
      setFileError(t("fileTooLarge"));
      return;
    }

    try {
      setRawRows(parseCardJsonImportText(await file.text()));
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      setFileError(
        code === "JSON_ARRAY_REQUIRED"
          ? t("arrayRequired")
          : code === "JSON_EMPTY"
            ? t("emptyFile")
            : code === "JSON_TOO_MANY_ROWS"
              ? t("tooManyRows", { count: MAX_CARD_IMPORT_ROWS })
              : t("invalidJson"),
      );
    }
  }

  const canSubmit = Boolean(seasonId && preview && preview.ready > 0 && !fileError && !pending);

  return (
    <form action={formAction} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-5">
        {!hideResult && state.status !== "idle" ? (
          <div
            className={state.status === "success"
              ? "flex items-start gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300"
              : "flex items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/7 px-4 py-3 text-sm text-destructive"}
            role={state.status === "error" ? "alert" : "status"}
          >
            {state.status === "success" ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : <AlertCircle className="mt-0.5 size-4 shrink-0" />}
            <div>
              <p className="font-medium">{state.message}</p>
              {state.status === "success" ? (
                <p className="mt-1 text-xs opacity-80">{t("resultSummary", { imported: state.imported, skipped: state.skipped })}</p>
              ) : null}
            </div>
          </div>
        ) : null}

        <section className="rounded-2xl border bg-card p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-safir/10 text-safir">1</span>
            <div className="min-w-0 flex-1">
              <h2 className="font-heading text-lg font-semibold">{t("destinationTitle")}</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{t("destinationDescription")}</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="admin-label">{t("seasonLabel")}</span>
                  <select className="admin-input" name="seasonId" value={seasonId} onChange={(event) => setSeasonId(event.target.value)} required>
                    <option value="">{t("seasonPlaceholder")}</option>
                    {seasons.map((season) => <option key={season.id} value={season.id}>{season.label}</option>)}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="admin-label">{t("fallbackRarityLabel")}</span>
                  <select className="admin-input" name="fallbackRarityId" value={fallbackRarityId} onChange={(event) => setFallbackRarityId(event.target.value)}>
                    <option value="">{t("fallbackRarityPlaceholder")}</option>
                    {rarities.map((rarity) => <option key={rarity.id} value={rarity.id}>{rarity.label}</option>)}
                  </select>
                  <span className="admin-help">{t("fallbackRarityHelp")}</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-safir/10 text-safir">2</span>
            <div className="min-w-0 flex-1">
              <h2 className="font-heading text-lg font-semibold">{t("fileTitle")}</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{t("fileDescription")}</p>
              <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 px-5 py-10 text-center transition hover:border-safir/40 hover:bg-safir/3">
                <span className="grid size-12 place-items-center rounded-2xl border bg-background text-safir shadow-sm"><FileJson className="size-5" /></span>
                <span className="mt-3 text-sm font-semibold">{fileName || t("chooseFile")}</span>
                <span className="mt-1 text-xs text-muted-foreground">{t("fileHint")}</span>
                <input
                  className="sr-only"
                  type="file"
                  name="jsonFile"
                  accept="application/json,.json"
                  onChange={(event) => void readFile(event.target.files?.[0])}
                  required
                />
              </label>
              {fileError ? <p className="admin-error mt-3" role="alert">{fileError}</p> : null}
            </div>
          </div>
        </section>

        {preview ? (
          <section className="rounded-2xl border bg-card p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">{t("previewEyebrow")}</p>
                <h2 className="mt-1 font-heading text-xl font-semibold">{t("previewTitle", { count: preview.total })}</h2>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary">{t("readyCount", { count: preview.ready })}</Badge>
                {preview.ignored ? <Badge variant="outline">{t("ignoredCount", { count: preview.ignored })}</Badge> : null}
              </div>
            </div>

            {preview.missingRarity > 0 && !fallbackRarityId ? (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/8 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-300">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                {t("missingRarityWarning", { count: preview.missingRarity })}
              </div>
            ) : null}

            {preview.unknownRarities.length || preview.unknownTypes.length || preview.unknownFactions.length ? (
              <div className="mt-4 space-y-1 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-xs text-destructive">
                {preview.unknownRarities.length ? <p>{t("unknownRarities", { values: preview.unknownRarities.join(", ") })}</p> : null}
                {preview.unknownTypes.length ? <p>{t("unknownTypes", { values: preview.unknownTypes.join(", ") })}</p> : null}
                {preview.unknownFactions.length ? <p>{t("unknownFactions", { values: preview.unknownFactions.join(", ") })}</p> : null}
              </div>
            ) : null}

            <div className="mt-5 overflow-hidden rounded-xl border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-xs text-muted-foreground">
                  <tr><th className="px-3 py-2 font-medium">#</th><th className="px-3 py-2 font-medium">{t("cardName")}</th><th className="px-3 py-2 font-medium">{t("rarity")}</th></tr>
                </thead>
                <tbody className="divide-y">
                  {preview.rows.map((row) => <tr key={`${row.number}-${row.name}`}><td className="px-3 py-2 font-mono text-xs">{row.number}</td><td className="px-3 py-2 font-medium">{row.name}</td><td className="px-3 py-2 font-mono text-xs text-muted-foreground">{row.rarity}</td></tr>)}
                </tbody>
              </table>
            </div>
            {preview.total > preview.rows.length ? <p className="mt-2 text-xs text-muted-foreground">{t("previewLimit", { count: preview.rows.length })}</p> : null}
          </section>
        ) : null}

        {!hideResult && state.issues.length > 0 ? (
          <section className="rounded-2xl border bg-card p-5 sm:p-6">
            <h2 className="font-heading text-lg font-semibold">{t("issuesTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("issuesDescription")}</p>
            <ul className="mt-4 max-h-80 divide-y overflow-y-auto rounded-xl border">
              {state.issues.map((issue) => (
                <li className="grid gap-1 px-3 py-2.5 text-xs sm:grid-cols-[4rem_12rem_1fr]" key={`${issue.row}-${issue.card}`}>
                  <span className="font-mono text-muted-foreground">{t("row", { number: issue.row })}</span>
                  <span className="truncate font-medium">{issue.card}</span>
                  <span className="text-muted-foreground">{issue.message}</span>
                </li>
              ))}
            </ul>
            {state.skipped > state.issues.length ? <p className="mt-2 text-xs text-muted-foreground">{t("issuesLimited", { count: state.issues.length })}</p> : null}
          </section>
        ) : null}
      </div>

      <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
        <div className="rounded-2xl border bg-card p-5">
          <h2 className="font-heading text-lg font-semibold">{t("summaryTitle")}</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3"><dt className="text-muted-foreground">{t("selectedSeason")}</dt><dd className="max-w-40 truncate font-medium">{seasons.find((season) => season.id === seasonId)?.label ?? "—"}</dd></div>
            <div className="flex items-center justify-between gap-3"><dt className="text-muted-foreground">{t("selectedFile")}</dt><dd className="max-w-40 truncate font-medium">{fileName || "—"}</dd></div>
            <div className="flex items-center justify-between gap-3 border-t pt-3"><dt className="text-muted-foreground">{t("cardsReady")}</dt><dd className="font-semibold text-safir">{preview?.ready ?? 0}</dd></div>
          </dl>
          <button
            type="submit"
            disabled={!canSubmit}
            onClick={() => setHideResult(true)}
            className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-safir px-4 text-sm font-semibold text-white transition hover:bg-safir/90 disabled:pointer-events-none disabled:opacity-45"
          >
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {pending ? t("importing") : t("submit", { count: preview?.ready ?? 0 })}
          </button>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">{t("duplicateNote")}</p>
        </div>

        <div className="rounded-2xl border bg-muted/25 p-5 text-xs leading-5 text-muted-foreground">
          <p className="font-semibold text-foreground">{t("mappingTitle")}</p>
          <p className="mt-2">{t("mappingDescription")}</p>
          <p className="mt-2">{t("imageNote")}</p>
        </div>
      </aside>
    </form>
  );
}
