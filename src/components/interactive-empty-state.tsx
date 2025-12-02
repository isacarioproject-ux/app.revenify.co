import React, { memo, useId, forwardRef } from 'react';
import { motion, LazyMotion, domAnimation } from 'framer-motion';
import { useTheme } from 'next-themes';
import { cn as cnUtils } from '@/lib/utils';

interface EmptyStateAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

interface EmptyStateProps {
  title: string;
  description?: string;
  icons?: React.ReactNode[];
  action?: EmptyStateAction;
  variant?: 'default' | 'subtle' | 'error';
  size?: 'sm' | 'default' | 'lg';
  isIconAnimated?: boolean;
  className?: string;
}

const ICON_VARIANTS = {
  left: {
    initial: { scale: 0.8, opacity: 0, x: 0, y: 0, rotate: 0 },
    animate: { scale: 1, opacity: 1, x: 0, y: 0, rotate: -6, transition: { duration: 0.4, delay: 0.1 } },
    hover: { x: -22, y: -5, rotate: -15, scale: 1.1, transition: { duration: 0.2 } }
  },
  center: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1, transition: { duration: 0.4, delay: 0.2 } },
    hover: { y: -10, scale: 1.15, transition: { duration: 0.2 } }
  },
  right: {
    initial: { scale: 0.8, opacity: 0, x: 0, y: 0, rotate: 0 },
    animate: { scale: 1, opacity: 1, x: 0, y: 0, rotate: 6, transition: { duration: 0.4, delay: 0.3 } },
    hover: { x: 22, y: -5, rotate: 15, scale: 1.1, transition: { duration: 0.2 } }
  }
};

const CONTENT_VARIANTS = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { duration: 0.4, delay: 0.2 } },
};

const BUTTON_VARIANTS = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { duration: 0.4, delay: 0.3 } },
};

// Usar cn do utils
const cn = cnUtils;

interface IconContainerProps {
  children: React.ReactNode;
  variant: 'left' | 'center' | 'right';
  className?: string;
}

const IconContainer = memo<IconContainerProps>(({ children, variant, className = '' }) => (
  <motion.div
    variants={ICON_VARIANTS[variant]}
    className={cn(
      "w-12 h-12 rounded-xl flex items-center justify-center relative shadow-lg transition-all duration-300",
      "bg-muted border border-border group-hover:shadow-xl group-hover:border-primary/20",
      className
    )}
  >
    <div className="text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-300">
      {children}
    </div>
  </motion.div>
));
IconContainer.displayName = "IconContainer";

interface MultiIconDisplayProps {
  icons: React.ReactNode[];
}

const MultiIconDisplay = memo<MultiIconDisplayProps>(({ icons }) => {
  if (!icons || icons.length < 3) return null;

  return (
    <div className="flex justify-center isolate relative">
      <IconContainer variant="left" className="left-2 top-1 z-10">
        {icons[0]}
      </IconContainer>
      <IconContainer variant="center" className="z-20">
        {icons[1]}
      </IconContainer>
      <IconContainer variant="right" className="right-2 top-1 z-10">
        {icons[2]}
      </IconContainer>
    </div>
  );
});
MultiIconDisplay.displayName = "MultiIconDisplay";

const Background = () => (
  <div
    aria-hidden="true"
    className="absolute inset-0 opacity-0 group-hover:opacity-5 dark:group-hover:opacity-[0.02] transition-opacity duration-500 bg-[radial-gradient(circle_at_2px_2px,hsl(var(--foreground))_1px,transparent_1px)] bg-[length:24px_24px]"
  />
);

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(({
  title,
  description,
  icons,
  action,
  variant = 'default',
  size = 'default',
  isIconAnimated = true,
  className = '',
  ...props
}, ref) => {
  const titleId = useId();
  const descriptionId = useId();

  const baseClasses = "group transition-all duration-300 rounded-xl relative overflow-hidden text-center flex flex-col items-center justify-center";

  const sizeClasses: Record<string, string> = {
    sm: "p-6",
    default: "p-8",
    lg: "p-12"
  };

  const getVariantClasses = (variant: string) => {
    const variants: Record<string, string> = {
      default: "bg-background border-dashed border-2 border-border hover:border-primary/50 hover:bg-accent/50",
      subtle: "bg-background border border-transparent hover:bg-accent/30",
      error: "bg-background border border-destructive/50 bg-destructive/5 hover:bg-destructive/10"
    };
    return variants[variant];
  };

  const getTextClasses = (type: string, size: string) => {
    const sizes: Record<string, Record<string, string>> = {
      title: {
        sm: "text-base",
        default: "text-lg",
        lg: "text-xl"
      },
      description: {
        sm: "text-xs",
        default: "text-sm",
        lg: "text-base"
      }
    };

    const colors: Record<string, string> = {
      title: "text-foreground",
      description: "text-muted-foreground"
    };

    return cn(sizes[type][size], colors[type], type === 'title' && "font-semibold", "transition-colors duration-200");
  };

  const getButtonClasses = (size: string) => {
    const sizeClasses: Record<string, string> = {
      sm: "text-xs px-3 py-1.5",
      default: "text-sm px-4 py-2",
      lg: "text-base px-6 py-3"
    };

    return cn(
      "inline-flex items-center gap-2 border border-border bg-background hover:bg-accent hover:text-accent-foreground rounded-md font-medium shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden group/button disabled:opacity-50 disabled:cursor-not-allowed",
      sizeClasses[size]
    );
  };

  return (
    <LazyMotion features={domAnimation}>
      <motion.section
        ref={ref}
        role="region"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={cn(
          baseClasses,
          sizeClasses[size],
          getVariantClasses(variant),
          className
        )}
        initial="initial"
        animate="animate"
        whileHover={isIconAnimated ? "hover" : "animate"}
        {...props}
      >
        <Background />
        <div className="relative z-10 flex flex-col items-center">
          {icons && (
            <div className="mb-6">
              <MultiIconDisplay icons={icons} />
            </div>
          )}

          <motion.div variants={CONTENT_VARIANTS} className="space-y-2 mb-6">
            <h2 id={titleId} className={getTextClasses('title', size)}>
              {title}
            </h2>
            {description && (
              <p
                id={descriptionId}
                className={cn(
                  getTextClasses('description', size),
                  "max-w-md leading-relaxed"
                )}
              >
                {description}
              </p>
            )}
          </motion.div>

          {action && (
            <motion.div variants={BUTTON_VARIANTS}>
              <motion.button
                type="button"
                onClick={action.onClick}
                disabled={action.disabled}
                className={getButtonClasses(size)}
                whileTap={{ scale: 0.98 }}
              >
                {action.icon && (
                  <motion.div
                    className="transition-transform group-hover/button:rotate-90"
                    whileHover={{ rotate: 90 }}
                  >
                    {action.icon}
                  </motion.div>
                )}
                <span className="relative z-10">{action.label}</span>
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.section>
    </LazyMotion>
  );
});
EmptyState.displayName = "EmptyState";
