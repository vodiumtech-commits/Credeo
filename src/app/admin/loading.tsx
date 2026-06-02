export default function AdminOverviewLoading() {
  return (
    <div className="p-5 md:p-8 max-w-7xl space-y-7">
      {/* Header */}
      <div className="flex justify-between items-start pt-1">
        <div className="space-y-2">
          <div className="skeleton-dark h-3 w-32 rounded" />
          <div className="skeleton-dark h-8 w-48 rounded-xl" />
          <div className="skeleton-dark h-4 w-40 rounded-lg" />
        </div>
        <div className="skeleton-dark h-8 w-44 rounded-xl" />
      </div>

      {/* 4 KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl p-5 space-y-4">
            <div className="flex justify-between">
              <div className="skeleton-dark h-3 w-24 rounded" />
              <div className="skeleton-dark h-9 w-9 rounded-xl" />
            </div>
            <div className="skeleton-dark h-9 w-28 rounded-xl" />
            <div className="skeleton-dark h-3.5 w-36 rounded" />
          </div>
        ))}
      </div>

      {/* 4 secondary metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-vodium-charcoal border border-white/[0.06] rounded-xl p-4 space-y-2">
            <div className="skeleton-dark h-3 w-32 rounded" />
            <div className="skeleton-dark h-7 w-16 rounded-lg" />
          </div>
        ))}
      </div>

      {/* 2 charts */}
      <div className="grid lg:grid-cols-2 gap-5">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl p-6 space-y-4">
            <div className="flex justify-between">
              <div className="space-y-2">
                <div className="skeleton-dark h-4 w-40 rounded" />
                <div className="skeleton-dark h-3 w-56 rounded" />
              </div>
              <div className="skeleton-dark h-6 w-20 rounded-full" />
            </div>
            <div className="skeleton-dark h-36 w-full rounded-xl" />
          </div>
        ))}
      </div>

      {/* Bottom row: vendors list + activity */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-vodium-charcoal border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.06] flex justify-between">
            <div className="skeleton-dark h-4 w-32 rounded" />
            <div className="skeleton-dark h-4 w-16 rounded" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-6 py-3.5 border-b border-white/[0.04]">
              <div className="skeleton-dark h-8 w-8 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton-dark h-4 w-36 rounded" />
                <div className="skeleton-dark h-3 w-24 rounded" />
              </div>
              <div className="skeleton-dark h-5 w-12 rounded" />
              <div className="skeleton-dark h-5 w-14 rounded-full" />
            </div>
          ))}
        </div>
        <div className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <div className="skeleton-dark h-4 w-28 rounded" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3 px-5 py-3.5 border-b border-white/[0.04]">
              <div className="skeleton-dark h-2 w-2 rounded-full mt-1.5 flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton-dark h-3 w-full rounded" />
                <div className="skeleton-dark h-2.5 w-20 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
