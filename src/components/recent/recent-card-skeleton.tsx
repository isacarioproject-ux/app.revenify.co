import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

export function RecentCardSkeleton() {
  return (
    <div className="space-y-3 p-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex gap-3 p-2"
        >
          {/* Avatar */}
          <Skeleton className="size-8 rounded-full flex-shrink-0" />
          
          {/* Content */}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </motion.div>
      ))}
      
      {/* Shimmer Effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          repeatDelay: 0.5,
          ease: "easeInOut"
        }}
      />
    </div>
  );
}
