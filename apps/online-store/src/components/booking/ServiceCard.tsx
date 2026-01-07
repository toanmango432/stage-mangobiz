import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PriceTag } from './design-system/PriceTag';
import { DurationBadge } from './design-system/DurationBadge';
import { AvailabilityDot } from './design-system/AvailabilityDot';
import { cn } from '@/lib/utils';
import { Service } from '@/types/catalog';
import { Star, Clock, Users, Sparkles } from 'lucide-react';

interface ServiceCardProps {
  service: Service;
  featured?: boolean;
  badge?: 'popular' | 'new' | 'limited' | 'discount';
  discountPercent?: number;
  onSelect: (service: Service) => void;
  layout?: 'grid' | 'list' | 'featured';
  className?: string;
}

export const ServiceCard = ({
  service,
  featured = false,
  badge,
  discountPercent,
  onSelect,
  layout = 'grid',
  className,
}: ServiceCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const getBadgeContent = () => {
    switch (badge) {
      case 'popular':
        return { text: 'Popular', icon: Star, color: 'bg-orange-500' };
      case 'new':
        return { text: 'New', icon: Sparkles, color: 'bg-green-500' };
      case 'limited':
        return { text: 'Limited Time', icon: Clock, color: 'bg-red-500' };
      case 'discount':
        return { text: `${discountPercent}% Off`, icon: null, color: 'bg-purple-500' };
      default:
        return null;
    }
  };

  const badgeContent = getBadgeContent();

  const handleSelect = () => {
    onSelect(service);
  };

  if (layout === 'featured') {
    return (
      <Card 
        className={cn(
          'relative overflow-hidden group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl',
          featured && 'ring-2 ring-primary/20 shadow-lg',
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleSelect}
      >
        {/* Featured Badge */}
        {featured && (
          <div className="absolute top-4 left-4 z-10">
            <Badge className="bg-primary text-primary-foreground font-semibold">
              Featured
            </Badge>
          </div>
        )}

        {/* Service Image */}
        <div className="relative h-48 overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <div className="text-6xl opacity-20">💅</div>
          </div>
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          
          {/* Service Name Overlay */}
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-white font-bold text-xl mb-1">
              {service.name}
            </h3>
            <p className="text-white/80 text-sm line-clamp-2">
              {service.description}
            </p>
          </div>
        </div>

        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <PriceTag 
              price={service.price ?? 0} 
              variant="featured" 
              size="lg"
              animated={isHovered}
            />
            <DurationBadge 
              duration={service.duration ?? 30} 
              variant="highlighted"
            />
          </div>

          <Button 
            className="w-full"
            size="lg"
            onClick={handleSelect}
          >
            Book This Service
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (layout === 'list') {
    return (
      <Card 
        className={cn(
          'group cursor-pointer transition-all duration-200 hover:shadow-md',
          className
        )}
        onClick={handleSelect}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Service Image */}
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
              <div className="text-2xl opacity-60">💅</div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-semibold text-foreground truncate">
                  {service.name}
                </h3>
                {badgeContent && (
                  <Badge className={cn('ml-2 text-xs', badgeContent.color)}>
                    {badgeContent.text}
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {service.description}
              </p>
              
              <div className="flex items-center gap-3">
                <PriceTag price={service.price ?? 0} size="sm" />
                <DurationBadge duration={service.duration ?? 30} size="sm" />
              </div>
            </div>

            {/* Action Button */}
            <Button size="sm" className="flex-shrink-0">
              Select
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default grid layout
  return (
    <Card 
      className={cn(
        'group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg',
        featured && 'ring-2 ring-primary/20 shadow-md',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleSelect}
    >
      {/* Badge */}
      {badgeContent && (
        <div className="absolute top-3 right-3 z-10">
          <Badge className={cn('text-xs font-semibold', badgeContent.color)}>
            {badgeContent.text}
          </Badge>
        </div>
      )}

      {/* Service Image */}
      <div className="relative h-32 overflow-hidden">
        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <div className="text-4xl opacity-30">💅</div>
        </div>
        
        {/* Hover Overlay */}
        <div className={cn(
          'absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity duration-200',
          isHovered ? 'opacity-100' : 'opacity-0'
        )}>
          <Button size="sm" variant="secondary">
            Quick View
          </Button>
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
          {service.name}
        </h3>
        
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {service.description}
        </p>
        
        <div className="flex items-center justify-between">
          <PriceTag 
            price={service.price ?? 0} 
            size="md"
            animated={isHovered}
          />
          <DurationBadge 
            duration={service.duration ?? 30} 
            size="sm"
          />
        </div>
      </CardContent>
    </Card>
  );
};
