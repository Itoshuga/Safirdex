import Link from "next/link";

import { Brand } from "@/components/layout/brand";
import { LanguageMenu } from "@/components/layout/language-menu";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { AppLocale } from "@/lib/i18n/locales";
import type { Messages } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

interface HeaderProps {
  locale: AppLocale;
  copy: Messages["header"];
}

export function Header({ locale, copy }: HeaderProps) {
  const links = [
    { href: "#cards", label: copy.codex },
    { href: "#seasons", label: copy.seasons },
    { href: "#collection", label: copy.collection },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="site-container flex h-[4.75rem] items-center justify-between gap-6">
        <Brand />
        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Primary navigation"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "rounded-lg px-4 text-sm text-muted-foreground hover:text-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-1 md:flex">
          <LanguageMenu currentLocale={locale} label={copy.language} />
          <ThemeToggle />
          <Tooltip>
            <TooltipTrigger
              render={<span className="ml-2 inline-flex" tabIndex={0} />}
            >
              <Button
                type="button"
                disabled
                variant="outline"
                className="rounded-lg px-5"
              >
                {copy.signIn}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{copy.signInSoon}</TooltipContent>
          </Tooltip>
        </div>
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <MobileNavigation locale={locale} copy={copy} />
        </div>
      </div>
    </header>
  );
}
