import { cn } from '@/lib/utils';

interface PriceTagProps {
  price: number | undefined;
  currency?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'featured' | 'discount' | 'original';
  discountPercent?: number;
  className?: string;
  animated?: boolean;
}

export const PriceTag = ({
  price,
  currency = '$',
  size = 'md',
  variant = 'default',
  discountPercent,
  className,
  animated = false,
}: PriceTagProps) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  const variantClasses = {
    default: 'text-foreground',
    featured: 'text-primary font-bold',
    discount: 'text-red-600 font-bold',
    original: 'text-muted-foreground line-through',
  };

  const formatPrice = (value: number | undefined) => {
    const safeValue = value ?? 0;
    return `${currency}${safeValue.toFixed(2)}`;
  };

  return (
    <div className={cn(
      'flex items-center gap-1',
      animated && 'transition-all duration-300 ease-out',
      className
    )}>
      <span className={cn(
        'font-semibold',
        sizeClasses[size],
        variantClasses[variant]
      )}>
        {formatPrice(price)}
      </span>
      
      {discountPercent && variant === 'discount' && (
        <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">
          -{discountPercent}%
        </span>
      )}
    </div>
  );
};
