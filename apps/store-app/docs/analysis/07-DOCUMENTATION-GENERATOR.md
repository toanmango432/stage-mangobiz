# Documentation Coverage Report

**Date:** January 8, 2026
**Scope:** `/apps/store-app/src`
**Overall Coverage:** ~15% (Target: 80%)

---

## Executive Summary

| Category | Total Files | Documented | Coverage |
|----------|-------------|------------|----------|
| Services | 94 | ~17 | ~18% |
| Hooks | 35 | ~4 | ~11% |
| Components | 427 | ~16 | ~4% |

---

## Documentation Quality by Category

### Services (Best Documented)

#### Well-Documented Examples

**`src/services/appointmentService.ts`** - EXCELLENT
- Class-level JSDoc with purpose and offline strategy
- Method-level documentation with @param tags
- Clear section separators (READ/CREATE/UPDATE)

**`src/services/search/searchService.ts`** - EXCELLENT
- File-level documentation explaining purpose
- @param and @returns on key functions
- Well-organized with section separators

**`src/services/deviceManager.ts`** - EXCELLENT
- Class-level documentation
- Section organization with comments
- Method-level JSDoc

#### Needs Documentation

| File | Lines | Priority |
|------|-------|----------|
| `services/supabase/tables/*.ts` | Various | High |
| `services/mqtt/*.ts` | Various | High |
| `services/syncService.ts` | 200+ | Critical |
| `services/licenseManager.ts` | 300+ | Critical |

---

### Hooks (Moderate Coverage)

#### Well-Documented Examples

**`src/hooks/useSync.ts`** - GOOD
- File-level documentation explaining LOCAL-FIRST pattern
- Function-level JSDoc

#### Needs Documentation

| File | Lines | Priority |
|------|-------|----------|
| `hooks/useFrontDeskState.ts` | 500+ | High |
| `hooks/useDragAndDrop.ts` | 300+ | Medium |
| `hooks/useSchedule.ts` | 400+ | Medium |
| `hooks/useCatalog.ts` | 1024 | High |

---

### Components (Poorest Coverage)

#### Issues Identified

1. **Props interfaces defined but undocumented** - 451 interface...Props found
2. **Large components lack purpose documentation**
3. **No @example blocks for reusable components**

#### Needs Documentation

| File | Lines | Priority |
|------|-------|----------|
| `components/tickets/ServiceTicketCard.tsx` | 537 | High |
| `components/frontdesk/FrontDesk.tsx` | 932 | High |
| `components/checkout/CheckoutScreen.tsx` | 600+ | Critical |
| `components/Book/*.tsx` | Various | Medium |

---

## Documentation Templates

### Service Documentation Template

```typescript
/**
 * @fileoverview Service for managing [entity] operations.
 *
 * This service handles CRUD operations for [entity] with support for
 * both online (Supabase) and offline (IndexedDB) modes.
 *
 * @module services/[entityName]Service
 */

/**
 * [ServiceName] - Manages [entity] data operations.
 *
 * @class
 * @example
 * ```typescript
 * const service = new EntityService(storeId);
 * const items = await service.getAll();
 * ```
 */
class EntityService {
  /**
   * Creates an instance of EntityService.
   *
   * @param {string} storeId - The store identifier
   */
  constructor(storeId: string) {}

  /**
   * Retrieves all [entities] for the store.
   *
   * @returns {Promise<Entity[]>} Array of entities
   * @throws {Error} If database operation fails
   *
   * @example
   * ```typescript
   * const entities = await service.getAll();
   * console.log(entities.length);
   * ```
   */
  async getAll(): Promise<Entity[]> {}

  /**
   * Creates a new [entity].
   *
   * @param {EntityInput} data - The entity data
   * @returns {Promise<Entity>} The created entity
   * @throws {ValidationError} If data is invalid
   *
   * @example
   * ```typescript
   * const newEntity = await service.create({
   *   name: 'Example',
   *   status: 'active'
   * });
   * ```
   */
  async create(data: EntityInput): Promise<Entity> {}
}
```

---

### Hook Documentation Template

```typescript
/**
 * @fileoverview Hook for managing [feature] state and operations.
 */

/**
 * use[HookName] - Manages [feature] state and provides operations.
 *
 * This hook provides:
 * - State management for [feature]
 * - CRUD operations
 * - Real-time updates
 *
 * @param {Object} options - Hook configuration
 * @param {string} options.storeId - Store identifier
 * @param {boolean} [options.autoFetch=true] - Whether to fetch on mount
 *
 * @returns {Object} Hook return value
 * @returns {Entity[]} returns.items - Array of entities
 * @returns {boolean} returns.isLoading - Loading state
 * @returns {string|null} returns.error - Error message if any
 * @returns {Function} returns.create - Create new entity
 * @returns {Function} returns.update - Update existing entity
 * @returns {Function} returns.delete - Delete entity
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { items, isLoading, create } = useHookName({ storeId: '123' });
 *
 *   if (isLoading) return <Spinner />;
 *
 *   return (
 *     <ul>
 *       {items.map(item => <li key={item.id}>{item.name}</li>)}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useHookName(options: HookOptions): HookReturn {
  // Implementation
}
```

---

### Component Documentation Template

```typescript
/**
 * @fileoverview [ComponentName] - Brief description of the component.
 */

/**
 * Props for the [ComponentName] component.
 */
interface ComponentNameProps {
  /** Unique identifier for the item */
  id: string;

  /** Display title */
  title: string;

  /** Optional description text */
  description?: string;

  /** Callback fired when the item is clicked */
  onClick?: (id: string) => void;

  /** Whether the component is in loading state */
  isLoading?: boolean;

  /** Custom CSS class name */
  className?: string;
}

/**
 * [ComponentName] - Brief description of what it does.
 *
 * This component is used for [purpose]. It supports:
 * - Feature 1
 * - Feature 2
 * - Feature 3
 *
 * @component
 * @example
 * ```tsx
 * // Basic usage
 * <ComponentName
 *   id="123"
 *   title="Example Item"
 *   onClick={(id) => console.log('Clicked:', id)}
 * />
 *
 * // With all props
 * <ComponentName
 *   id="123"
 *   title="Example Item"
 *   description="This is a description"
 *   onClick={(id) => handleClick(id)}
 *   isLoading={false}
 *   className="custom-class"
 * />
 * ```
 */
export function ComponentName({
  id,
  title,
  description,
  onClick,
  isLoading = false,
  className
}: ComponentNameProps) {
  // Implementation
}
```

---

## Action Checklist

### High Priority (Critical Business Logic)

#### Services Layer
- [ ] Document `src/services/dataService.ts`
- [ ] Document `src/services/syncService.ts`
- [ ] Document `src/services/licenseManager.ts`
- [ ] Document all Supabase adapters

#### Core Hooks
- [ ] Document `src/hooks/useFrontDeskState.ts`
- [ ] Document `src/hooks/useAppointmentCalendar.ts`
- [ ] Document `src/hooks/useSchedule.ts`
- [ ] Document `src/hooks/useCatalog.ts`

#### Main Components
- [ ] Document `src/components/tickets/*.tsx`
- [ ] Document `src/components/Book/*.tsx`
- [ ] Document `src/components/frontdesk/FrontDesk.tsx`
- [ ] Document `src/components/checkout/CheckoutScreen.tsx`

### Medium Priority

- [ ] Add @example blocks to commonly-used hooks
- [ ] Document all Props interfaces with inline comments
- [ ] Add architecture comments to complex files

### Low Priority

- [ ] Generate TypeDoc/API documentation
- [ ] Create architecture diagrams
- [ ] Add README to each major directory

---

## Documentation Tools Setup

### Install TypeDoc
```bash
pnpm add -D typedoc typedoc-plugin-markdown --filter @mango/store-app
```

### TypeDoc Configuration
```json
// typedoc.json
{
  "entryPoints": ["src/index.ts"],
  "out": "docs/api",
  "plugin": ["typedoc-plugin-markdown"],
  "excludePrivate": true,
  "excludeProtected": true,
  "readme": "README.md"
}
```

### Add Script
```json
// package.json
{
  "scripts": {
    "docs": "typedoc"
  }
}
```

---

## ESLint Rules for Documentation

```javascript
// .eslintrc.js
module.exports = {
  plugins: ['jsdoc'],
  rules: {
    'jsdoc/require-jsdoc': ['warn', {
      require: {
        FunctionDeclaration: true,
        MethodDefinition: true,
        ClassDeclaration: true
      }
    }],
    'jsdoc/require-param': 'warn',
    'jsdoc/require-returns': 'warn',
    'jsdoc/require-description': 'warn'
  }
};
```

---

## Implementation Schedule

### Week 1: Services
- [ ] Document dataService.ts
- [ ] Document syncService.ts
- [ ] Document all adapters

### Week 2: Hooks
- [ ] Document top 10 hooks
- [ ] Add @example to each

### Week 3: Components
- [ ] Document checkout components
- [ ] Document booking components

### Week 4: Review
- [ ] Run TypeDoc
- [ ] Review generated docs
- [ ] Fill gaps
