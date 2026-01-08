# Refactoring Plan

**Date:** January 8, 2026
**Scope:** `/apps/store-app/src`
**Focus:** Large files exceeding guidelines

---

## Executive Summary

Two files significantly exceed the codebase guidelines and need refactoring:

| File | Current Lines | Max Allowed | Over By |
|------|---------------|-------------|---------|
| `dataService.ts` | 1,281 | 600 | 2.1x |
| `useCatalog.ts` | 1,024 | 250 | 4.1x |

---

## Phase 1: Split dataService.ts (Low Risk)

### Current State

**File:** `src/services/dataService.ts`
**Lines:** 1,281
**Consumers:** 17 files

**Issues:**
- God Object pattern - handles 13 entity services
- ~60+ CRUD methods in single file
- Mixes API mode logic with local-first logic

### Proposed Structure

```
src/services/dataService/
├── index.ts                      # Barrel export (backward compatible)
├── types.ts                      # Shared types
├── core/
│   ├── apiClient.ts              # HTTP client setup
│   ├── operations.ts             # Base CRUD operations
│   ├── syncQueue.ts              # Sync queue management
│   └── helpers.ts                # Utility functions
├── entities/
│   ├── clientsService.ts         # Client operations
│   ├── staffService.ts           # Staff operations
│   ├── servicesService.ts        # Service operations
│   ├── appointmentsService.ts    # Appointment operations
│   ├── ticketsService.ts         # Ticket operations
│   └── transactionsService.ts    # Transaction operations
└── extended/
    ├── patchTestsService.ts      # Patch test operations
    ├── formResponsesService.ts   # Form response operations
    ├── referralsService.ts       # Referral operations
    ├── reviewsService.ts         # Review operations
    ├── loyaltyService.ts         # Loyalty operations
    ├── reviewRequestsService.ts  # Review request operations
    └── segmentsService.ts        # Segment operations
```

### Implementation Steps

#### Step 1: Create directory structure
```bash
mkdir -p src/services/dataService/{core,entities,extended}
```

#### Step 2: Extract types
```typescript
// src/services/dataService/types.ts
export type DataMode = 'LOCAL_FIRST' | 'API_FIRST';

export interface DataServiceConfig {
  mode: DataMode;
  storeId: string;
}

export interface BaseService<T> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}
```

#### Step 3: Extract core utilities
```typescript
// src/services/dataService/core/operations.ts
import { supabase } from '../supabase/client';
import { db } from '@/db/database';

export async function fetchFromSupabase<T>(
  table: string,
  storeId: string
): Promise<T[]> {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('store_id', storeId);

  if (error) throw error;
  return data as T[];
}

export async function fetchFromIndexedDB<T>(
  table: string
): Promise<T[]> {
  return db.table(table).toArray();
}
```

#### Step 4: Extract entity services
```typescript
// src/services/dataService/entities/clientsService.ts
import { fetchFromSupabase, fetchFromIndexedDB } from '../core/operations';
import type { Client } from '@/types';

export const clientsService = {
  async getAll(storeId: string, mode: DataMode): Promise<Client[]> {
    if (mode === 'LOCAL_FIRST') {
      return fetchFromIndexedDB<Client>('clients');
    }
    return fetchFromSupabase<Client>('clients', storeId);
  },

  async getById(id: string): Promise<Client | null> {
    // Implementation
  },

  async create(data: Partial<Client>): Promise<Client> {
    // Implementation
  },

  async update(id: string, data: Partial<Client>): Promise<Client> {
    // Implementation
  },

  async delete(id: string): Promise<void> {
    // Implementation
  }
};
```

#### Step 5: Create barrel export (backward compatible)
```typescript
// src/services/dataService/index.ts
import { clientsService } from './entities/clientsService';
import { staffService } from './entities/staffService';
import { appointmentsService } from './entities/appointmentsService';
import { ticketsService } from './entities/ticketsService';
// ... other imports

export const dataService = {
  clients: clientsService,
  staff: staffService,
  appointments: appointmentsService,
  tickets: ticketsService,
  // ... other services
};

// Re-export for backward compatibility
export default dataService;
```

### Rollback Plan
If issues arise, simply revert to the original single file. The barrel export ensures all 17 consumer files continue working without changes.

### Estimated Effort: 4-6 hours

---

## Phase 2: Split useCatalog.ts (Medium Risk)

### Current State

**File:** `src/hooks/useCatalog.ts`
**Lines:** 1,024
**Consumers:** 4 files

**Issues:**
- Monolithic hook managing 9+ entity types
- ~40+ CRUD operations
- Mixes UI state with data operations

### Proposed Structure

```
src/hooks/catalog/
├── index.ts                      # Main useCatalog hook (facade)
├── types.ts                      # Shared types
├── useCatalogState.ts            # UI state management
├── useCatalogQueries.ts          # Live queries (Dexie)
├── operations/
│   ├── useCategoryOperations.ts  # Category CRUD
│   ├── useServiceOperations.ts   # Service CRUD
│   ├── usePackageOperations.ts   # Package CRUD
│   ├── useAddOnOperations.ts     # Add-on CRUD
│   ├── useProductOperations.ts   # Product CRUD
│   ├── useGiftCardOperations.ts  # Gift card CRUD
│   └── useSettingsOperations.ts  # Settings operations
└── utils/
    ├── catalogValidation.ts      # Validation helpers
    └── catalogTransforms.ts      # Data transformations
```

### Implementation Steps

#### Step 1: Extract types
```typescript
// src/hooks/catalog/types.ts
export interface CatalogState {
  isLoading: boolean;
  error: string | null;
  selectedCategoryId: string | null;
}

export interface CategoryOperations {
  createCategory: (data: CategoryInput) => Promise<Category>;
  updateCategory: (id: string, data: Partial<Category>) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
  reorderCategories: (orderedIds: string[]) => Promise<void>;
}
```

#### Step 2: Extract state management
```typescript
// src/hooks/catalog/useCatalogState.ts
import { useState, useCallback } from 'react';
import type { CatalogState } from './types';

export function useCatalogState() {
  const [state, setState] = useState<CatalogState>({
    isLoading: false,
    error: null,
    selectedCategoryId: null
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  return { state, setLoading, setError };
}
```

#### Step 3: Extract entity operations
```typescript
// src/hooks/catalog/operations/useCategoryOperations.ts
import { useCallback } from 'react';
import { catalogDB } from '@/db/catalogDatabase';
import type { Category, CategoryInput } from '@/types';

export function useCategoryOperations(storeId: string) {
  const createCategory = useCallback(async (data: CategoryInput): Promise<Category> => {
    const category: Category = {
      id: crypto.randomUUID(),
      store_id: storeId,
      ...data,
      created_at: new Date().toISOString()
    };

    await catalogDB.categories.add(category);
    return category;
  }, [storeId]);

  const updateCategory = useCallback(async (
    id: string,
    data: Partial<Category>
  ): Promise<Category> => {
    await catalogDB.categories.update(id, data);
    return catalogDB.categories.get(id) as Promise<Category>;
  }, []);

  const deleteCategory = useCallback(async (id: string): Promise<void> => {
    await catalogDB.categories.delete(id);
  }, []);

  const reorderCategories = useCallback(async (orderedIds: string[]): Promise<void> => {
    const updates = orderedIds.map((id, index) =>
      catalogDB.categories.update(id, { display_order: index })
    );
    await Promise.all(updates);
  }, []);

  return { createCategory, updateCategory, deleteCategory, reorderCategories };
}
```

#### Step 4: Create facade hook
```typescript
// src/hooks/catalog/index.ts
import { useCatalogState } from './useCatalogState';
import { useCatalogQueries } from './useCatalogQueries';
import { useCategoryOperations } from './operations/useCategoryOperations';
import { useServiceOperations } from './operations/useServiceOperations';
// ... other imports

export function useCatalog(storeId: string) {
  const { state, setLoading, setError } = useCatalogState();
  const queries = useCatalogQueries(storeId);
  const categoryOps = useCategoryOperations(storeId);
  const serviceOps = useServiceOperations(storeId);
  // ... other operations

  return {
    // State
    isLoading: state.isLoading,
    error: state.error,

    // Data (from queries)
    categories: queries.categories,
    services: queries.services,
    packages: queries.packages,

    // Operations
    ...categoryOps,
    ...serviceOps,
    // ... spread other operations
  };
}

// Re-export for backward compatibility
export { useCatalog as default };
```

### Rollback Plan
Revert to original file if issues arise. The facade pattern ensures backward compatibility.

### Estimated Effort: 3-4 hours

---

## Success Criteria

### Phase 1 (dataService.ts)
- [ ] All 17 consumer files work without changes
- [ ] All tests pass
- [ ] No new lint errors
- [ ] Each extracted file < 300 lines

### Phase 2 (useCatalog.ts)
- [ ] All 4 consumer components work without changes
- [ ] All tests pass
- [ ] Each hook file < 200 lines
- [ ] Type safety maintained

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Import path breaks | Low | High | Barrel exports maintain paths |
| Type mismatches | Medium | Medium | TypeScript will catch |
| Missing exports | Low | Medium | Test all consumers |
| Performance regression | Low | Low | Memoization preserved |

---

## Total Estimated Effort

| Phase | Effort | Risk |
|-------|--------|------|
| Phase 1: dataService.ts | 4-6 hours | Low |
| Phase 2: useCatalog.ts | 3-4 hours | Medium |
| **Total** | **7-10 hours** | Low-Medium |

---

## Implementation Schedule

### Day 1 (4-6 hours)
- [ ] Create dataService module structure
- [ ] Extract core utilities
- [ ] Extract 6 main entity services
- [ ] Create barrel export
- [ ] Test all consumers

### Day 2 (3-4 hours)
- [ ] Create useCatalog module structure
- [ ] Extract state management
- [ ] Extract entity operations
- [ ] Create facade hook
- [ ] Test all consumers
