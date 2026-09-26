"use client";

import { Check, LoaderCircle, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { setFollowStateAction } from "@/features/community/server/actions";
import { Link } from "@/i18n/navigation";

export function FollowButton({
  username,
  initialFollowing,
  signedIn,
  compact = false,
}: {
  username: string;
  initialFollowing: boolean;
  signedIn: boolean;
  compact?: boolean;
}) {
  const t = useTranslations("Community.actions");
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  if (!signedIn) {
    return (
      <Button
        variant="outline"
        size={compact ? "sm" : "lg"}
        nativeButton={false}
        render={<Link href="/login" />}
      >
        <UserPlus /> {t("follow")}
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant={following ? "secondary" : "default"}
        size={compact ? "sm" : "lg"}
        disabled={pending}
        aria-pressed={following}
        onClick={() => {
          const next = !following;
          setFollowing(next);
          setFailed(false);
          startTransition(async () => {
            const result = await setFollowStateAction({ username, following: next });
            if (!result.ok) {
              setFollowing(!next);
              setFailed(true);
            }
          });
        }}
      >
        {pending ? <LoaderCircle className="animate-spin" /> : following ? <Check /> : <UserPlus />}
        {following ? t("following") : t("follow")}
      </Button>
      {failed ? <span className="text-[0.65rem] text-destructive">{t("failed")}</span> : null}
    </div>
  );
}

