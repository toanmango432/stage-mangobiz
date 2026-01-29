import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MobileBottomSheet } from './MobileBottomSheet';
import { ServiceQuickPreview } from './ServiceQuickPreview';
import { Service } from '@/types/catalog';
import { bookingDataService } from '@/lib/services/bookingDataService';
import { cn } from '@/lib/utils';
import { Search, Filter, Star, Clock, ChevronRight, Eye, TrendingUp, Zap } from 'lucide-react';

interface ServiceMenuGridMobileProps {
  onServiceSelect: (service: Service) => void;
  selectedService?: Service;
  className?: string;
  showPreview?: boolean;
}

export const ServiceMenuGridMobile: React.FC<ServiceMenuGridMobileProps> = ({
  onServiceSelect,
  selectedService,
  className,
  showPreview = true,
}) => {
  const [services, setServices] = useState<Service[]>([]);
  const [featuredServices, setFeaturedServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('popular');
  const [showFilters, setShowFilters] = useState(false);
  const [showPreviewSheet, setShowPreviewSheet] = useState(false);
  const [previewService, setPreviewService] = useState<Service | null>(null);

  // Load services
  useEffect(() => {
    const loadServices = async () => {
      setIsLoading(true);
      try {
        const [allServices, featured] = await Promise.all([
          bookingDataService.getServices(),
          bookingDataService.getFeaturedServices(),
        ]);
        
        setServices(allServices);
        setFeaturedServices(featured);
        setFilteredServices(allServices);
      } catch (error) {
        console.error('Failed to load services:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadServices();
  }, []);

  // Filter and sort services
  useEffect(() => {
    let filtered = [...services];

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

    // Sort
    switch (sortBy) {
      case 'popular':
        filtered = filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'price-low':
        filtered = filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered = filtered.sort((a, b) => b.price - a.price);
        break;
      case 'duration':
        filtered = filtered.sort((a, b) => a.duration - b.duration);
        break;
      case 'name':
        filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    setFilteredServices(filtered);
  }, [services, searchQuery, selectedCategory, sortBy]);

  const categories = ['all', ...Array.from(new Set(services.map(s => s.category)))];

  const handleServiceClick = (service: Service) => {
    if (showPreview) {
      setPreviewService(service);
      setShowPreviewSheet(true);
    } else {
      onServiceSelect(service);
    }
  };

  const handleServiceSelect = (service: Service) => {
    onServiceSelect(service);
    setShowPreviewSheet(false);
  };

  const getSortIcon = (sort: string) => {
    switch (sort) {
      case 'popular': return <TrendingUp className="h-4 w-4" />;
      case 'price-low': return <span className="text-xs">$</span>;
      case 'price-high': return <span className="text-xs">$$$</span>;
      case 'duration': return <Clock className="h-4 w-4" />;
      case 'name': return <span className="text-xs">A-Z</span>;
      default: return <TrendingUp className="h-4 w-4" />;
    }
  };

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
    <>
      <div className={cn("space-y-4", className)}>
        {/* Header */}
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Our Services</h2>
            <p className="text-muted-foreground mt-1">
              Choose from our range of professional beauty services
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters Row */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="whitespace-nowrap"
            >
              <Filter className="h-4 w-4 mr-1" />
              Filters
            </Button>
            
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

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">
                  <div className="flex items-center gap-2">
                    {getSortIcon('popular')}
                    Popular
                  </div>
                </SelectItem>
                <SelectItem value="price-low">
                  <div className="flex items-center gap-2">
                    {getSortIcon('price-low')}
                    Price: Low to High
                  </div>
                </SelectItem>
                <SelectItem value="price-high">
                  <div className="flex items-center gap-2">
                    {getSortIcon('price-high')}
                    Price: High to Low
                  </div>
                </SelectItem>
                <SelectItem value="duration">
                  <div className="flex items-center gap-2">
                    {getSortIcon('duration')}
                    Duration
                  </div>
                </SelectItem>
                <SelectItem value="name">
                  <div className="flex items-center gap-2">
                    {getSortIcon('name')}
                    Name
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Featured Services */}
        {featuredServices.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <h3 className="text-lg font-semibold">Featured Services</h3>
            </div>
            <div className="space-y-2">
              {featuredServices.slice(0, 2).map((service) => (
                <Card
                  key={service.id}
                  className="cursor-pointer transition-all duration-200 hover:shadow-lg group border-l-4 border-l-yellow-400"
                  onClick={() => handleServiceClick(service)}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className="w-20 h-20 rounded-lg bg-muted overflow-hidden flex-shrink-0">
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
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-base leading-tight">
                            {service.name}
                          </h3>
                          <div className="flex items-center gap-1">
                            <Badge variant="default" className="text-xs bg-yellow-100 text-yellow-800">
                              Featured
                            </Badge>
                            {showPreview && (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {service.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {service.duration}min
                            </div>
                            {service.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span>{service.rating}</span>
                              </div>
                            )}
                          </div>
                          {service.showPriceOnline ? (
                            <div className="font-bold text-lg">
                              {service.hasVariants ? (
                                <span className="text-sm text-muted-foreground">From ${service.price}</span>
                              ) : (
                                `$${service.price}`
                              )}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground italic">Price on request</div>
                          )}
                        </div>
                        {service.hasVariants && service.variants && service.variants.length > 0 && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            {service.variants.length} variant{service.variants.length > 1 ? 's' : ''} available
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Services */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">All Services</h3>
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
                    "cursor-pointer transition-all duration-200 hover:shadow-lg group",
                    selectedService?.id === service.id
                      ? "ring-2 ring-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  )}
                  onClick={() => handleServiceClick(service)}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-3">
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
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-base leading-tight">
                            {service.name}
                          </h3>
                          <div className="flex items-center gap-1">
                            {showPreview && (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
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
                          {selectedService?.id === service.id && (
                            <Badge variant="default" className="text-xs">
                              Selected
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {service.duration}min
                            </div>
                            {service.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span>{service.rating}</span>
                              </div>
                            )}
                          </div>
                          {service.showPriceOnline ? (
                            <div className="font-bold text-lg">
                              {service.hasVariants ? (
                                <span className="text-sm text-muted-foreground">From ${service.price}</span>
                              ) : (
                                `$${service.price}`
                              )}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground italic">Price on request</div>
                          )}
                        </div>
                        {service.hasVariants && service.variants && service.variants.length > 0 && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            {service.variants.length} variant{service.variants.length > 1 ? 's' : ''} available
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Service Preview Bottom Sheet */}
      <MobileBottomSheet
        isOpen={showPreviewSheet}
        onClose={() => setShowPreviewSheet(false)}
        title="Service Details"
        initialHeight="lg"
      >
        <ServiceQuickPreview
          selectedService={previewService}
          onServiceSelect={handleServiceSelect}
        />
      </MobileBottomSheet>
    </>
  );
};



