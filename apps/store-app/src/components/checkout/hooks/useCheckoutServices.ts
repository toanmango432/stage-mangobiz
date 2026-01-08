/**
 * Checkout Services Hook
 *
 * Provides services and categories from the catalog database for checkout.
 * Maps MenuService → Checkout Service format.
 */

import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { menuServicesDB, serviceCategoriesDB } from '@/db/catalogDatabase';
import type { MenuService, ServiceCategory } from '@/types';

export interface CheckoutService {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number;
}

export interface UseCheckoutServicesResult {
  services: CheckoutService[];
  categories: string[];
  isLoading: boolean;
}

/**
 * Hook to load services from the catalog database for checkout.
 * Automatically updates when catalog data changes (via Dexie live query).
 */
export function useCheckoutServices(storeId: string): UseCheckoutServicesResult {
  // Load services from IndexedDB (active only)
  const menuServices = useLiveQuery(
    () => storeId ? menuServicesDB.getAll(storeId, false) : Promise.resolve([]),
    [storeId],
    [] as MenuService[]
  );

  // Load categories from IndexedDB (active only)
  const serviceCategories = useLiveQuery(
    () => storeId ? serviceCategoriesDB.getAll(storeId, false) : Promise.resolve([]),
    [storeId],
    [] as ServiceCategory[]
  );

  // Build category lookup map
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    serviceCategories.forEach(cat => map.set(cat.id, cat.name));
    return map;
  }, [serviceCategories]);

  // Map MenuService → CheckoutService format
  const services = useMemo(() => {
    return menuServices.map((s): CheckoutService => ({
      id: s.id,
      name: s.name,
      category: categoryMap.get(s.categoryId) || 'Uncategorized',
      price: s.price,
      duration: s.duration,
    }));
  }, [menuServices, categoryMap]);

  // Extract unique category names
  const categories = useMemo(() => {
    const uniqueCategories = new Set(services.map(s => s.category));
    return ['All', 'Popular', ...Array.from(uniqueCategories).sort()];
  }, [services]);

  return {
    services,
    categories,
    isLoading: !menuServices || menuServices.length === 0,
  };
}

export default useCheckoutServices;
