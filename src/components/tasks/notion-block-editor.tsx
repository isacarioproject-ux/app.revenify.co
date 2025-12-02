import { useState } from 'react';
import { motion, Reorder, useDragControls } from 'framer-motion';
import { 
  GripVertical, 
  Plus, 
  Type, 
  Heading1, 
  Heading2, 
  Heading3,
  Heading4,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  Quote,
  Minus,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useI18n } from '@/hooks/use-i18n';

export type BlockType = 
  | 'text' 
  | 'h1' 
  | 'h2' 
  | 'h3' 
  | 'h4'
  | 'bullet-list'
  | 'numbered-list'
  | 'checkbox'
  | 'code'
  | 'quote'
  | 'divider';

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;
}

interface NotionBlockEditorProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  placeholder?: string;
}

const blockTypes = [
  { type: 'text' as BlockType, icon: Type, label: 'text', shortcut: 'T' },
  { type: 'h1' as BlockType, icon: Heading1, label: 'heading1', shortcut: 'H1' },
  { type: 'h2' as BlockType, icon: Heading2, label: 'heading2', shortcut: 'H2' },
  { type: 'h3' as BlockType, icon: Heading3, label: 'heading3', shortcut: 'H3' },
  { type: 'h4' as BlockType, icon: Heading4, label: 'heading4', shortcut: 'H4' },
  { type: 'bullet-list' as BlockType, icon: List, label: 'list', shortcut: '-' },
  { type: 'numbered-list' as BlockType, icon: ListOrdered, label: 'numberedList', shortcut: '1.' },
  { type: 'checkbox' as BlockType, icon: CheckSquare, label: 'checkbox', shortcut: '[]' },
  { type: 'code' as BlockType, icon: Code, label: 'code', shortcut: '```' },
  { type: 'quote' as BlockType, icon: Quote, label: 'quote', shortcut: '>' },
  { type: 'divider' as BlockType, icon: Minus, label: 'divider', shortcut: '---' },
];

export function NotionBlockEditor({ blocks, onChange, placeholder }: NotionBlockEditorProps) {
  const { t } = useI18n();
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);

  const addBlock = (type: BlockType = 'text') => {
    const newBlock: Block = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content: '',
      checked: type === 'checkbox' ? false : undefined,
    };
    onChange([...blocks, newBlock]);
    setShowBlockMenu(false);
  };

  const updateBlock = (id: string, updates: Partial<Block>) => {
    onChange(blocks.map(block => 
      block.id === id ? { ...block, ...updates } : block
    ));
  };

  const deleteBlock = (id: string) => {
    onChange(blocks.filter(block => block.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent, blockId: string, index: number) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const newBlock: Block = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'text',
        content: '',
      };
      const newBlocks = [...blocks];
      newBlocks.splice(index + 1, 0, newBlock);
      onChange(newBlocks);
      
      // Focus no novo bloco
      setTimeout(() => {
        const input = document.querySelector(`[data-block-id="${newBlock.id}"]`) as HTMLElement;
        input?.focus();
      }, 0);
    } else if (e.key === 'Backspace' && blocks[index].content === '' && blocks.length > 1) {
      e.preventDefault();
      deleteBlock(blockId);
      
      // Focus no bloco anterior
      if (index > 0) {
        setTimeout(() => {
          const input = document.querySelector(`[data-block-id="${blocks[index - 1].id}"]`) as HTMLElement;
          input?.focus();
        }, 0);
      }
    } else if (e.key === '/' && blocks[index].content === '') {
      e.preventDefault();
      setActiveBlockId(blockId);
      setShowBlockMenu(true);
    }
  };

  const getBlockComponent = (block: Block, index: number) => {
    const baseClasses = "w-full bg-transparent border-none focus:outline-none focus:ring-0 resize-none dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 px-1 py-1";
    
    const commonProps = {
      'data-block-id': block.id,
      value: block.content,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
        updateBlock(block.id, { content: e.target.value }),
      onKeyDown: (e: React.KeyboardEvent) => handleKeyDown(e, block.id, index),
      placeholder: index === 0 && blocks.length === 1 ? placeholder : '',
      autoFocus: index === blocks.length - 1 && blocks.length > 1,
    };

    switch (block.type) {
      case 'h1':
        return (
          <input
            type="text"
            {...commonProps}
            className={cn(baseClasses, "text-3xl font-bold")}
          />
        );
      case 'h2':
        return (
          <input
            type="text"
            {...commonProps}
            className={cn(baseClasses, "text-2xl font-bold")}
          />
        );
      case 'h3':
        return (
          <input
            type="text"
            {...commonProps}
            className={cn(baseClasses, "text-xl font-bold")}
          />
        );
      case 'h4':
        return (
          <input
            type="text"
            {...commonProps}
            className={cn(baseClasses, "text-lg font-bold")}
          />
        );
      case 'bullet-list':
        return (
          <div className="flex items-start gap-2">
            <span className="text-gray-400 mt-1">•</span>
            <input
              type="text"
              {...commonProps}
              className={cn(baseClasses, "flex-1")}
            />
          </div>
        );
      case 'numbered-list':
        return (
          <div className="flex items-start gap-2">
            <span className="text-gray-400 mt-1">{index + 1}.</span>
            <input
              type="text"
              {...commonProps}
              className={cn(baseClasses, "flex-1")}
            />
          </div>
        );
      case 'checkbox':
        return (
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={block.checked || false}
              onChange={(e) => updateBlock(block.id, { checked: e.target.checked })}
              className="mt-1 size-4 rounded border-gray-300 dark:border-gray-600"
            />
            <input
              type="text"
              {...commonProps}
              className={cn(baseClasses, "flex-1", block.checked && "line-through text-gray-400")}
            />
          </div>
        );
      case 'code':
        return (
          <textarea
            {...commonProps}
            className={cn(baseClasses, "font-mono text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded")}
            rows={3}
          />
        );
      case 'quote':
        return (
          <div className="flex items-start gap-2 border-l-4 border-gray-300 dark:border-gray-600 pl-3">
            <textarea
              {...commonProps}
              className={cn(baseClasses, "italic text-gray-600 dark:text-gray-400")}
              rows={2}
            />
          </div>
        );
      case 'divider':
        return (
          <div className="w-full h-px bg-gray-200 dark:bg-gray-700 my-2" />
        );
      default:
        return (
          <input
            type="text"
            {...commonProps}
            className={cn(baseClasses)}
          />
        );
    }
  };

  return (
    <div className="space-y-1">
      <TooltipProvider>
        <Reorder.Group
          axis="y"
          values={blocks}
          onReorder={onChange}
          className="space-y-1"
        >
          {blocks.map((block, index) => (
            <BlockItem
              key={block.id}
              block={block}
              index={index}
              onDelete={() => deleteBlock(block.id)}
              onTypeChange={(type) => updateBlock(block.id, { type })}
            >
              {getBlockComponent(block, index)}
            </BlockItem>
          ))}
        </Reorder.Group>

        {/* Botão Adicionar Bloco */}
        <div className="flex items-center gap-2 pt-2">
          <Popover open={showBlockMenu} onOpenChange={setShowBlockMenu}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <Plus className="size-4 mr-2" />
                {t('tasks.editor.addBlock')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full max-w-[95vw] md:w-[600px] p-3" align="start">
              <div className="mb-3 px-2 text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">{t('tasks.editor.changeType')}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                {blockTypes.map(({ type, icon: Icon, label, shortcut }) => (
                  <button
                    key={type}
                    onClick={() => addBlock(type)}
                    className="flex items-center justify-between w-full px-3 py-2.5 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="size-4 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200" />
                      <span className="dark:text-white text-left">{t(`tasks.editor.${label}`)}</span>
                    </div>
                    <span className="text-xs text-gray-400 font-mono ml-2">{shortcut}</span>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </TooltipProvider>
    </div>
  );
}

interface BlockItemProps {
  block: Block;
  index: number;
  children: React.ReactNode;
  onDelete: () => void;
  onTypeChange: (type: BlockType) => void;
}

function BlockItem({ block, index, children, onDelete, onTypeChange }: BlockItemProps) {
  const dragControls = useDragControls();
  const [isHovered, setIsHovered] = useState(false);

  if (block.type === 'divider') {
    return (
      <Reorder.Item
        value={block}
        dragListener={false}
        dragControls={dragControls}
        className="group relative py-2"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {children}
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute right-0 top-1/2 -translate-y-1/2"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 text-gray-400 hover:text-red-500"
                  onClick={onDelete}
                >
                  <X className="size-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Remover</p>
              </TooltipContent>
            </Tooltip>
          </motion.div>
        )}
      </Reorder.Item>
    );
  }

  return (
    <Reorder.Item
      value={block}
      dragListener={false}
      dragControls={dragControls}
      className="group relative flex items-start gap-1 py-1 rounded hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Drag Handle - Só aparece no hover */}
      {isHovered && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-0.5 pt-1.5 shrink-0"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onPointerDown={(e) => dragControls.start(e)}
                className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-0.5"
              >
                <GripVertical className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Arraste para mover</p>
            </TooltipContent>
          </Tooltip>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-0"
                title="Mudar tipo de bloco"
              >
                <Plus className="size-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full max-w-[95vw] md:w-[600px] p-3" align="start">
              <div className="mb-3 px-2 text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">Mudar tipo de bloco</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                {blockTypes.map(({ type, icon: Icon, label, shortcut }) => (
                  <button
                    key={type}
                    onClick={() => onTypeChange(type)}
                    className="flex items-center justify-between w-full px-3 py-2.5 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="size-4 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200" />
                      <span className="dark:text-white text-left">{label}</span>
                    </div>
                    <span className="text-xs text-gray-400 font-mono ml-2">{shortcut}</span>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </motion.div>
      )}

      {/* Block Content */}
      <div className="flex-1 min-w-0">
        {children}
      </div>

      {/* Delete Button - Só aparece no hover */}
      {isHovered && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="pt-1.5 shrink-0"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-5 text-gray-400 hover:text-red-500 p-0"
                onClick={onDelete}
              >
                <X className="size-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Remover</p>
            </TooltipContent>
          </Tooltip>
        </motion.div>
      )}
    </Reorder.Item>
  );
}
