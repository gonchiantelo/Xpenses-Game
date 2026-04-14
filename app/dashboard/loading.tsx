// Skeleton loader para el Dashboard en la ruta original app/dashboard/
// Mostrado automáticamente por Next.js mientras carga el Server Component

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <div className="skeleton h-6 w-32 rounded-lg" />
          <div className="skeleton h-3 w-44 rounded-md" />
        </div>
        <div className="skeleton h-8 w-8 rounded-xl" />
      </div>

      {/* NetBalanceCard skeleton */}
      <div className="skeleton h-36 w-full rounded-2xl" />

      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="skeleton h-3 w-24 rounded-md" />
        <div className="skeleton h-7 w-16 rounded-lg" />
      </div>

      {/* Group cards */}
      {[1, 2, 3].map(i => (
        <div key={i} className="rounded-xl border border-subtle bg-surface p-4"
          style={{ opacity: 1 - i * 0.15 }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="skeleton w-11 h-11 rounded-xl" />
            <div className="flex flex-col gap-2 flex-1">
              <div className="skeleton h-4 w-32 rounded-md" />
              <div className="skeleton h-3 w-20 rounded-md" />
            </div>
            <div className="flex flex-col gap-1 items-end">
              <div className="skeleton h-2 w-12 rounded-sm" />
              <div className="skeleton h-4 w-20 rounded-md" />
            </div>
          </div>
          <div className="progress-track">
            <div className="skeleton h-full w-3/4 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
