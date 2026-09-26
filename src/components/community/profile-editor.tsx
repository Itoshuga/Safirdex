"use client";

import { CheckCircle2, ImagePlus, LoaderCircle } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useState, useTransition } from "react";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { Button } from "@/components/ui/button";
import { initialCommunityActionState } from "@/features/community/action-state";
import {
  checkUsernameAvailabilityAction,
  updateProfileAction,
} from "@/features/community/server/actions";
import type { PublicProfileView } from "@/features/community/types";
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
  const [state, action, pending] = useActionState(updateProfileAction, initialCommunityActionState);
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
  const errorKey = state.code === "AUTH_REQUIRED" ||
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
            <input id="profile-display-name" name="displayName" className="admin-input" defaultValue={profile.displayName} minLength={2} maxLength={40} required />
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
        <div className="grid gap-4 sm:grid-cols-2">
          {(["avatar", "banner"] as const).map((kind) => {
            const url = kind === "avatar" ? avatarUrl : bannerUrl;
            return (
              <div key={kind} className="rounded-xl border p-4">
                <p className="text-sm font-semibold">{t(kind)}</p>
                <div className={`relative mt-3 overflow-hidden rounded-lg bg-muted ${kind === "avatar" ? "size-24 rounded-full" : "aspect-[8/3] w-full"}`}>
                  {url ? <Image src={url} alt="" fill sizes={kind === "avatar" ? "96px" : "320px"} className="object-cover" /> : null}
                </div>
                <label className="mt-3 inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition hover:bg-muted">
                  {uploading === kind ? <LoaderCircle className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
                  {t("chooseImage")}
                  <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading !== null} onChange={(event) => void upload(kind, event.target.files?.[0])} />
                </label>
              </div>
            );
          })}
        </div>
        <input type="hidden" name="avatarUrl" value={avatarUrl} />
        <input type="hidden" name="avatarStoragePath" value={avatarUrl ? `users/${userId}/avatar.webp` : ""} />
        <input type="hidden" name="bannerUrl" value={bannerUrl} />
        <input type="hidden" name="bannerStoragePath" value={bannerUrl ? `users/${userId}/banner.webp` : ""} />
        {uploadError ? <p className="admin-error">{uploadError}</p> : null}
        {state.status === "error" ? <p className="admin-error">{t(`errors.${errorKey}`)}</p> : null}
        {state.status === "success" ? <p className="flex items-center gap-2 text-sm text-emerald-600"><CheckCircle2 className="size-4" /> {t("saved")}</p> : null}
        <Button type="submit" size="lg" disabled={pending || uploading !== null || availability === "checking" || availability === "taken"}>
          {pending ? <LoaderCircle className="animate-spin" /> : null} {t("save")}
        </Button>
      </form>
    </section>
  );
}
