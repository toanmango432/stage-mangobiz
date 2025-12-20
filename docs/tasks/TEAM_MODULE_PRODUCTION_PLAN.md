# Team Module - Production Readiness Implementation Plan

**Created:** December 3, 2025
**Target:** Production-ready Team Module
**Estimated Duration:** 5-7 days of focused work

---

## Executive Summary

The Team Module is **85% complete**. The UI components are well-built, but there are critical data integration gaps that need to be addressed before production deployment.

### Current Status by Phase

| Phase | PRD Section | Status | Notes |
|-------|-------------|--------|-------|
| **Phase 1: Foundation** | 6.1-6.3 | ✅ 100% | Profile, Services, Permissions, Commission |
| **Phase 2: Time & Attendance** | 6.4 | ✅ 95% | Clock in/out, breaks, timesheets all working |
| **Phase 3: Payroll & Pay Runs** | 6.6 | ✅ 90% | Pay run UI, calculations - needs real data |
| **Phase 4: Staff Experience** | 6.9 | ⚠️ 60% | UI complete but uses MOCK DATA |

---

## Critical Gaps to Fix

### Priority 1: Performance Section Data Integration (HIGH)

**Problem:** PerformanceSection.tsx uses mock data generators instead of real data

**Files Affected:**
- `src/components/team-settings/sections/PerformanceSection.tsx`
- `src/components/team-settings/sections/AchievementsSection.tsx`
- `src/components/team-settings/sections/ReviewsSection.tsx`
- `src/components/team-settings/sections/PortfolioSection.tsx`

**Current Mock Functions to Replace:**
```typescript
generateMockMetrics()     // Lines 55-103
generateMockAchievements() // Lines 106-138
generateMockReviewSummary() // Lines 140-153
```

---

### Priority 2: Staff Ratings & Reviews Integration (MEDIUM)

**Problem:** No real client review data flowing into staff profiles

**Missing:**
- Client review collection after appointments
- Staff rating calculation
- Review display in staff profile

---

### Priority 3: Portfolio Image Storage (LOW)

**Problem:** Portfolio images use mock URLs, not persisted to Supabase storage

---

## Implementation Plan

### Sprint 1: Performance Data Integration (Days 1-2)

#### Task 1.1: Create Performance Data Service
**File:** `src/services/performanceService.ts` (NEW)
**Effort:** 3-4 hours

```typescript
// Functions to implement:
- getStaffMetrics(staffId, period: 'daily'|'weekly'|'monthly'|'yearly')
- getStaffAchievements(staffId)
- getStaffGoalProgress(staffId)
```

**Data Sources:**
- Revenue metrics → `transactions` table (sum by staffId)
- Service count → `appointments` table (completed appointments)
- Client metrics → `clients` table (where first visited staffId)
- Rebooking rate → `appointments` table (repeat client appointments)

#### Task 1.2: Create Performance Redux Slice
**File:** `src/store/slices/performanceSlice.ts` (NEW)
**Effort:** 2-3 hours

```typescript
interface PerformanceState {
  metrics: Record<string, PerformanceMetrics>; // keyed by staffId
  achievements: Record<string, Achievement[]>;
  goals: Record<string, GoalProgress[]>;
  loading: boolean;
  error: string | null;
}

// Thunks:
- fetchStaffPerformance(staffId, period)
- updateStaffGoals(staffId, goals)
```

#### Task 1.3: Update PerformanceSection to Use Real Data
**File:** `src/components/team-settings/sections/PerformanceSection.tsx`
**Effort:** 2-3 hours

- Remove `generateMockMetrics()` function
- Import `useSelector` to get data from Redux
- Dispatch `fetchStaffPerformance` on mount
- Handle loading/error states

#### Task 1.4: Update AchievementsSection to Use Real Data
**File:** `src/components/team-settings/sections/AchievementsSection.tsx`
**Effort:** 1-2 hours

- Remove mock achievement generators
- Connect to performanceSlice

---

### Sprint 2: Reviews & Ratings Integration (Days 3-4)

#### Task 2.1: Create Staff Reviews Data Service
**File:** `src/services/supabase/tables/staffReviews.ts` (NEW)
**Effort:** 2-3 hours

```typescript
// Supabase table: staff_reviews
interface StaffReview {
  id: string;
  staffId: string;
  clientId: string;
  appointmentId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  createdAt: string;
}

// Functions:
- getStaffReviews(staffId, limit)
- getStaffRatingSummary(staffId)
- addStaffReview(review)
```

#### Task 2.2: Create Reviews Redux Slice
**File:** `src/store/slices/staffReviewsSlice.ts` (NEW)
**Effort:** 2-3 hours

#### Task 2.3: Update ReviewsSection to Use Real Data
**File:** `src/components/team-settings/sections/ReviewsSection.tsx`
**Effort:** 1-2 hours

#### Task 2.4: Add Review Collection After Appointment
**File:** `src/components/checkout/QuickCheckout.tsx` (MODIFY)
**Effort:** 2-3 hours

- Add optional review prompt after checkout
- Link review to appointment and staff

---

### Sprint 3: Portfolio & Image Storage (Day 5)

#### Task 3.1: Create Supabase Storage Bucket for Staff Images
**Effort:** 1 hour

```sql
-- Supabase Storage setup
CREATE POLICY "Staff can upload their own images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'staff-portfolio' AND auth.uid()::text = owner);
```

#### Task 3.2: Create Image Upload Service
**File:** `src/services/imageUploadService.ts` (NEW)
**Effort:** 2-3 hours

```typescript
// Functions:
- uploadStaffAvatar(staffId, file): Promise<string>
- uploadPortfolioImage(staffId, file): Promise<string>
- deleteImage(url): Promise<void>
```

#### Task 3.3: Update PortfolioSection with Real Upload
**File:** `src/components/team-settings/sections/PortfolioSection.tsx`
**Effort:** 2-3 hours

---

### Sprint 4: Testing & Polish (Days 6-7)

#### Task 4.1: TypeScript Cleanup
**Effort:** 1-2 hours

- Fix unused imports in Performance/Achievements sections
- Fix duplicate export in TimesheetDashboard.tsx
- Run `npx tsc --noEmit` to verify no type errors

#### Task 4.2: Data Validation Testing
**Effort:** 2-3 hours

- Test performance metrics calculation
- Test achievement unlocking
- Test review display
- Test image upload/display

#### Task 4.3: End-to-End Testing
**Effort:** 2-3 hours

Manual test all 10 Team Settings sections:
- [ ] Profile - Edit and save
- [ ] Services - Assign/unassign services
- [ ] Schedule - Set working hours
- [ ] Timesheet - Clock in/out, view reports
- [ ] Permissions - Change role, toggle permissions
- [ ] Commission - Configure rates
- [ ] Payroll - View pay history
- [ ] Performance - View metrics with real data
- [ ] Online Booking - Configure settings
- [ ] Notifications - Toggle preferences

---

## Files to Create (6 new files)

| File | Purpose | Sprint |
|------|---------|--------|
| `src/services/performanceService.ts` | Performance data fetching | 1 |
| `src/store/slices/performanceSlice.ts` | Performance state management | 1 |
| `src/services/supabase/tables/staffReviews.ts` | Staff reviews CRUD | 2 |
| `src/store/slices/staffReviewsSlice.ts` | Reviews state management | 2 |
| `src/services/imageUploadService.ts` | Supabase storage wrapper | 3 |
| `src/db/performanceOperations.ts` | IndexedDB for offline perf data | 1 |

## Files to Modify (8 files)

| File | Changes | Sprint |
|------|---------|--------|
| `PerformanceSection.tsx` | Replace mock with Redux | 1 |
| `AchievementsSection.tsx` | Replace mock with Redux | 1 |
| `ReviewsSection.tsx` | Replace mock with Redux | 2 |
| `PortfolioSection.tsx` | Add real image upload | 3 |
| `ProfileSection.tsx` | Add avatar upload to Supabase | 3 |
| `QuickCheckout.tsx` | Add review collection prompt | 2 |
| `store/index.ts` | Add new slices | 1-2 |
| `db/database.ts` | Add performance table | 1 |

---

## Database Schema Additions

### Supabase Tables Needed

```sql
-- 1. Staff Reviews Table
CREATE TABLE staff_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES team_members(id),
  client_id UUID REFERENCES clients(id),
  appointment_id UUID REFERENCES appointments(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Staff Achievements Table
CREATE TABLE staff_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES team_members(id),
  achievement_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  period TEXT,
  value NUMERIC
);

-- 3. Staff Goals Table
CREATE TABLE staff_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES team_members(id),
  goal_type TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  current_value NUMERIC DEFAULT 0,
  period TEXT, -- 'daily', 'weekly', 'monthly'
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### IndexedDB Tables (for offline)

```typescript
// Add to src/db/database.ts
staffReviews: '++id, staffId, clientId, appointmentId, rating, createdAt',
staffAchievements: '++id, staffId, achievementType, earnedAt',
staffGoals: '++id, staffId, goalType, period',
performanceCache: '++id, staffId, periodType, calculatedAt'
```

---

## Success Criteria

### Definition of Done

- [ ] Performance section shows real metrics from transactions/appointments
- [ ] Achievements section shows earned achievements from actual performance
- [ ] Reviews section shows real client reviews with ratings
- [ ] Portfolio section allows image upload to Supabase storage
- [ ] Profile avatar uploads persist to Supabase storage
- [ ] No TypeScript errors in Team Module files
- [ ] All 10 sections function correctly in browser testing

### Performance Targets

| Metric | Target |
|--------|--------|
| Section load time | < 1 second |
| Data freshness | Real-time or < 5 min cache |
| Image upload | < 3 seconds |
| Offline functionality | All sections work offline |

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Supabase storage setup needed | Medium | Can use existing bucket or create new |
| Performance queries may be slow | Low | Add indexes, use caching |
| Review collection UX impact | Low | Make it optional, non-blocking |

---

## Execution Order

```
Day 1: Sprint 1 Tasks 1.1-1.2 (Performance Service + Slice)
Day 2: Sprint 1 Tasks 1.3-1.4 (Update Performance/Achievements UI)
Day 3: Sprint 2 Tasks 2.1-2.2 (Reviews Service + Slice)
Day 4: Sprint 2 Tasks 2.3-2.4 (Update Reviews UI + Checkout integration)
Day 5: Sprint 3 All Tasks (Image Storage)
Day 6-7: Sprint 4 All Tasks (Testing & Polish)
```

---

## Appendix: Existing Infrastructure to Leverage

### Already Complete (Don't Rebuild)

1. **Timesheet System** - Full clock in/out, breaks, reports
2. **Payroll System** - Pay runs, calculations, earnings display
3. **Commission System** - Tiered, percentage, bonuses
4. **Schedule System** - Working hours, time off, overrides
5. **Permissions System** - 14 roles, granular permissions

### Redux Slices Available

- `teamSlice` - Team member CRUD
- `timesheetSlice` - Time tracking
- `payrollSlice` - Pay runs
- `staffSlice` - Staff list for Front Desk
- `uiStaffSlice` - Staff UI state

### Database Operations Available

- `teamOperations.ts` - Team member CRUD
- `timesheetOperations.ts` - Timesheet CRUD
- `payrollOperations.ts` - Payroll CRUD

---

*This plan prioritizes data integration over new features. The UI is ready; we just need to connect it to real data sources.*
