import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Promotion } from '@/types/promotion';
import { CountdownTimer } from './CountdownTimer';
import { Tag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface PromotionsStripProps {
  promotions: Promotion[];
}

export const PromotionsStrip = ({ promotions }: PromotionsStripProps) => {
  if (promotions.length === 0) return null;

  const getDiscountDisplay = (promo: Promotion) => {
    if (promo.type === 'percent') return `${promo.value}% OFF`;
    if (promo.type === 'fixed') return `$${promo.value} OFF`;
    if (promo.type === 'bogo') return 'BOGO';
    if (promo.type === 'free_shipping') return 'FREE SHIPPING';
    return 'SPECIAL OFFER';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Special Offers</h2>
          <p className="text-sm text-muted-foreground">Limited time promotions</p>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/promotions" className="gap-1">
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4">
          {promotions.map((promo) => (
            <Card 
              key={promo.id} 
              className="flex-shrink-0 w-[280px] md:w-[320px] hover:shadow-lg transition-shadow"
              id={`promo-${promo.id}`}
            >
              <CardContent className="p-4 space-y-3">
                {/* Badge & Timer */}
                <div className="flex items-start justify-between gap-2">
                  {promo.badgeText && (
                    <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-primary text-primary-foreground">
                      {promo.badgeText}
                    </span>
                  )}
                  {promo.endDate && (
                    <CountdownTimer endDate={promo.endDate} compact />
                  )}
                </div>

                {/* Discount Display */}
                <div className="text-3xl font-bold text-primary">
                  {getDiscountDisplay(promo)}
                </div>

                {/* Title & Description */}
                <div className="space-y-1">
                  <h3 className="font-semibold text-base line-clamp-2">
                    {promo.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {promo.description}
                  </p>
                </div>

                {/* Code */}
                {promo.code && (
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Tag className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-mono font-semibold">
                      {promo.code}
                    </span>
                  </div>
                )}

                {/* CTA */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  asChild
                >
                  <Link to={`/promotions#promo-${promo.id}`}>
                    Details
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};
