export default function CardsLoading() {
  return (
    <main className="site-container py-12" aria-busy="true">
      <div className="h-4 w-32 animate-pulse rounded bg-muted" />
      <div className="mt-4 h-16 w-72 max-w-full animate-pulse rounded-xl bg-muted" />
      <div className="mt-10 grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <div className="hidden h-[34rem] animate-pulse rounded-2xl bg-muted lg:block" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4 2xl:grid-cols-6">
          {Array.from({ length: 12 }, (_, index) => (
            <div key={index} className="aspect-[5/8] animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    </main>
  );
}
