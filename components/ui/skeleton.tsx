import { cn } from "@/lib/utils"

/**
 * Loading placeholder. Shimmer animation respects `prefers-reduced-motion`
 * automatically (`animate-pulse` does not run when reduced motion is set).
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="skeleton"
      role="presentation"
      aria-hidden
      className={cn("bg-muted/70 animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

/** Pre-baked composite: a card-shaped skeleton with header + body rows. */
export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div className="bg-card/40 border-border/60 flex flex-col gap-3 rounded-lg border p-5">
      <Skeleton className="h-4 w-1/3" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-3" style={{ width: `${100 - i * 10}%` }} />
      ))}
    </div>
  )
}

/** Pre-baked composite: side-by-side column placeholders. */
export function SkeletonColumns({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${count}, 1fr)` }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} rows={4} />
      ))}
    </div>
  )
}
