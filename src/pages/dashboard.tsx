import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent } from '@/components/ui/card'
import { FinanceCard } from '@/components/finance/finance-card'
import { BudgetCard } from '@/components/finance/budget-card'
import { TasksCard } from '@/components/tasks/tasks-card'
import { RecentCard } from '@/components/recent/recent-card'
import { ProjectsCard } from '@/components/projects/projects-card'
import { AnalyticsCard } from '@/components/analytics/analytics-card'
import { DashboardGridSkeleton } from '@/components/loading-skeleton'
// import { EmpresaCard } from '@/components/empresa/empresa-card' // REMOVIDO - Whiteboard
import { DraggableCardWrapper } from '@/components/draggable-card-wrapper'
import { useDashboardStats } from '@/hooks/use-dashboard-stats'
import { useI18n } from '@/hooks/use-i18n'
import { useWorkspace } from '@/contexts/workspace-context'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable'

export default function DashboardPage() {
  const { t } = useI18n()
  const { stats, loading, error } = useDashboardStats()
  const { refreshWorkspaces } = useWorkspace()
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  

  // Estado para ordem dos cards
  const [cardOrder, setCardOrder] = useState(() => {
    const saved = localStorage.getItem('dashboard-card-order')
    const defaultOrder = ['finance-card', 'budget-card', 'projects-card', 'analytics-card', 'recent-card', 'tasks-card']
    const order = saved ? JSON.parse(saved) : defaultOrder
    
    // Garantir que todos os cards estão na lista
    if (!order.includes('finance-card')) {
      order.push('finance-card')
    }
    if (!order.includes('budget-card')) {
      order.push('budget-card')
    }
    if (!order.includes('projects-card')) {
      order.push('projects-card')
    }
    if (!order.includes('analytics-card')) {
      order.push('analytics-card')
    }
    if (!order.includes('tasks-card')) {
      order.push('tasks-card')
    }
    if (!order.includes('recent-card')) {
      order.push('recent-card')
    }
    localStorage.setItem('dashboard-card-order', JSON.stringify(order))
    
    console.log('Card Order:', order)
    return order
  })

  // Refresh workspaces após onboarding (evita workspace não aparecer)
  useEffect(() => {
    const fromOnboarding = sessionStorage.getItem('from-onboarding')
    if (fromOnboarding === 'true') {
      console.log('🔄 Detectado retorno do onboarding, atualizando workspaces...')
      refreshWorkspaces()
      sessionStorage.removeItem('from-onboarding')
    }
  }, [refreshWorkspaces])

  // Marcar que carregamento inicial terminou (para transição suave)
  useEffect(() => {
    if (!loading && isInitialLoad) {
      // Aguardar 100ms para transição suave do skeleton → cards
      const timer = setTimeout(() => {
        setIsInitialLoad(false)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [loading, isInitialLoad])

  // Sensores para drag & drop - Desktop + Mobile
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Precisa mover 8px para ativar o drag
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // 250ms de toque para ativar no mobile
        tolerance: 5, // Tolerância de movimento
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Handler para quando terminar o drag
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setCardOrder((items: string[]) => {
        const oldIndex = items.indexOf(active.id as string)
        const newIndex = items.indexOf(over.id as string)
        const newOrder = arrayMove(items, oldIndex, newIndex)
        localStorage.setItem('dashboard-card-order', JSON.stringify(newOrder))
        return newOrder
      })
    }
  }

  // Listener para deletar cards
  useEffect(() => {
    const handleDeleteCard = (event: CustomEvent) => {
      const cardId = event.detail
      setCardOrder((prev: string[]) => {
        const newOrder = prev.filter((id: string) => id !== cardId)
        localStorage.setItem('dashboard-card-order', JSON.stringify(newOrder))
        return newOrder
      })
    }

    window.addEventListener('delete-card', handleDeleteCard as EventListener)
    return () => window.removeEventListener('delete-card', handleDeleteCard as EventListener)
  }, [])

  return (
    <DashboardLayout>
      {/* Container responsivo - mobile scroll, desktop h-full */}
      <div className="w-full p-2 md:px-16 md:h-full md:overflow-hidden">
            {error ? (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-destructive">{error.message}</p>
                </CardContent>
              </Card>
            ) : (isInitialLoad || loading) ? (
              /* Skeleton aparece IMEDIATAMENTE na primeira renderização */
              <DashboardGridSkeleton />
            ) : (
              <>
                {/* Cards de Gestão com Drag & Drop - Renderiza sempre, skeletons internos */}
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={cardOrder} strategy={rectSortingStrategy}>
                    {/* Grid responsivo: 1 coluna mobile, 2 tablet, 3 desktop */}
                    <div className="grid gap-3 md:gap-[3px] grid-cols-1 md:grid-cols-2 xl:grid-cols-3 w-full md:h-full md:auto-rows-fr transition-all duration-300 ease-in-out animate-in fade-in duration-500">
                      {cardOrder.map((cardId: string) => {
                        if (cardId === 'finance-card') {
                          return (
                            <DraggableCardWrapper key="finance-card" id="finance-card">
                              <FinanceCard />
                            </DraggableCardWrapper>
                          )
                        }
                        if (cardId === 'tasks-card') {
                          return (
                            <DraggableCardWrapper key="tasks-card" id="tasks-card">
                              <TasksCard />
                            </DraggableCardWrapper>
                          )
                        }
                        if (cardId === 'recent-card') {
                          return (
                            <DraggableCardWrapper key="recent-card" id="recent-card">
                              <RecentCard />
                            </DraggableCardWrapper>
                          )
                        }
                        if (cardId === 'budget-card') {
                          return (
                            <DraggableCardWrapper key="budget-card" id="budget-card">
                              <BudgetCard />
                            </DraggableCardWrapper>
                          )
                        }
                        if (cardId === 'projects-card') {
                          return (
                            <DraggableCardWrapper key="projects-card" id="projects-card">
                              <ProjectsCard />
                            </DraggableCardWrapper>
                          )
                        }
                        if (cardId === 'analytics-card') {
                          return (
                            <DraggableCardWrapper key="analytics-card" id="analytics-card">
                              <AnalyticsCard />
                            </DraggableCardWrapper>
                          )
                        }
                        return null
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              </>
            )}
      </div>
    </DashboardLayout>
  )
}
