import { createTypeAction } from "@/app/admin/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { VisualEntityForm } from "@/components/admin/visual-entity-form";

export default function NewTypePage() { return <><AdminPageHeader eyebrow="Types / New" title="Create Card Type" description="Add a reusable card classification with localized labels." /><VisualEntityForm action={createTypeAction} mode="create" kind="type" /></>; }
