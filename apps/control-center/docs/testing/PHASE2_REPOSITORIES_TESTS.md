# Phase 2: Repositories - Test Documentation

## Overview

This document outlines the testing procedures for Phase 2 repository layer implementation.

---

## Repositories Created

| Repository | File | Status |
|------------|------|--------|
| MembersRepository | members.repository.ts | Created |
| AuditLogsRepository | audit-logs.repository.ts | Created |
| FeatureFlagsRepository | feature-flags.repository.ts | Created |
| AnnouncementsRepository | announcements.repository.ts | Created |
| SurveysRepository | surveys.repository.ts | Created |
| SystemConfigRepository | system-config.repository.ts | Created |

---

## 1. Members Repository Tests

### 1.1 CRUD Operations

```typescript
import { membersRepository } from '@/services/supabase/repositories';

// Test: Get all members
const members = await membersRepository.getAll();
// Expected: Array of Member objects

// Test: Get member by ID
const member = await membersRepository.getById('some-uuid');
// Expected: Member object or null

// Test: Get members by tenant
const tenantMembers = await membersRepository.getByTenant('tenant-uuid');
// Expected: Array of members for that tenant

// Test: Get members by store
const storeMembers = await membersRepository.getByStore('store-uuid');
// Expected: Array of members assigned to that store

// Test: Create member
const newMember = await membersRepository.createMember({
  tenantId: 'tenant-uuid',
  storeIds: ['store-uuid'],
  name: 'Test User',
  email: 'test@example.com',
  passwordHash: 'hashed-password',
  role: 'staff',
  permissions: ['pos:access'],
  status: 'active',
});
// Expected: Created member with ID

// Test: Update member
const updated = await membersRepository.updateMember('member-id', { name: 'New Name' });
// Expected: Updated member

// Test: Activate/Deactivate/Suspend
await membersRepository.activate('member-id');
await membersRepository.deactivate('member-id');
await membersRepository.suspend('member-id');
// Expected: Status changes correctly
```

---

## 2. Audit Logs Repository Tests

### 2.1 Log Operations

```typescript
import { auditLogsRepository } from '@/services/supabase/repositories';

// Test: Create log entry
const log = await auditLogsRepository.createLog({
  action: 'tenant_created',
  entityType: 'tenant',
  entityId: 'tenant-uuid',
  adminUserId: 'admin-uuid',
  adminUserEmail: 'admin@example.com',
  details: { name: 'New Tenant' },
});
// Expected: Created audit log

// Test: Get logs by entity
const tenantLogs = await auditLogsRepository.getByEntity('tenant', 'tenant-uuid');
// Expected: Array of logs for that entity

// Test: Get logs by date range
const recentLogs = await auditLogsRepository.getByDateRange(
  new Date('2024-01-01'),
  new Date()
);
// Expected: Logs within date range

// Test: Get recent activity
const activity = await auditLogsRepository.getRecentActivity(24);
// Expected: Logs from last 24 hours
```

---

## 3. Feature Flags Repository Tests

### 3.1 Flag Operations

```typescript
import { featureFlagsRepository } from '@/services/supabase/repositories';

// Test: Get all flags
const flags = await featureFlagsRepository.getAll();
// Expected: Array of feature flags

// Test: Get by key
const flag = await featureFlagsRepository.getByKey('multi-device-sync');
// Expected: Feature flag or null

// Test: Get enabled for tier
const proFlags = await featureFlagsRepository.getEnabledForTier('professional');
// Expected: Array of enabled flags for professional tier

// Test: Toggle flag
const toggled = await featureFlagsRepository.toggle('flag-id');
// Expected: Flag with toggled globallyEnabled

// Test: Enable/disable for tier
await featureFlagsRepository.enableForTier('flag-id', 'basic');
await featureFlagsRepository.disableForTier('flag-id', 'free');
// Expected: Tier enablement changes

// Test: Update rollout
await featureFlagsRepository.updateRollout('flag-id', 50);
// Expected: Rollout percentage set to 50
```

---

## 4. Announcements Repository Tests

### 4.1 Announcement Operations

```typescript
import { announcementsRepository } from '@/services/supabase/repositories';

// Test: Create announcement
const announcement = await announcementsRepository.createAnnouncement({
  content: {
    title: 'Test Announcement',
    body: 'This is a test',
  },
  category: 'general',
  channels: ['in_app_banner'],
  targeting: { tiers: ['all'], roles: ['all'] },
  behavior: { dismissible: true },
}, 'admin-user-id');
// Expected: Created announcement in draft status

// Test: Get active announcements
const active = await announcementsRepository.getActive();
// Expected: Only active announcements

// Test: Publish/Unpublish
const published = await announcementsRepository.publish('announcement-id');
// Expected: Announcement with status 'active' and publishedAt set

await announcementsRepository.unpublish('announcement-id');
// Expected: Announcement with status 'paused'

// Test: Archive
const archived = await announcementsRepository.archive('announcement-id');
// Expected: Announcement with status 'archived' and archivedAt set
```

---

## 5. Surveys Repository Tests

### 5.1 Survey Operations

```typescript
import { surveysRepository } from '@/services/supabase/repositories';

// Test: Create survey
const survey = await surveysRepository.createSurvey({
  name: 'Customer Satisfaction',
  title: 'How are we doing?',
  type: 'nps',
  questions: [
    {
      type: 'nps_scale',
      text: 'How likely are you to recommend us?',
      required: true,
      ratingConfig: { min: 0, max: 10 },
    },
  ],
  targeting: { tiers: ['all'], roles: ['all'] },
  trigger: { trigger: 'after_transaction' },
}, 'admin-user-id');
// Expected: Created survey with questions having IDs

// Test: Get responses
const responses = await surveysRepository.getResponses('survey-id');
// Expected: Array of survey responses

// Test: Create response
const response = await surveysRepository.createResponse({
  surveyId: 'survey-id',
  tenantId: 'tenant-id',
  answers: [{ questionId: 'q1', questionType: 'nps_scale', value: 9 }],
  startedAt: new Date(),
});
// Expected: Created response with calculated duration

// Test: Publish/Pause/Close
await surveysRepository.publish('survey-id');
await surveysRepository.pause('survey-id');
await surveysRepository.close('survey-id');
// Expected: Status changes correctly
```

---

## 6. System Config Repository Tests

### 6.1 Config Operations

```typescript
import { systemConfigRepository } from '@/services/supabase/repositories';

// Test: Get config (creates default if not exists)
const config = await systemConfigRepository.get();
// Expected: SystemConfig object with all settings

// Test: Update config
const updated = await systemConfigRepository.updateConfig({
  businessType: 'spa',
  defaultTimezone: 'America/New_York',
}, 'admin-user-id');
// Expected: Updated config

// Test: Tax settings
const taxes = await systemConfigRepository.getTaxes();
const newTax = await systemConfigRepository.addTax({ name: 'GST', rate: 5, isDefault: false });
await systemConfigRepository.updateTax(newTax.id, { rate: 6 });
await systemConfigRepository.deleteTax(newTax.id);

// Test: Categories
const categories = await systemConfigRepository.getCategories();
const newCat = await systemConfigRepository.addCategory({
  name: 'Massage',
  icon: '💆',
  color: '#FF0000',
  sortOrder: 5,
});

// Test: Items
const items = await systemConfigRepository.getItems();
const newItem = await systemConfigRepository.addItem({
  name: 'Swedish Massage',
  categoryId: newCat.id,
  description: '60 min relaxation',
  duration: 60,
  price: 80,
  commissionRate: 50,
  sortOrder: 1,
});

// Test: Roles
const roles = await systemConfigRepository.getRoles();
const newRole = await systemConfigRepository.addRole({
  name: 'Receptionist',
  permissions: ['appointments:view', 'clients:view'],
  color: '#00FF00',
  sortOrder: 3,
});

// Test: Payment methods
const methods = await systemConfigRepository.getPaymentMethods();
const newMethod = await systemConfigRepository.addPaymentMethod({
  name: 'Apple Pay',
  type: 'card',
  isActive: true,
  sortOrder: 5,
});

// Test: Reset to defaults
await systemConfigRepository.resetToDefaults();
// Expected: All settings reset to DEFAULT_SYSTEM_CONFIG
```

---

## Test Results Summary

| Repository | CRUD | Special Methods | Status |
|------------|------|-----------------|--------|
| MembersRepository | PENDING | getByStore, getByEmail | PENDING |
| AuditLogsRepository | PENDING | getByDateRange, search | PENDING |
| FeatureFlagsRepository | PENDING | toggle, enableForTier | PENDING |
| AnnouncementsRepository | PENDING | publish, archive | PENDING |
| SurveysRepository | PENDING | getResponses, createResponse | PENDING |
| SystemConfigRepository | PENDING | all CRUD for sub-entities | PENDING |

---

## Verification Checklist

Before proceeding to Phase 3:

- [ ] All 6 repositories export correctly from index.ts
- [ ] Type conversions (snake_case → camelCase) work correctly
- [ ] Error handling follows APIError pattern
- [ ] Circuit breaker integration works
- [ ] All entity types match type definitions
- [ ] Repositories follow BaseRepository pattern
- [ ] No TypeScript compilation errors

---

*Created: Phase 2 Repository Layer*
*Status: Implementation Complete, Testing Pending*
