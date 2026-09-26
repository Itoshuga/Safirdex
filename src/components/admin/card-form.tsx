"use client";

import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Eye,
  ImagePlus,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";

import { ArtworkUpload } from "@/components/admin/artwork-upload";
import { FormActions } from "@/components/admin/form-actions";
import { FormSection } from "@/components/admin/form-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  INITIAL_ADMIN_ACTION_STATE,
  type AdminActionState,
} from "@/features/admin/action-state";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { tokenizeGlossaryContent } from "@/lib/glossary/references";
import { getTranslation } from "@/lib/i18n/get-localized-value";
import {
  DEFAULT_LOCALE,
  LOCALE_CONFIG,
  SUPPORTED_LOCALES,
  type AppLocale,
} from "@/lib/i18n/locales";
import { createSlug } from "@/lib/utils/slug";
import { cn } from "@/lib/utils";
import { useRouter } from "@/i18n/navigation";
import type { CardArtwork, CardOrientation } from "@/types/artwork";
import type { CreateCardInput } from "@/types/card";
import type { GlossaryEntry } from "@/types/glossary";

type GlossaryOption = Pick<GlossaryEntry, "id" | "key" | "translations">;

type CardAction = (
  state: AdminActionState,
  formData: FormData,
) => Promise<AdminActionState>;

interface Option {
  id: string;
  label: string;
  seasonId?: string;
  color?: string;
}

export interface CardFormInitial extends CreateCardInput {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
}

const emptyTranslations = () => Object.fromEntries(
  SUPPORTED_LOCALES.map((locale) => [locale, { name: "", description: "" }]),
);

function defaultCard(seasons: Option[], rarities: Option[]): CardFormInitial {
  return {
    number: 1,
    slug: "",
    seasonId: seasons[0]?.id ?? "",
    setId: null,
    rarityId: rarities[0]?.id ?? "",
    typeIds: [],
    gameplayKind: "combatant",
    factionIds: [],
    attack: 0,
    value: 0,
    defense: 0,
    isCommander: false,
    isPromo: false,
    isFeatured: false,
    translations: emptyTranslations(),
    artwork: { id: "main", storagePath: "", orientation: "vertical", isPrimary: true },
    alternativeArtworks: [],
  };
}

function OrientationPicker({ value, onChange }: { value: CardOrientation; onChange: (value: CardOrientation) => void }) {
  const t = useTranslations("Admin.forms");
  return (
    <div className="grid grid-cols-2 gap-2">
      {(["vertical", "horizontal"] as const).map((orientation) => (
        <button
          key={orientation}
          type="button"
          onClick={() => onChange(orientation)}
          className={cn(
            "flex h-10 items-center justify-center gap-2 rounded-lg border text-sm font-medium capitalize transition",
            value === orientation ? "border-safir bg-safir/8 text-safir ring-2 ring-safir/10" : "bg-background hover:bg-muted",
          )}
        >
          <span className={cn("rounded-sm border-2", orientation === "vertical" ? "h-4 w-3" : "h-3 w-4")} />
          {t(orientation)}
        </button>
      ))}
    </div>
  );
}

function GlossaryDescription({
  locale,
  value,
  onChange,
  glossary,
}: {
  locale: AppLocale;
  value: string;
  onChange: (value: string) => void;
  glossary: GlossaryOption[];
}) {
  const t = useTranslations("Admin.forms");
  const common = useTranslations("Common.actions");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selected, setSelected] = useState("");
  const [preview, setPreview] = useState(false);

  function insertReference() {
    if (!selected) return;
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? value.length;
    const end = textarea?.selectionEnd ?? start;
    const reference = `[[${selected}]]`;
    onChange(`${value.slice(0, start)}${reference}${value.slice(end)}`);
    window.requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(start + reference.length, start + reference.length);
    });
    setSelected("");
  }

  const glossaryByKey = useMemo(
    () => new Map(glossary.map((entry) => [entry.key, entry])),
    [glossary],
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="admin-label" htmlFor={`description-${locale}`}>{t("description")}</label>
        <Button type="button" variant="ghost" size="xs" onClick={() => setPreview((current) => !current)}><Eye /> {preview ? common("edit") : t("preview")}</Button>
      </div>
      {preview ? (
        <div className="min-h-28 rounded-lg border bg-muted/25 px-3 py-2.5 text-sm leading-6">
          {value ? tokenizeGlossaryContent(value).map((token, index) => {
            if (token.type === "text") return <span key={index}>{token.value}</span>;
            const entry = glossaryByKey.get(token.key);
            const translation = getTranslation(entry?.translations, locale);
            return (
              <span
                key={`${token.key}-${index}`}
                className="cursor-help rounded bg-safir/10 px-1 font-medium text-safir underline decoration-dotted underline-offset-2"
                title={translation?.definition ?? t("unknownGlossary", { key: token.key })}
              >
                {translation?.label ?? token.key}
              </span>
            );
          }) : <span className="text-muted-foreground">{t("nothingToPreview")}</span>}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          id={`description-${locale}`}
          className="admin-textarea min-h-36"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={t("cardDescriptionPlaceholder")}
        />
      )}
      <div className="flex flex-col gap-2 rounded-lg border bg-muted/20 p-2 sm:flex-row">
        <select className="admin-input h-8 flex-1" value={selected} onChange={(event) => setSelected(event.target.value)} aria-label={t("glossaryTermLabel")}>
          <option value="">{t("insertGlossary")}</option>
          {glossary.map((entry) => (
            <option key={entry.id} value={entry.key}>{getTranslation(entry.translations, locale)?.label ?? entry.key}</option>
          ))}
        </select>
        <Button type="button" variant="outline" size="sm" onClick={insertReference} disabled={!selected}><Plus /> {t("insert")}</Button>
      </div>
    </div>
  );
}

export function CardForm({
  action,
  mode,
  initial,
  seasons,
  sets,
  rarities,
  types,
  factions,
  glossary,
}: {
  action: CardAction;
  mode: "create" | "edit";
  initial?: CardFormInitial;
  seasons: Option[];
  sets: Option[];
  rarities: Option[];
  types: Option[];
  factions: Option[];
  glossary: GlossaryOption[];
}) {
  const t = useTranslations("Admin.forms");
  const stats = useTranslations("Cards.stats");
  const status = useTranslations("Admin.status");
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, INITIAL_ADMIN_ACTION_STATE);
  const [value, setValue] = useState<CardFormInitial>(initial ?? defaultCard(seasons, rarities));
  const [primaryLocale, setPrimaryLocale] = useState<AppLocale>(DEFAULT_LOCALE);
  const [activeLocale, setActiveLocale] = useState<AppLocale>(DEFAULT_LOCALE);
  const [dirty, setDirty] = useState(false);
  const [slugAutomatic, setSlugAutomatic] = useState(mode === "create");
  const [setResetNotice, setSetResetNotice] = useState(false);
  useUnsavedChanges(dirty && !pending);

  useEffect(() => {
    if (state.status !== "success") return;
    const notice = encodeURIComponent(state.message ?? t("savedCard"));
    router.push(`/admin/cards?notice=${notice}`);
    router.refresh();
  }, [router, state, t]);

  const availableSets = sets.filter((set) => set.seasonId === value.seasonId);

  function update<K extends keyof CardFormInitial>(key: K, next: CardFormInitial[K]) {
    setDirty(true);
    setValue((current) => ({ ...current, [key]: next }));
  }

  function updateTranslation(locale: AppLocale, field: "name" | "description", next: string) {
    setDirty(true);
    setValue((current) => ({
      ...current,
      translations: {
        ...current.translations,
        [locale]: { ...current.translations[locale], [field]: next },
      },
      ...(field === "name" && locale === primaryLocale && slugAutomatic
        ? { slug: createSlug(next) }
        : {}),
    }));
  }

  function addAlternative() {
    const id = `alt_${crypto.randomUUID().replaceAll("-", "")}`;
    update("alternativeArtworks", [
      ...value.alternativeArtworks,
      { id, storagePath: "", orientation: "vertical", order: value.alternativeArtworks.length },
    ]);
  }

  function updateAlternative(id: string, patch: Partial<CardArtwork>) {
    update("alternativeArtworks", value.alternativeArtworks.map((artwork) => artwork.id === id ? { ...artwork, ...patch } : artwork));
  }

  function removeAlternative(id: string) {
    update("alternativeArtworks", value.alternativeArtworks.filter((artwork) => artwork.id !== id));
  }

  function moveAlternative(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= value.alternativeArtworks.length) return;
    const next = [...value.alternativeArtworks];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    update("alternativeArtworks", next.map((artwork, order) => ({ ...artwork, order })));
  }

  const payload = { ...value, primaryLocale };
  const fieldError = (path: string) => state.fieldErrors?.[path];

  return (
    <form action={formAction} className="space-y-5" onChangeCapture={() => setDirty(true)}>
      <input type="hidden" name="payload" value={JSON.stringify(payload)} />
      {state.status === "error" ? (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/7 px-4 py-3 text-sm text-destructive" role="alert">
          <AlertCircle className="mt-0.5 size-4 shrink-0" /> {state.message}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          <FormSection title={t("general")} description={t("coreIdentifiers")}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="admin-label" htmlFor="card-number">{t("number")}</label>
                <input id="card-number" className="admin-input" type="number" min="0" value={value.number} onChange={(event) => update("number", Number(event.target.value))} />
                {fieldError("number") ? <p className="admin-error">{fieldError("number")}</p> : null}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="admin-label" htmlFor="card-slug">{t("slug")}</label>
                  {mode === "create" ? (
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground"><input type="checkbox" checked={slugAutomatic} onChange={(event) => setSlugAutomatic(event.target.checked)} /> {t("auto")}</label>
                  ) : null}
                </div>
                <input id="card-slug" className="admin-input" value={value.slug} onChange={(event) => { setSlugAutomatic(false); update("slug", event.target.value); }} />
                {fieldError("slug") ? <p className="admin-error">{fieldError("slug")}</p> : null}
              </div>
              <div className="space-y-2">
                <label className="admin-label" htmlFor="card-season">{t("season")}</label>
                <select
                  id="card-season"
                  className="admin-input"
                  value={value.seasonId}
                  onChange={(event) => {
                    const nextSeason = event.target.value;
                    const currentSetValid = sets.some((set) => set.id === value.setId && set.seasonId === nextSeason);
                    update("seasonId", nextSeason);
                    if (!currentSetValid && value.setId) {
                      update("setId", null);
                      setSetResetNotice(true);
                    }
                  }}
                >
                  <option value="">{t("selectSeason")}</option>
                  {seasons.map((season) => <option value={season.id} key={season.id}>{season.label}</option>)}
                </select>
                {fieldError("seasonId") ? <p className="admin-error">{t("selectSeasonError")}</p> : null}
              </div>
              <div className="space-y-2">
                <label className="admin-label" htmlFor="card-set">{t("set")} <span className="font-normal text-muted-foreground">({t("optional")})</span></label>
                <select id="card-set" className="admin-input" value={value.setId ?? ""} onChange={(event) => { update("setId", event.target.value || null); setSetResetNotice(false); }} disabled={!value.seasonId}>
                  <option value="">{t("selectSet")}</option>
                  {availableSets.map((set) => <option value={set.id} key={set.id}>{set.label}</option>)}
                </select>
                {setResetNotice ? <p className="text-xs text-amber-600 dark:text-amber-400">{t("setReset")}</p> : null}
              </div>
            </div>
          </FormSection>

          <FormSection title={t("classification")} description={t("classificationDescription")}>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="admin-label" htmlFor="card-rarity">{t("rarity")}</label>
                <select id="card-rarity" className="admin-input" value={value.rarityId} onChange={(event) => update("rarityId", event.target.value)}>
                  <option value="">{t("selectRarity")}</option>
                  {rarities.map((rarity) => <option key={rarity.id} value={rarity.id}>{rarity.label}</option>)}
                </select>
              </div>
              <fieldset className="space-y-3">
                <legend className="admin-label">{t("types")}</legend>
                <div className="flex min-h-10 flex-wrap gap-2 rounded-lg border bg-background p-2">
                  {types.map((type) => {
                    const selected = value.typeIds.includes(type.id);
                    return (
                      <button
                        type="button"
                        key={type.id}
                        onClick={() => update("typeIds", selected ? value.typeIds.filter((id) => id !== type.id) : [...value.typeIds, type.id])}
                        className={cn("rounded-md border px-2.5 py-1 text-xs font-medium transition", selected ? "border-safir/40 bg-safir/10 text-safir" : "text-muted-foreground hover:bg-muted")}
                        aria-pressed={selected}
                      >
                        {selected ? <CheckCircle2 className="mr-1 inline size-3" /> : null}{type.label}
                      </button>
                    );
                  })}
                </div>
                {value.typeIds.length ? <div className="flex flex-wrap gap-1.5">{value.typeIds.map((id) => <Badge variant="secondary" key={id}>{types.find((type) => type.id === id)?.label ?? id}</Badge>)}</div> : <p className="admin-help">{t("noType")}</p>}
              </fieldset>
              <div className="space-y-2">
                <label className="admin-label" htmlFor="card-gameplay-kind">{t("gameplayKind")}</label>
                <select
                  id="card-gameplay-kind"
                  className="admin-input"
                  value={value.gameplayKind}
                  onChange={(event) => {
                    const gameplayKind = event.target.value as CardFormInitial["gameplayKind"];
                    update("gameplayKind", gameplayKind);
                    update("isCommander", gameplayKind === "commander");
                  }}
                >
                  {(["combatant", "spell", "token", "commander"] as const).map((kind) => (
                    <option key={kind} value={kind}>{t(`gameplayKinds.${kind}`)}</option>
                  ))}
                </select>
              </div>
              <fieldset className="space-y-3">
                <legend className="admin-label">{t("factions")}</legend>
                <div className="flex min-h-10 flex-wrap gap-2 rounded-lg border bg-background p-2">
                  {factions.map((faction) => {
                    const selected = value.factionIds.includes(faction.id);
                    return (
                      <button
                        type="button"
                        key={faction.id}
                        onClick={() => update("factionIds", selected ? value.factionIds.filter((id) => id !== faction.id) : [...value.factionIds, faction.id])}
                        className={cn("rounded-md border px-2.5 py-1 text-xs font-medium transition", selected ? "border-safir/40 bg-safir/10 text-safir" : "text-muted-foreground hover:bg-muted")}
                        aria-pressed={selected}
                      >
                        {selected ? <CheckCircle2 className="mr-1 inline size-3" /> : null}{faction.label}
                      </button>
                    );
                  })}
                </div>
                {factions.length === 0 ? <p className="admin-help">{t("noFactionConfigured")}</p> : null}
              </fieldset>
            </div>
          </FormSection>

          <FormSection title={t("statistics")} description={t("statsDescription")}>
            <div className="grid gap-4 sm:grid-cols-3">
              {(["attack", "value", "defense"] as const).map((stat) => {
                const invalid = value[stat] < 0 || value[stat] > 9 || !Number.isInteger(value[stat]);
                return (
                  <div className="rounded-xl border bg-muted/20 p-4" key={stat}>
                    <label className="mb-3 block text-xs font-semibold tracking-[0.12em] uppercase" htmlFor={`stat-${stat}`}>{stats(stat)}</label>
                    <input id={`stat-${stat}`} className="admin-input h-12 text-center text-xl font-semibold" type="number" min="0" max="9" step="1" value={value[stat]} aria-invalid={invalid} onChange={(event) => update(stat, Number(event.target.value))} />
                    {invalid ? <p className="admin-error mt-2">{t("statRange")}</p> : null}
                  </div>
                );
              })}
            </div>
          </FormSection>

          <FormSection title={t("cardFlags")} description={t("cardFlagsDescription")}>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["isCommander", status("commander"), t("commanderHelp")],
                ["isPromo", status("promo"), t("promoHelp")],
                ["isFeatured", status("featured"), t("featuredCardHelp")],
              ].map(([key, label, description]) => (
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4 hover:bg-muted/25" key={key}>
                  <input className="mt-1 size-4 accent-safir" type="checkbox" checked={Boolean(value[key as keyof CardFormInitial])} onChange={(event) => { update(key as "isCommander", event.target.checked); if (key === "isCommander") update("gameplayKind", event.target.checked ? "commander" : "combatant"); }} />
                  <span><span className="block text-sm font-medium">{label}</span><span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{description}</span></span>
                </label>
              ))}
            </div>
          </FormSection>

          <FormSection title={t("translations")} description={t("cardTranslationsDescription")}>
            <div className="mb-5 max-w-xs space-y-2">
              <label className="admin-label" htmlFor="primary-locale">{t("primaryLanguage")}</label>
              <select id="primary-locale" className="admin-input" value={primaryLocale} onChange={(event) => setPrimaryLocale(event.target.value as AppLocale)}>
                {SUPPORTED_LOCALES.map((locale) => <option key={locale} value={locale}>{LOCALE_CONFIG[locale].label}</option>)}
              </select>
            </div>
            <div className="mb-5 flex gap-1 border-b" role="tablist">
              {SUPPORTED_LOCALES.map((locale) => {
                const complete = Boolean(value.translations[locale]?.name.trim() && value.translations[locale]?.description.trim());
                return (
                  <button type="button" role="tab" aria-selected={activeLocale === locale} key={locale} onClick={() => setActiveLocale(locale)} className={cn("relative flex h-10 items-center gap-2 px-3 text-sm font-medium text-muted-foreground", activeLocale === locale && "text-foreground after:absolute after:inset-x-1 after:-bottom-px after:h-0.5 after:bg-safir")}>
                    {LOCALE_CONFIG[locale].label}
                    {complete ? <CheckCircle2 className="size-3.5 text-emerald-500" /> : <AlertCircle className="size-3.5 text-amber-500" />}
                  </button>
                );
              })}
            </div>
            {SUPPORTED_LOCALES.map((locale) => (
              <div className="space-y-5" key={locale} hidden={activeLocale !== locale} role="tabpanel">
                <div className="space-y-2">
                  <label className="admin-label" htmlFor={`name-${locale}`}>{t("name")}</label>
                  <input id={`name-${locale}`} className="admin-input" value={value.translations[locale]?.name ?? ""} onChange={(event) => updateTranslation(locale, "name", event.target.value)} />
                </div>
                <GlossaryDescription locale={locale} value={value.translations[locale]?.description ?? ""} onChange={(next) => updateTranslation(locale, "description", next)} glossary={glossary} />
              </div>
            ))}
          </FormSection>

          <FormSection title={t("alternativeArtworks")} description={t("alternativeArtworksHelp")}>
            <div className="space-y-4">
              {value.alternativeArtworks.map((artwork, index) => (
                <div className="rounded-xl border bg-muted/15 p-4" key={artwork.id}>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div><p className="text-sm font-semibold">{t("alternativeNumber", { number: index + 1 })}</p><p className="font-mono text-[10px] text-muted-foreground">{artwork.id}</p></div>
                    <div className="flex gap-1">
                      <Button type="button" variant="ghost" size="icon-sm" disabled={index === 0} onClick={() => moveAlternative(index, -1)} aria-label={t("moveUp")}><ArrowUp /></Button>
                      <Button type="button" variant="ghost" size="icon-sm" disabled={index === value.alternativeArtworks.length - 1} onClick={() => moveAlternative(index, 1)} aria-label={t("moveDown")}><ArrowDown /></Button>
                      <Button type="button" variant="destructive" size="icon-sm" onClick={() => removeAlternative(artwork.id)} aria-label={t("removeArtwork")}><Trash2 /></Button>
                    </div>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_15rem]">
                    <ArtworkUpload compact name={`alternativeArtwork:${artwork.id}`} storagePath={artwork.storagePath} sourceUrl={artwork.url} orientation={artwork.orientation} onRemove={() => removeAlternative(artwork.id)} />
                    <div className="space-y-3"><p className="admin-label">{t("orientation")}</p><OrientationPicker value={artwork.orientation} onChange={(orientation) => updateAlternative(artwork.id, { orientation })} /><p className="admin-help">{t("order")}: {index}</p></div>
                  </div>
                </div>
              ))}
              {value.alternativeArtworks.length === 0 ? <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">{t("noAlternativeArtwork")}</p> : null}
              <Button type="button" variant="outline" onClick={addAlternative}><ImagePlus /> {t("addAlternativeArtwork")}</Button>
            </div>
          </FormSection>

          {mode === "edit" && value.id ? (
            <FormSection title={t("systemInformation")} description={t("systemInformationHelp")}>
              <dl className="grid gap-4 text-sm sm:grid-cols-3">
                <div><dt className="text-xs text-muted-foreground">{t("documentId")}</dt><dd className="mt-1 break-all font-mono text-xs">{value.id}</dd></div>
                <div><dt className="text-xs text-muted-foreground">{t("created")}</dt><dd className="mt-1">{value.createdAt ?? "—"}</dd></div>
                <div><dt className="text-xs text-muted-foreground">{t("updated")}</dt><dd className="mt-1">{value.updatedAt ?? "—"}</dd></div>
              </dl>
            </FormSection>
          ) : null}
        </div>

        <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <FormSection title={t("mainArtwork")} description={t("mainArtworkHelp")}>
            <div className="space-y-4">
              <OrientationPicker value={value.artwork.orientation} onChange={(orientation) => update("artwork", { ...value.artwork, orientation })} />
              <ArtworkUpload name="mainArtwork" storagePath={value.artwork.storagePath} sourceUrl={value.artwork.url} orientation={value.artwork.orientation} onRemove={() => update("artwork", { ...value.artwork, storagePath: "", url: undefined })} />
              {!value.artwork.storagePath && fieldError("artwork.storagePath") ? <p className="admin-error">{t("artworkRequired")}</p> : null}
            </div>
          </FormSection>
          <div className="rounded-xl border bg-safir/5 p-4 text-sm">
            <p className="flex items-center gap-2 font-semibold text-safir"><Sparkles className="size-4" /> {t("cardSummary")}</p>
            <p className="mt-2 font-heading text-xl font-semibold">{value.translations[primaryLocale]?.name || t("untitledCard")}</p>
            <p className="mt-1 text-xs text-muted-foreground">#{String(value.number).padStart(3, "0")} · A {value.attack} / V {value.value} / D {value.defense}</p>
          </div>
        </aside>
      </div>
      <FormActions cancelHref="/admin/cards" pending={pending} label={mode === "create" ? t("saveCard") : t("saveChanges")} />
    </form>
  );
}
