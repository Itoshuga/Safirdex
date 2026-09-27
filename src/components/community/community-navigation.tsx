import { Compass, Users, UserRoundSearch } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

export type CommunitySection = "discover" | "following" | "people";

const items = [
  { id: "discover", href: "/community", icon: Compass },
  { id: "following", href: "/community?feed=following", icon: Users },
  { id: "people", href: "/community/people", icon: UserRoundSearch },
] as const;

export function CommunityNavigation({ active }: { active: CommunitySection }) {
  const t = useTranslations("Community.navigation");

  return (
    <nav aria-label={t("label")} className="flex gap-1 overflow-x-auto">
      {items.map(({ id, href, icon: Icon }) => (
        <Link
          key={id}
          href={href}
          aria-current={active === id ? "page" : undefined}
          className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
            active === id
              ? "bg-foreground text-background shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Icon className="size-4" aria-hidden="true" />
          {t(id)}
        </Link>
      ))}
    </nav>
  );
}
