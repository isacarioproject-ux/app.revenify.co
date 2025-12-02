import { useState } from 'react'
import { useGmailImport } from '@/hooks/use-gmail-import'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  message: any
}

export function GmailImportDialog({ open, onOpenChange, message }: Props) {
  const { importMessage, importing } = useGmailImport()
  const [formData, setFormData] = useState({
    amount: '',
    due_date: '',
    category: 'Contas',
    description: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message || !formData.amount || !formData.due_date) {
      return
    }

    try {
      await importMessage(message.id, {
        amount: parseFloat(formData.amount),
        due_date: formData.due_date,
        category: formData.category,
        description: formData.description || message.subject
      })

      // Fechar dialog e limpar form
      onOpenChange(false)
      setFormData({
        amount: '',
        due_date: '',
        category: 'Contas',
        description: ''
      })
    } catch (error) {
      // Erro já tratado no hook
    }
  }

  if (!message) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Importar Boleto/Fatura</DialogTitle>
          <DialogDescription>
            Preencha os dados para criar a despesa
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Preview do email */}
            <div className="p-3 bg-muted rounded-lg text-sm">
              <p className="font-medium truncate">{message.subject}</p>
              <p className="text-muted-foreground truncate">De: {message.from}</p>
            </div>

            {/* Valor */}
            <div className="space-y-2">
              <Label htmlFor="amount">Valor *</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">
                  R$
                </span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  className="pl-10"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Vencimento */}
            <div className="space-y-2">
              <Label htmlFor="due_date">Vencimento *</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                required
              />
            </div>

            {/* Categoria */}
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Contas">Contas</SelectItem>
                  <SelectItem value="Boletos">Boletos</SelectItem>
                  <SelectItem value="Fornecedores">Fornecedores</SelectItem>
                  <SelectItem value="Impostos">Impostos</SelectItem>
                  <SelectItem value="Cartão">Cartão de Crédito</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Descrição (opcional) */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Input
                id="description"
                placeholder="Ex: Conta de luz janeiro/2025"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Se vazio, usará o assunto do email
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={importing === message.id}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={importing === message.id || !formData.amount || !formData.due_date}
            >
              {importing === message.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                'Importar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
