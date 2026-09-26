"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { UserCard } from "@/components/community/user-card";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { CommunityConnectionItem } from "@/features/community/types";
import { Link, useRouter } from "@/i18n/navigation";

export function ConnectionsSheet({
  kind,
  items,
  nextCursor,
  basePath,
  signedIn,
}: {
  kind: "followers" | "following";
  items: CommunityConnectionItem[];
  nextCursor?: string;
  basePath: string;
  signedIn: boolean;
}) {
  const t = useTranslations("Profile.connections");
  const router = useRouter();
  const [open, setOpen] = useState(true);

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) router.replace(basePath);
      }}
    >
      <SheetContent className="w-[min(92vw,30rem)] sm:max-w-[30rem]">
        <SheetHeader className="border-b p-5">
          <SheetTitle>{t(kind)}</SheetTitle>
          <SheetDescription>{t(`${kind}Description`)}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {items.length ? items.map((user) => <UserCard key={user.username} user={user} signedIn={signedIn} />) : <p className="py-16 text-center text-sm text-muted-foreground">{t("empty")}</p>}
          {nextCursor ? (
            <Button variant="outline" className="w-full" nativeButton={false} render={<Link href={`${basePath}?connections=${kind}&connectionCursor=${encodeURIComponent(nextCursor)}`} />}>
              {t("loadMore")}
            </Button>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

