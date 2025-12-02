import { useState } from "react";
import { motion } from "framer-motion";
import { 
  CheckSquare, 
  Users, 
  Clock, 
  Mail,
  Target,
  TrendingUp,
  BarChart3,
  MapPin,
  Route,
  Compass
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BaseCardProps {
  title: string;
  description: string;
}

// Componente base para os cards com hover effect
function ManagementCardBase({ 
  title, 
  description, 
  icons,
  colors,
  delay = 0
}: BaseCardProps & { 
  icons: React.ReactNode[]; 
  colors: string[];
  delay?: number;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group"
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border",
          "bg-card transition-all duration-300",
          "hover:bg-accent/5 hover:shadow-xl hover:border-primary/50"
        )}
      >
        <div className="p-4">
          {/* Ícones no topo - Animação estilo EmptyState */}
          <div className="mb-5 flex items-center justify-center isolate">
            {icons.length === 3 ? (
              <>
                <motion.div
                  animate={{
                    x: isHovered ? -5 : 0,
                    y: isHovered ? -2 : 0,
                    rotate: isHovered ? -12 : -6,
                  }}
                  transition={{ 
                    duration: 0.5,
                    type: "spring",
                    stiffness: 300,
                    damping: 20
                  }}
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-lg",
                    "bg-background/95 backdrop-blur-sm shadow-lg ring-1 ring-border/50",
                    "relative left-2 top-1 z-0",
                    "transition-all duration-500",
                    isHovered && "bg-primary/10 ring-primary/20"
                  )}
                  style={{ opacity: 1 }}
                >
                  {icons[0]}
                </motion.div>
                <motion.div
                  animate={{
                    y: isHovered ? -2 : 0,
                    scale: isHovered ? 1.05 : 1,
                  }}
                  transition={{ 
                    duration: 0.5,
                    type: "spring",
                    stiffness: 300,
                    damping: 20
                  }}
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-lg",
                    "bg-background/95 backdrop-blur-sm shadow-xl ring-1 ring-border/50",
                    "relative z-10",
                    "transition-all duration-500",
                    isHovered && "bg-primary/15 ring-primary/30 shadow-2xl"
                  )}
                  style={{ opacity: 1 }}
                >
                  {icons[1]}
                </motion.div>
                <motion.div
                  animate={{
                    x: isHovered ? 5 : 0,
                    y: isHovered ? -2 : 0,
                    rotate: isHovered ? 12 : 6,
                  }}
                  transition={{ 
                    duration: 0.5,
                    type: "spring",
                    stiffness: 300,
                    damping: 20
                  }}
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-lg",
                    "bg-background/95 backdrop-blur-sm shadow-lg ring-1 ring-border/50",
                    "relative right-2 top-1 z-0",
                    "transition-all duration-500",
                    isHovered && "bg-primary/10 ring-primary/20"
                  )}
                  style={{ opacity: 1 }}
                >
                  {icons[2]}
                </motion.div>
              </>
            ) : null}
          </div>

          {/* Conteúdo */}
          <motion.div
            animate={{ 
              y: isHovered ? -2 : 0 
            }}
            transition={{ duration: 0.3 }}
            className="text-center space-y-2"
          >
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          </motion.div>

          {/* Indicador de hover */}
          <motion.div
            className="mt-4 h-1 rounded-full bg-primary/80"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            style={{ transformOrigin: "left" }}
          />
        </div>
      </div>
    </motion.div>
  );
}

interface TasksCardProps {
  title: string;
  description: string;
  onOpenWhiteboard?: () => void;
}

export function TasksCard({ title, description, onOpenWhiteboard }: TasksCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const icons = [
    <Users key="users" className="h-5 w-5 text-blue-500" />,
    <Clock key="clock" className="h-5 w-5 text-purple-500" />,
    <Mail key="mail" className="h-5 w-5 text-pink-500" />,
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onOpenWhiteboard}
      className="group cursor-pointer"
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border",
          "bg-card transition-all duration-300",
          "hover:bg-accent/5 hover:shadow-xl hover:border-primary/50"
        )}
      >
        <div className="p-4 relative">
          {/* Ícones no topo */}
          <div className="mb-5 flex items-center justify-center isolate">
            {icons.length === 3 ? (
              <>
                <motion.div
                  animate={{
                    x: isHovered ? -5 : 0,
                    y: isHovered ? -2 : 0,
                    rotate: isHovered ? -12 : -6,
                  }}
                  transition={{ 
                    duration: 0.5,
                    type: "spring",
                    stiffness: 300,
                    damping: 20
                  }}
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-lg",
                    "bg-background/95 backdrop-blur-sm shadow-lg ring-1 ring-border/50",
                    "relative left-2 top-1 z-0",
                    "transition-all duration-500",
                    isHovered && "bg-primary/10 ring-primary/20"
                  )}
                  style={{ opacity: 1 }}
                >
                  {icons[0]}
                </motion.div>
                <motion.div
                  animate={{
                    y: isHovered ? -2 : 0,
                    scale: isHovered ? 1.05 : 1,
                  }}
                  transition={{ 
                    duration: 0.5,
                    type: "spring",
                    stiffness: 300,
                    damping: 20
                  }}
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-lg",
                    "bg-background/95 backdrop-blur-sm shadow-xl ring-1 ring-border/50",
                    "relative z-10",
                    "transition-all duration-500",
                    isHovered && "bg-primary/15 ring-primary/30 shadow-2xl"
                  )}
                  style={{ opacity: 1 }}
                >
                  {icons[1]}
                </motion.div>
                <motion.div
                  animate={{
                    x: isHovered ? 5 : 0,
                    y: isHovered ? -2 : 0,
                    rotate: isHovered ? 12 : 6,
                  }}
                  transition={{ 
                    duration: 0.5,
                    type: "spring",
                    stiffness: 300,
                    damping: 20
                  }}
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-lg",
                    "bg-background/95 backdrop-blur-sm shadow-lg ring-1 ring-border/50",
                    "relative right-2 top-1 z-0",
                    "transition-all duration-500",
                    isHovered && "bg-primary/10 ring-primary/20"
                  )}
                  style={{ opacity: 1 }}
                >
                  {icons[2]}
                </motion.div>
              </>
            ) : null}
          </div>

          {/* Conteúdo */}
          <motion.div
            animate={{ 
              y: isHovered ? -2 : 0 
            }}
            transition={{ duration: 0.3 }}
            className="text-center space-y-2"
          >
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          </motion.div>

          {/* Indicador de hover */}
          <motion.div
            className="mt-4 h-1 rounded-full bg-primary/80"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            style={{ transformOrigin: "left" }}
          />
        </div>
      </div>
    </motion.div>
  );
}

interface PlansCardProps {
  title: string;
  description: string;
}

export function PlansCard({ title, description }: PlansCardProps) {
  const icons = [
    <Target key="target" className="h-5 w-5 text-green-500" />,
    <TrendingUp key="trending" className="h-5 w-5 text-blue-500" />,
    <BarChart3 key="chart" className="h-5 w-5 text-purple-500" />,
  ];

  return (
    <ManagementCardBase
      title={title}
      description={description}
      icons={icons}
      colors={["#10b981", "#3b82f6", "#8b5cf6"]}
      delay={0.1}
    />
  );
}

interface JourneyCardProps {
  title: string;
  description: string;
}

export function JourneyCard({ title, description }: JourneyCardProps) {
  const icons = [
    <MapPin key="mappin" className="h-5 w-5 text-pink-500" />,
    <Route key="route" className="h-5 w-5 text-orange-500" />,
    <Compass key="compass" className="h-5 w-5 text-green-500" />,
  ];

  return (
    <ManagementCardBase
      title={title}
      description={description}
      icons={icons}
      colors={["#ec4899", "#f59e0b", "#10b981"]}
      delay={0.2}
    />
  );
}
