"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { LanguageMenu } from "@/components/layout/language-menu";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { AppLocale } from "@/lib/i18n/locales";
import type { Messages } from "@/lib/i18n/messages";

interface MobileNavigationProps {
  locale: AppLocale;
  copy: Messages["header"];
}

export function MobileNavigation({ locale, copy }: MobileNavigationProps) {
  const [open, setOpen] = useState(false);
  const links = [
    { href: "#cards", label: copy.codex },
    { href: "#seasons", label: copy.seasons },
    { href: "#collection", label: copy.collection },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon-lg"
            className="rounded-full"
            aria-label={copy.menu}
          />
        }
      >
        <Menu aria-hidden="true" />
      </SheetTrigger>
      <SheetContent className="w-[min(88vw,24rem)] bg-background/95 p-0 backdrop-blur-xl">
        <SheetHeader className="border-b p-6 text-left">
          <SheetTitle className="font-heading text-2xl">{copy.menu}</SheetTitle>
          <SheetDescription>{copy.menuDescription}</SheetDescription>
        </SheetHeader>
        <nav className="flex flex-col px-4 py-5" aria-label={copy.menu}>
          {links.map((link, index) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between border-b px-2 py-5 text-left text-lg font-medium transition-colors hover:text-safir"
            >
              {link.label}
              <span className="font-heading text-base text-muted-foreground">
                0{index + 1}
              </span>
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex items-center justify-between border-t p-5">
          <LanguageMenu currentLocale={locale} label={copy.language} align="start" />
          <Button type="button" disabled variant="outline" className="rounded-full">
            {copy.signIn}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
