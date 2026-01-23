# Catalog Module - Integration Guide

## Table of Contents
- [Integration with Other Modules](#integration-with-other-modules)
- [Component Integration Patterns](#component-integration-patterns)
- [Redux Integration (Legacy)](#redux-integration-legacy)
- [Dexie Live Queries (Recommended)](#dexie-live-queries-recommended)
- [Checkout Integration](#checkout-integration)
- [Book Module Integration](#book-module-integration)
- [Front Desk Integration](#front-desk-integration)
- [External Systems](#external-systems)

---

## Integration with Other Modules

### Module Dependencies

```
┌─────────────────────────────────────────────────────────────────┐
│                        CATALOG MODULE                            │
│  (Service menu, pricing, variants, packages, add-ons)           │
└─────────────────────────────────────────────────────────────────┘
                         ↓ provides to ↓
┌─────────────┐  ┌──────────────┐  ┌─────────────┐  ┌────────────┐
│    BOOK     │  │  FRONT DESK  │  │  CHECKOUT   │  │   STAFF    │
│  (Calendar) │  │  (Tickets)   │  │  (Payment)  │  │ (Timesheet)│
└─────────────┘  └──────────────┘  └─────────────┘  └────────────┘
```

**Catalog provides to other modules:**
- Service definitions (name, price, duration)
- Service variants (different pricing/duration options)
- Service packages (bundled services)
- Add-on options (service customization)
- Staff service permissions (who can perform what)
- Category organization (service hierarchy)

**Other modules consume:**
- Book module: Service duration for scheduling
- Front Desk: Service pricing for tickets
- Checkout: Service pricing, packages, add-ons
- Staff: Service assignments for permissions

---

## Component Integration Patterns

### Using catalogDataService

**Recommended pattern for all components:**

```typescript
import { serviceCategoriesService, menuServicesService } from '@/services/domain/catalogDataService';

export function ServiceSelector({ onSelect }: Props) {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<MenuService[]>([]);
  const [loading, setLoading] = useState(true);
  const storeId = useAppSelector(state => state.auth.storeId);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [cats, svcs] = await Promise.all([
          serviceCategoriesService.getAll(storeId, false),
          menuServicesService.getAll(storeId, false),
        ]);
        setCategories(cats);
        setServices(svcs);
      } catch (error) {
        console.error('Failed to load catalog:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [storeId]);

  // Render categories and services
}
```

### Filtering Services by Category

```typescript
export function CategoryServiceList({ categoryId }: Props) {
  const [services, setServices] = useState<MenuService[]>([]);
  const storeId = useAppSelector(state => state.auth.storeId);

  useEffect(() => {
    async function loadServices() {
      const svcs = await menuServicesService.getByCategoryId(storeId, categoryId);
      setServices(svcs);
    }
    loadServices();
  }, [storeId, categoryId]);

  return (
    <div>
      {services.map(service => (
        <ServiceCard key={service.id} service={service} />
      ))}
    </div>
  );
}
```

### Loading Service with Variants

```typescript
export function ServiceDetailModal({ serviceId }: Props) {
  const [service, setService] = useState<ServiceWithVariants | null>(null);

  useEffect(() => {
    async function loadService() {
      const svc = await menuServicesDB.getWithVariants(serviceId);
      setService(svc);
    }
    loadService();
  }, [serviceId]);

  if (!service) return <Spinner />;

  return (
    <Modal>
      <h2>{service.name}</h2>
      <p>{service.description}</p>

      {service.variants.length > 0 && (
        <div>
          <h3>Variants</h3>
          {service.variants.map(variant => (
            <div key={variant.id}>
              <span>{variant.name}</span>
              <span>${variant.price}</span>
              <span>{variant.duration} min</span>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
```

---

## Redux Integration (Legacy)

**⚠️ DEPRECATED:** The catalog Redux slice is being phased out in favor of Dexie live queries.

**If you must use Redux (during migration):**

```typescript
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchCategories,
  fetchServices,
  selectCategories,
  selectServices,
} from '@/store/slices/catalogSlice';

export function LegacyCatalogComponent() {
  const dispatch = useAppDispatch();
  const categories = useAppSelector(selectCategories);
  const services = useAppSelector(selectServices);
  const storeId = useAppSelector(state => state.auth.storeId);

  useEffect(() => {
    dispatch(fetchCategories({ storeId, includeInactive: false }));
    dispatch(fetchServices({ storeId, includeInactive: false }));
  }, [dispatch, storeId]);

  // Render using Redux state
}
```

**Migration path:**
1. Replace Redux thunks with direct `catalogDataService` calls
2. Replace `useAppSelector` with local state or live queries
3. Remove Redux dependency from component

---

## Dexie Live Queries (Recommended)

**Use live queries for automatic reactivity:**

```typescript
import { useLiveQuery } from 'dexie-react-hooks';
import { serviceCategoriesDB, menuServicesDB } from '@/db/catalogDatabase';

export function CatalogBrowser() {
  const storeId = useAppSelector(state => state.auth.storeId);

  // Live queries - auto-update when data changes
  const categories = useLiveQuery(
    () => serviceCategoriesDB.getAll(storeId, false),
    [storeId]
  );

  const services = useLiveQuery(
    () => menuServicesDB.getAll(storeId, false),
    [storeId]
  );

  if (!categories || !services) {
    return <Spinner />;
  }

  return (
    <div>
      {categories.map(cat => (
        <CategorySection key={cat.id} category={cat}>
          {services
            .filter(s => s.categoryId === cat.id)
            .map(service => (
              <ServiceCard key={service.id} service={service} />
            ))}
        </CategorySection>
      ))}
    </div>
  );
}
```

**Benefits:**
- Component auto-updates when data changes in IndexedDB
- No manual state management
- Works across tabs (via BroadcastChannel)
- Less boilerplate than Redux

---

## Checkout Integration

### Loading Service for Checkout

```typescript
import { menuServicesService, serviceVariantsService } from '@/services/domain/catalogDataService';

export async function addServiceToCheckout(
  serviceId: string,
  variantId?: string
): Promise<CheckoutLineItem> {
  // 1. Load service
  const service = await menuServicesService.getById(serviceId);
  if (!service) {
    throw new Error('Service not found');
  }

  // 2. Load variant if specified
  let variant: ServiceVariant | undefined;
  if (variantId) {
    variant = await serviceVariantsService.getById(variantId);
    if (!variant) {
      throw new Error('Variant not found');
    }
  }

  // 3. Build checkout line item
  return {
    id: uuidv4(),
    type: 'service',
    serviceId: service.id,
    variantId: variant?.id,
    name: variant ? `${service.name} (${variant.name})` : service.name,
    price: variant?.price ?? service.price,
    duration: variant?.duration ?? service.duration,
    quantity: 1,
    taxable: service.taxable,
    taxRate: service.taxable ? catalogSettings.defaultTaxRate : 0,
  };
}
```

### Loading Add-ons for Service

```typescript
import { addOnGroupsService } from '@/services/domain/catalogDataService';

export async function getAddOnsForService(
  serviceId: string,
  categoryId: string
): Promise<AddOnGroupWithOptions[]> {
  const storeId = getStoreId();

  // Get applicable add-on groups with options
  const groups = await addOnGroupsDB.getForService(storeId, serviceId, categoryId);

  // Filter by online booking if needed
  return groups.filter(g => g.onlineBookingEnabled);
}
```

### Calculating Package Price

```typescript
import { servicePackagesService, menuServicesService } from '@/services/domain/catalogDataService';

export async function calculatePackagePrice(
  packageId: string
): Promise<{ originalPrice: number; packagePrice: number; savings: number }> {
  const pkg = await servicePackagesService.getById(packageId);
  if (!pkg) {
    throw new Error('Package not found');
  }

  // Calculate total from individual services
  let originalPrice = 0;
  for (const item of pkg.services) {
    const service = await menuServicesService.getById(item.serviceId);
    if (service) {
      originalPrice += service.price * item.quantity;
    }
  }

  return {
    originalPrice,
    packagePrice: pkg.packagePrice,
    savings: originalPrice - pkg.packagePrice,
  };
}
```

---

## Book Module Integration

### Loading Services for Booking Calendar

```typescript
import { menuServicesService } from '@/services/domain/catalogDataService';

export function useBookableServices() {
  const [services, setServices] = useState<MenuService[]>([]);
  const storeId = useAppSelector(state => state.auth.storeId);

  useEffect(() => {
    async function loadServices() {
      // Get only services available for online booking
      const svcs = await menuServicesService.getOnlineBookingServices(storeId);
      setServices(svcs);
    }
    loadServices();
  }, [storeId]);

  return services;
}
```

### Calculating Appointment Duration

```typescript
export async function calculateAppointmentDuration(
  serviceId: string,
  variantId?: string,
  addOnIds: string[] = []
): Promise<number> {
  // Base service duration
  const service = await menuServicesService.getById(serviceId);
  if (!service) return 0;

  let totalDuration = service.duration;

  // Add variant duration if specified
  if (variantId) {
    const variant = await serviceVariantsService.getById(variantId);
    if (variant) {
      totalDuration = variant.duration;
    }
  }

  // Add extra time (processing/blocked/finishing)
  if (service.extraTime) {
    totalDuration += service.extraTime;
  }

  // Add add-on durations
  for (const addOnId of addOnIds) {
    const addOn = await addOnOptionsDB.getById(addOnId);
    if (addOn) {
      totalDuration += addOn.duration;
    }
  }

  return totalDuration;
}
```

### Checking Staff Availability for Service

```typescript
import { staffServiceAssignmentsService } from '@/services/domain/catalogDataService';

export async function getStaffForService(
  serviceId: string
): Promise<string[]> {
  const service = await menuServicesService.getById(serviceId);
  if (!service) return [];

  // If all staff can perform, return all staff IDs
  if (service.allStaffCanPerform) {
    const allStaff = await staffDB.getAll(service.storeId);
    return allStaff.map(s => s.id);
  }

  // Otherwise, get staff from assignments
  return await staffServiceAssignmentsService.getStaffIdsForService(serviceId);
}
```

---

## Front Desk Integration

### Loading Services for Ticket

```typescript
import { menuServicesService, serviceCategoriesService } from '@/services/domain/catalogDataService';

export function ServiceSelector({ onSelect }: Props) {
  const storeId = useAppSelector(state => state.auth.storeId);

  const categories = useLiveQuery(
    () => serviceCategoriesService.getAll(storeId, false),
    [storeId]
  );

  const services = useLiveQuery(
    () => menuServicesService.getAll(storeId, false),
    [storeId]
  );

  const handleSelectService = async (serviceId: string) => {
    const service = await menuServicesService.getById(serviceId);
    if (!service) return;

    // Load variants if service has them
    const variants = service.hasVariants
      ? await serviceVariantsService.getByService(serviceId)
      : [];

    onSelect({ service, variants });
  };

  // Render categories and services
}
```

### Turn Weight Calculation

```typescript
export function calculateTurnWeight(serviceIds: string[]): Promise<number> {
  return Promise.all(
    serviceIds.map(id => menuServicesService.getById(id))
  ).then(services => {
    return services
      .filter(Boolean)
      .reduce((sum, svc) => sum + (svc!.turnWeight ?? 1.0), 0);
  });
}
```

---

## External Systems

### Supabase Sync

**Push local changes to Supabase:**

```typescript
import { supabase } from '@/services/supabase/client';
import { toMenuServiceInsert } from '@/services/supabase/adapters/menuServiceAdapter';

export async function syncServiceToCloud(service: MenuService): Promise<void> {
  if (service.syncStatus === 'synced') {
    return; // Already synced
  }

  const insertData = toMenuServiceInsert(
    service,
    service.storeId,
    service.tenantId,
    service.lastModifiedBy,
    service.lastModifiedByDevice
  );

  const { error } = await supabase
    .from('menu_services')
    .upsert(insertData, {
      onConflict: 'id',
    });

  if (error) {
    throw new Error(`Sync failed: ${error.message}`);
  }

  // Mark as synced locally
  await menuServicesDB.update(service.id, {
    syncStatus: 'synced',
    lastSyncedVersion: service.version,
  }, service.lastModifiedBy);
}
```

**Pull changes from Supabase:**

```typescript
import { toMenuService } from '@/services/supabase/adapters/menuServiceAdapter';

export async function pullServicesFromCloud(
  storeId: string,
  since?: Date
): Promise<void> {
  let query = supabase
    .from('menu_services')
    .select('*')
    .eq('store_id', storeId);

  if (since) {
    query = query.gt('updated_at', since.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Pull failed: ${error.message}`);
  }

  if (!data) return;

  // Convert and merge into local database
  for (const row of data) {
    const service = toMenuService(row);
    const existing = await menuServicesDB.getById(service.id);

    if (!existing) {
      // New service, add it
      await db.menuServices.add(service);
    } else {
      // Conflict resolution using vector clocks
      const resolved = resolveConflict(existing, service);
      await db.menuServices.put(resolved);
    }
  }
}
```

### Online Booking API

**Expose services for online booking:**

```typescript
// API endpoint: GET /api/stores/:storeId/services/online
export async function getOnlineBookingServices(
  storeId: string
): Promise<OnlineBookingService[]> {
  const categories = await serviceCategoriesService.getOnlineBookingCategories(storeId);
  const services = await menuServicesService.getOnlineBookingServices(storeId);

  return services.map(service => {
    const category = categories.find(c => c.id === service.categoryId);

    return {
      id: service.id,
      name: service.name,
      description: service.description,
      categoryName: category?.name,
      categoryColor: category?.color,
      price: service.showPriceOnline ? service.price : null,
      pricingType: service.pricingType,
      duration: service.duration,
      depositRequired: service.requiresDeposit,
      depositAmount: service.depositAmount,
      onlineBookingBufferMinutes: service.onlineBookingBufferMinutes,
      advanceBookingDaysMin: service.advanceBookingDaysMin,
      advanceBookingDaysMax: service.advanceBookingDaysMax,
    };
  });
}
```

---

## Next Steps

For related documentation, see:
- [CATALOG_OVERVIEW.md](./CATALOG_OVERVIEW.md) - High-level overview
- [CATALOG_ARCHITECTURE.md](./CATALOG_ARCHITECTURE.md) - Technical architecture
- [CATALOG_DATA_PATTERNS.md](./CATALOG_DATA_PATTERNS.md) - Common data patterns
- [CATALOG_TESTING.md](./CATALOG_TESTING.md) - Testing guide

---

**Last Updated:** 2026-01-22
**Integration Status:** ✅ Fully Documented
