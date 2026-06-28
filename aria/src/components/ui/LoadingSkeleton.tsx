import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  lines?: number
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-white/5',
        className
      )}
    />
  )
}

export function CardSkeleton({ lines = 3 }: SkeletonProps) {
  return (
    <div className="glass rounded-2xl border border-white/10 p-4 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-full" />
      ))}
    </div>
  )
}

export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} lines={2} />
      ))}
    </div>
  )
}
