import { ArrowUpRight, BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";

import { LanguageSwitcher } from "@/components/language-switcher";
import { SafirLogo } from "@/components/layout/safir-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Link } from "@/i18n/navigation";

export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  const home = useTranslations("Home");
  const navigation = useTranslations("Navigation");

  return (
    <header className="relative z-40 mx-auto flex h-20 w-full max-w-[90rem] items-center justify-between border-b border-border/55 px-5 sm:px-8 lg:px-12">
      <Link
        href="/"
        className="group inline-flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        aria-label={home("brandHome")}
      >
        <SafirLogo className="size-8" />
        <span className="font-heading text-sm font-semibold tracking-[-0.02em]">Safirdex</span>
      </Link>
      <div className="flex items-center gap-1">
        <LanguageSwitcher />
        <ThemeToggle />
        <Link
          href="/cards"
          className="ml-1 inline-flex h-9 items-center gap-1.5 px-2 text-xs font-semibold text-muted-foreground transition hover:text-foreground sm:px-3"
        >
          <BookOpen className="size-3.5" />
          <span className="hidden sm:inline">{navigation("cards")}</span>
        </Link>
        <Link
          href={signedIn ? "/account" : "/login"}
          className="ml-2 inline-flex h-9 items-center gap-1.5 border-l pl-4 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <span>{signedIn ? navigation("account") : navigation("login")}</span>
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>
    </header>
  );
}
