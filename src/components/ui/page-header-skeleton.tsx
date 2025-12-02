import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'

interface PageHeaderSkeletonProps {
  showBadge?: boolean
  showActions?: number
}

export function PageHeaderSkeleton({ showBadge = true, showActions = 3 }: PageHeaderSkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-between gap-2 px-4 md:px-6 py-2 border-b border-border"
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-4 w-32" />
        {showBadge && <Skeleton className="h-5 w-20 rounded-full hidden sm:block" />}
      </div>
      <div className="flex items-center gap-1">
        {Array.from({ length: showActions }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-7 rounded-md" />
        ))}
      </div>
    </motion.div>
  )
}
