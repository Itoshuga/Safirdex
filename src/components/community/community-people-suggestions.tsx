import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { UserCard } from "@/components/community/user-card";
import type { CommunityUserResult } from "@/features/community/types";
import { Link } from "@/i18n/navigation";

export function CommunityPeopleSuggestions({
  people,
  signedIn,
}: {
  people: CommunityUserResult[];
  signedIn: boolean;
}) {
  const t = useTranslations("Community.people");

  if (!people.length) return null;

  return (
    <section aria-labelledby="community-people-title">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{t("discoverEyebrow")}</p>
          <h2 id="community-people-title" className="mt-2 font-heading text-xl font-semibold">
            {t("discover")}
          </h2>
        </div>
        <Link href="/community/people" className="inline-flex items-center gap-1 text-xs font-semibold text-safir hover:underline">
          {t("viewAll")}
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-1 lg:overflow-visible lg:pb-0 [&>article]:min-w-[17rem] lg:[&>article]:min-w-0">
        {people.map((user) => (
          <UserCard key={user.username} user={user} signedIn={signedIn} />
        ))}
      </div>
    </section>
  );
}
