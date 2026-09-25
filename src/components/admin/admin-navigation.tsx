"use client";

import {
  BookOpenText,
  Boxes,
  CircleGauge,
  Diamond,
  Layers3,
  Settings,
  Shapes,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const sections = [
  {
    label: "Overview",
    items: [{ href: "/admin", label: "Dashboard", icon: CircleGauge }],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/cards", label: "Cards", icon: Layers3 },
      { href: "/admin/seasons", label: "Seasons", icon: Sparkles },
      { href: "/admin/sets", label: "Sets", icon: Boxes },
      { href: "/admin/rarities", label: "Rarities", icon: Diamond },
      { href: "/admin/types", label: "Types", icon: Shapes },
      { href: "/admin/glossary", label: "Glossary", icon: BookOpenText },
    ],
  },
  {
    label: "System",
    items: [{ href: "/admin/settings", label: "Settings", icon: Settings }],
  },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/admin"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNavigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-[color-mix(in_oklch,var(--card),var(--background)_28%)]">
      <Link
        href="/admin"
        className="flex h-16 items-center gap-3 border-b px-5"
        onClick={onNavigate}
      >
        <span className="relative block size-9 overflow-hidden bg-foreground" aria-hidden="true">
          <span className="absolute -right-2.5 -bottom-2.5 size-7 rotate-45 bg-safir" />
        </span>
        <span>
          <span className="block font-heading text-lg leading-5 font-semibold tracking-[-0.03em]">Safirdex</span>
          <span className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">Administration</span>
        </span>
      </Link>
      <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Admin navigation">
        {sections.map((section) => (
          <div className="mb-6" key={section.label}>
            <p className="mb-2 px-3 text-[10px] font-semibold tracking-[0.12em] text-muted-foreground/75 uppercase">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                      active && "bg-safir/10 text-safir hover:bg-safir/13 hover:text-safir",
                    )}
                  >
                    {active ? <span className="absolute inset-y-2 left-0 w-0.5 bg-safir" /> : null}
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}
