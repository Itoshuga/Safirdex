"use client";

import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useState } from "react";

import { ArtworkUpload } from "@/components/admin/artwork-upload";
import { FormActions } from "@/components/admin/form-actions";
import { FormSection } from "@/components/admin/form-section";
import {
  TranslationTabs,
  type TranslationFormValue,
} from "@/components/admin/translation-tabs";
import {
  INITIAL_ADMIN_ACTION_STATE,
  type AdminActionState,
} from "@/features/admin/action-state";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { SUPPORTED_LOCALES } from "@/lib/i18n/locales";
import { createSlug } from "@/lib/utils/slug";
import { useRouter } from "@/i18n/navigation";

type FormAction = (state: AdminActionState, formData: FormData) => Promise<AdminActionState>;

export interface SeasonFormValue {
  id?: string;
  number: number;
  slug: string;
  releaseDate: string;
  isActive: boolean;
  isFeatured: boolean;
  artwork?: { storagePath: string; url?: string };
  translations: TranslationFormValue;
  createdAt?: string;
  updatedAt?: string;
}

const emptyTranslations = () => Object.fromEntries(SUPPORTED_LOCALES.map((locale) => [locale, { name: "", description: "" }]));

export function SeasonForm({ action, mode, initial }: { action: FormAction; mode: "create" | "edit"; initial?: SeasonFormValue }) {
  const t = useTranslations("Admin.forms");
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, INITIAL_ADMIN_ACTION_STATE);
  const [dirty, setDirty] = useState(false);
  const [autoSlug, setAutoSlug] = useState(mode === "create");
  const [value, setValue] = useState<SeasonFormValue>(initial ?? {
    number: 1,
    slug: "",
    releaseDate: "",
    isActive: true,
    isFeatured: false,
    translations: emptyTranslations(),
  });
  useUnsavedChanges(dirty && !pending);

  useEffect(() => {
    if (state.status !== "success") return;
    router.push(`/admin/seasons?notice=${encodeURIComponent(state.message ?? t("savedSeason"))}`);
    router.refresh();
  }, [router, state, t]);

  function update(next: Partial<SeasonFormValue>) {
    setDirty(true);
    setValue((current) => ({ ...current, ...next }));
  }

  function setTranslations(translations: TranslationFormValue) {
    const name = translations.fr?.name ?? "";
    update({ translations, ...(autoSlug ? { slug: createSlug(name) } : {}) });
  }

  return (
    <form action={formAction} className="space-y-5" onChangeCapture={() => setDirty(true)}>
      <input type="hidden" name="payload" value={JSON.stringify(value)} />
      {state.status === "error" ? <div className="flex gap-2 rounded-xl border border-destructive/25 bg-destructive/7 p-3 text-sm text-destructive" role="alert"><AlertCircle className="size-4 shrink-0" />{state.message}</div> : null}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          <FormSection title={t("general")} description={t("generalSeasonDescription")}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2"><label className="admin-label" htmlFor="season-number">{t("number")}</label><input id="season-number" className="admin-input" type="number" min="1" value={value.number} onChange={(event) => update({ number: Number(event.target.value) })} /></div>
              <div className="space-y-2">
                <div className="flex items-center justify-between"><label className="admin-label" htmlFor="season-slug">{t("slug")}</label>{mode === "create" ? <label className="text-xs text-muted-foreground"><input className="mr-1" type="checkbox" checked={autoSlug} onChange={(event) => setAutoSlug(event.target.checked)} />{t("auto")}</label> : null}</div>
                <input id="season-slug" className="admin-input" value={value.slug} onChange={(event) => { setAutoSlug(false); update({ slug: event.target.value }); }} />
              </div>
              <div className="space-y-2"><label className="admin-label" htmlFor="season-release">{t("releaseDate")}</label><input id="season-release" className="admin-input" type="date" value={value.releaseDate} onChange={(event) => update({ releaseDate: event.target.value })} /></div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer gap-3 rounded-xl border p-4"><input className="mt-1 size-4 accent-safir" type="checkbox" checked={value.isActive} onChange={(event) => update({ isActive: event.target.checked })} /><span><span className="block text-sm font-medium">{t("active")}</span><span className="admin-help">{t("activeHelp")}</span></span></label>
              <label className="flex cursor-pointer gap-3 rounded-xl border p-4"><input className="mt-1 size-4 accent-safir" type="checkbox" checked={value.isFeatured} onChange={(event) => update({ isFeatured: event.target.checked })} /><span><span className="block text-sm font-medium">{t("featured")}</span><span className="admin-help">{t("featuredHelp")}</span></span></label>
            </div>
          </FormSection>
          <FormSection title={t("translations")} description={t("translationDescription")}>
            <TranslationTabs value={value.translations} onChange={setTranslations} requiredField="name" fields={[{ key: "name", label: t("name") }, { key: "description", label: t("description"), multiline: true }]} />
          </FormSection>
          {mode === "edit" && value.id ? <FormSection title={t("systemInformation")}><dl className="grid gap-4 text-sm sm:grid-cols-3"><div><dt className="admin-help">{t("documentId")}</dt><dd className="mt-1 break-all font-mono text-xs">{value.id}</dd></div><div><dt className="admin-help">{t("created")}</dt><dd>{value.createdAt ?? "—"}</dd></div><div><dt className="admin-help">{t("updated")}</dt><dd>{value.updatedAt ?? "—"}</dd></div></dl></FormSection> : null}
        </div>
        <aside className="xl:sticky xl:top-24 xl:self-start">
          <FormSection title={t("seasonArtwork")} description={t("seasonArtworkHelp")}>
            <ArtworkUpload name="artwork" storagePath={value.artwork?.storagePath} sourceUrl={value.artwork?.url} orientation="horizontal" onRemove={() => update({ artwork: undefined })} />
          </FormSection>
        </aside>
      </div>
      <FormActions cancelHref="/admin/seasons" pending={pending} label={mode === "create" ? t("saveSeason") : t("saveChanges")} />
    </form>
  );
}
