export default function CustomersLoading() {
  return (
    <div className="p-5 md:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="skeleton-dark h-8 w-32 rounded-xl" />
          <div className="skeleton-dark h-4 w-48 rounded-lg" />
        </div>
        <div className="skeleton-dark h-10 w-36 rounded-xl" />
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-white/[0.06] bg-vodium-charcoal p-4 space-y-2">
            <div className="skeleton-dark h-3 w-24 rounded" />
            <div className="skeleton-dark h-6 w-16 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Customer list */}
      <div className="bg-vodium-charcoal rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <div className="skeleton-dark h-9 w-full rounded-lg" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-white/[0.04]">
            <div className="skeleton-dark h-9 w-9 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="skeleton-dark h-4 w-36 rounded" />
              <div className="skeleton-dark h-3 w-24 rounded" />
            </div>
            <div className="hidden md:flex gap-6">
              <div className="skeleton-dark h-5 w-20 rounded-full" />
              <div className="skeleton-dark h-5 w-16 rounded-full" />
              <div className="skeleton-dark h-5 w-20 rounded-full" />
            </div>
            <div className="skeleton-dark h-7 w-7 rounded-lg ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
