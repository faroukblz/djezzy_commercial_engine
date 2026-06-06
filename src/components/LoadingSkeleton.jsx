export function SkeletonRow({ cols = 6 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="skeleton h-4 w-full rounded" />
        </td>
      ))}
    </tr>
  )
}

export function SkeletonCard() {
  return (
    <div className="glass-card p-6 space-y-4">
      <div className="skeleton h-4 w-1/3 rounded" />
      <div className="skeleton h-8 w-2/3 rounded" />
      <div className="skeleton h-3 w-1/2 rounded" />
    </div>
  )
}

export function SkeletonGauge() {
  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <div className="skeleton w-48 h-24 rounded-t-full" />
      <div className="skeleton h-6 w-24 rounded" />
    </div>
  )
}
