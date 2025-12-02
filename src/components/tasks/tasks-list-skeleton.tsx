import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

export function TasksListSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center gap-2 py-1.5 px-2 rounded-md"
        >
          {/* Checkbox */}
          <Skeleton className="h-4 w-4 rounded flex-shrink-0" />
          
          {/* Título */}
          <Skeleton className="h-4 flex-1" style={{ width: `${60 + Math.random() * 30}%` }} />
          
          {/* Badges */}
          <div className="flex items-center gap-1">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
          
          {/* Avatar */}
          <Skeleton className="h-6 w-6 rounded-full flex-shrink-0" />
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
