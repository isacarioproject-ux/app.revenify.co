import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

interface TasksCardSkeletonProps {
  variant?: 'default' | 'compact';
}

export function TasksCardSkeleton({ variant = 'default' }: TasksCardSkeletonProps) {
  const cardCount = variant === 'compact' ? 4 : 6;
  console.log('🔄 TasksCardSkeleton renderizado com', cardCount, 'cards');

  return (
    <div className="space-y-2 px-2 py-3 relative">
      {/* 6 Mini Cards suaves com baixa opacidade */}
      {Array.from({ length: cardCount }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 0.4, y: 0 }}
          transition={{
            duration: 0.4,
            delay: index * 0.08,
            ease: "easeOut"
          }}
          className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/20 border border-muted/10"
        >
          {/* Checkbox */}
          <Skeleton className="h-4 w-4 rounded-sm flex-shrink-0 opacity-50" />
          
          {/* Task Content */}
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-full max-w-[160px] opacity-60" />
            {index % 3 === 0 && (
              <Skeleton className="h-2.5 w-full max-w-[100px] opacity-40" />
            )}
          </div>

          {/* Icons/Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {index % 2 === 0 && (
              <Skeleton className="h-3.5 w-3.5 rounded-full opacity-40" />
            )}
            <Skeleton className="h-3.5 w-3.5 rounded-full opacity-40" />
          </div>
        </motion.div>
      ))}

      {/* Shimmer Effect Overlay - Mais suave */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 1,
          ease: "easeInOut"
        }}
      />
    </div>
  );
}

// Skeleton para estado vazio
export function TasksEmptySkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center h-full py-12 px-4"
    >
      <motion.div
        animate={{
          y: [0, -8, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="mb-4"
      >
        <Skeleton className="h-16 w-16 rounded-full" />
      </motion.div>
      <Skeleton className="h-4 w-40 mb-2" />
      <Skeleton className="h-3 w-56" />
    </motion.div>
  );
}

// Skeleton para tabs
export function TasksTabsSkeleton() {
  return (
    <div className="flex items-center gap-2 px-2 pt-1">
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <Skeleton className="h-8 w-20 rounded-md" />
        </motion.div>
      ))}
    </div>
  );
}

// Skeleton para lista simples (aba Feito/Delegado)
export function TasksListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2 px-2 py-1.5">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3,
            delay: index * 0.05,
            ease: "easeOut"
          }}
          className="flex items-center gap-2 p-2 rounded-md bg-muted/30"
        >
          {/* Checkbox */}
          <Skeleton className="h-4 w-4 rounded-sm flex-shrink-0" />
          
          {/* Task Content */}
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-full max-w-[200px]" />
            {index % 3 === 0 && (
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            )}
          </div>

          {/* Avatar */}
          <Skeleton className="h-6 w-6 rounded-full flex-shrink-0" />
        </motion.div>
      ))}
    </div>
  );
}

// Skeleton para o header da página de tasks
export function TasksHeaderSkeleton() {
  return (
    <div className="flex items-center gap-4 px-8 py-3">
      {/* Tabs Skeleton */}
      <div className="flex items-center gap-0.5 bg-muted/50 rounded-md p-0.5">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <Skeleton className="h-8 w-20 rounded-sm" />
          </motion.div>
        ))}
      </div>

      {/* Separador */}
      <Skeleton className="h-6 w-px" />

      {/* Seletor de Ícone */}
      <Skeleton className="h-9 w-9 rounded-md" />

      {/* Input Nome do Workspace */}
      <Skeleton className="h-9 w-64 rounded-md" />

      {/* Badge contador */}
      <Skeleton className="h-6 w-8 rounded-full" />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Botões de Ação */}
      <div className="flex items-center gap-1">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <Skeleton className="h-8 w-8 rounded-md" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
