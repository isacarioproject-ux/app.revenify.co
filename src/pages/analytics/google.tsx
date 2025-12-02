import { DashboardLayout } from '@/components/dashboard-layout'
import { AnalyticsContent } from '@/components/analytics/analytics-content'
import { Button } from '@/components/ui/button'
import { BarChart3, RefreshCw } from 'lucide-react'
import { useState } from 'react'

export default function GoogleAnalyticsPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <DashboardLayout>
      <div className="h-full w-full flex flex-col overflow-hidden">
        {/* Header padrão */}
        <div className="flex items-center justify-between gap-2 px-[5px] py-0.5 border-b border-border">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-semibold truncate">Google Analytics</h2>
          </div>

          <div className="flex items-center gap-0.5">
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-7 w-7"
              onClick={() => setRefreshKey(prev => prev + 1)}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-auto">
          <AnalyticsContent key={refreshKey} embedded />
        </div>
      </div>
    </DashboardLayout>
  )
}
