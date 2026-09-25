"use client";

import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useState } from "react";

import { FormActions } from "@/components/admin/form-actions";
import { FormSection } from "@/components/admin/form-section";
import { TranslationTabs, type TranslationFormValue } from "@/components/admin/translation-tabs";
import { INITIAL_ADMIN_ACTION_STATE, type AdminActionState } from "@/features/admin/action-state";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { SUPPORTED_LOCALES } from "@/lib/i18n/locales";
import { createSlug } from "@/lib/utils/slug";
import { useRouter } from "@/i18n/navigation";

type FormAction = (state: AdminActionState, formData: FormData) => Promise<AdminActionState>;
interface SetFormValue { id?: string; seasonId: string; slug: string; code: string; releaseDate: string; translations: TranslationFormValue; createdAt?: string; updatedAt?: string }
interface Option { id: string; label: string }
const emptyTranslations = () => Object.fromEntries(SUPPORTED_LOCALES.map((locale) => [locale, { name: "", description: "" }]));

export function SetForm({ action, mode, seasons, initial }: { action: FormAction; mode: "create" | "edit"; seasons: Option[]; initial?: SetFormValue }) {
  const t = useTranslations("Admin.forms");
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, INITIAL_ADMIN_ACTION_STATE);
  const [dirty, setDirty] = useState(false);
  const [autoSlug, setAutoSlug] = useState(mode === "create");
  const [value, setValue] = useState<SetFormValue>(initial ?? { seasonId: seasons[0]?.id ?? "", slug: "", code: "", releaseDate: "", translations: emptyTranslations() });
  useUnsavedChanges(dirty && !pending);
  useEffect(() => { if (state.status === "success") { router.push(`/admin/sets?notice=${encodeURIComponent(state.message ?? t("savedSet"))}`); router.refresh(); } }, [router, state, t]);
  function update(next: Partial<SetFormValue>) { setDirty(true); setValue((current) => ({ ...current, ...next })); }
  function translationsChanged(translations: TranslationFormValue) { update({ translations, ...(autoSlug ? { slug: createSlug(translations.fr?.name ?? "") } : {}) }); }

  return (
    <form action={formAction} className="space-y-5" onChangeCapture={() => setDirty(true)}>
      <input type="hidden" name="payload" value={JSON.stringify({ ...value, code: value.code || undefined })} />
      {state.status === "error" ? <div className="flex gap-2 rounded-xl border border-destructive/25 bg-destructive/7 p-3 text-sm text-destructive" role="alert"><AlertCircle className="size-4" />{state.message}</div> : null}
      <FormSection title={t("general")} description={t("generalSetDescription")}>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2"><label className="admin-label" htmlFor="set-season">{t("season")}</label><select id="set-season" className="admin-input" value={value.seasonId} onChange={(event) => update({ seasonId: event.target.value })}><option value="">{t("selectSeason")}</option>{seasons.map((season) => <option key={season.id} value={season.id}>{season.label}</option>)}</select></div>
          <div className="space-y-2"><label className="admin-label" htmlFor="set-code">{t("code")}</label><input id="set-code" className="admin-input uppercase" maxLength={32} value={value.code} onChange={(event) => update({ code: event.target.value.toUpperCase() })} /></div>
          <div className="space-y-2"><div className="flex justify-between"><label className="admin-label" htmlFor="set-slug">{t("slug")}</label>{mode === "create" ? <label className="text-xs text-muted-foreground"><input className="mr-1" type="checkbox" checked={autoSlug} onChange={(event) => setAutoSlug(event.target.checked)} />{t("auto")}</label> : null}</div><input id="set-slug" className="admin-input" value={value.slug} onChange={(event) => { setAutoSlug(false); update({ slug: event.target.value }); }} /></div>
          <div className="space-y-2"><label className="admin-label" htmlFor="set-release">{t("releaseDate")}</label><input id="set-release" className="admin-input" type="date" value={value.releaseDate} onChange={(event) => update({ releaseDate: event.target.value })} /></div>
        </div>
      </FormSection>
      <FormSection title={t("translations")}><TranslationTabs value={value.translations} onChange={translationsChanged} requiredField="name" fields={[{ key: "name", label: t("name") }, { key: "description", label: t("description"), multiline: true }]} /></FormSection>
      {mode === "edit" && value.id ? <FormSection title={t("systemInformation")}><p className="font-mono text-xs">{t("documentId")}: {value.id}</p></FormSection> : null}
      <FormActions cancelHref="/admin/sets" pending={pending} label={mode === "create" ? t("saveSet") : t("saveChanges")} />
    </form>
  );
}
