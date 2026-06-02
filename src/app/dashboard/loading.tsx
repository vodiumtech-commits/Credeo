export default function DashboardLoading() {
  return (
    <div className="p-5 md:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="skeleton-dark h-7 w-40 rounded-xl" />
          <div className="skeleton-dark h-4 w-56 rounded-lg" />
        </div>
        <div className="skeleton-dark h-9 w-28 rounded-xl" />
      </div>

      {/* 4 stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/[0.06] bg-vodium-charcoal p-5 space-y-4">
            <div className="skeleton-dark h-8 w-8 rounded-xl" />
            <div className="skeleton-dark h-7 w-24 rounded-lg" />
            <div className="skeleton-dark h-3.5 w-32 rounded" />
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Revenue chart */}
        <div className="lg:col-span-2 rounded-2xl border border-white/[0.06] bg-vodium-charcoal p-6 space-y-4">
          <div className="flex justify-between">
            <div className="space-y-2">
              <div className="skeleton-dark h-4 w-36 rounded" />
              <div className="skeleton-dark h-3 w-48 rounded" />
            </div>
            <div className="skeleton-dark h-6 w-20 rounded-full" />
          </div>
          <div className="skeleton-dark h-40 w-full rounded-xl" />
        </div>

        {/* Quick actions / overdue */}
        <div className="rounded-2xl border border-white/[0.06] bg-vodium-charcoal p-6 space-y-4">
          <div className="skeleton-dark h-4 w-28 rounded" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <div className="skeleton-dark h-8 w-8 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton-dark h-3.5 w-28 rounded" />
                <div className="skeleton-dark h-3 w-20 rounded" />
              </div>
              <div className="skeleton-dark h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
