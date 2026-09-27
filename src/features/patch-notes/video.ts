const YOUTUBE_ID = /^[a-zA-Z0-9_-]{6,20}$/;
const VIMEO_ID = /^\d{5,15}$/;

export function getPatchNoteVideoEmbed(value: string) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    if (hostname === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0] ?? "";
      return YOUTUBE_ID.test(id) ? { provider: "youtube" as const, id, src: `https://www.youtube-nocookie.com/embed/${id}` } : null;
    }
    if (hostname === "youtube.com" || hostname === "m.youtube.com") {
      const id = url.pathname.startsWith("/shorts/")
        ? url.pathname.split("/")[2] ?? ""
        : url.searchParams.get("v") ?? "";
      return YOUTUBE_ID.test(id) ? { provider: "youtube" as const, id, src: `https://www.youtube-nocookie.com/embed/${id}` } : null;
    }
    if (hostname === "vimeo.com" || hostname === "player.vimeo.com") {
      const id = url.pathname.split("/").filter(Boolean).findLast((segment) => VIMEO_ID.test(segment)) ?? "";
      return VIMEO_ID.test(id) ? { provider: "vimeo" as const, id, src: `https://player.vimeo.com/video/${id}` } : null;
    }
  } catch {
    return null;
  }
  return null;
}

export function isSafePatchNoteLink(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
