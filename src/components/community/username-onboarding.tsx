"use client";

import { AtSign, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { initialCommunityActionState } from "@/features/community/action-state";
import {
  checkUsernameAvailabilityAction,
  createCommunityProfileAction,
} from "@/features/community/server/actions";
import { useRouter } from "@/i18n/navigation";

export function UsernameOnboarding({ suggestedName }: { suggestedName: string }) {
  const t = useTranslations("Profile.onboarding");
  const router = useRouter();
  const [state, action, pending] = useActionState(createCommunityProfileAction, initialCommunityActionState);
  const [username, setUsername] = useState("");
  const [availabilityResult, setAvailabilityResult] = useState<{
    username: string;
    available: boolean;
  } | null>(null);
  const [, startAvailabilityTransition] = useTransition();
  const errorKey = state.code === "AUTH_REQUIRED" || state.code === "USERNAME_TAKEN"
    ? state.code
    : "INVALID_PROFILE";
  const validUsername = /^[a-zA-Z0-9._-]{3,24}$/.test(username);
  const availability: "idle" | "checking" | "available" | "taken" = username.length < 3
    ? "idle"
    : !validUsername
      ? "taken"
      : availabilityResult?.username !== username
        ? "checking"
        : availabilityResult.available
          ? "available"
          : "taken";
  useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [router, state.status]);

  useEffect(() => {
    if (!/^[a-zA-Z0-9._-]{3,24}$/.test(username)) return;
    const timer = window.setTimeout(() => {
      startAvailabilityTransition(async () => {
        const result = await checkUsernameAvailabilityAction(username);
        setAvailabilityResult({ username, available: result.available });
      });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [username]);

  return (
        <section className="w-full max-w-xl rounded-2xl border bg-card p-6 sm:p-8">
          <span className="grid size-11 place-items-center rounded-xl bg-safir/10 text-safir"><AtSign /></span>
          <p className="eyebrow mt-6">{t("eyebrow")}</p>
          <h1 className="mt-3 font-heading text-3xl font-semibold">{t("title")}</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{t("description")}</p>
          <form action={action} className="mt-7 space-y-4">
            <div className="space-y-1.5">
              <label className="admin-label" htmlFor="community-username">{t("username")}</label>
              <div className="relative"><span className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">@</span><input id="community-username" name="username" className="admin-input pl-8" value={username} onChange={(event) => setUsername(event.target.value)} minLength={3} maxLength={24} pattern="[A-Za-z0-9._-]+" required /></div>
              <p className={availability === "taken" ? "admin-error" : availability === "available" ? "text-xs text-emerald-600" : "admin-help"}>
                {availability === "checking" ? t("checking") : availability === "available" ? t("available") : availability === "taken" ? t("unavailable") : t("usernameHelp")}
              </p>
            </div>
            <div className="space-y-1.5"><label className="admin-label" htmlFor="community-display-name">{t("displayName")}</label><input id="community-display-name" name="displayName" className="admin-input" defaultValue={suggestedName} minLength={2} maxLength={40} required /></div>
            {state.status === "error" ? <p className="admin-error">{t(`errors.${errorKey}`)}</p> : null}
            <Button type="submit" size="lg" disabled={pending || availability === "checking" || availability === "taken"} className="w-full">{pending ? <LoaderCircle className="animate-spin" /> : null}{t("continue")}</Button>
          </form>
        </section>
  );
}
