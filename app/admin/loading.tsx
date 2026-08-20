import { Skeleton } from '@/components/ui/skeleton'

export default function AdminLoading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
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

      {/* Filter bar */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1 max-w-sm rounded-md" />
          <Skeleton className="h-10 w-32 rounded-md" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Table header */}
        <div className="border-b border-gray-200 dark:border-gray-800 px-6 py-3 bg-gray-50 dark:bg-gray-800 flex gap-6">
          {[40, 28, 20, 16, 20].map((w, i) => (
            <Skeleton key={i} className={`h-3 w-${w}`} />
          ))}
        </div>
        {/* Table rows */}
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="flex items-center gap-6 px-6 py-4 border-b border-gray-100 dark:border-gray-800 last:border-0"
          >
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-md ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}
