import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Type, Heading1, Heading2, List, CheckSquare, Table } from 'lucide-react';
import { PageElement } from '../types/docs';

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
    <div className="space-y-6">
      <div>
        <h3 className="mb-2">Elementos</h3>
        <p className="text-sm text-muted-foreground">
          Clique para adicionar à página
        </p>
      </div>

      {elements.map((section, idx) => (
        <div key={idx}>
          <div className="text-xs text-muted-foreground mb-3">
            {section.category}
          </div>
          <div className="space-y-1">
            {section.items.map((item, itemIdx) => (
              <Button
                key={itemIdx}
                variant="ghost"
                className="w-full justify-start h-auto py-3"
                onClick={item.onClick}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="flex-shrink-0">{item.icon}</div>
                  <div className="flex-1 text-left">
                    <div className="text-sm">{item.label}</div>
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
          {idx < elements.length - 1 && <Separator className="mt-4" />}
        </div>
      ))}
    </div>
  );
}
