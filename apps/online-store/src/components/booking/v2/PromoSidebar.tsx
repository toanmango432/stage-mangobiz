import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Gift, Star, Clock, Users, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Promo {
  id: string;
  type: 'announcement' | 'promo' | 'info';
  title: string;
  description: string;
  badge?: string;
  cta?: string;
  icon?: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning';
}

interface PromoSidebarProps {
  className?: string;
  onClose?: () => void;
}

const mockPromos: Promo[] = [
  {
    id: '1',
    type: 'promo',
    title: 'New Year Special',
    description: 'Get 20% off all spa services this month. Book now and save!',
    badge: 'Limited Time',
    cta: 'Learn More',
    icon: <Gift className="w-5 h-5" />,
    color: 'primary'
  },
  {
    id: '2',
    type: 'info',
    title: 'Booking Tips',
    description: 'Book early for best availability. Group bookings get priority scheduling.',
    icon: <Users className="w-5 h-5" />,
    color: 'secondary'
  },
  {
    id: '3',
    type: 'announcement',
    title: 'New Services Available',
    description: 'We\'ve added signature facial treatments and premium nail art. Check them out!',
    badge: 'New',
    icon: <Sparkles className="w-5 h-5" />,
    color: 'success'
  }
];

export const PromoSidebar: React.FC<PromoSidebarProps> = ({ className, onClose }) => {
  const getColorClasses = (color: Promo['color'] = 'primary') => {
    switch (color) {
      case 'primary':
        return 'border-primary/20 bg-primary/5';
      case 'secondary':
        return 'border-muted bg-muted/50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-amber-200 bg-amber-50';
      default:
        return 'border-primary/20 bg-primary/5';
    }
  };

  return (
    <div className={cn("w-full max-w-sm space-y-4", className)}>
      {onClose && (
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Current Updates</h3>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
        </div>
      )}
      
      {mockPromos.map((promo) => (
        <Card key={promo.id} className={cn("relative overflow-hidden", getColorClasses(promo.color))}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {promo.icon && (
                <div className="flex-shrink-0 mt-1">
                  {promo.icon}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-sm">{promo.title}</h4>
                  {promo.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {promo.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {promo.description}
                </p>
                {promo.cta && (
                  <Button variant="outline" size="sm" className="text-xs">
                    {promo.cta}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      <Card className="border-dashed border-2 border-muted">
        <CardContent className="p-4 text-center">
          <Star className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <h4 className="font-semibold text-sm mb-1">Need Help?</h4>
          <p className="text-xs text-muted-foreground mb-3">
            Our team is here to help you find the perfect services.
          </p>
          <Button variant="outline" size="sm" className="text-xs">
            Contact Support
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
