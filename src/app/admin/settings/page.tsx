import { Settings } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";

export default function AdminSettingsPage() {
  return (
    <>
      <AdminPageHeader title="Settings" description="System configuration will be added as Safir administration grows." />
      <div className="grid min-h-72 place-items-center rounded-xl border border-dashed bg-card/45 text-center"><div><Settings className="mx-auto mb-3 size-8 text-safir" /><h2 className="font-heading text-xl font-semibold">Settings are coming later</h2><p className="mt-1 text-sm text-muted-foreground">No configuration is exposed in this first administration release.</p></div></div>
    </>
  );
}
