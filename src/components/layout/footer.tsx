import Link from "next/link";

import { Brand } from "@/components/layout/brand";
import { Separator } from "@/components/ui/separator";
import type { Messages } from "@/lib/i18n/messages";

interface FooterProps {
  copy: Messages["footer"];
  navigation: Messages["header"];
}

export function Footer({ copy, navigation }: FooterProps) {
  const links = [
    { href: "#cards", label: navigation.codex },
    { href: "#seasons", label: navigation.seasons },
    { href: "#collection", label: navigation.collection },
  ];

  return (
    <footer className="border-t border-border/70">
      <div className="site-container py-12 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <Brand />
            <p className="mt-5 max-w-sm text-sm leading-6 text-muted-foreground">
              {copy.description}
            </p>
          </div>
          <nav
            className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:justify-self-end"
            aria-label="Footer navigation"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            <span className="cursor-not-allowed text-muted-foreground/50">
              {copy.legal}
            </span>
            <span className="cursor-not-allowed text-muted-foreground/50">
              {copy.privacy}
            </span>
          </nav>
        </div>
        <Separator className="my-8" />
        <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {copy.copyright}</p>
          <p>FR · EN</p>
        </div>
      </div>
    </footer>
  );
}
