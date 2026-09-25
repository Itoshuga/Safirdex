import { createTypeAction } from "@/app/[locale]/admin/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { VisualEntityForm } from "@/components/admin/visual-entity-form";
import { getTranslations } from "next-intl/server";

export default async function NewTypePage() { const t = await getTranslations("Admin.types"); return <><AdminPageHeader eyebrow={t("createEyebrow")} title={t("createTitle")} description={t("createDescription")} /><VisualEntityForm action={createTypeAction} mode="create" kind="type" /></>; }
