import { useState, useEffect, useMemo } from 'react';
import { Service } from '../types/service';
import { db } from '../db/database';

interface ServiceWithAnimation extends Service {
  justAdded?: boolean;
}

interface StaffService {
  staffId: string;
  staffName?: string;
  isRequested?: boolean;
  services: ServiceWithAnimation[];
}

/**
 * Custom hook for service selection and management
 * Handles service loading, filtering, and staff assignment
 */
export function useServiceSelection(salonId: string, isOpen: boolean) {
  const [services, setServices] = useState<ServiceWithAnimation[]>([]);
  const [serviceSearch, setServiceSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [postedStaff, setPostedStaff] = useState<StaffService[]>([]);
  const [activeStaffId, setActiveStaffId] = useState<string | null>(null);
  const [stagingServices, setStagingServices] = useState<ServiceWithAnimation[]>([]);
  const [justAddedService, setJustAddedService] = useState<string | null>(null);

  // Load services when modal opens
  useEffect(() => {
    if (!isOpen || !salonId) return;

    db.services
      .where('salonId')
      .equals(salonId)
      .and((service: Service) => service.isActive !== false)
      .toArray()
      .then(setServices)
      .catch(error => {
        console.error('Error loading services:', error);
        setServices([]);
      });
  }, [isOpen, salonId]);

  // Categories from services
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(services.map(s => s.category).filter(Boolean)));
    return ['All', ...uniqueCategories];
  }, [services]);

  // Filter services
  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesCategory = selectedCategory === 'All' || service.category === selectedCategory;
      const matchesSearch = !serviceSearch ||
        service.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
        service.category?.toLowerCase().includes(serviceSearch.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [services, selectedCategory, serviceSearch]);

  // Add service to staff
  const addServiceToStaff = (staffId: string, staffName: string, service: Service) => {
    const serviceWithTime: ServiceWithAnimation = {
      ...service,
      justAdded: true,
    };

    setPostedStaff(prev => {
      const existingStaff = prev.find(s => s.staffId === staffId);

      if (existingStaff) {
        return prev.map(s =>
          s.staffId === staffId
            ? { ...s, services: [...s.services, serviceWithTime] }
            : s
        );
      } else {
        return [...prev, {
          staffId,
          staffName,
          isRequested: true,
          services: [serviceWithTime]
        }];
      }
    });

    // Animate service addition
    setJustAddedService(service.id);
    setTimeout(() => setJustAddedService(null), 1000);
  };

  // Remove service from staff
  const removeServiceFromStaff = (staffId: string, serviceId: string) => {
    setPostedStaff(prev =>
      prev.map(s =>
        s.staffId === staffId
          ? { ...s, services: s.services.filter(svc => svc.id !== serviceId) }
          : s
      ).filter(s => s.services.length > 0)
    );
  };

  // Clear all services for a staff member
  const clearStaffServices = (staffId: string) => {
    setPostedStaff(prev => prev.filter(s => s.staffId !== staffId));
  };

  // Calculate totals
  const totals = useMemo(() => {
    const allServices = postedStaff.flatMap(s => s.services);
    const duration = allServices.reduce((sum, svc) => sum + (svc.duration || 0), 0);
    const price = allServices.reduce((sum, svc) => sum + (svc.price || 0), 0);

    return {
      duration,
      price,
      serviceCount: allServices.length,
      staffCount: postedStaff.length,
    };
  }, [postedStaff]);

  // Reset selections
  const resetSelections = () => {
    setPostedStaff([]);
    setActiveStaffId(null);
    setStagingServices([]);
    setServiceSearch('');
    setSelectedCategory('All');
  };

  return {
    services,
    serviceSearch,
    setServiceSearch,
    selectedCategory,
    setSelectedCategory,
    categories,
    filteredServices,
    postedStaff,
    setPostedStaff,
    activeStaffId,
    setActiveStaffId,
    stagingServices,
    setStagingServices,
    justAddedService,
    addServiceToStaff,
    removeServiceFromStaff,
    clearStaffServices,
    totals,
    resetSelections,
  };
}