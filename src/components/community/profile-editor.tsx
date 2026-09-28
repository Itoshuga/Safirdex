"use client";

import { CheckCircle2, ImageIcon, ImagePlus, LoaderCircle, Trash2, UserRound } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState, useTransition } from "react";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { Button } from "@/components/ui/button";
import { ProfileAvatar } from "@/components/community/profile-avatar";
import { initialCommunityActionState } from "@/features/community/action-state";
import {
  checkUsernameAvailabilityAction,
  updateProfileAction,
} from "@/features/community/server/actions";
import type { PublicProfileView } from "@/features/community/types";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { getFirebaseStorage } from "@/lib/firebase/client";

async function compressImage(file: File, maxWidth: number, maxHeight: number, quality: number) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("CANVAS_UNAVAILABLE");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("IMAGE_COMPRESSION_FAILED"))),
      "image/webp",
      quality,
    ),
  );
}

export function ProfileEditor({ profile, userId }: { profile: PublicProfileView; userId: string }) {
  const t = useTranslations("Profile.editor");
  const [state, setState] = useState(initialCommunityActionState);
  const [pending, startSaveTransition] = useTransition();
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [username, setUsername] = useState(profile.username);
  const [availabilityResult, setAvailabilityResult] = useState<{
    username: string;
    available: boolean;
  } | null>(null);
  const [, startAvailabilityTransition] = useTransition();
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? "");
  const [bannerUrl, setBannerUrl] = useState(profile.bannerUrl ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [uploading, setUploading] = useState<"avatar" | "banner" | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [baseline, setBaseline] = useState({
    displayName: profile.displayName,
    username: profile.username,
    bio: profile.bio ?? "",
    avatarUrl: profile.avatarUrl ?? "",
    bannerUrl: profile.bannerUrl ?? "",
  });
  const snapshot = useMemo(
    () => ({ displayName, username, bio, avatarUrl, bannerUrl }),
    [avatarUrl, bannerUrl, bio, displayName, username],
  );
  const dirty = JSON.stringify(snapshot) !== JSON.stringify(baseline);
  useUnsavedChanges(dirty && !pending, t("leaveWarning"));
  const errorKey = state.code === "AUTH_REQUIRED" ||
    state.code === "APPLICATION_MAINTENANCE" ||
    state.code === "USERNAME_TAKEN" ||
    state.code === "INVALID_ASSET_PATH"
    ? state.code
    : "INVALID_PROFILE";
  const unchangedUsername = username.toLowerCase() === profile.username.toLowerCase();
  const validUsername = /^[a-zA-Z0-9._-]{3,24}$/.test(username);
  const availability: "idle" | "checking" | "available" | "taken" = unchangedUsername
    ? "idle"
    : !validUsername
      ? "taken"
      : availabilityResult?.username !== username
        ? "checking"
        : availabilityResult.available
          ? "available"
          : "taken";

  useEffect(() => {
    if (
      username.toLowerCase() === profile.username.toLowerCase() ||
      !/^[a-zA-Z0-9._-]{3,24}$/.test(username)
    ) return;
    const timer = window.setTimeout(() => {
      startAvailabilityTransition(async () => {
        const result = await checkUsernameAvailabilityAction(username);
        setAvailabilityResult({ username, available: result.available });
      });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [profile.username, username]);

  function action(formData: FormData) {
    startSaveTransition(async () => {
      const result = await updateProfileAction(initialCommunityActionState, formData);
      setState(result);
      if (result.status === "success") setBaseline(snapshot);
    });
  }

  async function upload(kind: "avatar" | "banner", file?: File) {
    if (!file) return;
    setUploading(kind);
    setUploadError("");
    try {
      const blob = await compressImage(
        file,
        kind === "avatar" ? 512 : 1600,
        kind === "avatar" ? 512 : 600,
        0.82,
      );
      const storagePath = `users/${userId}/${kind}.webp`;
      const reference = ref(getFirebaseStorage(), storagePath);
      await uploadBytes(reference, blob, {
        contentType: "image/webp",
        cacheControl: "public,max-age=3600",
      });
      const url = await getDownloadURL(reference);
      if (kind === "avatar") setAvatarUrl(url);
      else setBannerUrl(url);
    } catch {
      setUploadError(t("uploadFailed"));
    } finally {
      setUploading(null);
    }
  }

  return (
    <section id="edit-profile" className="scroll-mt-6 rounded-2xl border bg-card p-5 sm:p-7">
      <p className="eyebrow">{t("eyebrow")}</p>
      <h2 className="mt-3 font-heading text-2xl font-semibold">{t("title")}</h2>
      <form action={action} className="mt-6 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="admin-label" htmlFor="profile-display-name">{t("displayName")}</label>
            <input id="profile-display-name" name="displayName" className="admin-input" value={displayName} onChange={(event) => setDisplayName(event.target.value)} minLength={2} maxLength={40} required />
          </div>
          <div className="space-y-1.5">
            <label className="admin-label" htmlFor="profile-username">{t("username")}</label>
            <div className="relative">
              <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">@</span>
              <input
                id="profile-username"
                name="username"
                className="admin-input pl-8"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                minLength={3}
                maxLength={24}
                pattern="[A-Za-z0-9._-]+"
                required
              />
            </div>
            <p className={`text-[0.68rem] ${availability === "taken" ? "text-destructive" : availability === "available" ? "text-emerald-600" : "text-muted-foreground"}`}>
              {availability === "checking" ? t("checking") : availability === "available" ? t("available") : availability === "taken" ? t("unavailable") : t("usernameHelp")}
            </p>
            <p className="truncate font-mono text-[0.68rem] text-muted-foreground">{t("usernamePreview", { username: username || "…" })}</p>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="admin-label" htmlFor="profile-bio">{t("bio")}</label>
          <textarea
            id="profile-bio"
            name="bio"
            className="admin-textarea"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            maxLength={280}
          />
          <p className="admin-help">{t("bioHelp", { count: bio.length })}</p>
        </div>
        <div className="rounded-2xl border bg-muted/20 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-safir/10 text-safir">
              <ImageIcon className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="font-heading text-lg font-semibold">{t("imagesTitle")}</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{t("imagesDescription")}</p>
            </div>
          </div>

          <div className="relative mt-5 pb-11 sm:pb-12">
            <div className="relative aspect-[8/3] w-full overflow-hidden rounded-2xl border bg-[linear-gradient(135deg,color-mix(in_oklch,var(--safir)_18%,var(--muted)),color-mix(in_oklch,var(--mineral)_12%,var(--background)))]">
              {bannerUrl ? (
                <Image src={bannerUrl} alt="" fill sizes="(max-width: 639px) 100vw, 720px" className="object-cover" />
              ) : (
                <>
                  <div className="surface-grid absolute inset-0 opacity-35" />
                  <div className="absolute -right-10 -bottom-16 size-40 rounded-full bg-safir/15 blur-3xl" />
                </>
              )}
              <span className="absolute top-3 left-3 rounded-full border border-white/10 bg-black/45 px-2.5 py-1 text-[0.62rem] font-semibold tracking-[0.08em] text-white uppercase backdrop-blur-md">
                {t("preview")}
              </span>
            </div>
            <ProfileAvatar
              src={avatarUrl || undefined}
              name={displayName}
              className="absolute bottom-0 left-5 size-22 border-[5px] shadow-lg sm:left-8 sm:size-24"
            />
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {(["avatar", "banner"] as const).map((kind) => {
              const url = kind === "avatar" ? avatarUrl : bannerUrl;
              const Icon = kind === "avatar" ? UserRound : ImageIcon;
              const inputId = `profile-${kind}-upload`;
              return (
                <div key={kind} className="rounded-xl border bg-background/75 p-4">
                  <div className="flex items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{t(kind)}</p>
                      <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{t(`${kind}Help`)}</p>
                    </div>
                  </div>
                  <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className={`size-1.5 rounded-full ${url ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                    {t(url ? "imageReady" : "imageEmpty")}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <label htmlFor={inputId} className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border bg-background px-3 text-xs font-semibold transition hover:bg-muted">
                      {uploading === kind ? <LoaderCircle className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
                      {t(url ? "replaceImage" : "chooseImage")}
                    </label>
                    <input
                      id={inputId}
                      className="sr-only"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={uploading !== null}
                      onChange={(event) => void upload(kind, event.target.files?.[0])}
                    />
                    {url ? (
                      <button
                        type="button"
                        className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-destructive transition hover:bg-destructive/10"
                        onClick={() => kind === "avatar" ? setAvatarUrl("") : setBannerUrl("")}
                      >
                        <Trash2 className="size-4" aria-hidden="true" /> {t("removeImage")}
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <input type="hidden" name="avatarUrl" value={avatarUrl} />
        <input type="hidden" name="avatarStoragePath" value={avatarUrl ? `users/${userId}/avatar.webp` : ""} />
        <input type="hidden" name="bannerUrl" value={bannerUrl} />
        <input type="hidden" name="bannerStoragePath" value={bannerUrl ? `users/${userId}/banner.webp` : ""} />
        {uploadError ? <p className="admin-error">{uploadError}</p> : null}
        {state.status === "error" ? <p className="admin-error">{t(`errors.${errorKey}`)}</p> : null}
        {state.status === "success" ? <p className="flex items-center gap-2 text-sm text-emerald-600"><CheckCircle2 className="size-4" /> {t("saved")}</p> : null}
        <div className="flex flex-wrap gap-2 border-t pt-5">
          <Button type="submit" size="lg" disabled={!dirty || pending || uploading !== null || availability === "checking" || availability === "taken"}>
            {pending ? <LoaderCircle className="animate-spin" /> : null} {t("save")}
          </Button>
          <Button
            type="button"
            size="lg"
            variant="ghost"
            disabled={!dirty || pending}
            onClick={() => {
              setDisplayName(baseline.displayName);
              setUsername(baseline.username);
              setBio(baseline.bio);
              setAvatarUrl(baseline.avatarUrl);
              setBannerUrl(baseline.bannerUrl);
              setUploadError("");
            }}
          >
            {t("cancel")}
          </Button>
        </div>
      </form>
    </section>
  );
}
