export default function AdminSupportLoading() {
  return (
    <div className="p-5 md:p-8 max-w-7xl space-y-7">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="skeleton-dark h-3 w-28 rounded" />
          <div className="skeleton-dark h-8 w-44 rounded-xl" />
        </div>
      </div>

      {/* Search bar */}
      <div className="skeleton-dark h-12 w-full rounded-xl" />

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-vodium-charcoal border border-white/[0.06] rounded-xl p-4 space-y-2">
            <div className="skeleton-dark h-3 w-20 rounded" />
            <div className="skeleton-dark h-6 w-14 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Vendor cards grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="skeleton-dark h-10 w-10 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton-dark h-4 w-36 rounded" />
                <div className="skeleton-dark h-3 w-24 rounded" />
              </div>
              <div className="skeleton-dark h-5 w-14 rounded-full" />
            </div>
            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              {Array.from({ length: 2 }).map((_, j) => (
                <div key={j} className="flex justify-between">
                  <div className="skeleton-dark h-3.5 w-28 rounded" />
                  <div className="skeleton-dark h-3.5 w-16 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
