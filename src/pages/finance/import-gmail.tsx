import { GmailImportList } from '@/components/gmail/gmail-import-list'
import { DashboardLayout } from '@/components/dashboard-layout'

export default function ImportGmailPage() {
  return (
    <DashboardLayout>
      <div className="relative z-0 container mx-auto p-4 sm:p-6 md:p-8 max-w-4xl">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Importar do Gmail</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Encontre boletos e faturas nos seus emails e importe para o Finance
          </p>
        </div>

        <GmailImportList />
      </div>
    </DashboardLayout>
  )
}
