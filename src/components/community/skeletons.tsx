function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted ${className}`} />;
}

export function UserCardSkeleton() {
  return <div className="flex gap-4 rounded-2xl border p-4"><Pulse className="size-12 rounded-full" /><div className="flex-1 space-y-2"><Pulse className="h-4 w-2/3" /><Pulse className="h-3 w-1/3" /><Pulse className="h-3 w-full" /></div></div>;
}

export function DeckActivitySkeleton() {
  return <div className="rounded-2xl border p-5"><div className="flex gap-3"><Pulse className="size-11 rounded-full" /><div className="flex-1 space-y-2"><Pulse className="h-4 w-1/3" /><Pulse className="h-3 w-1/4" /></div></div><Pulse className="mt-5 h-40 w-full" /></div>;
}

export function CommunityFeedSkeleton() {
  return <div className="space-y-4"><DeckActivitySkeleton /><DeckActivitySkeleton /><DeckActivitySkeleton /></div>;
}

export function ProfileHeaderSkeleton() {
  return <div><Pulse className="h-56 w-full rounded-2xl" /><div className="px-5"><Pulse className="-mt-14 size-28 rounded-full" /><Pulse className="mt-4 h-9 w-64" /><Pulse className="mt-3 h-4 w-40" /></div></div>;
}

