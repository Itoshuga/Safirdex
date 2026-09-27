import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { CommunityPostCard } from "@/components/community/community-post-card";
import { PublicHeader } from "@/components/layout/public-header";
import { getCommunityPost } from "@/features/community/server/post-service";
import { Link } from "@/i18n/navigation";
import { getUserSession } from "@/lib/auth/user-session";
import { resolveLocale } from "@/lib/i18n/locales";

type PageProps = { params: Promise<{ locale: string; postId: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: localeValue, postId } = await params;
  const locale = resolveLocale(localeValue);
  const [post, t] = await Promise.all([
    getCommunityPost(postId, locale, null),
    getTranslations({ locale, namespace: "Community.posts.metadata" }),
  ]);
  if (!post) return { title: t("privateTitle"), robots: { index: false, follow: false } };
  const description = post.content || t("attachmentDescription", { name: post.author.displayName });
  return {
    title: t("title", { name: post.author.displayName }),
    description,
    alternates: { canonical: `/${locale}/community/posts/${post.id}` },
    openGraph: { title: t("title", { name: post.author.displayName }), description },
  };
}

export default async function CommunityPostPage({ params }: PageProps) {
  const { locale: localeValue, postId } = await params;
  const locale = resolveLocale(localeValue);
  const session = await getUserSession();
  const post = await getCommunityPost(postId, locale, session?.uid ?? null);
  if (!post) notFound();
  const t = await getTranslations({ locale, namespace: "Community.posts" });
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="site-container py-8 sm:py-12">
        <div className="mx-auto max-w-2xl">
          <Link href="/community" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground">
            <ArrowLeft className="size-4" aria-hidden="true" /> {t("backToCommunity")}
          </Link>
          <div className="rounded-[1.75rem] border bg-card/60 p-5 shadow-sm sm:p-7">
            <CommunityPostCard post={post} />
          </div>
        </div>
      </main>
    </div>
  );
}
