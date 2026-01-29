/**
 * VariantSelector Component
 *
 * Displays variant options for a service at checkout.
 * Only shown when service.hasVariants is true.
 *
 * @see US-055 - Create VariantSelector component for checkout
 */

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Clock, DollarSign, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MenuServiceWithEmbeddedVariants, EmbeddedVariant } from '@/types';

export interface VariantSelectorProps {
  /** Service with embedded variants */
  service: MenuServiceWithEmbeddedVariants;
  /** Callback when a variant is selected */
  onSelect: (variantId: string, price: number, duration: number) => void;
  /** Optional: initially selected variant ID */
  initialVariantId?: string;
  /** Optional: class name for custom styling */
  className?: string;
}

/**
 * VariantSelector - Displays variant options for a service at checkout.
 *
 * Features:
 * - Pre-selects the default variant (or first variant if no default)
 * - Shows variant name, price, and duration
 * - Highlights selected variant with visual feedback
 * - Calls onSelect when a variant is chosen
 */
export function VariantSelector({
  service,
  onSelect,
  initialVariantId,
  className,
}: VariantSelectorProps) {
  const { variants } = service;

  // Find the default variant or use the first one
  const getDefaultVariantId = useCallback((): string => {
    if (initialVariantId && variants.some(v => v.id === initialVariantId)) {
      return initialVariantId;
    }
    const defaultVariant = variants.find(v => v.isDefault);
    return defaultVariant?.id || variants[0]?.id || '';
  }, [variants, initialVariantId]);

  const [selectedVariantId, setSelectedVariantId] = useState<string>(getDefaultVariantId);

  // Call onSelect with default variant on mount
  useEffect(() => {
    const defaultId = getDefaultVariantId();
    if (defaultId) {
      const variant = variants.find(v => v.id === defaultId);
      if (variant) {
        setSelectedVariantId(defaultId);
        onSelect(variant.id, variant.price, variant.duration);
      }
    }
  }, [getDefaultVariantId, variants, onSelect]);

  const handleVariantChange = (variantId: string) => {
    const variant = variants.find(v => v.id === variantId);
    if (variant) {
      setSelectedVariantId(variantId);
      onSelect(variant.id, variant.price, variant.duration);
    }
  };

  // Don't render if no variants
  if (!variants || variants.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-3', className)}>
      <Label className="text-sm font-medium text-muted-foreground">
        Select Variant
      </Label>

      <RadioGroup
        value={selectedVariantId}
        onValueChange={handleVariantChange}
        className="grid gap-2"
      >
        {variants.map((variant) => (
          <VariantOption
            key={variant.id}
            variant={variant}
            isSelected={selectedVariantId === variant.id}
          />
        ))}
      </RadioGroup>
    </div>
  );
}

/**
 * Individual variant option component
 */
interface VariantOptionProps {
  variant: EmbeddedVariant;
  isSelected: boolean;
}

function VariantOption({ variant, isSelected }: VariantOptionProps) {
  return (
    <Label
      htmlFor={variant.id}
      className={cn(
        'relative cursor-pointer',
        isSelected && 'ring-2 ring-primary ring-offset-2'
      )}
    >
      <Card
        className={cn(
          'flex items-center p-3 transition-colors',
          isSelected
            ? 'border-primary bg-primary/5'
            : 'hover:border-muted-foreground/30'
        )}
      >
        <RadioGroupItem
          value={variant.id}
          id={variant.id}
          className="mr-3"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-sm truncate">
              {variant.name}
            </span>
            {variant.isDefault && (
              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                Default
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {variant.duration}m
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              ${variant.price.toFixed(2)}
            </span>
          </div>
        </div>

        {isSelected && (
          <div className="ml-2">
            <Check className="h-4 w-4 text-primary" />
          </div>
        )}
      </Card>
    </Label>
  );
}

export default VariantSelector;
