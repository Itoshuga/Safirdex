import { PublicHeader } from "@/components/layout/public-header";
import { UserCardSkeleton } from "@/components/community/skeletons";

export default function CommunityPeopleLoading() {
  return (
    <div className="min-h-screen bg-background" aria-busy="true" aria-live="polite">
      <PublicHeader />
      <main>
        <div className="border-b">
          <div className="site-container py-12">
            <div className="h-12 w-72 animate-pulse rounded-xl bg-muted" />
            <div className="mt-6 h-16 max-w-2xl animate-pulse rounded-2xl bg-muted" />
          </div>
        </div>
        <div className="site-container grid gap-4 py-10 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <UserCardSkeleton key={index} />
          ))}
        </div>
      </main>
    </div>
  );
}
