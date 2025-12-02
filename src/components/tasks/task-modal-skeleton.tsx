import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

export function TaskModalSkeleton() {
  return (
    <div className="flex flex-col h-full relative">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b dark:border-gray-800">
        <div className="flex items-center gap-4">
          {/* Ícone + Badge */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-5 w-8 rounded" />
          </div>
          
          {/* Navegação */}
          <div className="flex items-center gap-1">
            <Skeleton className="h-7 w-7 rounded" />
            <Skeleton className="h-7 w-7 rounded" />
          </div>
          
          {/* Info */}
          <Skeleton className="h-4 w-32" />
        </div>
        
        {/* Botões direita */}
        <div className="flex items-center gap-0.5">
          <Skeleton className="h-7 w-7 rounded" />
          <Skeleton className="h-7 w-7 rounded" />
          <Skeleton className="h-7 w-7 rounded" />
          <Skeleton className="h-7 w-7 rounded" />
          <Skeleton className="h-7 w-7 rounded" />
        </div>
      </div>
      
      {/* Content Skeleton */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 p-4 space-y-4 overflow-auto">
          {/* Título */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Skeleton className="h-8 w-3/4" />
          </motion.div>
          
          {/* Descrição */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </motion.div>
          
          {/* Properties */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-2"
          >
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-full" />
            <Skeleton className="h-8 w-28 rounded-full" />
            <Skeleton className="h-8 w-16 rounded-full" />
          </motion.div>
          
          {/* Campos */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-3"
          >
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-full rounded" />
          </motion.div>
        </div>
        
        {/* Sidebar Skeleton */}
        <div className="w-80 border-l dark:border-gray-800 p-4 space-y-4">
          <Skeleton className="h-6 w-24" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex gap-2"
              >
                <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      
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
