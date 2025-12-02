"use client"

import * as React from "react"
import { motion, HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"

interface CardStackedProps extends HTMLMotionProps<"div"> {
  index: number
  total?: number
}

const CardStacked = React.forwardRef<HTMLDivElement, CardStackedProps>(
  ({ index, total = 4, children, className, ...props }, ref) => {
    // Calcular offset baseado no índice
    const offset = index * 8 // 8px de offset entre cada card
    const scale = 1 - (index * 0.02) // Cada card é 2% menor que o anterior
    const opacity = 1 - (index * 0.1) // Fade progressivo

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.4,
          delay: index * 0.1,
          ease: [0.23, 1, 0.32, 1]
        }}
        style={{
          transform: `translateY(${offset}px) scale(${scale})`,
          zIndex: total - index,
          transformOrigin: 'top center'
        }}
        className={cn("w-full", className)}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

CardStacked.displayName = "CardStacked"

interface CardsStackContainerProps {
  children: React.ReactNode
  className?: string
}

const CardsStackContainer = ({ children, className }: CardsStackContainerProps) => {
  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
      {children}
    </div>
  )
}

export { CardStacked, CardsStackContainer }
