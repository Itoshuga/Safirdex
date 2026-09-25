"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import {
  LOCALE_CONFIG,
  SUPPORTED_LOCALES,
  type AppLocale,
} from "@/lib/i18n/locales";

export type TranslationFormValue = Record<string, Record<string, string>>;

export function TranslationTabs({
  value,
  onChange,
  fields,
  requiredField,
}: {
  value: TranslationFormValue;
  onChange: (value: TranslationFormValue) => void;
  fields: { key: string; label: string; multiline?: boolean; placeholder?: string }[];
  requiredField: string;
}) {
  const t = useTranslations("Admin.forms");
  const [activeLocale, setActiveLocale] = useState<AppLocale>(SUPPORTED_LOCALES[0]);

  return (
    <div>
      <div className="mb-5 flex gap-1 border-b" role="tablist" aria-label={t("translations")}>
        {SUPPORTED_LOCALES.map((locale) => {
          const complete = Boolean(value[locale]?.[requiredField]?.trim());
          return (
            <button
              key={locale}
              type="button"
              role="tab"
              aria-selected={locale === activeLocale}
              onClick={() => setActiveLocale(locale)}
              className={cn(
                "relative flex h-10 items-center gap-2 px-3 text-sm font-medium text-muted-foreground transition hover:text-foreground",
                locale === activeLocale && "text-foreground after:absolute after:inset-x-1 after:-bottom-px after:h-0.5 after:rounded-full after:bg-safir",
              )}
            >
              {LOCALE_CONFIG[locale].label}
              {complete ? <CheckCircle2 className="size-3.5 text-emerald-500" /> : <AlertCircle className="size-3.5 text-amber-500" />}
            </button>
          );
        })}
      </div>
      {SUPPORTED_LOCALES.map((locale) => (
        <div key={locale} role="tabpanel" hidden={locale !== activeLocale} className="space-y-5">
          {fields.map((field) => {
            const id = `${locale}-${field.key}`;
            return (
              <div className="space-y-2" key={field.key}>
                <label className="admin-label" htmlFor={id}>{field.label}</label>
                {field.multiline ? (
                  <textarea
                    className="admin-textarea"
                    id={id}
                    value={value[locale]?.[field.key] ?? ""}
                    placeholder={field.placeholder}
                    onChange={(event) => onChange({
                      ...value,
                      [locale]: { ...value[locale], [field.key]: event.target.value },
                    })}
                  />
                ) : (
                  <input
                    className="admin-input"
                    id={id}
                    value={value[locale]?.[field.key] ?? ""}
                    placeholder={field.placeholder}
                    onChange={(event) => onChange({
                      ...value,
                      [locale]: { ...value[locale], [field.key]: event.target.value },
                    })}
                  />
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
