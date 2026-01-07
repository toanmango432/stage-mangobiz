# Phase 4 Testing Documentation: React Query Migration

## Overview

Phase 4 migrated all 14 admin pages from the legacy `@/db/database` and `@/db/supabaseDatabase` layer to the new React Query architecture using:
- **Repository pattern** (`@/services/supabase/repositories/`)
- **React Query hooks** (`@/hooks/queries/`)
- **Automatic cache invalidation** via query keys

## Migration Summary

| # | Page | Old Import | New Hooks |
|---|------|------------|-----------|
| 1 | CustomerManagement.tsx | tenantsDB, licensesDB | useTenants, useLicenses, useCreateTenant, useUpdateTenant, useDeleteTenant |
| 2 | LicenseManagement.tsx | licensesDB, tenantsDB | useLicenses, useTenants, useCreateLicense, useUpdateLicense, useDeleteLicense, useRevokeLicense |
| 3 | StoreManagement.tsx | storesDB, tenantsDB, licensesDB | useStores, useTenants, useLicenses, useCreateStore, useUpdateStore, useDeleteStore |
| 4 | AdminUserManagement.tsx | adminUsersDB | useAdminUsers, useCreateAdminUser, useUpdateAdminUser, useDeleteAdminUser |
| 5 | DeviceManagement.tsx | devicesDB, storesDB | useDevices, useStores, useRevokeDevice, useActivateDevice |
| 6 | AdminDashboard.tsx | tenantsDB, licensesDB, etc. | useTenants, useLicenses, useStores, useMembers, useDevices, useAuditLogs |
| 7 | MemberManagement.tsx | membersDB, tenantsDB, storesDB | useMembers, useTenants, useStores, useCreateMember, useUpdateMember, useDeleteMember, useSuspendMember, useActivateMember |
| 8 | AuditLogsViewer.tsx | auditLogsDB | useAuditLogs |
| 9 | FeatureFlagsManagement.tsx | featureFlagsDB, licensesDB | useFeatureFlags, useLicenses, useUpdateFeatureFlag, useToggleFeatureFlag |
| 10 | AnalyticsDashboard.tsx | Multiple DBs | useTenants, useLicenses, useStores, useMembers, useDevices, useAuditLogs + useMemo |
| 11 | QuickOnboard.tsx | tenantsDB, licensesDB, storesDB, membersDB | useCreateTenant, useCreateLicense, useCreateStore, useCreateMember |
| 12 | AnnouncementsManagement.tsx | announcementsDB | useAnnouncements, useCreateAnnouncement, useUpdateAnnouncement, useDeleteAnnouncement, usePublishAnnouncement, useUnpublishAnnouncement, useArchiveAnnouncement |
| 13 | SurveyManagement.tsx | surveysDB | useSurveys, useCreateSurvey, useUpdateSurvey, useDeleteSurvey, usePublishSurvey, usePauseSurvey, useCloseSurvey, useSurveyResponses |
| 14 | SystemConfiguration.tsx | systemConfigDB | useSystemConfig, useAddTax, useUpdateTax, useDeleteTax, useAddCategory, useUpdateCategory, useDeleteCategory, useAddServiceItem, useUpdateServiceItem, useDeleteServiceItem, useAddRole, useUpdateRole, useDeleteRole, useAddPaymentMethod, useUpdatePaymentMethod, useDeletePaymentMethod |

## Key Changes Made

### 1. Import Changes
- Removed: `import { xxxDB } from '@/db/database'` or `'@/db/supabaseDatabase'`
- Added: `import { useXxx, useCreateXxx, ... } from '@/hooks/queries'`

### 2. State Management Changes
- Removed: `useState` for data arrays + `useEffect` for loading
- Added: React Query hooks with `{ data, isLoading, refetch }`

### 3. Mutation Handling
- Removed: Manual `setSaving(true/false)` and try/catch with `setData()`
- Added: Mutation hooks with `isPending` and `mutateAsync()`

### 4. Error Handling
- Removed: Manual `console.error()` and `toast.error()` calls
- Added: Centralized error handling in hook `onError` callbacks

### 5. Cache Invalidation
- Removed: Manual `loadData()` calls after mutations
- Added: Automatic via `queryClient.invalidateQueries()` in hooks

## Testing Checklist

### Pre-Test Setup
1. Ensure Supabase is running and accessible
2. Start the dev server: `npm run dev`
3. Login with admin credentials
4. Have browser DevTools Network tab open to verify API calls

### Page-by-Page Testing

#### 1. Customer Management (`/customers`)
- [ ] Page loads with tenant list
- [ ] Search/filter works
- [ ] Create new tenant
- [ ] Edit existing tenant
- [ ] Delete tenant (with confirmation)
- [ ] Toast notifications appear for all operations

#### 2. License Management (`/licenses`)
- [ ] Page loads with license list
- [ ] Filter by status, tier
- [ ] Create new license
- [ ] Edit license
- [ ] Revoke license
- [ ] Toast notifications work

#### 3. Store Management (`/stores`)
- [ ] Page loads with store list
- [ ] Filter by tenant
- [ ] Create new store
- [ ] Edit store
- [ ] Delete store
- [ ] Toast notifications work

#### 4. Admin User Management (`/admin-users`)
- [ ] Page loads with admin user list
- [ ] Create new admin user
- [ ] Edit admin user
- [ ] Delete admin user
- [ ] Toast notifications work

#### 5. Device Management (`/devices`)
- [ ] Page loads with device list
- [ ] Filter by store
- [ ] Revoke device access
- [ ] Activate device
- [ ] Toast notifications work

#### 6. Admin Dashboard (`/dashboard`)
- [ ] Page loads with all statistics
- [ ] Refresh button works
- [ ] All data cards display correctly
- [ ] Recent activity shows audit logs

#### 7. Member Management (`/members`)
- [ ] Page loads with member list
- [ ] Filter by tenant/store
- [ ] Create new member
- [ ] Edit member
- [ ] Suspend/activate member
- [ ] Delete member
- [ ] Toast notifications work

#### 8. Audit Logs (`/audit-logs`)
- [ ] Page loads with log entries
- [ ] Pagination works
- [ ] Filter by action type
- [ ] Filter by user
- [ ] Date range filter works

#### 9. Feature Flags (`/feature-flags`)
- [ ] Page loads with flag list
- [ ] Toggle flag on/off
- [ ] Edit flag settings
- [ ] License tier statistics display
- [ ] Toast notifications work

#### 10. Analytics Dashboard (`/analytics`)
- [ ] Page loads with charts
- [ ] All analytics cards display
- [ ] Date range selector works
- [ ] Refresh button works

#### 11. Quick Onboard (`/quick-onboard`)
- [ ] Wizard loads
- [ ] Step 1: Create tenant works
- [ ] Step 2: Create license works
- [ ] Step 3: Create store works
- [ ] Step 4: Create member works
- [ ] Success state displays
- [ ] Toast notifications work

#### 12. Announcements (`/announcements`)
- [ ] Page loads with announcement list
- [ ] Create new announcement
- [ ] Edit announcement
- [ ] Publish/unpublish announcement
- [ ] Archive announcement
- [ ] Delete announcement
- [ ] Preview works
- [ ] Toast notifications work

#### 13. Surveys (`/surveys`)
- [ ] Page loads with survey list
- [ ] Create new survey
- [ ] Edit survey
- [ ] Add/edit questions
- [ ] Publish/pause/close survey
- [ ] View responses
- [ ] Delete survey
- [ ] Toast notifications work

#### 14. System Configuration (`/system-config`)
- [ ] Page loads with all sections
- [ ] Expand/collapse sections work
- [ ] **Tax Settings:**
  - [ ] Add tax
  - [ ] Edit tax
  - [ ] Delete tax
- [ ] **Service Categories:**
  - [ ] Add category
  - [ ] Edit category (icon, color, name)
  - [ ] Delete category
- [ ] **Default Services:**
  - [ ] Add service item
  - [ ] Edit service item
  - [ ] Delete service item
- [ ] **Employee Roles:**
  - [ ] Add role
  - [ ] Edit role (name, color, permissions)
  - [ ] Delete role
- [ ] **Payment Methods:**
  - [ ] Add payment method
  - [ ] Toggle active/inactive
  - [ ] Edit payment method
  - [ ] Delete payment method
- [ ] Toast notifications work for all operations

## Network Request Verification

For each page, verify in DevTools Network tab:
1. Initial GET request on page load
2. POST/PUT/DELETE requests on mutations
3. Automatic refetch after mutations (query invalidation)
4. No duplicate requests (React Query caching)

## Error Handling Verification

Test error scenarios:
1. Disconnect network → verify error toasts appear
2. Invalid data submission → verify validation errors
3. Concurrent updates → verify proper handling

## Performance Verification

1. Verify staleTime is working (no unnecessary refetches)
2. Verify loading states show correctly
3. Verify optimistic updates where implemented
4. Check React Query DevTools for cache state

## TypeScript Verification

Run type check to ensure no errors:
```bash
cd apps/control-center && npx tsc --noEmit
```

Expected: No errors

## Rollback Plan

If issues found:
1. Revert to old database layer import
2. Restore useState/useEffect pattern
3. Check repository methods match old DB methods

## Completion Criteria

- [ ] All 14 pages load without errors
- [ ] All CRUD operations work correctly
- [ ] Toast notifications appear for all operations
- [ ] TypeScript compilation passes
- [ ] No console errors
- [ ] React Query DevTools shows correct cache state

---

**Phase 4 Status: COMPLETE**
**Date: January 2026**
**Next: Phase 5 - Refactor Large Files**
