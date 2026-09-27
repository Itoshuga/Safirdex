"use client";

import { Globe2, ImagePlus, LoaderCircle, Lock, Search, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";

import { ProfileAvatar } from "@/components/community/profile-avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  createCommunityPostAction,
  getCommunityPostCollectionOptionAction,
  getCommunityPostDeckOptionsAction,
  searchCommunityPostCardsAction,
} from "@/features/community/server/actions";
import type { ActivityActorSnapshot, CommunityPostAttachmentOption, CommunityPostVisibility } from "@/features/community/types";
import { useRouter } from "@/i18n/navigation";
import { COMMUNITY_POST_MAX_LENGTH } from "@/validation/community-posts";

function OptionArtwork({ option }: { option: CommunityPostAttachmentOption }) {
  const artwork = option.type === "collection" ? option.cards[0]?.artworkUrl : option.artworkUrl;
  const label = option.type === "collection" ? "" : option.name;
  return (
    <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted">
      {artwork ? <Image src={artwork} alt={label} fill sizes="56px" className="object-cover" /> : null}
    </div>
  );
}

export function CommunityPostComposer({ viewer, locale }: { viewer: ActivityActorSnapshot; locale: string }) {
  const t = useTranslations("Community.composer");
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<CommunityPostVisibility>("public");
  const [attachment, setAttachment] = useState<CommunityPostAttachmentOption | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerType, setPickerType] = useState<"card" | "deck" | "collection">("card");
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<CommunityPostAttachmentOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!pickerOpen) return;
    const timeout = window.setTimeout(() => {
      setLoadingOptions(true);
      const task = pickerType === "card"
        ? searchCommunityPostCardsAction(locale, query)
        : pickerType === "deck"
          ? getCommunityPostDeckOptionsAction(locale)
          : getCommunityPostCollectionOptionAction(locale).then((item) => item ? [item] : []);
      void task.then(setOptions).finally(() => setLoadingOptions(false));
    }, pickerType === "card" ? 250 : 0);
    return () => window.clearTimeout(timeout);
  }, [locale, pickerOpen, pickerType, query]);

  function resizeTextarea(value: string) {
    setContent(value);
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 176)}px`;
    textarea.style.overflowY = textarea.scrollHeight > 176 ? "auto" : "hidden";
  }

  function submit() {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await createCommunityPostAction({
        locale,
        content,
        visibility,
        attachment: attachment ? { type: attachment.type, id: attachment.id } : null,
      });
      if (!result.ok) {
        setError(t(`errors.${result.code}`));
        return;
      }
      setContent("");
      setAttachment(null);
      setSuccess(true);
      window.setTimeout(() => setSuccess(false), 2500);
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      router.refresh();
    });
  }

  return (
    <Sheet open={pickerOpen} onOpenChange={setPickerOpen}>
      <section className="mb-8 rounded-[1.4rem] border bg-card/65 p-4 shadow-sm sm:p-5" aria-label={t("title")}>
        <div className="flex items-start gap-3">
          <ProfileAvatar src={viewer.avatarUrl} name={viewer.displayName} className="size-10 border-2 sm:size-11" />
          <div className="min-w-0 flex-1">
            <textarea
              ref={textareaRef}
              value={content}
              maxLength={COMMUNITY_POST_MAX_LENGTH}
              rows={1}
              placeholder={t("placeholder")}
              aria-label={t("placeholder")}
              className="min-h-11 w-full resize-none overflow-y-hidden bg-transparent py-2 text-[0.95rem] leading-6 outline-none placeholder:text-muted-foreground/75"
              onChange={(event) => resizeTextarea(event.target.value)}
            />
            {attachment ? (
              <div className="mt-3 flex items-center gap-3 rounded-2xl border bg-muted/25 p-2.5">
                <OptionArtwork option={attachment} />
                <div className="min-w-0 flex-1">
                  <p className="text-[0.62rem] font-semibold tracking-[0.1em] text-muted-foreground uppercase">{t(`types.${attachment.type}`)}</p>
                  <p className="mt-0.5 truncate text-sm font-semibold">{attachment.type === "collection" ? t("collectionSummary", { count: attachment.cardCount }) : attachment.name}</p>
                </div>
                <Button type="button" variant="ghost" size="icon-sm" className="rounded-full" aria-label={t("removeAttachment")} onClick={() => setAttachment(null)}><X aria-hidden="true" /></Button>
              </div>
            ) : null}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3">
          <SheetTrigger render={<Button type="button" variant="ghost" size="sm" className="rounded-full text-muted-foreground" />}>
            <ImagePlus aria-hidden="true" /> {t("attach")}
          </SheetTrigger>
          <label className="relative inline-flex items-center gap-1.5 rounded-full px-2 text-xs font-medium text-muted-foreground">
            {visibility === "public" ? <Globe2 className="size-3.5" aria-hidden="true" /> : <Lock className="size-3.5" aria-hidden="true" />}
            <span className="sr-only">{t("visibility")}</span>
            <select aria-describedby="community-post-visibility-help" value={visibility} onChange={(event) => setVisibility(event.target.value as CommunityPostVisibility)} className="appearance-none bg-transparent py-1.5 pr-3 outline-none">
              <option value="public">{t("public")}</option>
              <option value="followers">{t("followers")}</option>
            </select>
          </label>
          <div className="ml-auto flex items-center gap-3">
            {content.length >= 400 ? <span className={`text-xs tabular-nums ${content.length >= COMMUNITY_POST_MAX_LENGTH ? "text-destructive" : "text-muted-foreground"}`}>{content.length}/{COMMUNITY_POST_MAX_LENGTH}</span> : null}
            <Button type="button" className="rounded-full px-4" disabled={pending || (!content.trim() && !attachment)} onClick={submit}>
              {pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}{t("publish")}
            </Button>
          </div>
        </div>
        <p id="community-post-visibility-help" className="sr-only">{t(visibility === "public" ? "publicDescription" : "followersDescription")}</p>
        {error ? <p className="mt-3 text-xs text-destructive" role="alert">{error}</p> : null}
        {success ? <p className="mt-3 text-xs font-medium text-safir" role="status">{t("created")}</p> : null}
      </section>

      <SheetContent side="bottom" className="mx-auto max-h-[88dvh] w-full max-w-3xl gap-0 overflow-hidden rounded-t-[1.75rem] border-x sm:bottom-5 sm:rounded-[1.75rem] sm:border">
          <SheetHeader className="border-b px-5 py-5">
            <SheetTitle className="text-lg">{t("pickerTitle")}</SheetTitle>
            <SheetDescription>{t("pickerDescription")}</SheetDescription>
          </SheetHeader>
          <div className="flex gap-1 border-b px-4 py-3" role="tablist" aria-label={t("pickerTitle")}>
            {(["card", "deck", "collection"] as const).map((type) => (
              <button key={type} type="button" role="tab" aria-selected={pickerType === type} className={`rounded-full px-3 py-2 text-xs font-semibold transition ${pickerType === type ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`} onClick={() => { setPickerType(type); setQuery(""); }}>{t(`types.${type}`)}</button>
            ))}
          </div>
          {pickerType === "card" ? (
            <label className="mx-4 mt-4 flex items-center gap-2 rounded-xl border bg-background px-3">
              <Search className="size-4 text-muted-foreground" aria-hidden="true" />
              <span className="sr-only">{t("searchCards")}</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("searchCards")} className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none" />
            </label>
          ) : null}
          <div className="min-h-48 flex-1 overflow-y-auto p-4">
            {loadingOptions ? <div className="grid min-h-40 place-items-center"><LoaderCircle className="size-5 animate-spin text-safir" aria-label={t("loading")} /></div> : options.length ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {options.map((option) => (
                  <button key={`${option.type}:${option.id}`} type="button" className="flex items-center gap-3 rounded-2xl border p-2.5 text-left transition hover:border-safir/35 hover:bg-muted/35" onClick={() => { setAttachment(option); setPickerOpen(false); }}>
                    <OptionArtwork option={option} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{option.type === "collection" ? t("collectionSummary", { count: option.cardCount }) : option.name}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{option.type === "card" ? `N°${String(option.number).padStart(3, "0")}` : option.type === "deck" ? t("deckSummary", { count: option.cardCount }) : t("collectionHint")}</span>
                    </span>
                  </button>
                ))}
              </div>
            ) : <p className="grid min-h-40 place-items-center text-center text-sm text-muted-foreground">{t(`empty.${pickerType}`)}</p>}
          </div>
      </SheetContent>
    </Sheet>
  );
}
