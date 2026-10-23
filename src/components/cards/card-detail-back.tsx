"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { Link } from "@/i18n/navigation";

const className =
  "mb-7 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition hover:text-foreground";

export function CardDetailBack({
  label,
  fromCatalogue,
}: {
  label: string;
  fromCatalogue: boolean;
}) {
  const router = useRouter();

  if (!fromCatalogue) {
    return (
      <Link href="/cards" className={className}>
        <ArrowLeft className="size-4" /> {label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push("/cards");
      }}
    >
      <ArrowLeft className="size-4" /> {label}
    </button>
  );
}
