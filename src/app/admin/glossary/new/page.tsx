import { createGlossaryAction } from "@/app/admin/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { GlossaryForm } from "@/components/admin/glossary-form";

export default function NewGlossaryPage() { return <><AdminPageHeader eyebrow="Glossary / New" title="Create Glossary Entry" description="Use a language-independent key and localized tooltip content." /><GlossaryForm action={createGlossaryAction} mode="create" /></>; }
