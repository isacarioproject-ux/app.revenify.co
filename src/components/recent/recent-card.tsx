import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RecentExpandedView } from '@/components/recent/recent-expanded-view';
import { 
  Clock, 
  Maximize2, 
  GripVertical,
  CheckSquare,
  FileText,
  DollarSign,
  FolderKanban,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useRecentActivities } from '@/hooks/use-recent-activities';
import { useI18n } from '@/hooks/use-i18n';

interface RecentCardProps {
  className?: string;
  dragHandleProps?: any;
}

export function RecentCard({ className, dragHandleProps }: RecentCardProps) {
  const { t } = useI18n();
  const cardName = t('sidebar.recent');
  const [isExpandedViewOpen, setIsExpandedViewOpen] = useState(false);
  const { activities, loading } = useRecentActivities(50);


  // Pegar apenas as 10 atividades mais recentes para o card
  const recentActivities = activities.slice(0, 10);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <CheckSquare className="size-4" />;
      case 'document':
        return <FileText className="size-4" />;
      case 'finance':
        return <DollarSign className="size-4" />;
      case 'project':
        return <FolderKanban className="size-4" />;
      case 'member':
        return <Users className="size-4" />;
      // case 'whiteboard': // Removido - whiteboard deletado
      default:
        return <Clock className="size-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'task':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400';
      case 'document':
        return 'bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400';
      case 'finance':
        return 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400';
      case 'project':
        return 'bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400';
      case 'member':
        return 'bg-pink-100 text-pink-600 dark:bg-pink-950 dark:text-pink-400';
      // case 'whiteboard': // Removido - whiteboard deletado
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  return (
    <>
      <Card className="flex flex-col w-full h-full bg-card overflow-hidden group">
        {/* Header Inline - Estilo Finance */}
        <CardHeader className="p-0">
          <div className="flex items-center justify-between gap-2 px-0.5 py-0.5">
            {/* Drag Handle + Input Editável */}
            <div className="flex items-center gap-1 flex-1 min-w-0">
              {/* Drag Handle - sempre visível no mobile, hover no desktop */}
              <div 
                {...dragHandleProps}
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted/70 rounded transition-colors flex-shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 relative z-10 touch-none"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
              </div>
              
              {/* Nome Fixo + Badge */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">
                  {cardName}
                </h3>
                {recentActivities.length > 0 && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500 }}
                  >
                    <Badge variant="secondary" className="text-xs h-5 px-1.5">
                      {recentActivities.length}
                    </Badge>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Botões Animados - Sempre visíveis */}
            <div className="flex items-center gap-0.5">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  title="Expandir"
                  onClick={() => setIsExpandedViewOpen(true)}
                >
                  <Maximize2 className="size-3.5" />
                </Button>
              </motion.div>
            </div>
          </div>
        </CardHeader>

        {/* Conteúdo com Animações */}
        <CardContent className="flex-1 overflow-y-auto p-2 flex flex-col">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex gap-3 p-2">
                  <Skeleton className="size-8 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentActivities.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center h-full"
              >
                <div className="text-center py-16 px-6">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="text-sm font-medium mb-2">{t('recent.noActivity')}</p>
                  <p className="text-xs text-muted-foreground">{t('recent.activitiesHere')}</p>
                </div>
              </motion.div>
            ) : (
            <div className="space-y-2">
              {recentActivities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.01, x: 4 }}
                  className="flex gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className={`size-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.type)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">
                      <span className="font-medium dark:text-gray-100">
                        {activity.user_name}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400 ml-1">
                        {activity.details}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-gray-100 ml-1">
                        "{activity.entity_name}"
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {formatTimestamp(activity.created_at)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            )}
        </CardContent>
      </Card>

      {/* Expanded View */}
      <RecentExpandedView
        open={isExpandedViewOpen}
        onClose={() => setIsExpandedViewOpen(false)}
        activities={activities}
      />
    </>
  );
}
