export default function CustomerDetailLoading() {
  return (
    <div className="p-5 md:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Back + name */}
      <div className="flex items-center gap-4">
        <div className="skeleton-dark h-8 w-8 rounded-lg" />
        <div className="space-y-1.5">
          <div className="skeleton-dark h-7 w-48 rounded-xl" />
          <div className="skeleton-dark h-4 w-32 rounded-lg" />
        </div>
      </div>

      {/* Score + badges */}
      <div className="flex items-center gap-3">
        <div className="skeleton-dark h-14 w-28 rounded-2xl" />
        <div className="skeleton-dark h-6 w-20 rounded-full" />
        <div className="skeleton-dark h-6 w-24 rounded-full" />
      </div>

      {/* 4 KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-white/[0.06] bg-vodium-charcoal p-4 space-y-2">
            <div className="skeleton-dark h-3 w-20 rounded" />
            <div className="skeleton-dark h-6 w-24 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Credit history */}
      <div className="bg-vodium-charcoal rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <div className="skeleton-dark h-4 w-32 rounded" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-white/[0.04]">
            <div className="flex-1 space-y-1.5">
              <div className="skeleton-dark h-4 w-40 rounded" />
              <div className="skeleton-dark h-3 w-28 rounded" />
            </div>
            <div className="skeleton-dark h-5 w-20 rounded-full" />
            <div className="skeleton-dark h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
