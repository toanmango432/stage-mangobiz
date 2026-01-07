import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Truck, Zap, Clock } from 'lucide-react';

export interface ShippingMethod {
  id: string;
  name: string;
  price: number;
  estimatedDays: string;
  description: string;
}

interface ShippingMethodSelectorProps {
  methods: ShippingMethod[];
  selectedMethod: string;
  onMethodChange: (methodId: string) => void;
}

export const ShippingMethodSelector = ({
  methods,
  selectedMethod,
  onMethodChange,
}: ShippingMethodSelectorProps) => {
  const getIcon = (methodId: string) => {
    if (methodId === 'standard') return Truck;
    if (methodId === 'express') return Zap;
    return Clock;
  };

  return (
    <div className="space-y-3">
      <Label className="text-base font-semibold">Shipping Method</Label>
      <RadioGroup value={selectedMethod} onValueChange={onMethodChange}>
        {methods.map(method => {
          const Icon = getIcon(method.id);
          return (
            <div
              key={method.id}
              className={`relative flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                selectedMethod === method.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => onMethodChange(method.id)}
            >
              <RadioGroupItem value={method.id} id={method.id} className="mt-1" />
              <div className="flex-1">
                <Label htmlFor={method.id} className="flex items-center gap-2 cursor-pointer">
                  <Icon className="h-5 w-5 text-primary" />
                  <span className="font-semibold">{method.name}</span>
                  <Badge variant="secondary" className="ml-auto">
                    {method.price === 0 ? 'FREE' : `$${method.price.toFixed(2)}`}
                  </Badge>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {method.description} • Arrives in {method.estimatedDays}
                </p>
              </div>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
};
