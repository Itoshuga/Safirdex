import { useTranslations } from "next-intl";

import { CommunityNavigation, type CommunitySection } from "@/components/community/community-navigation";
import { CommunitySearch } from "@/components/community/community-search";

export function CommunityHeader({
  active,
  initialQuery = "",
}: {
  active: CommunitySection;
  initialQuery?: string;
}) {
  const t = useTranslations("Community");

  return (
    <section className="relative border-b">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="surface-grid absolute inset-0 opacity-35 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="absolute -top-44 left-[12%] size-80 rounded-full bg-safir/10 blur-3xl" />
      </div>
      <div className="site-container relative py-9 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(28rem,1.1fr)] lg:items-end">
          <div>
            <p className="eyebrow">{t("eyebrow")}</p>
            <h1 className="mt-3 font-heading text-4xl font-semibold tracking-[-0.055em] sm:text-6xl">
              {t("title")}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              {t("description")}
            </p>
          </div>
          <CommunitySearch initialQuery={initialQuery} />
        </div>
        <div className="mt-8 border-t pt-4">
          <CommunityNavigation active={active} />
        </div>
      </div>
    </section>
  );
}
