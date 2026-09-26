"use client";

import { AlertCircle, ImagePlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useState } from "react";

import { FormActions } from "@/components/admin/form-actions";
import { FormSection } from "@/components/admin/form-section";
import { TranslationTabs, type TranslationFormValue } from "@/components/admin/translation-tabs";
import { Badge } from "@/components/ui/badge";
import { INITIAL_ADMIN_ACTION_STATE, type AdminActionState } from "@/features/admin/action-state";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { SUPPORTED_LOCALES } from "@/lib/i18n/locales";
import { createSlug } from "@/lib/utils/slug";
import { useRouter } from "@/i18n/navigation";

type FormAction = (state: AdminActionState, formData: FormData) => Promise<AdminActionState>;
interface VisualFormValue { id?: string; slug: string; order?: number; translations: TranslationFormValue; visual?: { color?: string; iconStoragePath?: string }; createdAt?: string; updatedAt?: string }
const emptyTranslations = () => Object.fromEntries(SUPPORTED_LOCALES.map((locale) => [locale, { name: "", description: "" }]));

export function VisualEntityForm({ action, mode, kind, initial }: { action: FormAction; mode: "create" | "edit"; kind: "rarity" | "type" | "faction"; initial?: VisualFormValue }) {
  const t = useTranslations("Admin.forms");
  const entities = useTranslations("Admin.entities");
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, INITIAL_ADMIN_ACTION_STATE);
  const [dirty, setDirty] = useState(false);
  const [autoSlug, setAutoSlug] = useState(mode === "create");
  const [value, setValue] = useState<VisualFormValue>(initial ?? { slug: "", ...(kind === "rarity" ? { order: 0 } : {}), translations: emptyTranslations(), visual: { color: "#4D8FA8" } });
  useUnsavedChanges(dirty && !pending);
  const plural = kind === "rarity" ? "rarities" : kind === "faction" ? "factions" : "types";
  const title = kind === "rarity" ? entities("rarity") : kind === "faction" ? entities("faction") : entities("type");
  useEffect(() => { if (state.status === "success") { router.push(`/admin/${plural}?notice=${encodeURIComponent(state.message ?? (kind === "rarity" ? t("saveRarity") : kind === "faction" ? t("saveFaction") : t("saveType")))}`); router.refresh(); } }, [kind, plural, router, state, t]);
  function update(next: Partial<VisualFormValue>) { setDirty(true); setValue((current) => ({ ...current, ...next })); }
  function translationsChanged(translations: TranslationFormValue) { update({ translations, ...(autoSlug ? { slug: createSlug(translations.fr?.name ?? "") } : {}) }); }
  const color = value.visual?.color ?? "#4D8FA8";
  const label = value.translations.fr?.name || t("untitledEntity", { entity: title });

  return (
    <form action={formAction} className="space-y-5" onChangeCapture={() => setDirty(true)}>
      <input type="hidden" name="payload" value={JSON.stringify(value)} />
      {state.status === "error" ? <div className="flex gap-2 rounded-xl border border-destructive/25 bg-destructive/7 p-3 text-sm text-destructive" role="alert"><AlertCircle className="size-4" />{state.message}</div> : null}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          <FormSection title={t("general")} description={t("visualGeneralDescription")}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2"><div className="flex justify-between"><label className="admin-label" htmlFor="visual-slug">{t("slug")}</label>{mode === "create" ? <label className="text-xs text-muted-foreground"><input className="mr-1" type="checkbox" checked={autoSlug} onChange={(event) => setAutoSlug(event.target.checked)} />{t("auto")}</label> : null}</div><input id="visual-slug" className="admin-input" value={value.slug} onChange={(event) => { setAutoSlug(false); update({ slug: event.target.value }); }} /></div>
              {kind === "rarity" ? <div className="space-y-2"><label className="admin-label" htmlFor="visual-order">{t("order")}</label><input id="visual-order" className="admin-input" type="number" min="0" value={value.order ?? 0} onChange={(event) => update({ order: Number(event.target.value) })} /></div> : null}
              <div className="space-y-2"><label className="admin-label" htmlFor="visual-color">{t("color")}</label><div className="flex gap-2"><input className="h-10 w-12 cursor-pointer rounded-lg border bg-background p-1" type="color" value={color.slice(0, 7)} onChange={(event) => update({ visual: { ...value.visual, color: event.target.value.toUpperCase() } })} aria-label={t("chooseColor")} /><input id="visual-color" className="admin-input font-mono uppercase" value={color} pattern="^#[0-9A-Fa-f]{3,8}$" onChange={(event) => update({ visual: { ...value.visual, color: event.target.value.toUpperCase() } })} /></div><p className="admin-help">{t("colorHelp")}</p></div>
              <div className="space-y-2"><label className="admin-label" htmlFor="visual-icon">{t("icon")}</label><label className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border bg-background px-3 text-sm text-muted-foreground hover:bg-muted"><ImagePlus className="size-4" /><span>{t("chooseImage")}</span><input id="visual-icon" name="icon" className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml" /></label>{value.visual?.iconStoragePath ? <p className="truncate font-mono text-[10px] text-muted-foreground">{value.visual.iconStoragePath}</p> : null}</div>
            </div>
          </FormSection>
          <FormSection title={t("translations")}><TranslationTabs value={value.translations} onChange={translationsChanged} requiredField="name" fields={[{ key: "name", label: t("name") }, { key: "description", label: t("description"), multiline: true }]} /></FormSection>
          {mode === "edit" && value.id ? <FormSection title={t("systemInformation")}><p className="font-mono text-xs">{t("documentId")}: {value.id}</p></FormSection> : null}
        </div>
        <aside className="xl:sticky xl:top-24 xl:self-start">
          <FormSection title={t("visualPreview", { entity: title })} description={t("visualPreviewDescription")}>
            <div className="grid min-h-32 place-items-center rounded-xl border bg-muted/25 p-6">
              <Badge className="h-8 border px-3 text-sm" variant="outline" style={{ borderColor: color, color, backgroundColor: `${color}18` }}><span className="size-2 rounded-full" style={{ backgroundColor: color }} />{label}</Badge>
            </div>
          </FormSection>
        </aside>
      </div>
      <FormActions cancelHref={`/admin/${plural}`} pending={pending} label={mode === "create" ? (kind === "rarity" ? t("saveRarity") : kind === "faction" ? t("saveFaction") : t("saveType")) : t("saveChanges")} />
    </form>
  );
}
