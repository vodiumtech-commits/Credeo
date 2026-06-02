export default function AdminVendorDetailLoading() {
  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Back + header */}
      <div className="flex items-start gap-4">
        <div className="skeleton-dark h-8 w-8 rounded-lg mt-1 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <div className="skeleton-dark h-10 w-10 rounded-xl" />
            <div className="space-y-1.5">
              <div className="skeleton-dark h-7 w-48 rounded-xl" />
              <div className="skeleton-dark h-4 w-32 rounded-lg" />
            </div>
            <div className="skeleton-dark h-6 w-20 rounded-full" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="skeleton-dark h-9 w-24 rounded-xl" />
          <div className="skeleton-dark h-9 w-20 rounded-xl" />
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-vodium-charcoal border border-white/[0.06] rounded-xl p-4 space-y-2">
            <div className="skeleton-dark h-4 w-4 rounded" />
            <div className="skeleton-dark h-7 w-24 rounded-lg" />
            <div className="skeleton-dark h-3 w-20 rounded" />
          </div>
        ))}
      </div>

      {/* Detail cards */}
      <div className="grid md:grid-cols-2 gap-5">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl p-6 space-y-5">
            <div className="skeleton-dark h-4 w-28 rounded" />
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="flex gap-3">
                <div className="skeleton-dark h-4 w-4 rounded flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton-dark h-2.5 w-16 rounded" />
                  <div className="skeleton-dark h-4 w-36 rounded" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Credits table */}
      <div className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <div className="skeleton-dark h-4 w-32 rounded" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-6 py-3.5 border-b border-white/[0.04]">
            <div className="space-y-1.5">
              <div className="skeleton-dark h-4 w-40 rounded" />
              <div className="skeleton-dark h-3 w-32 rounded" />
            </div>
            <div className="flex items-center gap-4">
              <div className="skeleton-dark h-5 w-20 rounded" />
              <div className="skeleton-dark h-5 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
