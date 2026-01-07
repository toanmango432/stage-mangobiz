import { useQuery } from '@tanstack/react-query';
import { getActivePromotions } from '@/lib/api/promotions';
import { SEO } from '@/components/SEO';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CountdownTimer } from '@/components/promotions/CountdownTimer';
import { Tag, Sparkles, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';

export default function Promotions() {
  const { data: promotions, isLoading, error } = useQuery({
    queryKey: ['promotions', 'active'],
    queryFn: () => getActivePromotions({ status: 'active' }),
  });

  const { applyPromoCode } = useCart();
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const handleApplyOffer = async (code: string, promoId: string) => {
    setApplyingId(promoId);
    
    setTimeout(() => {
      const success = applyPromoCode(code);
      if (success) {
        toast.success('Offer applied at checkout!');
      } else {
        toast.error('Unable to apply offer. Check cart requirements.');
      }
      setApplyingId(null);
    }, 500);
  };

  const getDiscountDisplay = (promo: any) => {
    if (promo.type === 'percent') return `${promo.value}% OFF`;
    if (promo.type === 'fixed') return `$${promo.value} OFF`;
    if (promo.type === 'bogo') return 'Buy One Get One FREE';
    if (promo.type === 'free_shipping') return 'FREE SHIPPING';
    if (promo.type === 'new_client') return `${promo.value}% OFF`;
    if (promo.type === 'bundle') return `${promo.value}% OFF`;
    return 'SPECIAL OFFER';
  };

  return (
    <>
      <SEO 
        title="Current Promotions & Special Offers"
        description="Save on salon services and products with our exclusive promotions and limited-time offers."
      />

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 md:py-12">
          {/* Header */}
          <div className="text-center space-y-3 mb-8">
            <h1 className="text-3xl md:text-4xl font-bold">
              Current Promotions
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Take advantage of our exclusive offers. Applied promotions are automatically used at checkout.
            </p>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="grid gap-6 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <Card className="border-destructive">
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Unable to load promotions. Please try again later.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!isLoading && !error && promotions && promotions.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Promotions</h3>
                <p className="text-muted-foreground">
                  Check back soon for new special offers!
                </p>
              </CardContent>
            </Card>
          )}

          {/* Promotions Grid */}
          {promotions && promotions.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2">
              {promotions.map((promo) => (
                <Card 
                  key={promo.id} 
                  id={`promo-${promo.id}`}
                  className="hover:shadow-lg transition-shadow scroll-mt-20"
                >
                  <CardContent className="p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        {promo.badgeText && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wide">
                            <Sparkles className="h-3 w-3" />
                            {promo.badgeText}
                          </span>
                        )}
                        <div className="text-3xl font-bold text-primary">
                          {getDiscountDisplay(promo)}
                        </div>
                      </div>
                      {promo.endDate && (
                        <CountdownTimer endDate={promo.endDate} />
                      )}
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                      <h2 className="text-xl font-bold">
                        {promo.title}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {promo.description}
                      </p>
                    </div>

                    {/* Conditions */}
                    {promo.conditions && (
                      <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                        {promo.conditions.minPurchase && (
                          <p>• Minimum purchase: ${promo.conditions.minPurchase}</p>
                        )}
                        {promo.conditions.firstTimeOnly && (
                          <p>• First-time customers only</p>
                        )}
                        {promo.conditions.applicableTypes && (
                          <p>• Valid on: {promo.conditions.applicableTypes.join(', ')}</p>
                        )}
                      </div>
                    )}

                    {/* Code & CTA */}
                    <div className="space-y-3 pt-2">
                      {promo.code && (
                        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                          <Tag className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono font-semibold flex-1">
                            {promo.code}
                          </span>
                        </div>
                      )}
                      
                      {promo.code && (
                        <Button 
                          onClick={() => handleApplyOffer(promo.code!, promo.id)}
                          disabled={applyingId === promo.id}
                          className="w-full"
                        >
                          {applyingId === promo.id ? 'Applying...' : 'Apply Offer'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
