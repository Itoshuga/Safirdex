import { CommunityFeedSkeleton, UserSuggestionSkeleton } from "@/components/community/skeletons";
import { PublicHeader } from "@/components/layout/public-header";

export default function CommunityLoading() {
  return (
    <div className="min-h-screen bg-background" aria-busy="true" aria-live="polite">
      <PublicHeader />
      <main>
        <div className="border-b bg-muted/20">
          <div className="site-container py-10 sm:py-14">
            <div className="h-9 w-64 animate-pulse rounded-xl bg-muted" />
            <div className="mt-4 h-4 w-full max-w-xl animate-pulse rounded bg-muted" />
            <div className="mt-7 h-16 w-full max-w-3xl animate-pulse rounded-2xl bg-muted" />
            <div className="mt-7 h-10 w-80 max-w-full animate-pulse rounded-full bg-muted" />
          </div>
        </div>
        <div className="site-container py-8 sm:py-10">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.62fr)_minmax(19rem,0.72fr)]">
            <section className="order-2 lg:order-1">
              <div className="mb-6 h-16 animate-pulse rounded-xl bg-muted" />
              <CommunityFeedSkeleton />
            </section>
            <aside className="order-1 space-y-3 lg:order-2">
              <div className="mb-4 h-8 w-40 animate-pulse rounded-lg bg-muted" />
              <UserSuggestionSkeleton />
              <UserSuggestionSkeleton />
              <UserSuggestionSkeleton />
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
