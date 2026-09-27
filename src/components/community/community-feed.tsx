"use client";

import { LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { ActivityCard } from "@/components/community/activity-card";
import { Button } from "@/components/ui/button";
import { loadCommunityFeedAction } from "@/features/community/server/actions";
import type { CommunityFeedPage } from "@/features/community/types";

export function CommunityFeed({
  initialFeed,
  mode,
  locale,
  viewerId,
}: {
  initialFeed: CommunityFeedPage;
  mode: "discover" | "following";
  locale: string;
  viewerId: string | null;
}) {
  const t = useTranslations("Community.feed");
  const [items, setItems] = useState(initialFeed.items);
  const [cursor, setCursor] = useState(initialFeed.nextCursor);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <div className="space-y-8">
        {items.map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            viewerId={viewerId}
          />
        ))}
      </div>
      {cursor ? (
        <div className="mt-8">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full rounded-xl"
            disabled={pending}
            onClick={() => {
              setFailed(false);
              startTransition(async () => {
                try {
                  const page = await loadCommunityFeedAction({
                    locale,
                    mode,
                    cursor,
                  });
                  setItems((current) => [
                    ...current,
                    ...page.items.filter(
                      (item) => !current.some((existing) => existing.id === item.id),
                    ),
                  ]);
                  setCursor(page.nextCursor);
                } catch {
                  setFailed(true);
                }
              });
            }}
          >
            {pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
            {pending ? t("loadingMore") : t("loadMore")}
          </Button>
          {failed ? (
            <p className="mt-2 text-center text-xs text-destructive" role="alert">
              {t("loadFailed")}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
