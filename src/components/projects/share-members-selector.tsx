import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Search, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-media-query'

interface Member {
  id: string
  name: string
  email: string
  avatar?: string
  role: string
}

interface ShareMembersSelectorProps {
  selectedMembers: string[]
  onMembersChange: (memberIds: string[]) => void
  trigger: React.ReactNode
}

// Mock data - substituir por dados reais do workspace colaborativo
const MOCK_MEMBERS: Member[] = [
  {
    id: '1',
    name: 'Eu',
    email: 'isacar.dev@gmail.com',
    role: 'Proprietário',
    avatar: undefined
  },
  {
    id: '2',
    name: 'João Silva',
    email: 'joao.silva@empresa.com',
    role: 'Co-fundador',
    avatar: undefined
  },
  {
    id: '3',
    name: 'Maria Santos',
    email: 'maria.santos@empresa.com',
    role: 'Desenvolvedora',
    avatar: undefined
  },
  {
    id: '4',
    name: 'Pedro Costa',
    email: 'pedro.costa@empresa.com',
    role: 'Designer',
    avatar: undefined
  },
  {
    id: '5',
    name: 'Ana Oliveira',
    email: 'ana.oliveira@empresa.com',
    role: 'Marketing',
    avatar: undefined
  },
  {
    id: '6',
    name: 'Carlos Ferreira',
    email: 'carlos.ferreira@empresa.com',
    role: 'Desenvolvedor',
    avatar: undefined
  },
  {
    id: '7',
    name: 'Juliana Alves',
    email: 'juliana.alves@empresa.com',
    role: 'Product Manager',
    avatar: undefined
  },
  {
    id: '8',
    name: 'Rafael Lima',
    email: 'rafael.lima@empresa.com',
    role: 'QA',
    avatar: undefined
  },
]

export function ShareMembersSelector({
  selectedMembers,
  onMembersChange,
  trigger,
}: ShareMembersSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const isMobile = useIsMobile()

  // Filtrar membros com base na busca
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return MOCK_MEMBERS

    const query = searchQuery.toLowerCase()
    return MOCK_MEMBERS.filter(
      (member) =>
        member.name.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query) ||
        member.role.toLowerCase().includes(query)
    )
  }, [searchQuery])

  const toggleMember = (memberId: string) => {
    if (selectedMembers.includes(memberId)) {
      onMembersChange(selectedMembers.filter((id) => id !== memberId))
    } else {
      onMembersChange([...selectedMembers, memberId])
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const MembersContent = () => (
    <div className="flex flex-col">
      {/* Search Input */}
      <div className="px-4 py-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Busque ou insira o e-mail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
            autoFocus
          />
        </div>
      </div>

      {/* Members List */}
      <div className="max-h-[300px] overflow-y-auto">
        {filteredMembers.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Nenhum membro encontrado
          </div>
        ) : (
          <div className="p-2">
            {filteredMembers.map((member, index) => {
              const isSelected = selectedMembers.includes(member.id)
              const isCurrentUser = member.id === '1' // Mock - você é sempre o primeiro

              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => !isCurrentUser && toggleMember(member.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-2.5 rounded-lg transition-colors",
                    isCurrentUser
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-accent cursor-pointer"
                  )}
                >
                  <div className="relative">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center border-2 border-background"
                      >
                        <Check className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={3} />
                      </motion.div>
                    )}
                  </div>

                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium truncate">{member.name}</p>
                      {isCurrentUser && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                          Você
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                  </div>

                  {!isCurrentUser && (
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleMember(member.id)}
                      className="pointer-events-none"
                    />
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t bg-muted/30 space-y-2">
        <p className="text-xs text-muted-foreground">
          {selectedMembers.length === 0 
            ? 'Selecione membros para compartilhar'
            : selectedMembers.length === 1
            ? '1 membro selecionado'
            : `${selectedMembers.length} membros selecionados`}
        </p>
        <p className="text-[10px] text-muted-foreground/70">
          ℹ️ Membros do seu workspace colaborativo podem ser adicionados mesmo estando no workspace pessoal
        </p>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <div onClick={() => setOpen(true)}>
          {trigger}
        </div>
        <DrawerContent className="max-h-[85vh]">
          <DrawerTitle className="px-4 pt-4 pb-2 text-base font-semibold">
            Compartilhar com membros
          </DrawerTitle>
          <DrawerDescription className="px-4 pb-2 text-xs text-muted-foreground">
            Selecione os membros do workspace que terão acesso
          </DrawerDescription>
          {/* Handle visual */}
          <div className="mx-auto w-12 h-1.5 rounded-full bg-muted-foreground/20 mb-2" />
          <MembersContent />
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-0" align="start">
        <div className="px-4 py-3 border-b">
          <h3 className="text-sm font-semibold">Compartilhar com membros</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Selecione os membros do workspace que terão acesso
          </p>
        </div>
        <MembersContent />
      </PopoverContent>
    </Popover>
  )
}
