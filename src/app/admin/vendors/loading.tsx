export default function AdminVendorsLoading() {
  return (
    <div className="p-6 md:p-8 max-w-7xl space-y-8">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="skeleton-dark h-3 w-32 rounded" />
          <div className="skeleton-dark h-8 w-36 rounded-xl" />
          <div className="skeleton-dark h-4 w-52 rounded-lg" />
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-vodium-charcoal border border-white/[0.06] rounded-xl p-4 space-y-2">
            <div className="skeleton-dark h-3 w-24 rounded" />
            <div className="skeleton-dark h-7 w-20 rounded-lg" />
            <div className="skeleton-dark h-3 w-16 rounded" />
          </div>
        ))}
      </div>

      {/* Plan cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border border-white/[0.08] rounded-xl p-5 space-y-3">
            <div className="skeleton-dark h-3 w-20 rounded" />
            <div className="skeleton-dark h-8 w-12 rounded-xl" />
            <div className="skeleton-dark h-3 w-32 rounded" />
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <div className="skeleton-dark h-10 w-full rounded-lg" />
        </div>
        <div className="hidden md:flex px-6 py-3 gap-4 bg-black/20">
          {[3, 2, 1, 2, 1, 1, 1, 1].map((w, i) => (
            <div key={i} className="skeleton-dark h-3 rounded" style={{ width: `${w * 7}%` }} />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-t border-white/[0.04]">
            <div className="skeleton-dark h-8 w-8 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="skeleton-dark h-4 w-36 rounded" />
              <div className="skeleton-dark h-3 w-24 rounded" />
            </div>
            <div className="hidden md:flex items-center gap-4 flex-1 justify-end">
              <div className="skeleton-dark h-4 w-12 rounded" />
              <div className="skeleton-dark h-4 w-20 rounded" />
              <div className="skeleton-dark h-4 w-16 rounded" />
              <div className="skeleton-dark h-5 w-14 rounded-full" />
              <div className="skeleton-dark h-5 w-16 rounded-md" />
              <div className="skeleton-dark h-7 w-7 rounded-lg" />
            </div>
          </div>
        ))}
        <div className="px-6 py-4 border-t border-white/[0.06]">
          <div className="skeleton-dark h-3 w-36 rounded" />
        </div>
      </div>
    </div>
  );
}
