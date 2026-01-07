/**
 * React Query hooks for Services
 *
 * Provides data fetching for services catalog with caching and error handling.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { servicesRepository, type Service, type ServiceCategoryRow } from '@/services/supabase/repositories';

// Query key factory for services
export const serviceKeys = {
  all: ['services'] as const,
  lists: () => [...serviceKeys.all, 'list'] as const,
  list: (storeId: string) => [...serviceKeys.lists(), storeId] as const,
  byCategory: (storeId: string) => [...serviceKeys.list(storeId), 'byCategory'] as const,
  details: () => [...serviceKeys.all, 'detail'] as const,
  detail: (id: string) => [...serviceKeys.details(), id] as const,
  search: (storeId: string, query: string) => [...serviceKeys.list(storeId), 'search', query] as const,
  categories: (storeId: string) => [...serviceKeys.all, 'categories', storeId] as const,
};

/**
 * Hook to fetch all online services
 */
export function useServices(storeId: string | undefined) {
  return useQuery({
    queryKey: serviceKeys.list(storeId || ''),
    queryFn: async () => {
      if (!storeId) return [];
      return servicesRepository.setStoreContext(storeId).getOnlineServices();
    },
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch services grouped by category
 */
export function useServicesByCategory(storeId: string | undefined) {
  return useQuery({
    queryKey: serviceKeys.byCategory(storeId || ''),
    queryFn: async () => {
      if (!storeId) return new Map<string, Service[]>();
      return servicesRepository.setStoreContext(storeId).getServicesByCategory();
    },
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    select: (data) => {
      // Convert Map to array of category objects for easier rendering
      return Array.from(data.entries()).map(([categoryName, services]) => ({
        name: categoryName,
        services,
      }));
    },
  });
}

/**
 * Hook to fetch a single service by ID
 */
export function useService(storeId: string | undefined, serviceId: string | undefined) {
  return useQuery({
    queryKey: serviceKeys.detail(serviceId || ''),
    queryFn: async () => {
      if (!storeId || !serviceId) return null;
      return servicesRepository.setStoreContext(storeId).getServiceById(serviceId);
    },
    enabled: !!storeId && !!serviceId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to search services
 */
export function useSearchServices(storeId: string | undefined, query: string) {
  return useQuery({
    queryKey: serviceKeys.search(storeId || '', query),
    queryFn: async () => {
      if (!storeId || !query) return [];
      return servicesRepository.setStoreContext(storeId).searchServices(query);
    },
    enabled: !!storeId && query.length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
  });
}

/**
 * Hook to fetch service categories
 */
export function useServiceCategories(storeId: string | undefined) {
  return useQuery({
    queryKey: serviceKeys.categories(storeId || ''),
    queryFn: async () => {
      if (!storeId) return [];
      return servicesRepository.setStoreContext(storeId).getCategories();
    },
    enabled: !!storeId,
    staleTime: 10 * 60 * 1000, // 10 minutes for categories
  });
}

/**
 * Hook to prefetch service data
 */
export function usePrefetchService(storeId: string | undefined) {
  const queryClient = useQueryClient();

  return (serviceId: string) => {
    if (!storeId) return;
    queryClient.prefetchQuery({
      queryKey: serviceKeys.detail(serviceId),
      queryFn: () => servicesRepository.setStoreContext(storeId).getServiceById(serviceId),
      staleTime: 5 * 60 * 1000,
    });
  };
}
