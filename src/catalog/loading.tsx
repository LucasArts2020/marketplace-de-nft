export function Loading({ label, count }: { label: string; count: number }) {
  return (
    <div role="status">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="space-y-3 rounded-lg bg-card p-3">
            <div className="skeleton aspect-4/3 rounded-md" />
            <div className="skeleton h-6 w-2/3 rounded-md" />
            <div className="skeleton h-6 w-1/3 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}
