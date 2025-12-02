import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { Type, Heading1, Heading2, Heading3, List, CheckSquare, Table, Image, Code, Quote, Minus } from 'lucide-react';
import { PageElement } from '@/types/docs';
import { cn } from '@/lib/utils';

interface PageEditorSidebarProps {
  docId: string;
}

export function PageEditorSidebar({ docId }: PageEditorSidebarProps) {
  const addElement = (type: PageElement['type'], content: PageElement['content']) => {
    const newElement: PageElement = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content,
    };

    // Dispatch custom event to PageViewer
    window.dispatchEvent(new CustomEvent('addPageElement', { detail: newElement }));
  };

  const elements = [
    {
      category: 'TEXTO',
      items: [
        {
          icon: <Heading1 className="h-4 w-4" />,
          label: 'Título 1',
          description: 'Grande',
          onClick: () => addElement('h1', 'Título 1'),
        },
        {
          icon: <Heading2 className="h-4 w-4" />,
          label: 'Título 2',
          description: 'Médio',
          onClick: () => addElement('h2', 'Título 2'),
        },
        {
          icon: <Type className="h-4 w-4" />,
          label: 'Parágrafo',
          description: 'Normal',
          onClick: () => addElement('text', ''),
        },
      ],
    },
    {
      category: 'LISTAS',
      items: [
        {
          icon: <List className="h-4 w-4" />,
          label: 'Lista',
          description: 'Bullets',
          onClick: () => addElement('list', ['']),
        },
        {
          icon: <CheckSquare className="h-4 w-4" />,
          label: 'Checklist',
          description: 'Tarefas',
          onClick: () => addElement('checklist', [{ id: '1', text: '', checked: false }]),
        },
      ],
    },
    {
      category: 'AVANÇADO',
      items: [
        {
          icon: <Table className="h-4 w-4" />,
          label: 'Tabela',
          description: 'Linhas/Colunas',
          onClick: () => addElement('table', { headers: ['Coluna 1', 'Coluna 2'], rows: [['', '']] }),
        },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">Elementos</h3>
        <p className="text-xs text-muted-foreground">
          Clique para adicionar à página
        </p>
      </div>

      {/* Sections */}
      {elements.map((section, idx) => (
        <div key={idx} className="space-y-2">
          {/* Category Label */}
          <div className="text-[10px] font-bold text-muted-foreground tracking-wider px-1">
            {section.category}
          </div>
          
          {/* Items Grid */}
          <div className="space-y-1">
            {section.items.map((item, itemIdx) => (
              <Card
                key={itemIdx}
                className={cn(
                  "p-3 cursor-pointer transition-all duration-200",
                  "hover:bg-accent hover:shadow-md hover:scale-[1.02]",
                  "active:scale-[0.98]",
                  "border border-border/50 hover:border-accent-foreground/20"
                )}
                onClick={item.onClick}
              >
                <div className="flex items-center gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                    {item.icon}
                  </div>
                  
                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {item.label}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {item.description}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          {/* Separator */}
          {idx < elements.length - 1 && (
            <Separator className="my-3" />
          )}
        </div>
      ))}
    </div>
  );
}
