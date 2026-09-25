import { getTranslations } from "next-intl/server";

export default async function AdminLoading() {
  const t = await getTranslations("Admin.shell");
  return (
    <div className="animate-pulse space-y-6" aria-label={t("loading")}>
      <div><div className="h-8 w-52 rounded bg-muted" /><div className="mt-3 h-4 w-80 max-w-full rounded bg-muted" /></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div className="h-28 rounded-xl border bg-muted/50" key={index} />)}</div>
      <div className="h-80 rounded-xl border bg-muted/40" />
    </div>
  );
}
