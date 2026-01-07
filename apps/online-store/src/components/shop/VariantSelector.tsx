import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface Variant {
  id: string;
  name: string;
  sku: string;
  price?: number;
  stockQuantity: number;
}

interface VariantSelectorProps {
  variants: Variant[];
  selectedVariant: Variant;
  onVariantChange: (variant: Variant) => void;
}

export const VariantSelector = ({ variants, selectedVariant, onVariantChange }: VariantSelectorProps) => {
  if (variants.length === 0) return null;

  return (
    <div className="space-y-3">
      <Label className="text-base font-semibold">Size</Label>
      <RadioGroup
        value={selectedVariant.id}
        onValueChange={(value) => {
          const variant = variants.find(v => v.id === value);
          if (variant) onVariantChange(variant);
        }}
      >
        <div className="flex flex-wrap gap-2">
          {variants.map((variant) => (
            <div key={variant.id} className="flex items-center">
              <RadioGroupItem
                value={variant.id}
                id={variant.id}
                className="sr-only"
                disabled={variant.stockQuantity === 0}
              />
              <Label
                htmlFor={variant.id}
                className={`cursor-pointer px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
                  selectedVariant.id === variant.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : variant.stockQuantity === 0
                    ? 'border-muted bg-muted text-muted-foreground cursor-not-allowed line-through'
                    : 'border-input hover:border-primary hover:bg-accent'
                }`}
              >
                {variant.name}
              </Label>
            </div>
          ))}
        </div>
      </RadioGroup>
      {selectedVariant.stockQuantity === 0 && (
        <p className="text-sm text-destructive">This size is currently out of stock</p>
      )}
    </div>
  );
};
