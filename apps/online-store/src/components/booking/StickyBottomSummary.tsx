import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookingFormData } from '@/types/booking';
import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface StickyBottomSummaryProps {
  formData: Partial<BookingFormData>;
  onBookNow: () => void;
  isContactComplete?: boolean;
}

export const StickyBottomSummary = ({ formData, onBookNow, isContactComplete = false }: StickyBottomSummaryProps) => {
  const [promoCode, setPromoCode] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const buttonText = isContactComplete ? "REVIEW & CONFIRM" : "BOOK NOW";
  const isDisabled = !isContactComplete;

  const servicePrice = formData.service?.price || 0;
  const addOnsTotal = (formData.addOns || []).reduce((sum, addon) => sum + addon.price, 0);
  const subTotal = servicePrice + addOnsTotal;
  const total = subTotal;

  return (
    <>
      {/* Mobile: Collapsible */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
        <div 
          className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-2xl transition-all duration-300"
          style={{ 
            transform: isExpanded ? 'translateY(0)' : 'translateY(calc(100% - 72px))' 
          }}
        >
          {/* Handle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full py-4 px-5 flex items-center justify-between border-b border-white/10"
          >
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-2xl font-bold">${total.toFixed(2)}</span>
            </div>
            {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
          </button>

          {/* Expanded Content */}
          <div className="p-5 space-y-5">
            <div className="space-y-2">
              {formData.service && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-primary-foreground/90">{formData.service.name}</span>
                  <span className="font-medium">${formData.service.price.toFixed(2)}</span>
                </div>
              )}
              {formData.addOns?.map((addon) => (
                <div key={addon.id} className="flex items-center justify-between text-sm">
                  <span className="text-primary-foreground/90">{addon.name}</span>
                  <span className="font-medium">${addon.price.toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-white/20 pt-2 mt-2 flex items-center justify-between font-semibold">
                <span>Subtotal</span>
                <span>${subTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Input
                placeholder="Promo code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="bg-white/10 text-white placeholder:text-white/60 border-white/20 h-11"
              />
              <Button variant="secondary" size="sm" className="h-11 px-5 shrink-0">
                Apply
              </Button>
            </div>

            <Button
              size="lg"
              className="w-full bg-white text-primary hover:bg-white/90 font-bold text-lg h-14 shadow-lg"
              onClick={onBookNow}
              disabled={isDisabled}
            >
              {buttonText}
            </Button>

            <p className="text-xs text-primary-foreground/70 text-center">
              Final prices reflected at confirmation
            </p>
          </div>
        </div>
      </div>

      {/* Desktop: Fixed Bottom */}
      <div className="hidden lg:block fixed bottom-0 left-0 right-0 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-2xl z-50 backdrop-blur">
        <div className="container max-w-6xl mx-auto px-6 py-6">
          <div className="grid grid-cols-[1fr,auto] gap-12 items-center">
            {/* Left: Breakdown */}
            <div className="space-y-4">
              <div className="space-y-2">
                {formData.service && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-primary-foreground/90">{formData.service.name}</span>
                    <span className="font-medium">${formData.service.price.toFixed(2)}</span>
                  </div>
                )}
                {formData.addOns?.map((addon) => (
                  <div key={addon.id} className="flex items-center justify-between text-sm">
                    <span className="text-primary-foreground/90">{addon.name}</span>
                    <span className="font-medium">${addon.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Input
                  placeholder="Promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="bg-white/10 text-white placeholder:text-white/60 border-white/20 h-10"
                />
                <Button variant="secondary" size="sm" className="shrink-0 h-10 px-6">
                  Apply
                </Button>
              </div>

              <p className="text-xs text-primary-foreground/70 pt-1">
                Final prices reflected at confirmation
              </p>
            </div>

            {/* Right: Total & CTA */}
            <div className="space-y-4 min-w-[320px]">
              <div className="text-center">
                <div className="text-sm text-primary-foreground/80 mb-1">Total Payable at Studio</div>
                <div className="text-4xl font-bold">${total.toFixed(2)}</div>
              </div>

              <Button
                size="lg"
                className="w-full bg-white text-primary hover:bg-white/90 font-bold text-lg h-14 shadow-lg"
                onClick={onBookNow}
                disabled={isDisabled}
              >
                {buttonText}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
