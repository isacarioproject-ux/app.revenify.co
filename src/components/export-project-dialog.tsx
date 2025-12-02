import { useState } from 'react'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { FileText, FileSpreadsheet, FileJson, Download, Loader2 } from 'lucide-react'
import type { Project } from '@/types/database'
import { toast } from 'sonner'
import { useI18n } from '@/hooks/use-i18n'
import jsPDF from 'jspdf'

interface ExportProjectDialogProps {
  project: Project
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

type ExportFormat = 'pdf' | 'excel' | 'json'

const getExportOptions = (t: any): { value: ExportFormat; label: string; icon: any }[] => [
  { value: 'pdf', label: t('export.pdf'), icon: FileText },
  { value: 'excel', label: t('export.excel'), icon: FileSpreadsheet },
  { value: 'json', label: t('export.json'), icon: FileJson },
]

export function ExportProjectDialog({ project, trigger, open: controlledOpen, onOpenChange }: ExportProjectDialogProps) {
  const { t } = useI18n()
  const [internalOpen, setInternalOpen] = useState(false)
  const [format, setFormat] = useState<ExportFormat>('pdf')
  const [exporting, setExporting] = useState(false)
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  const exportToPDF = async () => {
    const doc = new jsPDF()
    
    // Configurar fonte
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text('Relatório do Projeto', 20, 20)
    
    // Linha divisória
    doc.setLineWidth(0.5)
    doc.line(20, 25, 190, 25)
    
    // Informações do projeto
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Nome:', 20, 40)
    doc.setFont('helvetica', 'normal')
    doc.text(project.name, 50, 40)
    
    doc.setFont('helvetica', 'bold')
    doc.text('Status:', 20, 50)
    doc.setFont('helvetica', 'normal')
    doc.text(project.status, 50, 50)
    
    doc.setFont('helvetica', 'bold')
    doc.text('Progresso:', 20, 60)
    doc.setFont('helvetica', 'normal')
    doc.text(`${project.progress}%`, 50, 60)
    
    if (project.description) {
      doc.setFont('helvetica', 'bold')
      doc.text('Descrição:', 20, 70)
      doc.setFont('helvetica', 'normal')
      const splitDescription = doc.splitTextToSize(project.description, 160)
      doc.text(splitDescription, 20, 80)
    }
    
    if (project.due_date) {
      doc.setFont('helvetica', 'bold')
      doc.text('Data de Entrega:', 20, 100)
      doc.setFont('helvetica', 'normal')
      doc.text(new Date(project.due_date).toLocaleDateString('pt-BR'), 70, 100)
    }
    
    // Rodapé
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, 20, 280)
    doc.text('ISACAR.IO - Plataforma de Gestão de Projetos', 20, 285)
    
    // Salvar PDF
    doc.save(`${project.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`)
  }

  const exportToExcel = async () => {
    // Criar CSV (compatível com Excel)
    const headers = ['Campo', 'Valor']
    const rows = [
      ['Nome', project.name],
      ['Descrição', project.description || '-'],
      ['Status', project.status],
      ['Progresso', `${project.progress}%`],
      ['Tamanho da Equipe', project.team_size?.toString() || '-'],
      ['Data de Entrega', project.due_date ? new Date(project.due_date).toLocaleDateString('pt-BR') : '-'],
      ['Cor', project.color || '-'],
      ['Criado em', new Date(project.created_at).toLocaleString('pt-BR')],
    ]

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${project.name.replace(/\s+/g, '_')}_${Date.now()}.csv`
    link.click()
  }

  const exportToJSON = async () => {
    const data = {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      progress: project.progress,
      team_size: project.team_size,
      due_date: project.due_date,
      color: project.color,
      created_at: project.created_at,
      updated_at: project.updated_at,
      exported_at: new Date().toISOString(),
      platform: 'ISACAR.IO'
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${project.name.replace(/\s+/g, '_')}_${Date.now()}.json`
    link.click()
  }

  const handleExport = async () => {
    setExporting(true)
    
    try {
      switch (format) {
        case 'pdf':
          await exportToPDF()
          toast.success('PDF exportado!', {
            description: 'O arquivo foi baixado com sucesso'
          })
          break
        case 'excel':
          await exportToExcel()
          toast.success('Excel exportado!', {
            description: 'O arquivo CSV foi baixado com sucesso'
          })
          break
        case 'json':
          await exportToJSON()
          toast.success('JSON exportado!', {
            description: 'Os dados foram baixados com sucesso'
          })
          break
      }
      
      setOpen(false)
    } catch (err) {
      toast.error('Erro ao exportar', {
        description: 'Tente novamente mais tarde'
      })
    } finally {
      setExporting(false)
    }
  }

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ModalContent className="md:max-w-[420px]">
        <ModalHeader>
          <ModalTitle>{t('export.title')}</ModalTitle>
          <ModalDescription>
            Escolha o formato para exportar
          </ModalDescription>
        </ModalHeader>
        
        <ModalBody className="space-y-2">
          <RadioGroup value={format} onValueChange={(value) => setFormat(value as ExportFormat)}>
            {getExportOptions(t).map((option) => (
              <Label 
                key={option.value}
                htmlFor={option.value} 
                className="flex items-center gap-3 cursor-pointer rounded-lg border p-3 hover:bg-accent has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5 transition-colors"
              >
                <RadioGroupItem value={option.value} id={option.value} />
                <option.icon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{option.label}</span>
              </Label>
            ))}
          </RadioGroup>
        </ModalBody>

        <ModalFooter>
          <Button onClick={handleExport} disabled={exporting} className="w-full">
            {exporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('export.exporting')}
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                {t('export.button')}
              </>
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
