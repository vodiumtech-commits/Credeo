export default function AdminTeamLoading() {
  return (
    <div className="p-5 md:p-8 max-w-4xl space-y-8">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="skeleton-dark h-3 w-32 rounded" />
          <div className="skeleton-dark h-8 w-36 rounded-xl" />
        </div>
        <div className="skeleton-dark h-10 w-36 rounded-xl" />
      </div>

      {/* Role cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-vodium-charcoal border border-white/[0.06] rounded-xl p-4 space-y-2">
            <div className="skeleton-dark h-8 w-8 rounded-lg" />
            <div className="skeleton-dark h-4 w-24 rounded" />
            <div className="skeleton-dark h-3 w-16 rounded" />
          </div>
        ))}
      </div>

      {/* Team member list */}
      <div className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06] flex justify-between">
          <div className="skeleton-dark h-4 w-24 rounded" />
          <div className="skeleton-dark h-4 w-16 rounded" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-white/[0.04]">
            <div className="skeleton-dark h-10 w-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="skeleton-dark h-4 w-36 rounded" />
              <div className="skeleton-dark h-3 w-48 rounded" />
            </div>
            <div className="skeleton-dark h-5 w-24 rounded-full" />
            <div className="skeleton-dark h-5 w-16 rounded-full" />
            <div className="skeleton-dark h-7 w-7 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
