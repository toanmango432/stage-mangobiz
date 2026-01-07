import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ServiceCard } from './ServiceCard';
import { ServiceEmptyState } from './design-system/EmptyState';
import { LoadingShimmer, ServiceCardShimmer } from './design-system/LoadingShimmer';
import { Service } from '@/types/catalog';
import { bookingDataService, ServiceFilters } from '@/lib/services/bookingDataService';
import { cn } from '@/lib/utils';
import { Search, Filter, Star, Clock, TrendingUp } from 'lucide-react';

interface ServiceMenuGridProps {
  onServiceSelect: (service: Service) => void;
  selectedService?: Service;
  className?: string;
}

export const ServiceMenuGrid = ({
  onServiceSelect,
  selectedService,
  className,
}: ServiceMenuGridProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [featuredServices, setFeaturedServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('popular');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [showFilters, setShowFilters] = useState(false);

  // Load services on mount
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
        
        // Extract unique categories
        const uniqueCategories = Array.from(new Set(allServices.map(s => s.category)));
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Failed to load services:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadServices();
  }, []);

  // Filter and sort services
  const filteredServices = useMemo(() => {
    let filtered = services;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(service => service.category === selectedCategory);
    }

    // Price range filter
    filtered = filtered.filter(service => 
      service.price >= priceRange[0] && service.price <= priceRange[1]
    );

    // Sort
    switch (sortBy) {
      case 'popular':
        filtered = filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
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
      case 'newest':
        filtered = filtered.sort((a, b) => (b.badge === 'new' ? 1 : 0) - (a.badge === 'new' ? 1 : 0));
        break;
    }

    return filtered;
  }, [services, searchQuery, selectedCategory, priceRange, sortBy]);

  const handleServiceSelect = (service: Service) => {
    onServiceSelect(service);
  };

  const getServiceBadge = (service: Service) => {
    if (service.featured) return 'popular';
    if (service.badge) return service.badge;
    return undefined;
  };

  if (isLoading) {
    return (
      <div className={cn('space-y-6', className)}>
        {/* Featured Section Skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted rounded w-48 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <ServiceCardShimmer key={i} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Services Grid Skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted rounded w-32 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <ServiceCardShimmer key={i} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Sort Dropdown */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Popular
                  </div>
                </SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="duration">Duration</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>

            {/* Filters Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="w-full md:w-auto"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Price Range: ${priceRange[0]} - ${priceRange[1]}
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                    />
                    <span className="text-muted-foreground">to</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Featured Services */}
      {featuredServices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Featured Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  featured
                  badge={getServiceBadge(service)}
                  onSelect={handleServiceSelect}
                  layout="featured"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Services */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Services</span>
            <Badge variant="outline">
              {filteredServices.length} services
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredServices.length === 0 ? (
            <ServiceEmptyState onRefresh={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setPriceRange([0, 500]);
            }} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  badge={getServiceBadge(service)}
                  onSelect={handleServiceSelect}
                  layout="grid"
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};