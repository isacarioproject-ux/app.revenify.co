import { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import {
  ArrowLeft,
  GripVertical,
  Plus,
  Trash2,
  Menu,
  MessageSquare,
  Check,
} from 'lucide-react';
import { getDocument, updateDocument } from '../lib/storage';
import { PageElement, ChecklistItem, TableData } from '../types/docs';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface PageViewerProps {
  docId: string;
  onBack?: () => void;
}

export function PageViewer({ docId, onBack }: PageViewerProps) {
  const [title, setTitle] = useState('');
  const [elements, setElements] = useState<PageElement[]>([]);
  const [saving, setSaving] = useState(false);
  const [iconEmoji, setIconEmoji] = useState('📄');
  const [coverImg, setCoverImg] = useState('');
  const [showNavSidebar, setShowNavSidebar] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load document data
  useEffect(() => {
    const doc = getDocument(docId);
    if (doc?.page_data) {
      setTitle(doc.page_data.title || doc.name);
      setElements(doc.page_data.elements || []);
      setIconEmoji(doc.page_data.iconEmoji || doc.icon || '📄');
      setCoverImg(doc.page_data.coverImg || '');
    }
  }, [docId]);

  // Auto-save with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (elements.length > 0) {
        saveDocument();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [title, elements, iconEmoji, coverImg]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveDocument();
      }
      if (e.ctrlKey && e.key === 'm') {
        e.preventDefault();
        setShowComments(!showComments);
      }
      if (e.key === 'Escape' && onBack) {
        onBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showComments, onBack, title, elements, iconEmoji, coverImg]);

  // Listen for add element events from sidebar
  useEffect(() => {
    const handleAddElement = ((e: CustomEvent) => {
      const newElement: PageElement = e.detail;
      setElements(prev => [...prev, newElement]);
      toast.success('Elemento adicionado!');
    }) as EventListener;

    window.addEventListener('addPageElement', handleAddElement);
    return () => window.removeEventListener('addPageElement', handleAddElement);
  }, []);

  const saveDocument = useCallback(() => {
    setSaving(true);
    updateDocument(docId, {
      name: title,
      page_data: {
        title,
        elements,
        iconEmoji,
        coverImg,
      },
    });
    setTimeout(() => setSaving(false), 500);
  }, [docId, title, elements, iconEmoji, coverImg]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setElements((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const updateElement = (id: string, content: PageElement['content']) => {
    setElements(prev =>
      prev.map(el => (el.id === id ? { ...el, content } : el))
    );
  };

  const deleteElement = (id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
    toast.success('Elemento removido!');
  };

  const addElement = (type: PageElement['type']) => {
    const newElement: PageElement = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content: type === 'list' ? [''] : type === 'checklist' ? [] : type === 'table' ? { headers: [''], rows: [['']] } : '',
    };
    setElements(prev => [...prev, newElement]);
  };

  return (
    <div className="relative h-full">
      {/* Floating buttons */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowNavSidebar(!showNavSidebar)}
        >
          <Menu className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageSquare className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex h-full">
        {/* Nav Sidebar */}
        {showNavSidebar && (
          <div className="w-64 border-r p-4 overflow-auto">
            <h3 className="mb-4">Navegação</h3>
            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div className="text-sm text-muted-foreground mt-4">
                Estrutura da página
              </div>
              {elements.filter(el => el.type === 'h1' || el.type === 'h2').map(el => (
                <button
                  key={el.id}
                  className="block text-sm hover:bg-muted/50 w-full text-left px-2 py-1 rounded"
                  style={{ paddingLeft: el.type === 'h2' ? '1.5rem' : '0.5rem' }}
                >
                  {String(el.content).slice(0, 50)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto p-8">
            {/* Cover Image */}
            {coverImg && (
              <div className="mb-8 -mx-8 -mt-8">
                <img src={coverImg} alt="Cover" className="w-full h-64 object-cover" />
              </div>
            )}

            {/* Emoji Icon */}
            <div className="mb-4">
              <input
                type="text"
                value={iconEmoji}
                onChange={(e) => setIconEmoji(e.target.value)}
                className="text-6xl bg-transparent border-none outline-none w-20 h-20"
                maxLength={2}
              />
            </div>

            {/* Saved Indicator */}
            {saving && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Check className="h-4 w-4" />
                Salvando...
              </div>
            )}

            {/* Title */}
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-4xl border-none p-0 mb-8 h-auto"
              placeholder="Título da página"
            />

            {/* Back button on small screens */}
            {onBack && (
              <Button variant="ghost" onClick={onBack} className="mb-4 md:hidden">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            )}

            {/* Elements */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={elements.map(el => el.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {elements.map(element => (
                    <ElementRenderer
                      key={element.id}
                      element={element}
                      onUpdate={updateElement}
                      onDelete={deleteElement}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* Add Element Button */}
            <Button
              variant="ghost"
              className="mt-4 w-full justify-start text-muted-foreground"
              onClick={() => addElement('text')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar elemento
            </Button>
          </div>
        </div>

        {/* Comments Sidebar */}
        {showComments && (
          <div className="w-80 border-l p-4 overflow-auto">
            <h3 className="mb-4">Comentários</h3>
            <div className="text-sm text-muted-foreground text-center py-8">
              Nenhum comentário ainda
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface ElementRendererProps {
  element: PageElement;
  onUpdate: (id: string, content: PageElement['content']) => void;
  onDelete: (id: string) => void;
}

function ElementRenderer({ element, onUpdate, onDelete }: ElementRendererProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: element.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const renderContent = () => {
    switch (element.type) {
      case 'h1':
        return (
          <Input
            value={element.content as string}
            onChange={(e) => onUpdate(element.id, e.target.value)}
            className="text-3xl border-none p-0 h-auto"
            placeholder="Título 1"
          />
        );
      case 'h2':
        return (
          <Input
            value={element.content as string}
            onChange={(e) => onUpdate(element.id, e.target.value)}
            className="text-2xl border-none p-0 h-auto"
            placeholder="Título 2"
          />
        );
      case 'text':
        return (
          <Textarea
            value={element.content as string}
            onChange={(e) => onUpdate(element.id, e.target.value)}
            className="border-none p-0 resize-none min-h-[60px]"
            placeholder="Parágrafo"
          />
        );
      case 'list':
        const listItems = element.content as string[];
        return (
          <div className="space-y-2">
            {listItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span>•</span>
                <Input
                  value={item}
                  onChange={(e) => {
                    const newList = [...listItems];
                    newList[idx] = e.target.value;
                    onUpdate(element.id, newList);
                  }}
                  className="border-none p-0 h-auto"
                  placeholder="Item da lista"
                />
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUpdate(element.id, [...listItems, ''])}
            >
              <Plus className="h-3 w-3 mr-1" />
              Adicionar item
            </Button>
          </div>
        );
      case 'checklist':
        const checklistItems = element.content as ChecklistItem[];
        return (
          <div className="space-y-2">
            {checklistItems.map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <Checkbox
                  checked={item.checked}
                  onCheckedChange={(checked) => {
                    const newItems = checklistItems.map(i =>
                      i.id === item.id ? { ...i, checked: !!checked } : i
                    );
                    onUpdate(element.id, newItems);
                  }}
                />
                <Input
                  value={item.text}
                  onChange={(e) => {
                    const newItems = checklistItems.map(i =>
                      i.id === item.id ? { ...i, text: e.target.value } : i
                    );
                    onUpdate(element.id, newItems);
                  }}
                  className="border-none p-0 h-auto"
                  placeholder="Item"
                />
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const newItem: ChecklistItem = {
                  id: Math.random().toString(36).substr(2, 9),
                  text: '',
                  checked: false,
                };
                onUpdate(element.id, [...checklistItems, newItem]);
              }}
            >
              <Plus className="h-3 w-3 mr-1" />
              Adicionar item
            </Button>
          </div>
        );
      case 'table':
        const tableData = element.content as TableData;
        return (
          <div className="overflow-x-auto border rounded-md">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  {tableData.headers.map((header, idx) => (
                    <th key={idx} className="border-b border-r last:border-r-0 p-2 text-left">
                      <Input
                        value={header}
                        onChange={(e) => {
                          const newHeaders = [...tableData.headers];
                          newHeaders[idx] = e.target.value;
                          onUpdate(element.id, { ...tableData, headers: newHeaders });
                        }}
                        className="border-none p-0 bg-transparent"
                        placeholder="Cabeçalho"
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.rows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-muted/30">
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="border-b border-r last:border-r-0 p-2">
                        <Input
                          value={cell}
                          onChange={(e) => {
                            const newRows = [...tableData.rows];
                            newRows[rowIdx][cellIdx] = e.target.value;
                            onUpdate(element.id, { ...tableData, rows: newRows });
                          }}
                          className="border-none p-0 bg-transparent"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex gap-2 p-2 border-t bg-muted/20">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newRow = Array(tableData.headers.length).fill('');
                  onUpdate(element.id, { ...tableData, rows: [...tableData.rows, newRow] });
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Adicionar linha
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newHeaders = [...tableData.headers, ''];
                  const newRows = tableData.rows.map(row => [...row, '']);
                  onUpdate(element.id, { headers: newHeaders, rows: newRows });
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Adicionar coluna
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative p-4 hover:bg-muted/30 rounded-lg transition-colors"
    >
      <div className="absolute left-0 top-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => onDelete(element.id)}
        >
          <Trash2 className="h-3 w-3 text-destructive" />
        </Button>
      </div>
      <div className="ml-12">{renderContent()}</div>
    </div>
  );
}