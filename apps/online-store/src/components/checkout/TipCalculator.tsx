import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign } from 'lucide-react';

interface TipCalculatorProps {
  subtotal: number;
  onTipChange: (tip: number) => void;
  selectedTip: number;
}

export const TipCalculator = ({ subtotal, onTipChange, selectedTip }: TipCalculatorProps) => {
  const [customTip, setCustomTip] = useState('');
  const [activeOption, setActiveOption] = useState<string>('');

  const tipOptions = [
    { label: '15%', value: 0.15 },
    { label: '18%', value: 0.18 },
    { label: '20%', value: 0.20 },
    { label: '25%', value: 0.25 },
  ];

  const handleTipSelect = (percentage: number, label: string) => {
    const tip = subtotal * percentage;
    onTipChange(tip);
    setActiveOption(label);
    setCustomTip('');
  };

  const handleCustomTip = (value: string) => {
    setCustomTip(value);
    const tip = parseFloat(value) || 0;
    onTipChange(tip);
    setActiveOption('custom');
  };

  return (
    <div className="space-y-4 p-4 rounded-lg border bg-card">
      <div className="flex items-center gap-2">
        <DollarSign className="h-5 w-5 text-primary" />
        <Label className="text-base font-semibold">Add a Tip for Your Stylist (Optional)</Label>
      </div>
      
      <div className="grid grid-cols-4 gap-2">
        {tipOptions.map(option => (
          <Button
            key={option.label}
            variant={activeOption === option.label ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleTipSelect(option.value, option.label)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="custom-tip">Custom Amount</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          <Input
            id="custom-tip"
            type="number"
            placeholder="0.00"
            value={customTip}
            onChange={(e) => handleCustomTip(e.target.value)}
            className="pl-7"
            step="0.01"
            min="0"
          />
        </div>
      </div>

      {selectedTip > 0 && (
        <div className="pt-3 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tip Amount:</span>
            <span className="font-semibold text-primary">${selectedTip.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
};
