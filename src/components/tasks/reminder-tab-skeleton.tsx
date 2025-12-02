import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

export function ReminderTabSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4 p-4"
    >
      {/* Input Skeleton */}
      <Skeleton className="h-10 w-full" />

      {/* Badges Skeleton */}
      <div className="flex flex-wrap items-center gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <Skeleton className="h-7 w-24 rounded-full" />
          </motion.div>
        ))}
      </div>

      {/* Options Skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Skeleton className="h-10 w-full rounded-md" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Button Skeleton */}
      <div className="flex justify-end pt-2 border-t dark:border-gray-800">
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
    </motion.div>
  );
}

