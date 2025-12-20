import { motion } from 'framer-motion'
import {
  Home,
  FolderKanban,
  Radio,
  BarChart3,
  Users,
  Route,
  FileText,
  Link2,
  Globe,
  Shield,
  Settings,
  CreditCard,
  Bell,
  Palette,
  User,
  LogOut,
  Plug,
  PenSquare,
} from 'lucide-react'
import { forwardRef } from 'react'

interface AnimatedIconProps {
  icon: string
  isActive?: boolean
  className?: string
}

// Animações específicas para cada ícone
const iconAnimations: Record<string, {
  hover: object
  active?: object
}> = {
  Home: {
    hover: {
      scale: [1, 1.1, 1],
      rotate: [0, -5, 5, 0],
      transition: { duration: 0.5, ease: "easeInOut" }
    }
  },
  FolderKanban: {
    hover: {
      y: [0, -2, 0],
      transition: { duration: 0.3, repeat: 1 }
    }
  },
  Radio: {
    hover: {
      scale: [1, 1.15, 1],
      transition: { duration: 0.4, repeat: Infinity, repeatType: "reverse" }
    }
  },
  BarChart3: {
    hover: {
      scaleY: [1, 1.1, 0.95, 1.05, 1],
      transition: { duration: 0.5 }
    }
  },
  Users: {
    hover: {
      x: [0, -2, 2, 0],
      transition: { duration: 0.4 }
    }
  },
  Route: {
    hover: {
      pathLength: [0, 1],
      x: [0, 3, 0],
      transition: { duration: 0.5 }
    }
  },
  FileText: {
    hover: {
      rotateY: [0, 15, 0],
      transition: { duration: 0.4 }
    }
  },
  Link2: {
    hover: {
      rotate: [0, 15, -15, 0],
      transition: { duration: 0.5 }
    }
  },
  Globe: {
    hover: {
      rotate: 360,
      transition: { duration: 2, ease: "linear", repeat: Infinity }
    }
  },
  Shield: {
    hover: {
      scale: [1, 1.1, 1],
      y: [0, -2, 0],
      transition: { duration: 0.4 }
    }
  },
  Settings: {
    hover: {
      rotate: 180,
      transition: { duration: 0.5 }
    }
  },
  CreditCard: {
    hover: {
      x: [0, 3, 0],
      rotateY: [0, 10, 0],
      transition: { duration: 0.4 }
    }
  },
  Bell: {
    hover: {
      rotate: [0, 15, -15, 10, -10, 0],
      transition: { duration: 0.5 }
    }
  },
  Palette: {
    hover: {
      rotate: [0, -10, 10, 0],
      scale: [1, 1.1, 1],
      transition: { duration: 0.4 }
    }
  },
  User: {
    hover: {
      y: [0, -2, 0],
      transition: { duration: 0.3 }
    }
  },
  Plug: {
    hover: {
      x: [0, 2, 0],
      transition: { duration: 0.3, repeat: 2 }
    }
  },
}

const iconComponents: Record<string, React.ComponentType<{ className?: string }>> = {
  Home,
  FolderKanban,
  Radio,
  BarChart3,
  Users,
  Route,
  FileText,
  Link2,
  Globe,
  Shield,
  Settings,
  CreditCard,
  Bell,
  Palette,
  User,
  LogOut,
  Plug,
  PenSquare,
}

export const AnimatedIcon = forwardRef<HTMLDivElement, AnimatedIconProps>(
  ({ icon, isActive, className }, ref) => {
    const IconComponent = iconComponents[icon]
    const animation = iconAnimations[icon] || { hover: { scale: 1.1 } }

    if (!IconComponent) {
      return null
    }

    return (
      <motion.div
        ref={ref}
        whileHover={animation.hover as any}
        className={className}
        style={{ display: 'inline-flex' }}
      >
        <IconComponent className="h-4 w-4" />
      </motion.div>
    )
  }
)

AnimatedIcon.displayName = 'AnimatedIcon'

// Componente wrapper para usar diretamente o ícone com animação
export function createAnimatedIcon(IconComponent: React.ComponentType<{ className?: string }>, animationKey: string) {
  return forwardRef<HTMLDivElement, { className?: string; isActive?: boolean }>(
    ({ className, isActive }, ref) => {
      const animation = iconAnimations[animationKey] || { hover: { scale: 1.1 } }
      
      return (
        <motion.div
          ref={ref}
          whileHover={animation.hover as any}
          className={className}
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <IconComponent className="h-4 w-4" />
        </motion.div>
      )
    }
  )
}

// Ícones animados prontos para usar
export const AnimatedHome = createAnimatedIcon(Home, 'Home')
export const AnimatedFolderKanban = createAnimatedIcon(FolderKanban, 'FolderKanban')
export const AnimatedRadio = createAnimatedIcon(Radio, 'Radio')
export const AnimatedBarChart3 = createAnimatedIcon(BarChart3, 'BarChart3')
export const AnimatedUsers = createAnimatedIcon(Users, 'Users')
export const AnimatedRoute = createAnimatedIcon(Route, 'Route')
export const AnimatedFileText = createAnimatedIcon(FileText, 'FileText')
export const AnimatedLink2 = createAnimatedIcon(Link2, 'Link2')
export const AnimatedGlobe = createAnimatedIcon(Globe, 'Globe')
export const AnimatedShield = createAnimatedIcon(Shield, 'Shield')
export const AnimatedSettings = createAnimatedIcon(Settings, 'Settings')
export const AnimatedCreditCard = createAnimatedIcon(CreditCard, 'CreditCard')
export const AnimatedBell = createAnimatedIcon(Bell, 'Bell')
export const AnimatedPalette = createAnimatedIcon(Palette, 'Palette')
export const AnimatedUser = createAnimatedIcon(User, 'User')
export const AnimatedPlug = createAnimatedIcon(Plug, 'Plug')
