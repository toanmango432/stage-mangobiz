import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Promotion } from '@/types/promotion';
import { CountdownTimer } from './CountdownTimer';
import { Tag, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';
import { Link } from 'react-router-dom';

interface PromotionBannerProps {
  promotion: Promotion;
}

export const PromotionBanner = ({ promotion }: PromotionBannerProps) => {
  const [isApplying, setIsApplying] = useState(false);
  const { applyPromoCode } = useCart();

  const handleApplyNow = async () => {
    if (!promotion.code) {
      toast.error('This promotion cannot be applied directly');
      return;
    }

    setIsApplying(true);
    
    // Simulate API call
    setTimeout(() => {
      const success = applyPromoCode(promotion.code!);
      if (success) {
        toast.success('Offer applied at checkout!');
      } else {
        toast.error('Unable to apply offer. Check cart requirements.');
      }
      setIsApplying(false);
    }, 500);
  };

  return (
    <Card className="relative overflow-hidden border-2 shadow-lg animate-fade-in">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />
      
      <div className="relative p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Content */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              {promotion.badgeText && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wide">
                  <Sparkles className="h-3 w-3" />
                  {promotion.badgeText}
                </span>
              )}
            </div>
            
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              {promotion.title}
            </h2>
            
            <p className="text-muted-foreground text-sm md:text-base max-w-2xl">
              {promotion.description}
            </p>

            {promotion.code && (
              <div className="flex items-center gap-2 text-sm">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono font-semibold text-primary">
                  {promotion.code}
                </span>
              </div>
            )}
          </div>

          {/* Actions & Timer */}
          <div className="flex flex-col items-start md:items-end gap-4 w-full md:w-auto">
            {promotion.endDate && (
              <CountdownTimer endDate={promotion.endDate} />
            )}
            
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Button variant="outline" asChild className="w-full sm:w-auto">
                <Link to="/promotions">View Offer</Link>
              </Button>
              {promotion.code && (
                <Button 
                  onClick={handleApplyNow}
                  disabled={isApplying}
                  className="w-full sm:w-auto"
                >
                  {isApplying ? 'Applying...' : 'Apply Now'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
