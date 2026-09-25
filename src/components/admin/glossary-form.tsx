"use client";

import { AlertCircle, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

import { FormActions } from "@/components/admin/form-actions";
import { FormSection } from "@/components/admin/form-section";
import { TranslationTabs, type TranslationFormValue } from "@/components/admin/translation-tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { INITIAL_ADMIN_ACTION_STATE, type AdminActionState } from "@/features/admin/action-state";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { SUPPORTED_LOCALES } from "@/lib/i18n/locales";
import { createSlug } from "@/lib/utils/slug";

type FormAction = (state: AdminActionState, formData: FormData) => Promise<AdminActionState>;
interface GlossaryFormValue { id?: string; key: string; slug: string; translations: TranslationFormValue; createdAt?: string; updatedAt?: string }
const emptyTranslations = () => Object.fromEntries(SUPPORTED_LOCALES.map((locale) => [locale, { label: "", definition: "" }]));

export function GlossaryForm({ action, mode, initial }: { action: FormAction; mode: "create" | "edit"; initial?: GlossaryFormValue }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, INITIAL_ADMIN_ACTION_STATE);
  const [dirty, setDirty] = useState(false);
  const [value, setValue] = useState<GlossaryFormValue>(initial ?? { key: "", slug: "", translations: emptyTranslations() });
  useUnsavedChanges(dirty && !pending);
  const keyChanged = mode === "edit" && initial && value.key !== initial.key;
  useEffect(() => { if (state.status === "success") { router.push(`/admin/glossary?notice=${encodeURIComponent(state.message ?? "Glossary entry saved.")}`); router.refresh(); } }, [router, state]);
  function update(next: Partial<GlossaryFormValue>) { setDirty(true); setValue((current) => ({ ...current, ...next })); }
  const preview = value.translations.en?.label ? value.translations.en : value.translations.fr;

  return (
    <form action={formAction} className="space-y-5" onChangeCapture={() => setDirty(true)}>
      <input type="hidden" name="payload" value={JSON.stringify(value)} />
      {state.status === "error" ? <div className="flex gap-2 rounded-xl border border-destructive/25 bg-destructive/7 p-3 text-sm text-destructive" role="alert"><AlertCircle className="size-4" />{state.message}</div> : null}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          <FormSection title="Identity" description="The stable key is what card descriptions reference.">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2"><label className="admin-label" htmlFor="glossary-key">Key</label><input id="glossary-key" className="admin-input font-mono" value={value.key} onChange={(event) => update({ key: createSlug(event.target.value) })} /><p className="admin-help">Cards insert this as [[{value.key || "key"}]].</p>{keyChanged ? <p className="flex gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400"><AlertCircle className="size-3.5 shrink-0" />Changing a used key can break existing card references.</p> : null}</div>
              <div className="space-y-2"><label className="admin-label" htmlFor="glossary-slug">Slug</label><input id="glossary-slug" className="admin-input" value={value.slug} onChange={(event) => update({ slug: createSlug(event.target.value) })} /></div>
            </div>
          </FormSection>
          <FormSection title="Translations"><TranslationTabs value={value.translations} onChange={(translations) => update({ translations })} requiredField="label" fields={[{ key: "label", label: "Label" }, { key: "definition", label: "Definition", multiline: true }]} /></FormSection>
          {mode === "edit" && value.id ? <FormSection title="System information"><p className="font-mono text-xs">Document ID: {value.id}</p></FormSection> : null}
        </div>
        <aside className="xl:sticky xl:top-24 xl:self-start">
          <FormSection title="Tooltip preview" description="Hover or focus the term to inspect its definition.">
            <div className="grid min-h-32 place-items-center rounded-xl border bg-muted/25">
              <Tooltip>
                <TooltipTrigger className="inline-flex items-center gap-1 rounded-md bg-safir/10 px-2 py-1 text-sm font-semibold text-safir underline decoration-dotted underline-offset-2">{preview?.label || "Glossary term"}<Info className="size-3" /></TooltipTrigger>
                <TooltipContent>{preview?.definition || "Add a definition to preview the tooltip."}</TooltipContent>
              </Tooltip>
            </div>
          </FormSection>
        </aside>
      </div>
      <FormActions cancelHref="/admin/glossary" pending={pending} label={mode === "create" ? "Save Entry" : "Save changes"} />
    </form>
  );
}
