import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { SafirLogo } from "@/components/layout/safir-logo";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("Common.notFound");

  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 text-center">
      <div>
        <SafirLogo className="mx-auto mb-6 size-12" />
        <p className="font-mono text-sm font-semibold text-safir">404</p>
        <h1 className="mt-2 font-heading text-4xl font-semibold">{t("title")}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          {t("description")}
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          <ArrowLeft className="size-4" /> {t("backHome")}
        </Link>
      </div>
    </main>
  );
}
