"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Common.errors");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 text-center">
      <div>
        <AlertTriangle className="mx-auto mb-4 size-9 text-destructive" />
        <h1 className="font-heading text-3xl font-semibold">{t("title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("description")}</p>
        <Button className="mt-6" onClick={reset}>
          <RefreshCw /> {t("retry")}
        </Button>
      </div>
    </main>
  );
}
