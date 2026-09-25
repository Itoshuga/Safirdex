import { createRarityAction } from "@/app/admin/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { VisualEntityForm } from "@/components/admin/visual-entity-form";

export default function NewRarityPage() { return <><AdminPageHeader eyebrow="Rarities / New" title="Create Rarity" description="Define a localized rarity with a clear color and catalogue order." /><VisualEntityForm action={createRarityAction} mode="create" kind="rarity" /></>; }
