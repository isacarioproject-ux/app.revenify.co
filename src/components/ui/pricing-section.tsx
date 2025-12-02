import React from 'react';
import { RainbowButton } from '@/components/ui/rainbow-button';
import { Button } from '@/components/ui/button';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { CheckCircle, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useI18n } from '@/hooks/use-i18n';

// Frequências traduzíveis via hook

interface PricingFeature {
  text: string;
  tooltip?: string;
}

interface PricingPlan {
  name: string;
  info: string;
  price: {
    mensal: number | string;
    anual: number | string;
  };
  originalPrice?: number;
  discount?: number;
  features: PricingFeature[];
  highlighted?: boolean;
  btn?: {
    text: string;
    href?: string;
    variant?: 'outline' | 'ghost' | 'destructive' | 'secondary';
    onClick?: () => void;
  };
  onClick?: () => void;
  selected?: boolean;
}

interface PricingSectionProps {
  plans: PricingPlan[];
  heading?: string;
  description?: string;
  className?: string;
  onFrequencyChange?: (frequency: 'mensal' | 'anual') => void;
  defaultFrequency?: 'mensal' | 'anual';
}

export function PricingSection({
	plans,
	heading,
	description,
	className,
  onFrequencyChange,
  defaultFrequency = 'mensal',
	...props
}: PricingSectionProps) {
	const { t } = useI18n();
	const [frequency, setFrequency] = React.useState<'mensal' | 'anual'>(defaultFrequency);

  const frequencies = [
    { key: 'mensal' as const, label: t('pricing.monthly') },
    { key: 'anual' as const, label: t('pricing.yearly') }
  ];

  const handleFrequencyChange = (freq: 'mensal' | 'anual') => {
    setFrequency(freq);
    onFrequencyChange?.(freq);
  };

	return (
		<div
			className={cn(
				'flex w-full flex-col space-y-4',
				className,
			)}
			{...props}
		>
			{heading && (
        <div className="w-full space-y-3">
          <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            {heading}
          </h2>
          {description && (
            <p className="text-muted-foreground text-center text-base md:text-lg">
              {description}
            </p>
          )}
        </div>
      )}
			<div className="w-full flex justify-center mb-6">
				<PricingFrequencyToggle
					frequency={frequency}
					setFrequency={handleFrequencyChange}
				/>
			</div>
			<div className="w-full max-w-7xl mx-auto grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 px-0">
				{plans.map((plan) => (
					<PricingCard plan={plan} key={plan.name} frequency={frequency} />
				))}
			</div>
		</div>
	);
}

interface PricingFrequencyToggleProps {
  frequency: 'mensal' | 'anual';
  setFrequency: (freq: 'mensal' | 'anual') => void;
  className?: string;
}

export function PricingFrequencyToggle({
	frequency,
	setFrequency,
	className,
	...props
}: PricingFrequencyToggleProps) {
	const { t } = useI18n();
	const frequencies = [
		{ key: 'mensal' as const, label: t('pricing.monthly') },
		{ key: 'anual' as const, label: t('pricing.yearly') }
	];

	return (
		<div
			className={cn(
				'bg-gray-100 dark:bg-gray-800 mx-auto flex w-fit rounded-full p-1 gap-1',
				className,
			)}
			{...props}
		>
			{frequencies.map((freq) => (
				<button
					key={freq.key}
					onClick={() => setFrequency(freq.key)}
					className={cn(
						'relative px-6 py-2 text-sm font-medium rounded-full transition-all duration-300',
						frequency === freq.key 
							? 'bg-gray-700 dark:bg-gray-300 text-white dark:text-gray-900 shadow-md font-semibold' 
							: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
					)}
				>
					{freq.label}
				</button>
			))}
		</div>
	);
}

interface PricingCardProps {
  plan: PricingPlan;
  className?: string;
  frequency?: 'mensal' | 'anual';
}

export function PricingCard({
	plan,
	className,
	frequency = 'mensal',
	...props
}: PricingCardProps) {
	const { t } = useI18n();
	const isCustomPrice = typeof plan.price[frequency] === 'string';
	const showDiscount = frequency === 'anual' && !isCustomPrice;

	return (
		<div
			key={plan.name}
			onClick={plan.onClick}
			className={cn(
				'relative flex w-full flex-col rounded-2xl border bg-card shadow-lg transition-all duration-300 hover:shadow-2xl overflow-hidden',
				plan.highlighted && 'border-primary/50 shadow-2xl scale-105',
        plan.selected && !plan.highlighted && 'ring-2 ring-primary scale-105',
        plan.onClick && 'cursor-pointer',
				className,
			)}
			{...props}
		>
			{plan.highlighted && (
				<BorderTrail
					className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
					size={100}
					transition={{ duration: 6, repeat: Infinity, ease: "linear", repeatType: "loop" }}
				/>
			)}
			<div
				className={cn(
					'bg-muted/20 rounded-t-xl border-b p-3',
					plan.highlighted && 'bg-muted/40',
				)}
			>
				<div className="absolute top-3 right-3 z-10 flex items-center gap-2">
					{plan.highlighted && (
						<p className="bg-primary text-primary-foreground flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold">
							<Star className="h-3 w-3 fill-current" />
							{t('pricing.popular')}
						</p>
					)}
					{showDiscount && plan.discount && (
						<p className="bg-green-500 text-white flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold">
							{plan.discount}% off
						</p>
					)}
          {plan.selected && (
            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-primary-foreground fill-current" />
            </div>
          )}
				</div>

				<div className="text-lg font-bold mb-1">{plan.name}</div>
				<p className="text-muted-foreground text-xs font-normal mb-3">{plan.info}</p>
				<div className="flex items-end gap-1">
					{isCustomPrice ? (
						<span className="text-xl font-bold">{plan.price[frequency]}</span>
					) : (
						<>
							<span className="text-2xl font-bold">
								R$ {plan.price[frequency]}
							</span>
							<span className="text-muted-foreground text-xs pb-0.5">
								/{frequency === 'mensal' ? t('pricing.month') : t('pricing.year')}
							</span>
						</>
					)}
				</div>
				{showDiscount && plan.originalPrice && (
					<p className="text-xs text-muted-foreground mt-1">
						<span className="line-through">R$ {plan.originalPrice}</span>
					</p>
				)}
			</div>
			<div
				className={cn(
					'text-muted-foreground space-y-1.5 px-4 py-3 text-xs flex-1',
					plan.highlighted && 'bg-muted/10',
				)}
			>
				{plan.features.map((feature, index) => (
					<div key={index} className="flex items-start gap-1.5">
						<CheckCircle className="text-foreground h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
						<TooltipProvider>
							<Tooltip delayDuration={0}>
								<TooltipTrigger asChild>
									<p
										className={cn(
											feature.tooltip &&
												'cursor-pointer border-b border-dashed',
										)}
									>
										{feature.text}
									</p>
								</TooltipTrigger>
								{feature.tooltip && (
									<TooltipContent>
										<p>{feature.tooltip}</p>
									</TooltipContent>
								)}
							</Tooltip>
						</TooltipProvider>
					</div>
				))}
			</div>
			{plan.btn && (
				<div
					className={cn(
						'mt-auto w-full border-t p-2.5',
						plan.highlighted && 'bg-muted/40',
					)}
				>
					{plan.highlighted ? (
						<RainbowButton 
              className="w-full" 
              onClick={plan.btn.onClick}
            >
							{plan.btn.text}
						</RainbowButton>
					) : (
						<Button
							className="w-full"
							variant={plan.btn.variant || 'outline'}
              onClick={plan.btn.onClick}
						>
							{plan.btn.text}
						</Button>
					)}
				</div>
			)}
		</div>
	);
}

interface BorderTrailProps {
  className?: string;
  size?: number;
  transition?: any;
  delay?: number;
  onAnimationComplete?: () => void;
  style?: React.CSSProperties;
}

export function BorderTrail({
	className,
	size = 60,
	transition,
	delay,
	onAnimationComplete,
	style,
}: BorderTrailProps) {
	const BASE_TRANSITION = {
		repeat: Infinity,
		duration: 5,
		ease: 'linear',
		repeatType: 'loop' as const,
	};

	return (
		<div className='pointer-events-none absolute inset-0 rounded-[inherit] border-2 border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]'>
			<motion.div
				className={cn('absolute aspect-square will-change-transform', className)}
				style={{
					width: size,
					offsetPath: `rect(0px 100% 100% 0px round 16px)`,
					...style,
				}}
				animate={{
					offsetDistance: ['0%', '100%'],
				}}
				transition={{
					...(transition ?? BASE_TRANSITION),
					delay: delay,
				}}
				onAnimationComplete={onAnimationComplete}
			/>
		</div>
	);
}
