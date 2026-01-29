/**
 * Checkout Services Hook
 *
 * Provides services, categories, variants, and add-ons from the catalog database for checkout.
 * Returns MenuServiceWithEmbeddedVariants[] with variants embedded and optional staff overrides applied.
 */

import { useMemo, useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { menuServicesDB, serviceCategoriesDB, serviceVariantsDB } from '@/db/catalogDatabase';
import {
  serviceVariantsService,
  staffServiceAssignmentsService,
  addOnGroupsService,
  addOnOptionsService,
} from '@/services/domain/catalogDataService';
import type {
  MenuService,
  ServiceCategory,
  ServiceVariant,
  MenuServiceWithEmbeddedVariants,
  EmbeddedVariant,
  StaffServiceAssignment,
  AddOnGroup,
  AddOnOption,
} from '@/types';
import { toEmbeddedVariant } from '@/types/catalog';

/**
 * Checkout service with full variant and add-on support
 */
export interface CheckoutServiceWithVariants extends MenuServiceWithEmbeddedVariants {
  /** Category name (resolved from categoryId) - alias for backwards compatibility */
  category: string;
  /** Category name (resolved from categoryId) */
  categoryName: string;
  /** Price after staff override (if applicable) */
  effectivePrice: number;
  /** Duration after staff override (if applicable) */
  effectiveDuration: number;
  /** Whether this service has a staff price/duration override */
  hasStaffOverride: boolean;
}

/**
 * Add-on group with options for checkout display
 */
export interface CheckoutAddOnGroup extends AddOnGroup {
  options: AddOnOption[];
}

export interface UseCheckoutServicesOptions {
  /** Staff ID to apply price/duration overrides (optional) */
  staffId?: string;
  /** Whether to include archived services (default: false) */
  includeArchived?: boolean;
}

export interface UseCheckoutServicesResult {
  /** Services with embedded variants and staff overrides applied */
  services: CheckoutServiceWithVariants[];
  /** Unique category names */
  categories: string[];
  /** Add-on groups with options, keyed by service ID */
  addOnGroupsByService: Map<string, CheckoutAddOnGroup[]>;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
}

/**
 * Hook to load services with variants and add-ons for checkout.
 *
 * Features:
 * - Loads services with embedded variants for variant selection
 * - Loads applicable add-on groups per service
 * - Applies staff price/duration overrides when staffId is provided
 * - Automatically updates when catalog data changes (via Dexie live query)
 *
 * @param storeId - Store ID to load services for
 * @param options - Optional configuration (staffId for overrides)
 */
export function useCheckoutServices(
  storeId: string,
  options: UseCheckoutServicesOptions = {}
): UseCheckoutServicesResult {
  const { staffId, includeArchived = false } = options;

  // State for async data
  const [variantsByService, setVariantsByService] = useState<Map<string, ServiceVariant[]>>(new Map());
  const [staffAssignments, setStaffAssignments] = useState<StaffServiceAssignment[]>([]);
  const [addOnGroupsByService, setAddOnGroupsByService] = useState<Map<string, CheckoutAddOnGroup[]>>(new Map());
  const [isLoadingExtras, setIsLoadingExtras] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Load services from IndexedDB (active only)
  const menuServices = useLiveQuery(
    () => storeId ? menuServicesDB.getAll(storeId, includeArchived) : Promise.resolve([]),
    [storeId, includeArchived],
    [] as MenuService[]
  );

  // Load categories from IndexedDB (active only)
  const serviceCategories = useLiveQuery(
    () => storeId ? serviceCategoriesDB.getAll(storeId, false) : Promise.resolve([]),
    [storeId],
    [] as ServiceCategory[]
  );

  // Load variants for all services that have variants
  useEffect(() => {
    if (!menuServices || menuServices.length === 0) return;

    const loadVariants = async () => {
      try {
        const servicesWithVariants = menuServices.filter(s => s.hasVariants);
        if (servicesWithVariants.length === 0) {
          setVariantsByService(new Map());
          return;
        }

        const variantPromises = servicesWithVariants.map(async (service) => {
          const variants = await serviceVariantsService.getByService(service.id);
          return { serviceId: service.id, variants };
        });

        const results = await Promise.all(variantPromises);
        const newMap = new Map<string, ServiceVariant[]>();
        results.forEach(({ serviceId, variants }) => {
          newMap.set(serviceId, variants);
        });
        setVariantsByService(newMap);
      } catch (err) {
        console.error('Failed to load service variants:', err);
        setError(err instanceof Error ? err : new Error('Failed to load variants'));
      }
    };

    loadVariants();
  }, [menuServices]);

  // Load staff assignments when staffId is provided
  useEffect(() => {
    if (!storeId || !staffId) {
      setStaffAssignments([]);
      return;
    }

    const loadAssignments = async () => {
      try {
        const assignments = await staffServiceAssignmentsService.getByStaff(storeId, staffId, false);
        setStaffAssignments(assignments);
      } catch (err) {
        console.error('Failed to load staff assignments:', err);
        // Don't set error for staff assignments - just proceed without overrides
      }
    };

    loadAssignments();
  }, [storeId, staffId]);

  // Load add-on groups for all services
  useEffect(() => {
    if (!storeId || !menuServices || menuServices.length === 0) {
      setAddOnGroupsByService(new Map());
      return;
    }

    const loadAddOns = async () => {
      setIsLoadingExtras(true);
      try {
        const addOnPromises = menuServices.map(async (service) => {
          // Get applicable add-on groups for this service
          const groups = await addOnGroupsService.getForService(storeId, service.id, service.categoryId);

          // Load options for each group
          const groupsWithOptions = await Promise.all(
            groups.map(async (group): Promise<CheckoutAddOnGroup> => {
              const options = await addOnOptionsService.getByGroup(group.id);
              return { ...group, options };
            })
          );

          return { serviceId: service.id, groups: groupsWithOptions };
        });

        const results = await Promise.all(addOnPromises);
        const newMap = new Map<string, CheckoutAddOnGroup[]>();
        results.forEach(({ serviceId, groups }) => {
          if (groups.length > 0) {
            newMap.set(serviceId, groups);
          }
        });
        setAddOnGroupsByService(newMap);
      } catch (err) {
        console.error('Failed to load add-on groups:', err);
        // Don't set error for add-ons - checkout can proceed without them
      } finally {
        setIsLoadingExtras(false);
      }
    };

    loadAddOns();
  }, [storeId, menuServices]);

  // Build category lookup map
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    serviceCategories.forEach(cat => map.set(cat.id, cat.name));
    return map;
  }, [serviceCategories]);

  // Build staff assignment lookup map
  const staffAssignmentMap = useMemo(() => {
    const map = new Map<string, StaffServiceAssignment>();
    staffAssignments.forEach(a => map.set(a.serviceId, a));
    return map;
  }, [staffAssignments]);

  // Map MenuService → CheckoutServiceWithVariants with embedded variants and staff overrides
  const services = useMemo(() => {
    return menuServices.map((s): CheckoutServiceWithVariants => {
      // Get variants for this service
      const serviceVariants = variantsByService.get(s.id) || [];
      const embeddedVariants: EmbeddedVariant[] = serviceVariants.map(toEmbeddedVariant);

      // Check for staff override
      const assignment = staffAssignmentMap.get(s.id);
      const hasStaffOverride = !!assignment && (
        assignment.customPrice !== undefined ||
        assignment.customDuration !== undefined
      );

      // Apply staff overrides if available
      const effectivePrice = assignment?.customPrice ?? s.price;
      const effectiveDuration = assignment?.customDuration ?? s.duration;

      const categoryName = categoryMap.get(s.categoryId) || 'Uncategorized';

      return {
        ...s,
        hasVariants: serviceVariants.length > 0,
        variants: embeddedVariants,
        category: categoryName, // Backwards compatibility alias
        categoryName,
        effectivePrice,
        effectiveDuration,
        hasStaffOverride,
        processingTime: s.extraTime, // Map extraTime to processingTime for UI compatibility
        assignedStaffIds: [], // Would need to load from assignments if needed
      };
    });
  }, [menuServices, variantsByService, categoryMap, staffAssignmentMap]);

  // Extract unique category names
  const categories = useMemo(() => {
    const uniqueCategories = new Set(services.map(s => s.categoryName));
    return ['All', 'Popular', ...Array.from(uniqueCategories).sort()];
  }, [services]);

  // Determine loading state
  const isLoading = !menuServices || menuServices.length === 0 || isLoadingExtras;

  return {
    services,
    categories,
    addOnGroupsByService,
    isLoading,
    error,
  };
}

/**
 * Legacy hook interface for backwards compatibility
 * @deprecated Use useCheckoutServices with options instead
 */
export interface CheckoutService {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number;
}

export interface UseCheckoutServicesLegacyResult {
  services: CheckoutService[];
  categories: string[];
  isLoading: boolean;
}

/**
 * Legacy hook for simple checkout service loading (backwards compatible)
 */
export function useCheckoutServicesLegacy(storeId: string): UseCheckoutServicesLegacyResult {
  const { services, categories, isLoading } = useCheckoutServices(storeId);

  const legacyServices = useMemo(() => {
    return services.map((s): CheckoutService => ({
      id: s.id,
      name: s.name,
      category: s.categoryName,
      price: s.effectivePrice,
      duration: s.effectiveDuration,
    }));
  }, [services]);

  return {
    services: legacyServices,
    categories,
    isLoading,
  };
}

export default useCheckoutServices;
