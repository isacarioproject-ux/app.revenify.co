import { useState } from 'react'
import { useGmailImport } from '@/hooks/use-gmail-import'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Mail, FileText, CheckCircle2, Calendar } from 'lucide-react'
import { GmailImportDialog } from '@/components/gmail/gmail-import-dialog'

export function GmailImportList() {
  const { messages, loading, searchMessages } = useGmailImport()
  const [selectedMessage, setSelectedMessage] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleImportClick = (message: any) => {
    setSelectedMessage(message)
    setDialogOpen(true)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="w-full sm:w-auto">
              <CardTitle className="text-lg sm:text-xl">Importar do Gmail</CardTitle>
              <CardDescription className="text-sm">
                Encontre boletos e faturas nos seus emails
              </CardDescription>
            </div>
            
            <Button
              onClick={searchMessages}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Buscar Emails
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {messages.length === 0 && !loading && (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Clique em "Buscar Emails" para encontrar boletos</p>
            </div>
          )}

          {messages.length > 0 && (
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  {/* Ícone */}
                  <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                    {message.hasAttachment ? (
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    ) : (
                      <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    )}
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm sm:text-base truncate">{message.subject}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          De: {message.from}
                        </p>
                      </div>

                      {message.isImported && (
                        <Badge variant="outline" className="gap-1 shrink-0 text-xs">
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                          <span className="hidden sm:inline">Importado</span>
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                      {message.snippet}
                    </p>

                    <div className="flex items-center justify-between mt-2 gap-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(message.date).toLocaleDateString('pt-BR')}
                      </div>

                      {/* Ação - Mobile */}
                      <Button
                        size="sm"
                        onClick={() => handleImportClick(message)}
                        disabled={message.isImported}
                        className="sm:hidden"
                      >
                        {message.isImported ? 'Importado' : 'Importar'}
                      </Button>
                    </div>
                  </div>

                  {/* Ação - Desktop */}
                  <Button
                    size="sm"
                    onClick={() => handleImportClick(message)}
                    disabled={message.isImported}
                    className="hidden sm:flex shrink-0"
                  >
                    {message.isImported ? 'Importado' : 'Importar'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de importação */}
      <GmailImportDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        message={selectedMessage}
      />
    </>
  )
}
