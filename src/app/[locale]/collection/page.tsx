import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { CollectionManager } from "@/components/collection/collection-manager";
import { PublicHeader } from "@/components/layout/public-header";
import { getCollectionPageData } from "@/features/collection/server/collection-service";
import { redirect } from "@/i18n/navigation";
import { getUserSession } from "@/lib/auth/user-session";
import { resolveLocale } from "@/lib/i18n/locales";

export const dynamic = "force-dynamic";

type CollectionSearchParams = {
  season?: string | string[];
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "Collection.metadata" });
  return {
    title: t("title"),
    description: t("description"),
    robots: { index: false, follow: false },
  };
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<CollectionSearchParams>;
}) {
  const [{ locale: rawLocale }, query] = await Promise.all([params, searchParams]);
  const locale = resolveLocale(rawLocale);
  const session = await getUserSession();
  if (!session) return redirect({ href: "/login", locale });
  const seasonSlug = first(query.season);
  if (!seasonSlug) return redirect({ href: "/account?tab=collection", locale });
  const data = await getCollectionPageData(session.uid, locale);
  if (!data.options.seasons.some((season) => season.slug === seasonSlug)) {
    return redirect({ href: "/account?tab=collection", locale });
  }
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main>
        <CollectionManager data={data} seasonSlug={seasonSlug} />
      </main>
    </div>
  );
}
