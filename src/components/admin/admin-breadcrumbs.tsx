"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const labels: Record<string, string> = {
  admin: "Admin",
  cards: "Cards",
  seasons: "Seasons",
  sets: "Sets",
  rarities: "Rarities",
  types: "Types",
  glossary: "Glossary",
  settings: "Settings",
  new: "New",
};

export function AdminBreadcrumbs() {
  const pathname = usePathname();
  const [customTitle, setCustomTitle] = useState({ pathname: "", title: "" });

  useEffect(() => {
    const handleTitle = (event: Event) => {
      const detail = (event as CustomEvent<{ pathname: string; title: string }>).detail;
      setCustomTitle(detail);
    };
    window.addEventListener("safir:breadcrumb", handleTitle);
    return () => window.removeEventListener("safir:breadcrumb", handleTitle);
  }, [pathname]);
  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav className="min-w-0" aria-label="Breadcrumb">
      <ol className="flex min-w-0 items-center gap-1.5 text-sm">
        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join("/")}`;
          const last = index === segments.length - 1;
          const pageTitle = customTitle.pathname === pathname ? customTitle.title : "";
          const label = labels[segment] ?? (last ? pageTitle || "Edit" : segment);

          return (
            <li className="flex min-w-0 items-center gap-1.5" key={href}>
              {index > 0 ? <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/50" /> : null}
              {last ? (
                <span className="truncate font-medium text-foreground" aria-current="page">{label}</span>
              ) : (
                <Link className="truncate text-muted-foreground hover:text-foreground" href={href}>{label}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function AdminBreadcrumbTitle({ title }: { title: string }) {
  const pathname = usePathname();
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("safir:breadcrumb", { detail: { pathname, title } }));
    return () => {
      window.dispatchEvent(new CustomEvent("safir:breadcrumb", { detail: { pathname, title: "" } }));
    };
  }, [pathname, title]);
  return null;
}
