/**
 * SummarySection Component
 *
 * Displays ticket totals including subtotal, tax, discount, tip, and grand total.
 * Provides quick actions for applying discounts and tips.
 *
 * Target: <300 lines
 * Current: Placeholder - to be extracted from main TicketPanel
 */

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tag, Percent, DollarSign, Gift } from 'lucide-react';
import { DISCOUNT_PRESETS, TIP_PRESETS } from '../constants';
import type { SummarySectionProps, TicketDiscount } from '../types';

export default function SummarySection({
  subtotal,
  tax,
  discount,
  tip,
  total,
  onApplyDiscount,
  onRemoveDiscount,
  onAddTip,
}: SummarySectionProps) {
  const [showDiscountForm, setShowDiscountForm] = useState(false);
  const [showTipForm, setShowTipForm] = useState(false);
  const [customDiscount, setCustomDiscount] = useState('');
  const [customTip, setCustomTip] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleApplyPresetDiscount = (preset: typeof DISCOUNT_PRESETS[number]) => {
    onApplyDiscount({
      type: preset.type,
      amount: preset.value,
      reason: `${preset.label} discount`,
    });
    setShowDiscountForm(false);
  };

  const handleApplyCustomDiscount = () => {
    const amount = parseFloat(customDiscount);
    if (!isNaN(amount) && amount > 0) {
      onApplyDiscount({
        type: discountType,
        amount,
        reason: 'Custom discount',
      });
      setCustomDiscount('');
      setShowDiscountForm(false);
    }
  };

  const handleApplyPresetTip = (percentage: number) => {
    const tipAmount = (subtotal - discount) * (percentage / 100);
    onAddTip(Math.round(tipAmount * 100) / 100);
    setShowTipForm(false);
  };

  const handleApplyCustomTip = () => {
    const amount = parseFloat(customTip);
    if (!isNaN(amount) && amount >= 0) {
      onAddTip(amount);
      setCustomTip('');
      setShowTipForm(false);
    }
  };

  const grandTotal = total + tip;

  return (
    <div className="border-t bg-muted/30 p-4 space-y-2" data-testid="summary-section">
      {/* Subtotal */}
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>

      {/* Discount */}
      <div className="flex justify-between text-sm items-center">
        <span className="text-muted-foreground flex items-center gap-1">
          <Tag className="h-3 w-3" />
          Discount
        </span>
        {discount > 0 ? (
          <div className="flex items-center gap-2">
            <span className="text-green-600">-{formatCurrency(discount)}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemoveDiscount}
              className="h-6 px-2 text-xs"
            >
              Remove
            </Button>
          </div>
        ) : (
          <Popover open={showDiscountForm} onOpenChange={setShowDiscountForm}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                Add
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="end">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Quick Discount</h4>
                <div className="grid grid-cols-3 gap-2">
                  {DISCOUNT_PRESETS.map((preset) => (
                    <Button
                      key={preset.label}
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyPresetDiscount(preset)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      variant={discountType === 'percentage' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDiscountType('percentage')}
                    >
                      <Percent className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={discountType === 'fixed' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDiscountType('fixed')}
                    >
                      <DollarSign className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={customDiscount}
                      onChange={(e) => setCustomDiscount(e.target.value)}
                      className="h-8"
                    />
                    <Button size="sm" onClick={handleApplyCustomDiscount}>
                      Apply
                    </Button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Tax */}
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Tax</span>
        <span>{formatCurrency(tax)}</span>
      </div>

      {/* Tip */}
      <div className="flex justify-between text-sm items-center">
        <span className="text-muted-foreground flex items-center gap-1">
          <Gift className="h-3 w-3" />
          Tip
        </span>
        {tip > 0 ? (
          <div className="flex items-center gap-2">
            <span>{formatCurrency(tip)}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddTip(0)}
              className="h-6 px-2 text-xs"
            >
              Remove
            </Button>
          </div>
        ) : (
          <Popover open={showTipForm} onOpenChange={setShowTipForm}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                Add
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="end">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Add Tip</h4>
                <div className="grid grid-cols-4 gap-2">
                  {TIP_PRESETS.map((percentage) => (
                    <Button
                      key={percentage}
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyPresetTip(percentage)}
                    >
                      {percentage}%
                    </Button>
                  ))}
                </div>
                <Separator />
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Custom amount"
                    value={customTip}
                    onChange={(e) => setCustomTip(e.target.value)}
                    className="h-8"
                  />
                  <Button size="sm" onClick={handleApplyCustomTip}>
                    Add
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      <Separator />

      {/* Grand Total */}
      <div className="flex justify-between font-bold text-lg">
        <span>Total</span>
        <span>{formatCurrency(grandTotal)}</span>
      </div>
    </div>
  );
}
