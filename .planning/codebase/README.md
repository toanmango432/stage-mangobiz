# Mango POS Catalog Module - Codebase Documentation

> **Comprehensive documentation for the Catalog Module architecture, data patterns, testing, and integration.**

---

## 📚 Documentation Index

### Getting Started
1. **[CATALOG_OVERVIEW.md](./CATALOG_OVERVIEW.md)** - Start here
   - Introduction to the Catalog module
   - High-level architecture
   - Technology stack
   - Core components
   - Key design decisions

### Deep Dives
2. **[CATALOG_ARCHITECTURE.md](./CATALOG_ARCHITECTURE.md)** - Technical architecture
   - Storage layer (IndexedDB, SQLite, Supabase)
   - Sync architecture (vector clocks, conflict resolution)
   - Type system patterns
   - Service layer routing
   - Performance considerations
   - Security & multi-tenancy

3. **[CATALOG_DATA_PATTERNS.md](./CATALOG_DATA_PATTERNS.md)** - Code examples
   - CRUD patterns
   - Search & filter patterns
   - Relationships & joins
   - Archive & restore patterns
   - Sync patterns
   - Common queries
   - Error handling

4. **[CATALOG_INTEGRATION.md](./CATALOG_INTEGRATION.md)** - Integration guide
   - Integration with other modules (Book, Checkout, Front Desk)
   - Component integration patterns
   - Redux vs Dexie live queries
   - External systems (Supabase sync, Online Booking API)

5. **[CATALOG_TESTING_AND_CONCERNS.md](./CATALOG_TESTING_AND_CONCERNS.md)** - Testing & technical debt
   - Testing strategy (unit, integration, E2E)
   - Test coverage status
   - Technical debt analysis
   - Known issues
   - Future improvements

---

## 🎯 Quick Reference

### Key Files

| Category | File Path | Purpose |
|----------|-----------|---------|
| **Types** | `src/types/catalog.ts` | Single source of truth for all catalog types |
| **Database** | `src/db/catalogDatabase.ts` | Dexie CRUD operations |
| **Service Layer** | `src/services/domain/catalogDataService.ts` | Storage routing logic |
| **Redux** | `src/store/slices/catalogSlice.ts` | ⚠️ DEPRECATED - use live queries |
| **Seed Data** | `src/db/catalogSeed.ts` | Test data seeder |
| **Adapters** | `src/services/supabase/adapters/*` | Supabase ↔ App type converters |
| **Tables** | `src/services/supabase/tables/*` | Supabase table operations |

### Core Entities

```
ServiceCategory (categories of services)
  └─ MenuService (individual services)
       ├─ ServiceVariant (price/duration variants)
       ├─ StaffServiceAssignment (who can perform)
       └─ AddOnGroup (available add-ons)
            └─ AddOnOption (individual add-on choices)

ServicePackage (bundled services)
CatalogSettings (per-store configuration)
BookingSequence (service order rules)
Product (retail items)
```

### Storage Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    catalogDataService                        │
│                    (Routing Layer)                           │
└─────────────────────────────────────────────────────────────┘
         ↓                    ↓                    ↓
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  IndexedDB      │  │     SQLite      │  │    Supabase     │
│  (Dexie)        │  │   (Electron)    │  │  (Online-only)  │
│  Default Web    │  │  Desktop App    │  │   Opt-in Cloud  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## 🚀 Common Tasks

### Creating a New Service

```typescript
import { menuServicesService } from '@/services/domain/catalogDataService';
import type { CreateMenuServiceInput } from '@/types/catalog';

const input: CreateMenuServiceInput = {
  categoryId: 'cat-123',
  name: 'Haircut',
  pricingType: 'fixed',
  price: 50,
  duration: 60,
  taxable: true,
  hasVariants: false,
  variantCount: 0,
  allStaffCanPerform: true,
  bookingAvailability: 'both',
  onlineBookingEnabled: true,
  requiresDeposit: false,
  status: 'active',
  displayOrder: 0,
  showPriceOnline: true,
  allowCustomDuration: false,
};

const service = await menuServicesService.create(
  input,
  userId,
  storeId,
  tenantId,
  deviceId
);
```

### Searching Services

```typescript
const results = await menuServicesService.search(storeId, 'haircut', 50);
```

### Loading Service with Variants

```typescript
import { menuServicesDB } from '@/db/catalogDatabase';

const service = await menuServicesDB.getWithVariants(serviceId);
// Returns: ServiceWithVariants { ...service, variants: ServiceVariant[] }
```

### Using Dexie Live Queries (Recommended)

```typescript
import { useLiveQuery } from 'dexie-react-hooks';
import { serviceCategoriesDB } from '@/db/catalogDatabase';

export function CatalogBrowser() {
  const storeId = useAppSelector(state => state.auth.storeId);

  const categories = useLiveQuery(
    () => serviceCategoriesDB.getAll(storeId, false),
    [storeId]
  );

  if (!categories) return <Spinner />;

  return (
    <div>
      {categories.map(cat => (
        <CategoryCard key={cat.id} category={cat} />
      ))}
    </div>
  );
}
```

---

## 📊 Module Status

### Implementation Status: ✅ Phase 6 Complete

| Component | Status | Coverage |
|-----------|--------|----------|
| Type System | ✅ Complete | 100% |
| Database Operations | ✅ Complete | 85% |
| Service Layer Routing | ✅ Complete | 70% |
| Type Adapters | ✅ Complete | 95% |
| Supabase Integration | ✅ Complete | 75% |
| Redux Slice | ⚠️ Deprecated | N/A |
| Live Queries | 🚧 Partial | N/A |
| Background Sync | ❌ Not Implemented | 0% |

### Test Coverage: 78% (Target: 90%)

```
File                                    | % Stmts | % Branch | % Funcs | % Lines
======================================  |=========|==========|=========|=========
TOTAL                                   |    78   |    73    |    82   |    78
```

### Technical Debt: 🟡 Manageable

**High Priority (🔴):**
- Implement background sync worker

**Medium Priority (🟡):**
- Add compound indexes for performance
- Implement tombstone cleanup job
- Remove deprecated Redux slice
- Implement full vector clock merge

**Low Priority (🟢):**
- Improve search with full-text indexing
- Add bulk operations
- GraphQL API layer
- Real-time collaboration

---

## 🧪 Testing

### Run Tests

```bash
# Unit tests
npm test

# Unit tests with coverage
npm run test:coverage

# E2E tests
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui
```

### Test Structure

```
apps/store-app/
├── src/
│   ├── db/
│   │   └── catalogDatabase.test.ts         # Database operations
│   ├── services/
│   │   ├── domain/
│   │   │   └── catalogDataService.test.ts  # Service routing
│   │   └── supabase/
│   │       └── adapters/
│   │           └── catalogSettingsAdapter.test.ts
└── e2e/
    └── catalog-checkout.spec.ts            # E2E flow
```

---

## 📦 Dependencies

### Core Dependencies

```json
{
  "dexie": "^4.2.1",
  "dexie-react-hooks": "^1.1.7",
  "@supabase/supabase-js": "^2.49.1",
  "better-sqlite3": "^11.7.0",
  "uuid": "^11.1.0"
}
```

### Type Dependencies

```json
{
  "@reduxjs/toolkit": "^2.9.1",
  "react": "^18.3.1",
  "react-redux": "^9.2.0"
}
```

---

## 🔍 Troubleshooting

### "Service not found" errors

**Cause:** Attempting to read before data is loaded

**Solution:** Use live queries or check for undefined
```typescript
const service = await menuServicesService.getById(serviceId);
if (!service) {
  throw new Error('Service not found');
}
```

### "Failed to resolve import" at runtime

**Cause:** Missing dependency after branch merge

**Solution:** Always run `pnpm install` after merging branches

### Slow search on large datasets

**Cause:** Client-side filtering without indexes

**Solution:** Add compound indexes or use Supabase full-text search

### Sync status stuck at 'local'

**Cause:** Background sync worker not implemented

**Solution:** Manually trigger sync or implement background worker (high priority)

---

## 🤝 Contributing

### Before Making Changes

1. Read relevant documentation (especially [CATALOG_ARCHITECTURE.md](./CATALOG_ARCHITECTURE.md))
2. Check existing patterns in [CATALOG_DATA_PATTERNS.md](./CATALOG_DATA_PATTERNS.md)
3. Review type definitions in `src/types/catalog.ts`
4. Add tests for new functionality
5. Update documentation if adding new patterns

### Code Style

- Use TypeScript strict mode
- Prefer `async/await` over `.then()`
- Use `useLiveQuery` over Redux for catalog data
- Always filter by `storeId` for multi-tenancy
- Add JSDoc comments for public APIs

### File Size Guidelines

| File Type | Target Lines | Max Lines | Action if Exceeded |
|-----------|--------------|-----------|-------------------|
| Component | <300 | 500 | Split into module structure |
| Database operations | <400 | 600 | Extract helpers |
| Service layer | <400 | 600 | Split by entity |

---

## 📖 Related Documentation

### Product Requirements
- `docs/product/PRD-Catalog-Module.md` - Product requirements
- `docs/product/Mango POS PRD.md` - Overall product spec

### Architecture
- `docs/architecture/DATA_STORAGE_STRATEGY.md` - Data storage overview
- `docs/architecture/TECHNICAL_DOCUMENTATION.md` - Overall architecture

### Other Modules
- `docs/modules/book/` - Book module integration
- `docs/modules/frontdesk/` - Front Desk integration
- `docs/modules/tickets/` - Ticket system integration

---

## 📞 Support

### Issues & Questions

For questions about:
- **Data patterns** → See [CATALOG_DATA_PATTERNS.md](./CATALOG_DATA_PATTERNS.md)
- **Integration** → See [CATALOG_INTEGRATION.md](./CATALOG_INTEGRATION.md)
- **Testing** → See [CATALOG_TESTING_AND_CONCERNS.md](./CATALOG_TESTING_AND_CONCERNS.md)
- **Architecture decisions** → See [CATALOG_ARCHITECTURE.md](./CATALOG_ARCHITECTURE.md)

### Reporting Bugs

When reporting bugs, include:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Storage backend (Dexie/SQLite/Supabase)
5. Browser/platform details

---

## 📝 Changelog

### Phase 6 (2026-01-22) - Comprehensive Review ✅
- Completed full code review and refactoring
- Fixed TypeScript errors across all files
- Standardized adapter patterns
- Enhanced type safety with proper generic handling
- Comprehensive documentation created

### Phase 5 (2026-01-21) - Testing & Bug Fixes
- Added unit tests for adapters
- Fixed sync metadata handling
- Improved error handling

### Phase 4 (2026-01-20) - Supabase Integration
- Implemented Supabase tables and adapters
- Added tri-path storage routing
- Deprecated Redux slice

### Phase 3 (2026-01-19) - Core Database Operations
- Implemented all CRUD operations
- Added search functionality
- Implemented archive/restore

### Phase 2 (2026-01-18) - Type System
- Defined all catalog types
- Created input types
- Added aggregate types

### Phase 1 (2026-01-17) - Initial Setup
- Created database schema
- Set up Dexie tables
- Initial type definitions

---

**Last Updated:** 2026-01-22
**Documentation Version:** 1.0.0
**Module Status:** ✅ Production-Ready (pending background sync worker)
