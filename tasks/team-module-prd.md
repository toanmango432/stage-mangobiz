# Team Module PRD - Quick Reference

> **Full PRD Location:** `docs/product/PRD-Team-Module.md`
> **Competitive Analysis:** `docs/product/TEAM-MODULE-COMPARISON-FRESHA.md`
> **Version:** 2.0 | **Last Updated:** December 2, 2024

---

## Document Locations

| Document | Path | Description |
|----------|------|-------------|
| **Full PRD v2.0** | `docs/product/PRD-Team-Module.md` | Complete requirements (1500+ lines) |
| **Implementation Plan** | `tasks/TEAM-MODULE-IMPLEMENTATION-PLAN.md` | Phase 2-4 implementation details |
| **Fresha Comparison** | `docs/product/TEAM-MODULE-COMPARISON-FRESHA.md` | Competitive analysis |
| **Docs Index** | `docs/INDEX.md` | All documentation index |

---

## Implementation Phases Summary

### Phase 1: Foundation (COMPLETE)
- [x] Team member profiles (14 roles)
- [x] Service assignments with custom pricing
- [x] Schedule management (1-4 week rotating)
- [x] Turn tracking (unique differentiator)
- [x] Permissions (17 granular flags)
- [x] Commission configuration
- [x] Online booking settings
- [x] Offline-first sync

### Phase 2: Time & Attendance (HIGH PRIORITY)
- [ ] Clock in/out system
- [ ] Break tracking
- [ ] Timesheet dashboard
- [ ] Overtime calculation (daily/weekly)
- [ ] Attendance alerts
- [ ] Manager approval workflow
- [ ] Timesheet reports

### Phase 3: Payroll & Pay Runs (HIGH PRIORITY)
- [ ] Pay run creation
- [ ] Automatic calculations (wages + commission + tips)
- [ ] Manual adjustments
- [ ] Review & approval workflow
- [ ] Payment processing integration
- [ ] 9 payroll reports
- [ ] Staff earnings portal

### Phase 4: Staff Experience (MEDIUM)
- [ ] Staff ratings & reviews
- [ ] Portfolio gallery
- [ ] Performance dashboard
- [ ] Goal tracking
- [ ] Achievements/badges
- [ ] Group booking
- [ ] Staff mobile app

### Phase 5: Advanced Features (LOWER)
- [ ] Multi-location staff
- [ ] AI schedule optimization
- [ ] Skills matrix
- [ ] Training tracking
- [ ] HR integrations (Gusto, ADP)
- [ ] Calendar integrations

---

## Key Differentiators vs Fresha

| Feature | Mango POS | Fresha | Winner |
|---------|-----------|--------|--------|
| **Turn Tracking** | Comprehensive | Not available | **Mango** |
| **Offline Mode** | Full support | Not available | **Mango** |
| **Rotating Schedules** | 1-4 weeks | Unknown | **Mango** |
| **14 Specialized Roles** | Yes | Generic roles | **Mango** |
| **Granular Permissions** | 17 flags | Level-based | **Mango** |
| **Real-time Timesheets** | Phase 2 | Full | Fresha |
| **Pay Run Processing** | Phase 3 | Team Pay | Fresha |
| **Staff Ratings** | Phase 4 | Yes | Fresha |
| **Marketplace** | None | Yes | Fresha |

---

## Current File References

| Component | File Path |
|-----------|-----------|
| Types | `src/components/team-settings/types.ts` |
| Team Slice | `src/store/slices/teamSlice.ts` |
| UI Staff Slice | `src/store/slices/uiStaffSlice.ts` |
| Staff Slice | `src/store/slices/staffSlice.ts` |
| Team Settings UI | `src/components/team-settings/TeamSettings.tsx` |
| Turn Tracker | `src/components/TurnTracker/TurnTracker.tsx` |
| Database Ops | `src/db/teamOperations.ts` |
| Sync Middleware | `src/store/middleware/teamStaffSyncMiddleware.ts` |

---

## New Files to Create (Phase 2+)

| Component | Proposed Path | Phase |
|-----------|---------------|-------|
| Timesheet Slice | `src/store/slices/timesheetSlice.ts` | P2 |
| Timesheet Dashboard | `src/components/team-settings/sections/TimesheetSection.tsx` | P2 |
| Payroll Slice | `src/store/slices/payrollSlice.ts` | P3 |
| Pay Run UI | `src/components/payroll/PayRun.tsx` | P3 |
| Performance Dashboard | `src/components/team-settings/sections/PerformanceSection.tsx` | P4 |

---

## Key Data Types (Quick Reference)

```typescript
// Core entity
interface TeamMemberSettings {
  id: string;
  profile: TeamMemberProfile;
  professionalProfile: ProfessionalProfile;
  services: ServiceAssignment[];
  schedule: ScheduleSettings;
  permissions: RolePermissions;
  commission: CommissionSettings;
  wages: WageSettings;
  onlineBooking: OnlineBookingSettings;
  ratings: StaffRatings;
  performanceGoals: PerformanceGoals;
  notifications: NotificationPreferences;
  status: 'active' | 'inactive' | 'archived' | 'terminated';
}

// New in Phase 2
interface TimesheetEntry {
  staffId: string;
  date: string;
  actualClockIn: string;
  actualClockOut: string;
  breaks: BreakEntry[];
  status: 'pending' | 'approved' | 'disputed';
}

// New in Phase 3
interface PayRun {
  periodStart: string;
  periodEnd: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'processed';
  staffPayments: StaffPayment[];
}
```

---

## Business Rules (Key)

| Rule | Description |
|------|-------------|
| BR-TM-001 | Email must be unique per tenant |
| BR-TT-001 | Only clocked-in staff appear in turn tracker |
| BR-TT-002 | Turn adjustments require reason |
| BR-CM-002 | Tiered rates apply to period total, not per-service |
| BR-PR-001 | Pay run cannot be processed without approval |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Turn dispute reduction | 100% (zero disputes) |
| Payroll processing time | < 30 minutes |
| Timesheet accuracy | > 99% |
| Staff booking rate increase | +25% |
| Offline operation success | 100% |

---

*For complete details, see [docs/product/PRD-Team-Module.md](../docs/product/PRD-Team-Module.md)*
