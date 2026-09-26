import { CommunityFeedSkeleton, UserCardSkeleton } from "@/components/community/skeletons";

export default function CommunityLoading() {
  return (
    <main className="site-container py-12">
      <div className="h-36 animate-pulse rounded-2xl bg-muted" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)]">
        <CommunityFeedSkeleton />
        <div className="space-y-3"><UserCardSkeleton /><UserCardSkeleton /><UserCardSkeleton /></div>
      </div>
    </main>
  );
}

