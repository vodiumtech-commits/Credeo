export default function CreditsLoading() {
  return (
    <div className="p-5 md:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="skeleton-dark h-8 w-24 rounded-xl" />
          <div className="skeleton-dark h-4 w-40 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <div className="skeleton-dark h-10 w-28 rounded-xl" />
          <div className="skeleton-dark h-10 w-28 rounded-xl" />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/[0.06] bg-vodium-charcoal p-4 space-y-2">
            <div className="skeleton-dark h-7 w-7 rounded-lg" />
            <div className="skeleton-dark h-6 w-20 rounded-lg" />
            <div className="skeleton-dark h-3 w-24 rounded" />
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-vodium-charcoal rounded-2xl border border-white/[0.06] overflow-hidden">
        {/* Table header */}
        <div className="hidden md:flex px-6 py-3 border-b border-white/[0.06] gap-4">
          {[3, 3, 2, 2, 1, 1].map((w, i) => (
            <div key={i} className={`skeleton-dark h-3 rounded col-span-${w}`} style={{ width: `${w * 8}%` }} />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-white/[0.04]">
            <div className="flex-1 space-y-1.5">
              <div className="skeleton-dark h-4 w-32 rounded" />
              <div className="skeleton-dark h-3 w-20 rounded" />
            </div>
            <div className="hidden md:block flex-1">
              <div className="skeleton-dark h-3.5 w-28 rounded" />
            </div>
            <div className="skeleton-dark h-5 w-20 rounded-full ml-auto" />
            <div className="skeleton-dark h-5 w-20 rounded-full" />
            <div className="skeleton-dark h-3 w-12 rounded" />
            <div className="skeleton-dark h-6 w-16 rounded-full" />
            <div className="skeleton-dark h-7 w-20 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
