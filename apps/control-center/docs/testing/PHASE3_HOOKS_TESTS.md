# Phase 3: React Query Hooks - Test Documentation

## Overview

This document outlines the testing procedures for Phase 3 React Query hooks implementation.

---

## Hooks Created

| Hook File | Entity | Status |
|-----------|--------|--------|
| useStores.ts | Stores | Created |
| useAdminUsers.ts | Admin Users | Created |
| useDevices.ts | Devices | Created |
| useMembers.ts | Members | Created |
| useAuditLogs.ts | Audit Logs | Created |
| useFeatureFlags.ts | Feature Flags | Created |
| useAnnouncements.ts | Announcements | Created |
| useSurveys.ts | Surveys | Created |
| useSystemConfig.ts | System Config | Created |

---

## Hook Usage Examples

### Stores

```tsx
import {
  useStores,
  useStore,
  useStoresByTenant,
  useCreateStore,
  useUpdateStore,
  useDeleteStore,
} from '@/hooks/queries';

function StoreList() {
  const { data: stores, isLoading, error } = useStores();
  const createStore = useCreateStore();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {stores?.map(store => (
        <li key={store.id}>{store.name}</li>
      ))}
    </ul>
  );
}
```

### Admin Users

```tsx
import { useAdminUsers, useCreateAdminUser } from '@/hooks/queries';

function AdminList() {
  const { data: admins } = useAdminUsers();
  const createAdmin = useCreateAdminUser();

  const handleCreate = () => {
    createAdmin.mutate({
      name: 'New Admin',
      email: 'admin@example.com',
      role: 'admin',
      isActive: true,
    });
  };

  return (/* ... */);
}
```

### Members

```tsx
import { useMembers, useMembersByStore, useCreateMember } from '@/hooks/queries';

function MemberList({ storeId }: { storeId: string }) {
  const { data: members } = useMembersByStore(storeId);
  const createMember = useCreateMember();

  return (/* ... */);
}
```

### Audit Logs

```tsx
import {
  useAuditLogs,
  useRecentActivity,
  useAuditLogsByDateRange
} from '@/hooks/queries';

function AuditViewer() {
  const { data: logs } = useAuditLogs(100);
  const { data: recent } = useRecentActivity(24);
  const { data: ranged } = useAuditLogsByDateRange(
    new Date('2024-01-01'),
    new Date()
  );

  return (/* ... */);
}
```

### Feature Flags

```tsx
import {
  useFeatureFlags,
  useToggleFeatureFlag,
  useUpdateFeatureRollout
} from '@/hooks/queries';

function FeatureFlagManager() {
  const { data: flags } = useFeatureFlags();
  const toggle = useToggleFeatureFlag();
  const updateRollout = useUpdateFeatureRollout();

  const handleToggle = (id: string) => {
    toggle.mutate(id);
  };

  const handleRollout = (id: string, percentage: number) => {
    updateRollout.mutate({ id, percentage });
  };

  return (/* ... */);
}
```

### Announcements

```tsx
import {
  useAnnouncements,
  useActiveAnnouncements,
  useCreateAnnouncement,
  usePublishAnnouncement
} from '@/hooks/queries';

function AnnouncementManager() {
  const { data: all } = useAnnouncements();
  const { data: active } = useActiveAnnouncements();
  const create = useCreateAnnouncement();
  const publish = usePublishAnnouncement();

  return (/* ... */);
}
```

### Surveys

```tsx
import {
  useSurveys,
  useSurveyResponses,
  useCreateSurvey,
  usePublishSurvey
} from '@/hooks/queries';

function SurveyManager() {
  const { data: surveys } = useSurveys();
  const { data: responses } = useSurveyResponses('survey-id');
  const create = useCreateSurvey();
  const publish = usePublishSurvey();

  return (/* ... */);
}
```

### System Config

```tsx
import {
  useSystemConfig,
  useTaxSettings,
  useAddTax,
  useServiceCategories,
  useAddCategory,
} from '@/hooks/queries';

function ConfigManager() {
  const { data: config } = useSystemConfig();
  const { data: taxes } = useTaxSettings();
  const { data: categories } = useServiceCategories();
  const addTax = useAddTax();
  const addCategory = useAddCategory();

  return (/* ... */);
}
```

---

## Query Key Verification

```typescript
import { queryKeys } from '@/hooks/queries';

// Test all query keys exist
console.log(queryKeys.stores.list());       // ['stores', 'list']
console.log(queryKeys.members.byStore('1')); // ['members', 'store', '1']
console.log(queryKeys.featureFlags.forTier('pro')); // ['feature-flags', 'tier', 'pro']
console.log(queryKeys.systemConfig.taxes()); // ['system-config', 'taxes']
```

---

## Mutation Testing

### Test Optimistic Updates

```tsx
// Create a tenant
const createTenant = useCreateTenant();
createTenant.mutate({ name: 'Test', email: 'test@test.com', ... });
// Expected: Toast shows "Tenant created"
// Expected: Query cache invalidates and refetches

// Toggle feature flag
const toggle = useToggleFeatureFlag();
toggle.mutate('flag-id');
// Expected: Flag toggles immediately
// Expected: Toast shows status change
```

### Test Error Handling

```tsx
// Try to delete non-existent entity
const deleteStore = useDeleteStore();
deleteStore.mutate('non-existent-id');
// Expected: Toast shows error message
// Expected: Error state available via deleteStore.error
```

---

## Stale Time Configuration

| Entity | Stale Time | Reason |
|--------|------------|--------|
| Tenants | 5 min | Moderate change frequency |
| Stores | 5 min | Moderate change frequency |
| Devices | 2 min | More frequent updates |
| Audit Logs | 1 min | Real-time activity |
| System Config | 10 min | Rarely changes |

---

## Test Results Summary

| Hook File | Query | Mutation | Error Handling | Cache Invalidation |
|-----------|-------|----------|----------------|-------------------|
| useStores.ts | PENDING | PENDING | PENDING | PENDING |
| useAdminUsers.ts | PENDING | PENDING | PENDING | PENDING |
| useDevices.ts | PENDING | PENDING | PENDING | PENDING |
| useMembers.ts | PENDING | PENDING | PENDING | PENDING |
| useAuditLogs.ts | PENDING | PENDING | PENDING | PENDING |
| useFeatureFlags.ts | PENDING | PENDING | PENDING | PENDING |
| useAnnouncements.ts | PENDING | PENDING | PENDING | PENDING |
| useSurveys.ts | PENDING | PENDING | PENDING | PENDING |
| useSystemConfig.ts | PENDING | PENDING | PENDING | PENDING |

---

## Verification Checklist

Before proceeding to Phase 4:

- [ ] All hooks export correctly from index.ts
- [ ] Query keys follow factory pattern
- [ ] Mutations invalidate correct queries
- [ ] Toast notifications work
- [ ] Error handling displays correctly
- [ ] Loading states work
- [ ] Stale times are appropriate
- [ ] No TypeScript compilation errors

---

*Created: Phase 3 React Query Hooks*
*Status: Implementation Complete, Testing Pending*
