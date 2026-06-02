export default function SettingsLoading() {
  return (
    <div className="p-5 md:p-8 space-y-8 max-w-2xl mx-auto">
      <div className="space-y-2">
        <div className="skeleton-dark h-8 w-28 rounded-xl" />
        <div className="skeleton-dark h-4 w-56 rounded-lg" />
      </div>

      {/* Profile section */}
      <div className="bg-vodium-charcoal rounded-2xl border border-white/[0.06] p-6 space-y-5">
        <div className="skeleton-dark h-4 w-28 rounded" />
        <div className="flex items-center gap-4">
          <div className="skeleton-dark h-16 w-16 rounded-2xl" />
          <div className="space-y-2">
            <div className="skeleton-dark h-5 w-40 rounded-lg" />
            <div className="skeleton-dark h-3.5 w-32 rounded" />
          </div>
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="skeleton-dark h-3.5 w-24 rounded" />
            <div className="skeleton-dark h-11 w-full rounded-xl" />
          </div>
        ))}
      </div>

      {/* Subscription section */}
      <div className="bg-vodium-charcoal rounded-2xl border border-white/[0.06] p-6 space-y-5">
        <div className="skeleton-dark h-4 w-32 rounded" />
        <div className="skeleton-dark h-20 w-full rounded-xl" />
        <div className="skeleton-dark h-10 w-36 rounded-xl" />
      </div>

      {/* Danger zone */}
      <div className="bg-vodium-charcoal rounded-2xl border border-rose-500/20 p-6 space-y-4">
        <div className="skeleton-dark h-4 w-28 rounded" />
        <div className="skeleton-dark h-3.5 w-64 rounded" />
        <div className="skeleton-dark h-10 w-32 rounded-xl" />
      </div>
    </div>
  );
}
