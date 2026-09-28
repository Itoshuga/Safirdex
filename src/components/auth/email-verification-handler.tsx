"use client";

import { applyActionCode, reload } from "firebase/auth";
import {
  ArrowRight,
  BadgeCheck,
  House,
  LoaderCircle,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { cn } from "@/lib/utils";

type VerificationStatus = "checking" | "success" | "error";

export function EmailVerificationHandler({ actionCode }: { actionCode?: string }) {
  const t = useTranslations("Auth.emailVerification");
  const started = useRef(false);
  const [status, setStatus] = useState<VerificationStatus>(
    actionCode ? "checking" : "error",
  );

  useEffect(() => {
    if (!actionCode || started.current) return;
    started.current = true;

    const auth = getFirebaseAuth();

    void applyActionCode(auth, actionCode)
      .then(async () => {
        if (auth.currentUser) {
          await reload(auth.currentUser);
          await auth.currentUser.getIdToken(true);
        }
        setStatus("success");
      })
      .catch(async () => {
        if (auth.currentUser) {
          await reload(auth.currentUser).catch(() => undefined);
          if (auth.currentUser.emailVerified) {
            setStatus("success");
            return;
          }
        }
        setStatus("error");
      });
  }, [actionCode]);

  const presentation = {
    checking: {
      icon: LoaderCircle,
      title: t("checking.title"),
      description: t("checking.description"),
      iconClassName: "bg-safir/10 text-safir",
    },
    success: {
      icon: BadgeCheck,
      title: t("success.title"),
      description: t("success.description"),
      iconClassName: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    error: {
      icon: TriangleAlert,
      title: t("error.title"),
      description: t("error.description"),
      iconClassName: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
  }[status];
  const StatusIcon = presentation.icon;

  return (
    <div className="p-6 text-center sm:p-10">
      <span
        className={cn(
          "mx-auto grid size-16 place-items-center rounded-2xl",
          presentation.iconClassName,
        )}
      >
        <StatusIcon
          className={cn("size-8", status === "checking" && "animate-spin")}
          aria-hidden="true"
        />
      </span>
      <p className="mt-6 text-xs font-semibold tracking-[0.1em] text-safir uppercase">
        {t("eyebrow")}
      </p>
      <h1 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
        {presentation.title}
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
        {presentation.description}
      </p>

      {status !== "checking" ? (
        <div className="mx-auto mt-8 grid max-w-sm gap-2.5">
          <Button
            size="lg"
            nativeButton={false}
            render={<Link href="/login" />}
            className="h-11"
          >
            {status === "success" ? <ArrowRight /> : <ShieldCheck />}
            {status === "success" ? t("success.action") : t("error.action")}
          </Button>
          <Button
            size="lg"
            variant="ghost"
            nativeButton={false}
            render={<Link href="/" />}
            className="h-11"
          >
            <House /> {t("homeAction")}
          </Button>
        </div>
      ) : (
        <div className="mx-auto mt-8 h-1.5 max-w-xs overflow-hidden rounded-full bg-muted" aria-hidden="true">
          <span className="admin-loading-bar block h-full w-1/2 rounded-full bg-safir" />
        </div>
      )}

      <div className="mx-auto mt-8 flex max-w-md items-start gap-2.5 border-t pt-6 text-left text-xs leading-5 text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-safir" aria-hidden="true" />
        <p>{t("security")}</p>
      </div>
    </div>
  );
}
