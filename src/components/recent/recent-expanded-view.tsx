import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  X,
  Maximize2,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  MessageSquare,
  UserPlus,
  Calendar,
  Flag,
  Trash2,
} from 'lucide-react';
import { RecentActivity } from '@/hooks/use-recent-activities';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface RecentExpandedViewProps {
  open: boolean;
  onClose: () => void;
  activities: RecentActivity[];
}

export function RecentExpandedView({
  open,
  onClose,
  activities,
}: RecentExpandedViewProps) {
  const [activeTab, setActiveTab] = useState('todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

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
    
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getActivityIcon = (details: string) => {
    if (details.includes('concluiu')) return <CheckCircle2 className="size-4 text-green-600" />;
    if (details.includes('comentou')) return <MessageSquare className="size-4 text-blue-600" />;
    if (details.includes('atribuiu')) return <UserPlus className="size-4 text-purple-600" />;
    if (details.includes('data')) return <Calendar className="size-4 text-orange-600" />;
    if (details.includes('prioridade')) return <Flag className="size-4 text-red-600" />;
    if (details.includes('excluiu')) return <Trash2 className="size-4 text-red-600" />;
    return <Clock className="size-4 text-gray-600" />;
  };

  // Filtrar atividades por busca
  const filteredActivities = activities.filter(activity => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      activity.user_name.toLowerCase().includes(query) ||
      activity.details.toLowerCase().includes(query)
    );
  });

  // Ordenar por data (mais recente primeiro)
  const sortedActivities = [...filteredActivities].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Agrupar por período
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const todayActivities = sortedActivities.filter(a => new Date(a.created_at) >= today);
  const yesterdayActivities = sortedActivities.filter(a => {
    const date = new Date(a.created_at);
    return date >= yesterday && date < today;
  });
  const lastWeekActivities = sortedActivities.filter(a => {
    const date = new Date(a.created_at);
    return date >= lastWeek && date < yesterday;
  });
  const olderActivities = sortedActivities.filter(a => new Date(a.created_at) < lastWeek);

  const ActivityList = ({ activities }: { activities: RecentActivity[] }) => (
    <div className="space-y-2">
      {activities.map((activity, index) => (
        <motion.div
          key={activity.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.03 }}
          whileHover={{ scale: 1.01, x: 4 }}
          className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-800 cursor-pointer"
        >
          <Avatar className="size-10 flex-shrink-0">
            <AvatarFallback className="text-xs">
              {activity.user_name.substring(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <div className="text-sm">
                  <span className="font-medium dark:text-gray-100">
                    {activity.user_name}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 ml-1">
                    {activity.details}
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatTimestamp(activity.created_at)}
                </div>
              </div>
              <div className="flex-shrink-0">
                {getActivityIcon(activity.details)}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        showClose={false}
        className={
          isFullscreen
            ? "!w-screen !h-screen !max-w-none !rounded-none p-0 gap-0"
            : "!w-[90vw] md:!w-[90vw] !w-screen !max-w-5xl !h-[85vh] md:!h-[85vh] !h-screen md:!rounded-lg !rounded-none p-0 gap-0"
        }
      >
        {/* Content com Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          {/* Header Único - Tabs e Botões */}
          <div className="flex items-center justify-between border-b dark:border-gray-800 px-2 py-1.5">
            {/* Título e Busca */}
            <div className="flex items-center gap-3 flex-1">
              <motion.div
                animate={{
                  scale: activities.length > 0 ? [1, 1.1, 1] : 1,
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut"
                }}
              >
                <Clock className="size-5 text-blue-600 dark:text-blue-400" />
              </motion.div>
              {activities.length > 0 && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 500 }}
                >
                  <Badge variant="secondary" className="text-xs h-5 px-1.5">
                    {activities.length}
                  </Badge>
                </motion.div>
              )}
              <h2 className="text-lg font-semibold dark:text-white">Atividades Recentes</h2>
              
              {/* Busca */}
              <div className="relative max-w-xs hidden md:block">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  placeholder="Buscar atividades..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>
            </div>

            {/* Botões Animados */}
            <div className="flex items-center gap-0.5">
              {/* Dropdown de Filtros */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="ghost" size="icon" className="size-7" title="Filtros">
                      <Filter className="size-3.5" />
                    </Button>
                  </motion.div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Filtrar atividades</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Clock className="size-4 mr-2 text-gray-600" />
                    Todas as atividades
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <CheckCircle2 className="size-4 mr-2 text-green-600" />
                    Ações concluídas
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <MessageSquare className="size-4 mr-2 text-blue-600" />
                    Comentários adicionados
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <UserPlus className="size-4 mr-2 text-purple-600" />
                    Atribuições feitas
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Calendar className="size-4 mr-2 text-orange-600" />
                    Datas modificadas
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Flag className="size-4 mr-2 text-red-600" />
                    Prioridades alteradas
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    Limpar filtros
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Fullscreen */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="size-7 hidden md:flex" 
                  title={isFullscreen ? "Sair do fullscreen" : "Fullscreen"}
                  onClick={() => setIsFullscreen(!isFullscreen)}
                >
                  <Maximize2 className="size-3.5" />
                </Button>
              </motion.div>

              {/* Fechar */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="ghost" size="icon" className="size-7" onClick={onClose} title="Fechar">
                  <X className="size-3.5" />
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Tabs Content */}
          <div className="flex-1 overflow-y-auto p-2 md:p-4">
            <TabsContent value="todas" className="mt-0 space-y-6">
              {/* Hoje */}
              {todayActivities.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span>Hoje</span>
                    <span className="text-xs font-normal text-gray-500">
                      {todayActivities.length}
                    </span>
                  </h3>
                  <ActivityList activities={todayActivities} />
                </div>
              )}

              {/* Ontem */}
              {yesterdayActivities.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span>Ontem</span>
                    <span className="text-xs font-normal text-gray-500">
                      {yesterdayActivities.length}
                    </span>
                  </h3>
                  <ActivityList activities={yesterdayActivities} />
                </div>
              )}

              {/* Última semana */}
              {lastWeekActivities.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span>Última semana</span>
                    <span className="text-xs font-normal text-gray-500">
                      {lastWeekActivities.length}
                    </span>
                  </h3>
                  <ActivityList activities={lastWeekActivities} />
                </div>
              )}

              {/* Mais antigas */}
              {olderActivities.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span>Mais antigas</span>
                    <span className="text-xs font-normal text-gray-500">
                      {olderActivities.length}
                    </span>
                  </h3>
                  <ActivityList activities={olderActivities} />
                </div>
              )}

              {/* Vazio */}
              {sortedActivities.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Clock className="size-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">
                    {searchQuery ? 'Nenhuma atividade encontrada' : 'Nenhuma atividade recente'}
                  </p>
                  {searchQuery && (
                    <p className="text-xs mt-1">Tente buscar por outro termo</p>
                  )}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>

        <DialogTitle className="sr-only">Atividades Recentes</DialogTitle>
        <DialogDescription className="sr-only">
          Visualização expandida das atividades recentes
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}
