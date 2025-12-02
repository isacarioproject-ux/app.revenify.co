import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Plus, Trash, GripVertical } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useI18n } from '@/hooks/use-i18n'

// Tipo de elemento
export type ElementType = 'h1' | 'h2' | 'text' | 'list' | 'checklist' | 'table'

export interface PageElement {
  id: string
  type: ElementType
  content: any
}

interface ChecklistItem {
  text: string
  checked: boolean
}

interface ElementProps {
  id: string
  content: any
  onChange: (content: any) => void
  onDelete: () => void
}

// H1 Editável
export const H1Element = ({ id, content, onChange, onDelete }: ElementProps) => {
  const { t } = useI18n()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative py-2 hover:bg-muted/30 rounded"
    >
      {/* Handle - SEMPRE VISÍVEL */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0 top-1 sm:top-2 h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center opacity-100 transition-opacity cursor-grab active:cursor-grabbing rounded bg-muted/50 hover:bg-muted z-10"
        style={{ touchAction: 'none', userSelect: 'none' }}
      >
        <GripVertical className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground pointer-events-none" />
      </div>

      <div className="pl-7 sm:pl-8 pr-7 sm:pr-8 relative">
        <Input
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('pages.elements.heading1Placeholder')}
          className="text-xl sm:text-2xl md:text-3xl font-bold border-none px-0 focus-visible:ring-0 bg-transparent"
        />
        <Button
          size="icon"
          variant="ghost"
          className="absolute right-0 top-0 h-7 w-7 sm:h-6 sm:w-6 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          onClick={onDelete}
          type="button"
        >
          <Trash className="h-4 w-4 sm:h-3 sm:w-3" />
        </Button>
      </div>
    </div>
  )
}

// H2 Editável
export const H2Element = ({ id, content, onChange, onDelete }: ElementProps) => {
  const { t } = useI18n()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative py-2 hover:bg-muted/30 rounded"
    >
      {/* Handle - SEMPRE VISÍVEL */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0 top-1 sm:top-2 h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center opacity-100 transition-opacity cursor-grab active:cursor-grabbing rounded bg-muted/50 hover:bg-muted z-10"
        style={{ touchAction: 'none', userSelect: 'none' }}
      >
        <GripVertical className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground pointer-events-none" />
      </div>

      <div className="pl-7 sm:pl-8 pr-7 sm:pr-8 relative">
        <Input
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('pages.elements.heading2Placeholder')}
          className="text-lg sm:text-xl md:text-2xl font-semibold border-none px-0 focus-visible:ring-0 bg-transparent"
        />
        <Button
          size="icon"
          variant="ghost"
          className="absolute right-0 top-0 h-7 w-7 sm:h-6 sm:w-6 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          onClick={onDelete}
          type="button"
        >
          <Trash className="h-4 w-4 sm:h-3 sm:w-3" />
        </Button>
      </div>
    </div>
  )
}

// Texto Editável
export const TextElement = ({ id, content, onChange, onDelete }: ElementProps) => {
  const { t } = useI18n()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative py-2 hover:bg-muted/30 rounded"
    >
      {/* Handle - SEMPRE VISÍVEL */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0 top-1 sm:top-2 h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center opacity-100 transition-opacity cursor-grab active:cursor-grabbing rounded bg-muted/50 hover:bg-muted z-10"
        style={{ touchAction: 'none', userSelect: 'none' }}
      >
        <GripVertical className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground pointer-events-none" />
      </div>

      <div className="pl-7 sm:pl-8 pr-7 sm:pr-8 relative">
        <Textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('pages.elements.textPlaceholder')}
          className="min-h-[60px] border-none px-0 focus-visible:ring-0 bg-transparent resize-none text-sm sm:text-base"
        />
        <Button
          size="icon"
          variant="ghost"
          className="absolute right-0 top-0 h-7 w-7 sm:h-6 sm:w-6 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          onClick={onDelete}
          type="button"
        >
          <Trash className="h-4 w-4 sm:h-3 sm:w-3" />
        </Button>
      </div>
    </div>
  )
}

// Lista Editável
export const ListElement = ({ id, content, onChange, onDelete }: ElementProps) => {
  const { t } = useI18n()
  const items: string[] = Array.isArray(content) ? content : ['Item 1', 'Item 2', 'Item 3']
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const updateItem = (index: number, value: string) => {
    const newItems = [...items]
    newItems[index] = value
    onChange(newItems)
  }

  const addItem = () => {
    onChange([...items, `Item ${items.length + 1}`])
  }

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative py-2 hover:bg-muted/30 rounded"
    >
      {/* Handle - SEMPRE VISÍVEL */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0 top-1 sm:top-2 h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center opacity-100 transition-opacity cursor-grab active:cursor-grabbing rounded bg-muted/50 hover:bg-muted z-10"
        style={{ touchAction: 'none', userSelect: 'none' }}
      >
        <GripVertical className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground pointer-events-none" />
      </div>

      <div className="pl-10 sm:pl-8 pr-10 sm:pr-8 relative space-y-1">
        {items.map((item: string, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-muted-foreground">•</span>
            <Input
              value={item}
              onChange={(e) => updateItem(index, e.target.value)}
              className="flex-1 border-none px-2 h-7 sm:h-8 focus-visible:ring-0 bg-transparent text-sm sm:text-base"
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              onClick={() => removeItem(index)}
              type="button"
            >
              <Trash className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <Button
          size="sm"
          variant="ghost"
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={addItem}
          type="button"
        >
          <Plus className="h-3 w-3 mr-1" />
          {t('pages.elements.addItem')}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="absolute right-0 top-0 h-7 w-7 sm:h-6 sm:w-6 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          onClick={onDelete}
          type="button"
        >
          <Trash className="h-4 w-4 sm:h-3 sm:w-3" />
        </Button>
      </div>
    </div>
  )
}

// Checklist Editável
export const ChecklistElement = ({ id, content, onChange, onDelete }: ElementProps) => {
  const { t } = useI18n()
  const items: ChecklistItem[] = Array.isArray(content) ? content : [
    { text: 'Tarefa 1', checked: false },
    { text: 'Tarefa 2', checked: false },
  ]

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const updateItem = (index: number, updates: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], ...updates }
    onChange(newItems)
  }

  const addItem = () => {
    onChange([...items, { text: `Tarefa ${items.length + 1}`, checked: false }])
  }

  const removeItem = (index: number) => {
    onChange(items.filter((_: any, i: number) => i !== index))
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative py-2 hover:bg-muted/30 rounded"
    >
      {/* Handle - SEMPRE VISÍVEL */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0 top-1 sm:top-2 h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center opacity-100 transition-opacity cursor-grab active:cursor-grabbing rounded bg-muted/50 hover:bg-muted z-10"
        style={{ touchAction: 'none', userSelect: 'none' }}
      >
        <GripVertical className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground pointer-events-none" />
      </div>

      <div className="pl-10 sm:pl-8 pr-10 sm:pr-8 relative space-y-1">
        {items.map((item: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <Checkbox
              checked={item.checked}
              onCheckedChange={(checked) => updateItem(index, { checked })}
            />
            <Input
              value={item.text}
              onChange={(e) => updateItem(index, { text: e.target.value })}
              className="flex-1 border-none px-2 h-7 sm:h-8 focus-visible:ring-0 bg-transparent text-sm sm:text-base"
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              onClick={() => removeItem(index)}
              type="button"
            >
              <Trash className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <Button size="sm" variant="ghost" onClick={addItem} className="h-7 text-xs" type="button">
          <Plus className="h-3 w-3 mr-1" />
          {t('pages.elements.addTask')}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="absolute right-0 top-0 h-7 w-7 sm:h-6 sm:w-6 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          onClick={onDelete}
          type="button"
        >
          <Trash className="h-4 w-4 sm:h-3 sm:w-3" />
        </Button>
      </div>
    </div>
  )
}

// Tabela Editável
export const TableElement = ({ id, content, onChange, onDelete }: ElementProps) => {
  const data = content || {
    headers: ['Coluna 1', 'Coluna 2'],
    rows: [
      ['Dado 1', 'Dado 2'],
      ['Dado 3', 'Dado 4'],
    ],
  }

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const updateHeader = (index: number, value: string) => {
    const newHeaders = [...data.headers]
    newHeaders[index] = value
    onChange({ ...data, headers: newHeaders })
  }

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const newRows = [...data.rows]
    newRows[rowIndex][colIndex] = value
    onChange({ ...data, rows: newRows })
  }

  const addRow = () => {
    onChange({
      ...data,
      rows: [...data.rows, data.headers.map(() => '')],
    })
  }

  const addColumn = () => {
    onChange({
      headers: [...data.headers, `Coluna ${data.headers.length + 1}`],
      rows: data.rows.map((row: string[]) => [...row, '']),
    })
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative py-2 hover:bg-muted/30 rounded"
    >
      {/* Handle - SEMPRE VISÍVEL */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0 top-1 sm:top-2 h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center opacity-100 transition-opacity cursor-grab active:cursor-grabbing rounded bg-muted/50 hover:bg-muted z-10"
        style={{ touchAction: 'none', userSelect: 'none' }}
      >
        <GripVertical className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground pointer-events-none" />
      </div>

      <div className="pl-7 sm:pl-8 pr-7 sm:pr-8 relative">
        <div className="overflow-x-auto">
          <div className="border border-border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  {data.headers.map((header: string, index: number) => (
                    <TableHead key={index} className="min-w-[80px] sm:min-w-[120px]">
                      <Input
                        value={header}
                        onChange={(e) => updateHeader(index, e.target.value)}
                        className="border-none h-7 sm:h-8 font-semibold focus-visible:ring-0 text-[10px] sm:text-xs"
                      />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.map((row: string[], rowIndex: number) => (
                  <TableRow key={rowIndex}>
                    {row.map((cell: string, colIndex: number) => (
                      <TableCell key={colIndex} className="min-w-[80px] sm:min-w-[120px]">
                        <Input
                          value={cell}
                          onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                          className="border-none h-7 sm:h-8 focus-visible:ring-0 text-[10px] sm:text-xs"
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          <Button size="sm" variant="outline" onClick={addRow} className="h-7 text-xs flex-1 sm:flex-none" type="button">
            <Plus className="h-3 w-3 mr-1" />
            Linha
          </Button>
          <Button size="sm" variant="outline" onClick={addColumn} className="h-7 text-xs flex-1 sm:flex-none" type="button">
            <Plus className="h-3 w-3 mr-1" />
            Coluna
          </Button>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="absolute right-0 top-0 h-7 w-7 sm:h-6 sm:w-6 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          onClick={onDelete}
          type="button"
        >
          <Trash className="h-4 w-4 sm:h-3 sm:w-3" />
        </Button>
      </div>
    </div>
  )
}
