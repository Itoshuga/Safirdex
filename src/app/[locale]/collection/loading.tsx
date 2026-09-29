import { PublicHeader } from "@/components/layout/public-header";

export default function CollectionLoading() {
  return (
    <div className="min-h-screen bg-background" aria-busy="true">
      <PublicHeader />
      <main>
        <section className="border-b">
          <div className="site-container py-9 sm:py-12">
            <div className="mb-7 h-4 w-40 animate-pulse rounded bg-muted" />
            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(26rem,1.1fr)] lg:items-end">
              <div>
                <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                <div className="mt-4 h-14 w-64 max-w-full animate-pulse rounded-xl bg-muted" />
                <div className="mt-4 h-12 w-full max-w-xl animate-pulse rounded-xl bg-muted" />
              </div>
              <div className="h-36 animate-pulse rounded-2xl border bg-muted/60" />
            </div>
            <div className="mt-8 border-t pt-4">
              <div className="h-10 w-72 max-w-full animate-pulse rounded-full bg-muted" />
            </div>
          </div>
        </section>

        <section className="site-container py-8 sm:py-10">
          <div className="mb-5 flex items-end justify-between gap-4 border-b pb-4">
            <div>
              <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              <div className="mt-3 h-8 w-56 animate-pulse rounded-lg bg-muted" />
            </div>
            <div className="h-5 w-28 animate-pulse rounded bg-muted" />
          </div>
          <div className="mb-5 h-28 animate-pulse rounded-2xl border bg-muted/50" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 2xl:grid-cols-5">
            {Array.from({ length: 10 }, (_, index) => (
              <div key={index} className="aspect-[5/8] animate-pulse rounded-[1.35rem] bg-muted" />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
