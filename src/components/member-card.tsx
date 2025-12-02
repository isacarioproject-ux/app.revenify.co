import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { motion } from 'framer-motion'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Shield, UserX } from 'lucide-react'

const roleLabels: Record<string, string> = {
  owner: 'Proprietário',
  admin: 'Admin',
  member: 'Membro',
}

const getInitials = (text: string) => {
  return text.substring(0, 2).toUpperCase()
}

const formatRelativeTime = (date: string) => {
  const now = new Date()
  const past = new Date(date)
  const diffMs = now.getTime() - past.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) return `há ${diffMins}m`
  if (diffHours < 24) return `há ${diffHours}h`
  return `há ${diffDays}d`
}

interface MemberCardProps {
  member: any
  onChangeRole: () => void
  onRemove: () => void
}

export const MemberCard = ({ member, onChangeRole, onRemove }: MemberCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <motion.div
          whileHover={{ scale: 1.05, rotate: 2 }}
          transition={{ duration: 0.2 }}
        >
          <Avatar className="h-12 w-12">
            <AvatarImage src={member.avatar_url} alt={member.name} />
            <AvatarFallback className="text-sm">
              {getInitials(member.name || member.email)}
            </AvatarFallback>
          </Avatar>
        </motion.div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm truncate">
              {member.name || member.email}
            </p>
            {member.status === 'active' && (
              <div className="h-2 w-2 rounded-full bg-green-500" />
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <p className="text-xs text-muted-foreground truncate">
              {member.email}
            </p>
            <Badge variant="secondary" className="text-2xs px-1.5 py-0">
              {roleLabels[member.role] || member.role}
            </Badge>
          </div>
          {member.joined_at && (
            <p className="mt-1 text-2xs text-muted-foreground">
              Entrou {formatRelativeTime(member.joined_at)}
            </p>
          )}
        </div>
        {member.role !== 'owner' && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onChangeRole}>
                <Shield className="mr-2 h-3.5 w-3.5" />
                Alterar Papel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onRemove} className="text-destructive">
                <UserX className="mr-2 h-3.5 w-3.5" />
                Remover
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardContent>
    </Card>
    </motion.div>
  )
}
