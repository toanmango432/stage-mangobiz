import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Clock, Star, Search, Filter, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { bookingDataService } from '@/lib/services/bookingDataService';
import type { Service } from '@/types/catalog';

interface ServiceQuickPreviewProps {
  selectedService?: Service;
  onServiceSelect: (service: Service) => void;
  className?: string;
}

export const ServiceQuickPreview: React.FC<ServiceQuickPreviewProps> = ({
  selectedService,
  onServiceSelect,
  className,
}) => {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Load services
  useEffect(() => {
    const loadServices = async () => {
      setIsLoading(true);
      try {
        const servicesData = await bookingDataService.getServices();
        setServices(servicesData);
        setFilteredServices(servicesData);
      } catch (error) {
        console.error('Failed to load services:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadServices();
  }, []);

  // Filter services
  useEffect(() => {
    let filtered = services;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(service => service.category === selectedCategory);
    }

    setFilteredServices(filtered);
  }, [services, searchQuery, selectedCategory]);

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(services.map(s => s.category)))];

  const formatPrice = (price: number) => `$${price}`;
  const formatDuration = (duration: number) => `${duration}min`;

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="space-y-2">
          <div className="h-10 bg-muted rounded animate-pulse" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 w-20 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <div className="w-16 h-16 bg-muted rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                    <div className="h-3 bg-muted rounded w-1/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="whitespace-nowrap"
            >
              {category === 'all' ? 'All' : category}
            </Button>
          ))}
        </div>
      </div>

      {/* Services List */}
      <div className="space-y-2">
        {filteredServices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No services found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredServices.map((service) => (
            <Card
              key={service.id}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-md",
                selectedService?.id === service.id
                  ? "ring-2 ring-primary bg-primary/5"
                  : "hover:bg-muted/50"
              )}
              onClick={() => onServiceSelect(service)}
            >
              <CardContent className="p-4">
                <div className="flex gap-3">
                  {/* Service Image */}
                  <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                    {service.image ? (
                      <img
                        src={service.image}
                        alt={service.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <span className="text-xs">No image</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Service Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-base leading-tight">
                        {service.name}
                      </h3>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {service.description}
                    </p>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {service.category}
                      </Badge>
                      {service.isPopular && (
                        <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                          Popular
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDuration(service.duration)}
                      </div>
                      <div className="font-semibold text-foreground">
                        {formatPrice(service.price)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};



