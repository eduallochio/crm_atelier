import { Skeleton } from '@/components/ui/skeleton'

export function AdminTableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="border-b border-gray-200 dark:border-gray-800 px-6 py-3 bg-gray-50 dark:bg-gray-800 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 dark:border-gray-800 last:border-0">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" style={{ maxWidth: j === 0 ? '180px' : j === cols - 1 ? '40px' : '100px' }} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function AdminCardsSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-${Math.min(cards, 4)} gap-4`}>
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  )
}

export function AdminPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
      <AdminCardsSkeleton cards={4} />
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1 max-w-sm rounded-md" />
          <Skeleton className="h-10 w-28 rounded-md" />
        </div>
      </div>
      <AdminTableSkeleton rows={6} cols={5} />
    </div>
  )
}

export function AdminDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-28" />
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
          </div>
        ))}
      </div>
    </div>
  )
}
