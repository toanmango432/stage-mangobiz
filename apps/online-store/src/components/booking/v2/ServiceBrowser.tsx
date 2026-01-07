import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, Plus, Clock, Star, Sparkles, Users, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Service, CartItem } from './types';
import { generateMockServices } from '@/lib/mockData';
import { PromoSidebar } from './PromoSidebar';
import { StickyActionBar } from './StickyActionBar';

interface ServiceBrowserProps {
  onServiceAdd: (service: Service) => void;
  onServiceRemove?: (serviceId: string) => void;
  cart: CartItem[];
  onContinue: () => void;
  isGroupBooking?: boolean;
  onToggleGroupBooking?: () => void;
}

const categories = [
  { id: 'all', label: 'All Services', icon: '✨' },
  { id: 'hair', label: 'Hair', icon: '💇‍♀️' },
  { id: 'nails', label: 'Nails', icon: '💅' },
  { id: 'spa', label: 'Spa', icon: '🧖‍♀️' },
  { id: 'packages', label: 'Packages', icon: '🎁' },
];

export const ServiceBrowser: React.FC<ServiceBrowserProps> = ({
  onServiceAdd,
  onServiceRemove,
  cart,
  onContinue,
  isGroupBooking = false,
  onToggleGroupBooking,
}) => {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [flyingItem, setFlyingItem] = useState<string | null>(null);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      const mockServices = generateMockServices();
      const servicesWithImages = mockServices.map((service, index) => ({
        id: service.id,
        name: service.name,
        description: service.description,
        price: service.basePrice || service.price,
        duration: service.duration,
        category: service.category?.toLowerCase() || (index < 3 ? 'hair' : index < 6 ? 'nails' : index < 8 ? 'spa' : 'packages'),
        image: service.imageUrl || `/src/assets/${service.name.toLowerCase().replace(/\s+/g, '-')}.jpg`,
        isFeatured: service.featured || index < 2,
        promoBadge: service.badge || (index === 0 ? 'Most Popular' : index === 1 ? 'New' : undefined),
      }));
      setServices(servicesWithImages);
      setLoading(false);
    }, 500);
  }, []);

  const filteredServices = services.filter(service => 
    selectedCategory === 'all' || service.category === selectedCategory
  );

  const featuredServices = services.filter(service => service.isFeatured);
  const regularServices = filteredServices.filter(service => !service.isFeatured);

  const handleAddService = (service: Service) => {
    // Start flying animation
    setFlyingItem(service.id);
    
    // Add service to cart
    onServiceAdd(service);
    
    // Add haptic feedback on mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    // Reset flying animation after delay
    setTimeout(() => {
      setFlyingItem(null);
    }, 600);
  };

  const handleRemoveService = (serviceId: string) => {
    if (onServiceRemove) {
      onServiceRemove(serviceId);
    }
  };

  const isServiceInCart = (serviceId: string) => {
    return cart.some(item => item.service.id === serviceId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header skeleton */}
          <div className="h-16 bg-muted animate-pulse rounded-lg mb-8" />
          
          {/* Featured services skeleton */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {[1, 2].map(i => (
              <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
          
          {/* Services grid skeleton */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-b from-background via-background to-background/80 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="animate-in fade-in slide-in-from-left duration-500">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent mb-1">
                Choose Your Services
              </h1>
              <p className="text-muted-foreground text-sm md:text-base">Build your perfect appointment</p>
            </div>
            
            {/* Group Booking Toggle */}
            {onToggleGroupBooking && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onToggleGroupBooking}
              >
                <Users className="h-4 w-4 mr-2" />
                {isGroupBooking ? 'Single Booking' : 'Group Booking'}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-8">
          <div className="flex-1">
            {/* Category Tabs */}
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
          <TabsList className="grid w-full grid-cols-5">
            {categories.map((category) => (
              <TabsTrigger key={category.id} value={category.id} className="text-sm">
                <span className="mr-2">{category.icon}</span>
                <span className="hidden sm:inline">{category.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Featured Services - Hero Section */}
        {selectedCategory === 'all' && featuredServices.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Featured Services</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {featuredServices.map((service) => (
                <FeaturedServiceCard
                  key={service.id}
                  service={service}
                  onAdd={() => handleAddService(service)}
                  onRemove={() => handleRemoveService(service.id)}
                  isInCart={isServiceInCart(service.id)}
                  isFlying={flyingItem === service.id}
                />
              ))}
            </div>
          </div>
        )}

        {/* Regular Services Grid */}
        <div>
          <h2 className="text-xl font-semibold mb-6">
            {selectedCategory === 'all' ? 'All Services' : categories.find(c => c.id === selectedCategory)?.label}
          </h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {regularServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onAdd={() => handleAddService(service)}
                isInCart={isServiceInCart(service.id)}
                isFlying={flyingItem === service.id}
              />
            ))}
          </div>
          
          {regularServices.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No services found in this category.</p>
            </div>
          )}
        </div>
          </div>
          
          {/* Promo Sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <PromoSidebar />
          </div>
        </div>
      </div>

      {/* Sticky Action Bar */}
      <StickyActionBar
        onAction={onContinue}
        actionText={cart.length > 0 ? `Choose Staff (${cart.length} ${cart.length === 1 ? 'service' : 'services'})` : 'Choose Staff'}
        disabled={cart.length === 0}
      />
    </div>
  );
};

// Featured Service Card Component
const FeaturedServiceCard: React.FC<{
  service: Service;
  onAdd: () => void;
  onRemove: () => void;
  isInCart: boolean;
  isFlying?: boolean;
}> = ({ service, onAdd, onRemove, isInCart, isFlying = false }) => (
  <Card className={cn(
    "group relative overflow-hidden transition-all duration-300 cursor-pointer",
    "hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1",
    "active:scale-[0.98] active:translate-y-0",
    "rounded-2xl border-2",
    isInCart && "border-green-500 bg-green-50/50",
    isFlying && "animate-pulse scale-105 shadow-2xl ring-4 ring-orange-500/50"
  )}>
    <div className="relative h-48 bg-gradient-to-br from-orange-500/20 via-orange-400/10 to-orange-300/5 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      {/* Shine effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      <div className="absolute top-4 left-4">
        {service.promoBadge && (
          <Badge variant="secondary" className="bg-primary text-primary-foreground">
            {service.promoBadge}
          </Badge>
        )}
      </div>
      <div className="absolute bottom-4 left-4 right-4 text-white">
        <h3 className="text-xl font-bold mb-2">{service.name}</h3>
        <p className="text-sm opacity-90 line-clamp-2">{service.description}</p>
      </div>
    </div>
    
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-4">
          <span className="text-2xl font-bold text-primary">${service.price}</span>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-sm">{service.duration} min</span>
          </div>
        </div>
      </div>
      
      {isInCart ? (
        <Button 
          onClick={onRemove}
          variant="outline"
          className="w-full h-12 transition-all duration-300 border-2 border-green-500 text-green-600 hover:bg-green-50 hover:scale-105 active:scale-95 rounded-xl font-semibold"
        >
          <X className="h-4 w-4 mr-2" />
          Remove from Cart
        </Button>
      ) : (
        <Button 
          onClick={onAdd}
          className="w-full h-12 transition-all duration-300 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 hover:scale-105 active:scale-95 rounded-xl font-semibold shadow-lg hover:shadow-xl"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add to Cart
        </Button>
      )}
    </CardContent>
  </Card>
);

// Regular Service Card Component
const ServiceCard: React.FC<{
  service: Service;
  onAdd: () => void;
  isInCart: boolean;
  isFlying?: boolean;
}> = ({ service, onAdd, isInCart, isFlying = false }) => (
  <Card className={cn(
    "group transition-all duration-200 hover:shadow-md",
    isFlying && "animate-pulse scale-105 shadow-lg"
  )}>
    <div className="relative h-32 bg-gradient-to-br from-primary/10 to-primary/5">
      <div className="absolute inset-0 bg-black/10" />
      <div className="absolute top-2 left-2">
        {service.promoBadge && (
          <Badge variant="secondary" className="text-xs">
            {service.promoBadge}
          </Badge>
        )}
      </div>
    </div>
    
    <CardContent className="p-4">
      <h3 className="font-semibold mb-2 line-clamp-1">{service.name}</h3>
      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{service.description}</p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-primary">${service.price}</span>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span className="text-xs">{service.duration}m</span>
          </div>
        </div>
        
        <Button
          size="sm"
          onClick={onAdd}
          className={cn(
            "transition-all duration-200",
            isInCart 
              ? "bg-green-500 hover:bg-green-600" 
              : "bg-primary hover:bg-primary/90"
          )}
        >
          {isInCart ? (
            <Star className="h-4 w-4 fill-current" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </div>
    </CardContent>
  </Card>
);
