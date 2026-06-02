export default function AdminAnalyticsLoading() {
  return (
    <div className="p-5 md:p-8 max-w-7xl space-y-7">
      <div className="space-y-2">
        <div className="skeleton-dark h-3 w-24 rounded" />
        <div className="skeleton-dark h-8 w-36 rounded-xl" />
      </div>

      {/* Metric row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-vodium-charcoal border border-white/[0.06] rounded-xl p-4 space-y-2">
            <div className="skeleton-dark h-3 w-28 rounded" />
            <div className="skeleton-dark h-7 w-20 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Charts 2x2 */}
      <div className="grid md:grid-cols-2 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl p-6 space-y-4">
            <div className="skeleton-dark h-4 w-44 rounded" />
            <div className="skeleton-dark h-40 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
