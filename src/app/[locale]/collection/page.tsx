import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { CollectionManager } from "@/components/collection/collection-manager";
import { PublicHeader } from "@/components/layout/public-header";
import { getCollectionPageData } from "@/features/collection/server/collection-service";
import { redirect } from "@/i18n/navigation";
import { getUserSession } from "@/lib/auth/user-session";
import { resolveLocale } from "@/lib/i18n/locales";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "Collection.metadata" });
  return {
    title: t("title"),
    description: t("description"),
    robots: { index: false, follow: false },
  };
}

export default async function CollectionPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const session = await getUserSession();
  if (!session) return redirect({ href: "/login", locale });
  const data = await getCollectionPageData(session.uid, locale);
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main><CollectionManager data={data} /></main>
    </div>
  );
}
