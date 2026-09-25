"use client";

import { CheckCircle2, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

export function NoticeToast({ message }: { message?: string }) {
  const [dismissedMessage, setDismissedMessage] = useState("");
  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setDismissedMessage(message), 4500);
    return () => window.clearTimeout(timeout);
  }, [message]);
  if (!message || dismissedMessage === message) return null;
  return (
    <div className="fixed right-4 bottom-4 z-50 flex max-w-sm items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm shadow-2xl" role="status">
      <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
      <span className="flex-1">{message}</span>
      <Button variant="ghost" size="icon-xs" onClick={() => setDismissedMessage(message)} aria-label="Dismiss"><X /></Button>
    </div>
  );
}
