import { createRarityAction } from "@/app/[locale]/admin/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { VisualEntityForm } from "@/components/admin/visual-entity-form";
import { getTranslations } from "next-intl/server";

export default async function NewRarityPage() { const t = await getTranslations("Admin.rarities"); return <><AdminPageHeader eyebrow={t("createEyebrow")} title={t("createTitle")} description={t("createDescription")} /><VisualEntityForm action={createRarityAction} mode="create" kind="rarity" /></>; }
