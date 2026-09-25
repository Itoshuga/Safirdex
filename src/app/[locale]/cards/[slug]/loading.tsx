export default function CardDetailLoading() {
  return (
    <main className="site-container py-12" aria-busy="true">
      <div className="mb-8 h-5 w-36 animate-pulse rounded bg-muted" />
      <div className="grid gap-8 lg:grid-cols-[minmax(20rem,0.82fr)_minmax(0,1.18fr)] lg:gap-14">
        <div className="aspect-[5/7] animate-pulse rounded-2xl bg-muted" />
        <div className="space-y-5 py-8">
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
          <div className="h-20 w-4/5 animate-pulse rounded-xl bg-muted" />
          <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-24 w-full animate-pulse rounded-2xl bg-muted" />
          <div className="h-32 w-full animate-pulse rounded-2xl bg-muted" />
        </div>
      </div>
    </main>
  );
}
