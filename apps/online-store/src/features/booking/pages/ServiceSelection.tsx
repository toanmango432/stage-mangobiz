'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, ShoppingBag } from 'lucide-react';
import { ServiceCard } from '../components/ServiceCard';
import { Cart } from '../components/Cart';
import {
  addService,
  removeService,
  setCartOpen,
  nextStep,
} from '../redux/bookingSlice';
import {
  selectServices,
  selectCategories,
  selectSelectedServices,
  selectServiceCount,
  selectCartOpen,
} from '../redux/bookingSelectors';

export const ServiceSelection: React.FC = () => {
  const dispatch = useAppDispatch();
  
  const services = useAppSelector(selectServices);
  const categories = useAppSelector(selectCategories);
  const selectedServices = useAppSelector(selectSelectedServices);
  const serviceCount = useAppSelector(selectServiceCount);
  const cartOpen = useAppSelector(selectCartOpen);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Filter services
  const filteredServices = useMemo(() => {
    let filtered = services;

    // Filter by category
    if (selectedCategoryId) {
      filtered = filtered.filter(s => s.categoryId === selectedCategoryId);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.title.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query) ||
        s.categoryName.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [services, selectedCategoryId, searchQuery]);

  const handleAddService = (service: any) => {
    dispatch(addService(service));
  };

  const handleRemoveService = (serviceId: string) => {
    dispatch(removeService(serviceId));
  };

  const handleCheckout = () => {
    dispatch(setCartOpen(false));
    dispatch(nextStep());
  };

  const isServiceSelected = (serviceId: string) => {
    return selectedServices.some(s => s.id === serviceId);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Select Services</h1>
        <p className="text-muted-foreground">
          Choose the services you'd like to book
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <Badge
            variant={selectedCategoryId === null ? 'default' : 'outline'}
            className="cursor-pointer whitespace-nowrap"
            onClick={() => setSelectedCategoryId(null)}
          >
            All Services
          </Badge>
          {categories.map(category => (
            <Badge
              key={category.id}
              variant={selectedCategoryId === category.id ? 'default' : 'outline'}
              className="cursor-pointer whitespace-nowrap"
              onClick={() => setSelectedCategoryId(category.id)}
            >
              {category.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No services found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
          {filteredServices.map(service => (
            <ServiceCard
              key={service.id}
              service={service}
              isSelected={isServiceSelected(service.id)}
              onAdd={handleAddService}
              onRemove={handleRemoveService}
            />
          ))}
        </div>
      )}

      {/* Floating Cart Button */}
      {serviceCount > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            size="lg"
            className="rounded-full shadow-lg h-14 px-6"
            onClick={() => dispatch(setCartOpen(true))}
          >
            <ShoppingBag className="h-5 w-5 mr-2" />
            View Cart ({serviceCount})
          </Button>
        </div>
      )}

      {/* Cart Drawer */}
      <Cart
        open={cartOpen}
        onClose={() => dispatch(setCartOpen(false))}
        services={selectedServices}
        onRemoveService={handleRemoveService}
        onCheckout={handleCheckout}
      />
    </div>
  );
};
