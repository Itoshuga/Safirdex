"use client";

import { Copy, Images, LockKeyhole, MoreHorizontal, Share2, Trash2 } from "lucide-react";
import Image from "next/image";
import { useFormatter, useLocale, useNow, useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { ProfileAvatar } from "@/components/community/profile-avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteCommunityPostAction } from "@/features/community/server/actions";
import type { CommunityPostAttachmentView, CommunityPostView } from "@/features/community/types";
import { Link, useRouter } from "@/i18n/navigation";

function AttachmentPreview({ attachment, collectionHref }: { attachment: CommunityPostAttachmentView; collectionHref: string }) {
  const t = useTranslations("Community.posts");
  if (!attachment.available) {
    return (
      <div className="mt-4 flex min-h-24 items-center gap-3 rounded-2xl border border-dashed bg-muted/30 px-4 py-5 text-sm text-muted-foreground">
        <LockKeyhole className="size-5 shrink-0" aria-hidden="true" />
        <span>{t("attachmentUnavailable")}</span>
      </div>
    );
  }
  if (attachment.type === "card") {
    return (
      <Link href={`/cards/${attachment.slug}`} className="group mt-4 flex overflow-hidden rounded-2xl border bg-card transition hover:border-safir/35">
        <div className={`relative w-32 shrink-0 bg-muted sm:w-40 ${attachment.orientation === "horizontal" ? "aspect-[3/2] self-center" : "aspect-[5/7]"}`}>
          {attachment.artworkUrl ? <Image src={attachment.artworkUrl} alt={attachment.name} fill sizes="160px" className="object-cover transition group-hover:scale-[1.02]" /> : null}
        </div>
        <div className="min-w-0 self-center p-4">
          <p className="text-[0.65rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">{t("card")}</p>
          <h3 className="mt-1 truncate font-heading text-lg font-semibold">{attachment.name}</h3>
          <p className="mt-1 text-xs text-muted-foreground">N°{String(attachment.number).padStart(3, "0")}{attachment.rarityName ? ` · ${attachment.rarityName}` : ""}</p>
        </div>
      </Link>
    );
  }
  if (attachment.type === "deck") {
    return (
      <Link href={`/decks/${attachment.deckId}`} className="group relative mt-4 block min-h-48 overflow-hidden rounded-2xl border bg-muted">
        {attachment.artworkUrl ? <Image src={attachment.artworkUrl} alt="" fill sizes="(max-width: 768px) 100vw, 640px" className="object-cover transition duration-500 group-hover:scale-[1.025]" /> : <div className="surface-grid absolute inset-0 opacity-35" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/5" />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
          <p className="text-[0.65rem] font-semibold tracking-[0.12em] text-white/65 uppercase">{t("deck")}</p>
          <h3 className="mt-1 truncate font-heading text-xl font-semibold">{attachment.name}</h3>
          <p className="mt-1 text-xs text-white/70">{t("deckCards", { count: attachment.cardCount })}{attachment.commanderName ? ` · ${attachment.commanderName}` : ""}</p>
        </div>
      </Link>
    );
  }
  return (
    <Link href={collectionHref} className="mt-4 block rounded-2xl border bg-muted/25 p-4 transition hover:border-safir/35">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[0.65rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">{t("collection")}</p>
          <p className="mt-1 font-heading text-lg font-semibold">{t("collectionCards", { count: attachment.cardCount })}</p>
        </div>
        <Images className="size-5 text-safir" aria-hidden="true" />
      </div>
      {attachment.cards.length ? (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {attachment.cards.map((card) => (
            <div key={card.cardId} className="relative aspect-[5/7] overflow-hidden rounded-lg bg-muted">
              {card.artworkUrl ? <Image src={card.artworkUrl} alt={card.name} fill sizes="120px" className="object-cover" /> : null}
            </div>
          ))}
        </div>
      ) : null}
    </Link>
  );
}

export function CommunityPostCard({
  post,
  compact = false,
  onDeleted,
}: {
  post: CommunityPostView;
  compact?: boolean;
  onDeleted?: (postId: string) => void;
}) {
  const t = useTranslations("Community.posts");
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const locale = useLocale();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  const profileHref = post.isOwner ? "/account" : `/user/@${post.author.username}`;
  const detailHref = `/community/posts/${post.id}`;
  const isLong = post.content.length > 280;

  async function sharePost() {
    const url = `${window.location.origin}/${locale}${detailHref}`;
    if (navigator.share) {
      await navigator.share({ title: t("shareTitle", { name: post.author.displayName }), url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function removePost() {
    if (!window.confirm(t("deleteConfirm"))) return;
    startTransition(async () => {
      const result = await deleteCommunityPostAction(post.id);
      if (result.ok) {
        onDeleted?.(post.id);
        router.refresh();
      }
    });
  }

  if (compact) {
    return (
      <article className="py-4 first:pt-0 last:pb-0">
        <div className="flex gap-3">
          <Link href={profileHref}><ProfileAvatar src={post.author.avatarUrl} name={post.author.displayName} className="size-10 border-2" /></Link>
          <div className="min-w-0 flex-1">
            <p className="text-sm leading-5"><span className="font-semibold">{post.author.displayName}</span>{post.content ? ` · ${post.content}` : ` · ${t("sharedAttachment")}`}</p>
            <time className="mt-1 block text-xs text-muted-foreground" dateTime={post.createdAtIso}>{format.relativeTime(new Date(post.createdAtIso), { now })}</time>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="border-b border-border/65 pb-8 last:border-0 last:pb-0">
      <header className="flex items-center gap-3">
        <Link href={profileHref} className="shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-safir/40">
          <ProfileAvatar src={post.author.avatarUrl} name={post.author.displayName} className="size-11 border-2 sm:size-12" />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={profileHref} className="block truncate text-sm font-semibold hover:text-safir">{post.author.displayName}</Link>
          <p className="truncate text-xs text-muted-foreground">@{post.author.username}<span aria-hidden="true"> · </span><Link href={detailHref} className="hover:underline"><time dateTime={post.createdAtIso}>{format.relativeTime(new Date(post.createdAtIso), { now })}</time></Link></p>
        </div>
        {post.isOwner ? (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="rounded-full" disabled={pending} />} aria-label={t("moreActions")}><MoreHorizontal aria-hidden="true" /></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem variant="destructive" className="px-2.5 py-2" onClick={removePost}><Trash2 aria-hidden="true" /> {t("delete")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </header>
      {post.content ? (
        <div className="mt-4">
          <p className={`whitespace-pre-wrap text-[0.94rem] leading-6 text-foreground/95 ${isLong && !expanded ? "line-clamp-5" : ""}`}>{post.content}</p>
          {isLong ? <button type="button" className="mt-1 text-xs font-semibold text-muted-foreground hover:text-foreground" onClick={() => setExpanded((value) => !value)}>{t(expanded ? "showLess" : "readMore")}</button> : null}
        </div>
      ) : null}
      {post.attachment ? <AttachmentPreview attachment={post.attachment} collectionHref={`${profileHref}?tab=collection`} /> : null}
      <footer className="mt-4 flex items-center justify-end">
        <Button type="button" variant="ghost" size="sm" className="rounded-full text-muted-foreground" onClick={() => void sharePost()}>
          {copied ? <Copy aria-hidden="true" /> : <Share2 aria-hidden="true" />}{copied ? t("copied") : t("share")}
        </Button>
      </footer>
    </article>
  );
}
