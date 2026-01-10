# Check-In App PRD Review & Production Readiness Assessment

**Date**: January 9, 2026  
**Status**: Draft for Review  
**Reviewer**: Amp AI Agent

---

## Executive Summary

**Current State**: ~60-70% of MVP is already implemented in code.
**PRD Coverage**: Our Ralph PRD misses existing work and is not optimized for production.
**Recommendation**: Restructure PRD to align with actual codebase state + add critical production requirements.

---

## Part 1: What's Already Built

### ✅ Existing Implementation (Not In Our PRD)

| Component | Status | Lines | Coverage |
|-----------|--------|-------|----------|
| **Page Routing** | ✅ Complete | - | App.tsx has all 10 routes defined |
| **Welcome Screen** | ✅ 90% | 466 | Phone input, promo display, keyboard |
| **QR Scan** | ✅ Implemented | ~300 | html5-qrcode integration ready |
| **Verify Page** | ✅ Implemented | ~400 | Phone lookup + client display |
| **Signup Page** | ✅ 90% | ~500 | Registration form with validation |
| **Appointment Confirm** | ✅ Implemented | ~300 | QR appointment check-in |
| **Services Selection** | ✅ 95% | ~400 | Multi-select, filtering ready |
| **Technician Selection** | ✅ Implemented | ~400 | Status indicators, photo display |
| **Guests Page** | ✅ 95% | ~400 | Guest addition, party management |
| **Confirm Page** | ✅ 95% | ~350 | Review, queue position |
| **Success Page** | ✅ 90% | ~200 | Confirmation, thank you |
| **Config Types** | ✅ Complete | 160 | CheckInConfig with all settings |
| **Offline Banner** | ✅ Complete | ~100 | Global offline indicator |
| **Loading Skeleton** | ✅ Complete | ~150 | Loading states |
| **Error State** | ✅ Complete | ~150 | Error handling |

**Total Lines Already Written**: ~4,500+ LOC  
**Completion Level**: ~65-70%

---

## Part 2: Gap Analysis - What's Missing

### 🔴 Critical (Blocks Ralph/Production)

1. **Redux State Management** - NOT FOUND
   - No Redux store setup
   - No slices for: checkin, client, auth, ui, sync
   - No Redux thunks for API calls
   - Each page uses `useState` locally (anti-pattern)
   - **Impact**: Can't share state across pages, no sync queue
   - **Effort**: 1-2 stories

2. **DataService Integration** - NOT FOUND
   - Pages don't call dataService (no API integration)
   - No Supabase client setup
   - No type adapters
   - No IndexedDB/offline storage
   - **Impact**: App is UI-only, no actual functionality
   - **Effort**: 2-3 stories

3. **MQTT Real-Time** - NOT FOUND
   - No MQTT client connection to Store App
   - No queue position updates
   - No staff status updates
   - No check-in publish events
   - **Impact**: App can't communicate with POS
   - **Effort**: 1-2 stories

4. **Authentication Context** - NOT FOUND
   - No store/organization context
   - No user/staff authentication
   - No permission checks
   - **Impact**: App doesn't know which salon it's running in
   - **Effort**: 1 story

5. **Error Handling & Loading States** - PARTIAL
   - Components have error/loading files
   - But pages don't wire them up
   - No error boundaries
   - **Impact**: Poor user experience on failures
   - **Effort**: 1 story

### 🟡 Important (Impacts Quality)

1. **Testing** - MISSING
   - No unit tests for components
   - No integration tests
   - No E2E tests
   - **Effort**: 2-3 stories
   - **Current Coverage**: 0%
   - **Target**: 70%+

2. **Analytics/Event Tracking** - MISSING
   - No event tracking implemented
   - No funnel analytics setup
   - No metrics collection
   - **Impact**: Can't measure success
   - **Effort**: 1 story

3. **Security** - PARTIAL
   - No input validation at service layer
   - No rate limiting
   - No CSRF protection
   - No data sanitization
   - **Impact**: Vulnerable to attacks
   - **Effort**: 1-2 stories

4. **Accessibility** - MISSING
   - No ARIA labels
   - No keyboard navigation beyond mobile
   - No screen reader testing
   - No large text mode
   - **Impact**: Not WCAG 2.1 AA compliant
   - **Effort**: 1-2 stories

5. **Performance** - UNKNOWN
   - No bundle size analysis
   - No performance profiling
   - No image optimization
   - **Impact**: Kiosk may feel slow
   - **Effort**: 1 story

### 🟢 Nice to Have (Already Done or Low Priority)

- ✅ UI Components (Lucide icons, Tailwind)
- ✅ Page routing structure
- ✅ Configuration types
- ✅ Form inputs and validation basics
- ✅ Responsive design approach

---

## Part 3: Ralph PRD Issues

### ❌ Problems with Current PRD

1. **Doesn't Account for Existing Work**
   - Stories 1-7 assume starting from scratch
   - Actually, page layout is 90% done
   - Wastes 5-7 iterations on done work

2. **Missing Critical Path**
   - Redux (story 1) should be priority 0
   - DataService (story 2) should be priority 0.5
   - MQTT (story 3) should be priority 1
   - Ordering is wrong for integration

3. **No Production Requirements**
   - No testing strategy
   - No security hardening
   - No performance targets
   - No monitoring/alerts
   - No deployment checklist

4. **Missing Edge Cases**
   - Network failures
   - Sync conflicts
   - Offline scenario handling
   - Rate limiting
   - Data validation at boundaries

5. **No Environment Setup**
   - No .env.example
   - No local dev instructions
   - No database seeding
   - No MQTT broker setup

---

## Part 4: Production-Ready Recommendations

### Phase A: Foundation (Pre-Ralph Execution) - 3-4 days
**Must be done before Ralph starts optimally**

1. **Setup Redux + Store**
   - Create Redux store config
   - Define slices: checkin, client, auth, ui, sync
   - Add Redux DevTools

2. **Setup DataService Layer**
   - Create dataService.ts facade
   - Setup Supabase client
   - Create type adapters

3. **Setup MQTT Connection**
   - Initialize MQTT client
   - Define topic subscriptions
   - Create MQTT service

4. **Environment Configuration**
   - Create .env.example
   - Setup environment validation
   - Add config loading

5. **Error Boundaries & Global State**
   - Add React error boundary
   - Setup error context
   - Add loading context

**Effort**: ~200-300 LOC  
**Does NOT require Ralph** - Amp can do in one iteration

---

### Phase B: Ralph Stories (Revised Prioritization)

#### Tier 0 - FOUNDATION (Do First, Not In Ralph)
```json
{
  "id": "SETUP-001",
  "title": "Redux + DataService + MQTT Foundation",
  "priority": 0,
  "description": "Setup store, auth context, dataService layer, MQTT client. Do this with Amp first.",
  "passes": false
}
```

#### Tier 1 - INTEGRATION (Ralph Stories 1-5)
```json
[
  {
    "id": "CHECKIN-301",
    "title": "Connect Welcome/Verify to DataService (Phone Lookup)",
    "priority": 1,
    "description": "Wire Redux thunks to fetch client by phone from Supabase via dataService. Update Verify page to show real client data."
  },
  {
    "id": "CHECKIN-302",
    "title": "Connect Signup to DataService (Client Creation)",
    "priority": 2,
    "description": "Wire new client registration to Supabase. Handle duplicates, validation. Store in Redux."
  },
  {
    "id": "CHECKIN-303",
    "title": "Connect Services to DataService (Fetch Service Catalog)",
    "priority": 3,
    "description": "Fetch services from Supabase, cache in Redux. Handle offline with IndexedDB."
  },
  {
    "id": "CHECKIN-304",
    "title": "Connect Technician to DataService (Staff Status)",
    "priority": 4,
    "description": "Fetch technician list from Supabase. Subscribe to MQTT staff/status updates. Show real-time availability."
  },
  {
    "id": "CHECKIN-305",
    "title": "Connect Confirm to DataService (Check-In Creation)",
    "priority": 5,
    "description": "Create check-in in Supabase. Publish to MQTT salon/{id}/checkin/new. Generate check-in number, store in local queue."
  }
]
```

#### Tier 2 - REALTIME (Ralph Stories 6-8)
```json
[
  {
    "id": "CHECKIN-306",
    "title": "Queue Position & Wait Time (MQTT Subscribe)",
    "priority": 6,
    "description": "Subscribe to salon/{id}/queue/status from Store App. Update queue position in real-time. Persist to Redux + IndexedDB."
  },
  {
    "id": "CHECKIN-307",
    "title": "Client Called Handler (MQTT Subscribe)",
    "priority": 7,
    "description": "Subscribe to salon/{id}/checkin/called. Navigate to confirmation page when called. Play sound/vibration."
  },
  {
    "id": "CHECKIN-308",
    "title": "Offline Mode - IndexedDB Sync Queue",
    "priority": 8,
    "description": "Setup Dexie.js for offline storage. Queue check-ins when offline. Sync when reconnected. Handle conflicts."
  }
]
```

#### Tier 3 - FEATURES (Ralph Stories 9-13)
```json
[
  {
    "id": "CHECKIN-309",
    "title": "Guest Check-In with MQTT Publish",
    "priority": 9,
    "description": "Wire guest selection to create guest entries. Publish guest updates to MQTT."
  },
  {
    "id": "CHECKIN-310",
    "title": "QR Code Appointment Lookup",
    "priority": 10,
    "description": "Decode QR → fetch appointment from Supabase → pre-fill services/technician."
  },
  {
    "id": "CHECKIN-311",
    "title": "SMS Opt-In & Notification Integration",
    "priority": 11,
    "description": "Capture SMS consent. Integrate with SMS service for queue notifications."
  },
  {
    "id": "CHECKIN-312",
    "title": "Admin Mode for Staff Assistance",
    "priority": 12,
    "description": "Staff button opens admin interface. Allow manual check-in override. Require authentication."
  },
  {
    "id": "CHECKIN-313",
    "title": "Analytics Event Tracking",
    "priority": 13,
    "description": "Track: checkin_started, services_selected, technician_selected, checkin_completed, abandoned. Send to analytics service."
  }
]
```

#### Tier 4 - QUALITY (Ralph Stories 14-18)
```json
[
  {
    "id": "CHECKIN-314",
    "title": "Accessibility (WCAG 2.1 AA)",
    "priority": 14,
    "description": "Add ARIA labels, keyboard navigation, screen reader support. Large text mode. Test with accessibility tools."
  },
  {
    "id": "CHECKIN-315",
    "title": "Security Hardening",
    "priority": 15,
    "description": "Input validation, rate limiting, CSRF protection, data sanitization. Security audit."
  },
  {
    "id": "CHECKIN-316",
    "title": "Unit Tests (70% Coverage)",
    "priority": 16,
    "description": "Redux thunks, dataService, utilities. Test critical paths: phone lookup, check-in creation, MQTT sync."
  },
  {
    "id": "CHECKIN-317",
    "title": "E2E Tests (Happy Path + Edge Cases)",
    "priority": 17,
    "description": "E2E tests: returning client check-in, new client registration, guest addition, offline sync."
  },
  {
    "id": "CHECKIN-318",
    "title": "Performance & Bundle Optimization",
    "priority": 18,
    "description": "Analyze bundle size. Code split by route. Lazy load images. Target <500KB gzipped."
  }
]
```

---

## Part 5: Production Checklist

**Before deploying Check-In App to production:**

### Security ✅
- [ ] Supabase credentials in env vars (not hardcoded)
- [ ] Input validation at all boundaries
- [ ] Rate limiting on check-in endpoint
- [ ] CSRF tokens for API calls
- [ ] No sensitive data in Redux DevTools
- [ ] SQLi/XSS protection via Supabase RLS

### Data & Sync ✅
- [ ] IndexedDB sync queue tested
- [ ] Offline mode tested (no internet)
- [ ] Conflict resolution tested (dual check-ins)
- [ ] Data consistency with Store App verified
- [ ] MQTT connection fallback working
- [ ] Audit trail for check-ins (who, when, what)

### Performance ✅
- [ ] Bundle size < 500KB gzipped
- [ ] Page load < 2 seconds
- [ ] Check-in submit < 500ms
- [ ] MQTT message latency < 200ms
- [ ] No memory leaks (Chrome DevTools)
- [ ] No janky animations

### Reliability ✅
- [ ] Error boundaries catch all crashes
- [ ] Graceful degradation when APIs fail
- [ ] Automatic retry with exponential backoff
- [ ] Error logging to monitoring service
- [ ] Health check endpoint
- [ ] Database connection pooling

### Testing ✅
- [ ] Unit test coverage ≥ 70%
- [ ] Integration tests for dataService
- [ ] E2E tests for critical paths
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Cross-device testing (7", 10" tablets)
- [ ] Network throttling tests

### Monitoring ✅
- [ ] Event tracking in place
- [ ] Error logging to Sentry/Datadog
- [ ] Performance monitoring
- [ ] Queue depth metrics
- [ ] Check-in funnel analytics
- [ ] Device uptime tracking

### Operations ✅
- [ ] Deployment pipeline (GitHub Actions)
- [ ] Rollback procedure documented
- [ ] Feature flags for gradual rollout
- [ ] Admin dashboard for monitoring
- [ ] Configuration management
- [ ] User documentation + training

---

## Part 6: Revised Ralph Strategy

### Recommendation: Two-Phase Approach

**Phase 1: Foundation Setup (Amp, 1 iteration)**
- Setup Redux store
- Setup DataService + Supabase
- Setup MQTT client
- Create environment validation
- Add error boundaries

**Phase 2: Ralph Execution (18 stories, ~18 iterations)**
- Integration stories 1-5 (wire existing pages to backend)
- Realtime stories 6-8 (MQTT + offline)
- Feature stories 9-13 (guests, SMS, QR, admin)
- Quality stories 14-18 (testing, security, performance)

**Total Effort**: ~3-4 weeks  
**Output**: Production-ready Check-In App

---

## Part 7: Updated PRD JSON Structure

```json
{
  "branchName": "ralph/check-in-production",
  "version": "2.0",
  "phases": [
    {
      "name": "Foundation (Do with Amp first)",
      "status": "not-started",
      "stories": [
        { "id": "SETUP-001", "title": "Redux + DataService + MQTT Foundation" }
      ]
    },
    {
      "name": "Integration (Tier 1-2, Ralph Stories 1-8)",
      "status": "not-started",
      "stories": [
        { "id": "CHECKIN-301", "priority": 1, "title": "Connect Welcome/Verify to DataService" },
        { "id": "CHECKIN-302", "priority": 2, "title": "Connect Signup to DataService" },
        ...
      ]
    },
    {
      "name": "Features (Tier 3, Ralph Stories 9-13)",
      "status": "not-started",
      "stories": [...]
    },
    {
      "name": "Quality (Tier 4, Ralph Stories 14-18)",
      "status": "not-started",
      "stories": [...]
    }
  ]
}
```

---

## Part 8: Key Insights & Lessons

### What Worked ✅
1. Page structure is well-designed
2. All UI components are in place
3. Config types show good planning
4. Routing architecture is solid

### What's Missing 🚨
1. **Integration Layer**: No backend connection
2. **State Management**: Each page is isolated
3. **Real-time Communication**: No MQTT
4. **Testing**: 0% coverage
5. **Documentation**: No architecture docs

### Critical Path 🔴
The app will NOT work until:
1. Redux is setup
2. DataService connects to Supabase
3. Pages wire to Redux thunks
4. MQTT publishes check-ins to Store App

These must happen FIRST, before Ralph tackles individual features.

---

## Recommendations Summary

| Action | Priority | Effort | Owner |
|--------|----------|--------|-------|
| **Audit existing code** | 🔴 ASAP | 4h | Amp |
| **Setup Redux/DataService (Phase 1)** | 🔴 ASAP | 1d | Amp |
| **Execute Ralph Tier 1 (Integration)** | 🔴 Week 1 | 1w | Ralph |
| **Execute Ralph Tier 2 (Realtime)** | 🟡 Week 2 | 1w | Ralph |
| **Execute Ralph Tier 3 (Features)** | 🟡 Week 3 | 1w | Ralph |
| **Execute Ralph Tier 4 (Quality)** | 🟡 Week 4 | 1w | Ralph |
| **Production validation** | 🟡 Week 5 | 3d | Team |
| **Deploy to staging** | 🟡 Week 5 | 1d | DevOps |
| **Deploy to production** | 🟡 Week 6 | 1d | DevOps |

---

**Next Steps:**
1. ✅ Review this assessment
2. ⏳ Approve Phase 1 (Foundation)
3. ⏳ Amp executes Phase 1
4. ⏳ Review + update Ralph PRD
5. ⏳ Ralph runs Phases 2-4

