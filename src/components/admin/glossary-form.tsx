"use client";

import { AlertCircle, Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useState } from "react";

import { FormActions } from "@/components/admin/form-actions";
import { FormSection } from "@/components/admin/form-section";
import { TranslationTabs, type TranslationFormValue } from "@/components/admin/translation-tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { INITIAL_ADMIN_ACTION_STATE, type AdminActionState } from "@/features/admin/action-state";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { SUPPORTED_LOCALES } from "@/lib/i18n/locales";
import { createSlug } from "@/lib/utils/slug";
import { useRouter } from "@/i18n/navigation";

type FormAction = (state: AdminActionState, formData: FormData) => Promise<AdminActionState>;
interface GlossaryFormValue { id?: string; key: string; slug: string; translations: TranslationFormValue; createdAt?: string; updatedAt?: string }
const emptyTranslations = () => Object.fromEntries(SUPPORTED_LOCALES.map((locale) => [locale, { label: "", definition: "" }]));

export function GlossaryForm({ action, mode, initial }: { action: FormAction; mode: "create" | "edit"; initial?: GlossaryFormValue }) {
  const t = useTranslations("Admin.forms");
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, INITIAL_ADMIN_ACTION_STATE);
  const [dirty, setDirty] = useState(false);
  const [value, setValue] = useState<GlossaryFormValue>(initial ?? { key: "", slug: "", translations: emptyTranslations() });
  useUnsavedChanges(dirty && !pending);
  const keyChanged = mode === "edit" && initial && value.key !== initial.key;
  useEffect(() => { if (state.status === "success") { router.push(`/admin/glossary?notice=${encodeURIComponent(state.message ?? t("savedEntry"))}`); router.refresh(); } }, [router, state, t]);
  function update(next: Partial<GlossaryFormValue>) { setDirty(true); setValue((current) => ({ ...current, ...next })); }
  const preview = value.translations.en?.label ? value.translations.en : value.translations.fr;

  return (
    <form action={formAction} className="space-y-5" onChangeCapture={() => setDirty(true)}>
      <input type="hidden" name="payload" value={JSON.stringify(value)} />
      {state.status === "error" ? <div className="flex gap-2 rounded-xl border border-destructive/25 bg-destructive/7 p-3 text-sm text-destructive" role="alert"><AlertCircle className="size-4" />{state.message}</div> : null}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          <FormSection title={t("identity")} description={t("stableKeyDescription")}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2"><label className="admin-label" htmlFor="glossary-key">{t("key")}</label><input id="glossary-key" className="admin-input font-mono" value={value.key} onChange={(event) => update({ key: createSlug(event.target.value) })} /><p className="admin-help">{t("keyReference", { key: value.key || "key" })}</p>{keyChanged ? <p className="flex gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400"><AlertCircle className="size-3.5 shrink-0" />{t("keyWarning")}</p> : null}</div>
              <div className="space-y-2"><label className="admin-label" htmlFor="glossary-slug">{t("slug")}</label><input id="glossary-slug" className="admin-input" value={value.slug} onChange={(event) => update({ slug: createSlug(event.target.value) })} /></div>
            </div>
          </FormSection>
          <FormSection title={t("translations")}><TranslationTabs value={value.translations} onChange={(translations) => update({ translations })} requiredField="label" fields={[{ key: "label", label: t("label") }, { key: "definition", label: t("definition"), multiline: true }]} /></FormSection>
          {mode === "edit" && value.id ? <FormSection title={t("systemInformation")}><p className="font-mono text-xs">{t("documentId")}: {value.id}</p></FormSection> : null}
        </div>
        <aside className="xl:sticky xl:top-24 xl:self-start">
          <FormSection title={t("tooltipPreview")} description={t("tooltipPreviewHelp")}>
            <div className="grid min-h-32 place-items-center rounded-xl border bg-muted/25">
              <Tooltip>
                <TooltipTrigger className="inline-flex items-center gap-1 rounded-md bg-safir/10 px-2 py-1 text-sm font-semibold text-safir underline decoration-dotted underline-offset-2">{preview?.label || t("glossaryTerm")}<Info className="size-3" /></TooltipTrigger>
                <TooltipContent>{preview?.definition || t("definitionPreview")}</TooltipContent>
              </Tooltip>
            </div>
          </FormSection>
        </aside>
      </div>
      <FormActions cancelHref="/admin/glossary" pending={pending} label={mode === "create" ? t("saveEntry") : t("saveChanges")} />
    </form>
  );
}
