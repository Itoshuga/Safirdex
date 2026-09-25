import { createGlossaryAction } from "@/app/[locale]/admin/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { GlossaryForm } from "@/components/admin/glossary-form";
import { getTranslations } from "next-intl/server";

export default async function NewGlossaryPage() { const t = await getTranslations("Admin.glossary"); return <><AdminPageHeader eyebrow={t("createEyebrow")} title={t("createTitle")} description={t("createDescription")} /><GlossaryForm action={createGlossaryAction} mode="create" /></>; }
