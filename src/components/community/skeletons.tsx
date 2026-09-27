function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted ${className}`} />;
}

export function UserCardSkeleton() {
  return <div className="flex gap-4 rounded-2xl border p-4"><Pulse className="size-12 rounded-full" /><div className="flex-1 space-y-2"><Pulse className="h-4 w-2/3" /><Pulse className="h-3 w-1/3" /><Pulse className="h-3 w-full" /></div></div>;
}

export function UserSuggestionSkeleton() {
  return <UserCardSkeleton />;
}

export function ActivityCardSkeleton() {
  return <div className="overflow-hidden rounded-3xl border bg-card"><div className="flex gap-3 p-5"><Pulse className="size-11 rounded-full" /><div className="flex-1 space-y-2"><Pulse className="h-4 w-1/3" /><Pulse className="h-3 w-1/4" /></div></div><Pulse className="h-64 w-full rounded-none" /><div className="space-y-2 p-5"><Pulse className="h-4 w-2/3" /><Pulse className="h-3 w-full" /></div></div>;
}

export function DeckActivitySkeleton() {
  return <ActivityCardSkeleton />;
}

export function CommunityDeckSkeleton() {
  return <div className="space-y-3"><Pulse className="aspect-[4/3] w-full rounded-2xl" /><Pulse className="h-4 w-3/4" /><Pulse className="h-3 w-1/2" /></div>;
}

export function CommunityFeedSkeleton() {
  return <div className="space-y-6"><ActivityCardSkeleton /><ActivityCardSkeleton /><ActivityCardSkeleton /></div>;
}

export function ProfileHeaderSkeleton() {
  return <div><Pulse className="h-56 w-full rounded-2xl" /><div className="px-5"><Pulse className="-mt-14 size-28 rounded-full" /><Pulse className="mt-4 h-9 w-64" /><Pulse className="mt-3 h-4 w-40" /></div></div>;
}
