export default function AdminFinanceLoading() {
  return (
    <div className="p-5 md:p-8 max-w-7xl space-y-7">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="skeleton-dark h-3 w-24 rounded" />
          <div className="skeleton-dark h-8 w-40 rounded-xl" />
        </div>
        <div className="skeleton-dark h-8 w-32 rounded-xl" />
      </div>

      {/* Revenue KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl p-5 space-y-3">
            <div className="skeleton-dark h-3 w-24 rounded" />
            <div className="skeleton-dark h-8 w-32 rounded-xl" />
            <div className="skeleton-dark h-3 w-20 rounded" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-vodium-charcoal border border-white/[0.06] rounded-2xl p-6 space-y-4">
          <div className="skeleton-dark h-4 w-40 rounded" />
          <div className="skeleton-dark h-56 w-full rounded-xl" />
        </div>
        <div className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl p-6 space-y-4">
          <div className="skeleton-dark h-4 w-36 rounded" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <div className="skeleton-dark h-3.5 w-20 rounded" />
                <div className="skeleton-dark h-3.5 w-12 rounded" />
              </div>
              <div className="skeleton-dark h-3 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Top vendors table */}
      <div className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <div className="skeleton-dark h-4 w-36 rounded" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-white/[0.04]">
            <div className="skeleton-dark h-8 w-8 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="skeleton-dark h-4 w-40 rounded" />
              <div className="skeleton-dark h-3 w-24 rounded" />
            </div>
            <div className="skeleton-dark h-5 w-20 rounded" />
            <div className="skeleton-dark h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
