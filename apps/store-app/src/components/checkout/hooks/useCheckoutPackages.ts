/**
 * Checkout Packages Hook
 *
 * Provides service packages from the catalog database for checkout.
 * Maps ServicePackage → Checkout Package format.
 */

import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { servicePackagesDB } from '@/db/catalogDatabase';
import type { ServicePackage as CatalogServicePackage } from '@/types';

export interface CheckoutPackageService {
  serviceId: string;
  serviceName: string;
  originalPrice: number;
}

export interface CheckoutPackage {
  id: string;
  name: string;
  description: string;
  services: CheckoutPackageService[];
  packagePrice: number;
  validDays: number;
  category: string;
}

export interface UseCheckoutPackagesResult {
  packages: CheckoutPackage[];
  categories: string[];
  isLoading: boolean;
}

/**
 * Hook to load service packages from the catalog database for checkout.
 * Automatically updates when catalog data changes (via Dexie live query).
 */
export function useCheckoutPackages(storeId: string): UseCheckoutPackagesResult {
  // Load packages from IndexedDB (active only)
  const catalogPackages = useLiveQuery(
    () => storeId ? servicePackagesDB.getAll(storeId, false) : Promise.resolve([]),
    [storeId],
    [] as CatalogServicePackage[]
  );

  // Map CatalogServicePackage → CheckoutPackage format
  const packages = useMemo(() => {
    return catalogPackages.map((pkg): CheckoutPackage => ({
      id: pkg.id,
      name: pkg.name,
      description: pkg.description || '',
      services: pkg.services.map(s => ({
        serviceId: s.serviceId,
        serviceName: s.serviceName,
        originalPrice: s.originalPrice,
      })),
      packagePrice: pkg.packagePrice,
      validDays: pkg.validityDays || 30, // Default to 30 days
      category: 'Packages', // Catalog packages don't have categories, use default
    }));
  }, [catalogPackages]);

  // Extract unique categories
  const categories = useMemo(() => {
    const uniqueCategories = new Set(packages.map(p => p.category));
    return Array.from(uniqueCategories).sort();
  }, [packages]);

  return {
    packages,
    categories,
    isLoading: !catalogPackages || catalogPackages.length === 0,
  };
}

export default useCheckoutPackages;
