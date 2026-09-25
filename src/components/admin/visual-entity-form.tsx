"use client";

import { AlertCircle, ImagePlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

import { FormActions } from "@/components/admin/form-actions";
import { FormSection } from "@/components/admin/form-section";
import { TranslationTabs, type TranslationFormValue } from "@/components/admin/translation-tabs";
import { Badge } from "@/components/ui/badge";
import { INITIAL_ADMIN_ACTION_STATE, type AdminActionState } from "@/features/admin/action-state";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { SUPPORTED_LOCALES } from "@/lib/i18n/locales";
import { createSlug } from "@/lib/utils/slug";

type FormAction = (state: AdminActionState, formData: FormData) => Promise<AdminActionState>;
interface VisualFormValue { id?: string; slug: string; order?: number; translations: TranslationFormValue; visual?: { color?: string; iconStoragePath?: string }; createdAt?: string; updatedAt?: string }
const emptyTranslations = () => Object.fromEntries(SUPPORTED_LOCALES.map((locale) => [locale, { name: "", description: "" }]));

export function VisualEntityForm({ action, mode, kind, initial }: { action: FormAction; mode: "create" | "edit"; kind: "rarity" | "type"; initial?: VisualFormValue }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, INITIAL_ADMIN_ACTION_STATE);
  const [dirty, setDirty] = useState(false);
  const [autoSlug, setAutoSlug] = useState(mode === "create");
  const [value, setValue] = useState<VisualFormValue>(initial ?? { slug: "", ...(kind === "rarity" ? { order: 0 } : {}), translations: emptyTranslations(), visual: { color: "#4D8FA8" } });
  useUnsavedChanges(dirty && !pending);
  const plural = kind === "rarity" ? "rarities" : "types";
  const title = kind === "rarity" ? "Rarity" : "Type";
  useEffect(() => { if (state.status === "success") { router.push(`/admin/${plural}?notice=${encodeURIComponent(state.message ?? `${title} saved.`)}`); router.refresh(); } }, [plural, router, state, title]);
  function update(next: Partial<VisualFormValue>) { setDirty(true); setValue((current) => ({ ...current, ...next })); }
  function translationsChanged(translations: TranslationFormValue) { update({ translations, ...(autoSlug ? { slug: createSlug(translations.fr?.name ?? "") } : {}) }); }
  const color = value.visual?.color ?? "#4D8FA8";
  const label = value.translations.fr?.name || `Untitled ${kind}`;

  return (
    <form action={formAction} className="space-y-5" onChangeCapture={() => setDirty(true)}>
      <input type="hidden" name="payload" value={JSON.stringify(value)} />
      {state.status === "error" ? <div className="flex gap-2 rounded-xl border border-destructive/25 bg-destructive/7 p-3 text-sm text-destructive" role="alert"><AlertCircle className="size-4" />{state.message}</div> : null}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          <FormSection title="General" description={`Configure how this ${kind} is identified and ordered.`}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2"><div className="flex justify-between"><label className="admin-label" htmlFor="visual-slug">Slug</label>{mode === "create" ? <label className="text-xs text-muted-foreground"><input className="mr-1" type="checkbox" checked={autoSlug} onChange={(event) => setAutoSlug(event.target.checked)} />Auto</label> : null}</div><input id="visual-slug" className="admin-input" value={value.slug} onChange={(event) => { setAutoSlug(false); update({ slug: event.target.value }); }} /></div>
              {kind === "rarity" ? <div className="space-y-2"><label className="admin-label" htmlFor="visual-order">Order</label><input id="visual-order" className="admin-input" type="number" min="0" value={value.order ?? 0} onChange={(event) => update({ order: Number(event.target.value) })} /></div> : null}
              <div className="space-y-2"><label className="admin-label" htmlFor="visual-color">Color</label><div className="flex gap-2"><input className="h-10 w-12 cursor-pointer rounded-lg border bg-background p-1" type="color" value={color.slice(0, 7)} onChange={(event) => update({ visual: { ...value.visual, color: event.target.value.toUpperCase() } })} aria-label="Choose color" /><input id="visual-color" className="admin-input font-mono uppercase" value={color} pattern="^#[0-9A-Fa-f]{3,8}$" onChange={(event) => update({ visual: { ...value.visual, color: event.target.value.toUpperCase() } })} /></div><p className="admin-help">Use a hexadecimal color such as #8B5CF6.</p></div>
              <div className="space-y-2"><label className="admin-label" htmlFor="visual-icon">Icon</label><label className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border bg-background px-3 text-sm text-muted-foreground hover:bg-muted"><ImagePlus className="size-4" /><span>Choose image or SVG</span><input id="visual-icon" name="icon" className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml" /></label>{value.visual?.iconStoragePath ? <p className="truncate font-mono text-[10px] text-muted-foreground">{value.visual.iconStoragePath}</p> : null}</div>
            </div>
          </FormSection>
          <FormSection title="Translations"><TranslationTabs value={value.translations} onChange={translationsChanged} requiredField="name" fields={[{ key: "name", label: "Name" }, { key: "description", label: "Description", multiline: true }]} /></FormSection>
          {mode === "edit" && value.id ? <FormSection title="System information"><p className="font-mono text-xs">Document ID: {value.id}</p></FormSection> : null}
        </div>
        <aside className="xl:sticky xl:top-24 xl:self-start">
          <FormSection title={`${title} preview`} description="A quick approximation of the public badge.">
            <div className="grid min-h-32 place-items-center rounded-xl border bg-muted/25 p-6">
              <Badge className="h-8 border px-3 text-sm" variant="outline" style={{ borderColor: color, color, backgroundColor: `${color}18` }}><span className="size-2 rounded-full" style={{ backgroundColor: color }} />{label}</Badge>
            </div>
          </FormSection>
        </aside>
      </div>
      <FormActions cancelHref={`/admin/${plural}`} pending={pending} label={mode === "create" ? `Save ${title}` : "Save changes"} />
    </form>
  );
}
