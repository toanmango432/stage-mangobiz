# 🧹 Codebase Cleanup Implementation Plan

**Created:** December 20, 2025  
**Goal:** Transform the codebase into a well-structured, scalable, and clean architecture  
**Estimated Time:** 3-5 days (can be done incrementally)  
**Risk Level:** Low-Medium (all changes are reversible)

---

## 📋 Table of Contents

1. [Pre-Cleanup Checklist](#pre-cleanup-checklist)
2. [Phase 1: Root Directory Cleanup](#phase-1-root-directory-cleanup)
3. [Phase 2: Archive Experimental Modules](#phase-2-archive-experimental-modules)
4. [Phase 3: Consolidate src/ Top-Level Folders](#phase-3-consolidate-src-top-level-folders)
5. [Phase 4: Reorganize Components](#phase-4-reorganize-components)
6. [Phase 5: Split Giant Components](#phase-5-split-giant-components)
7. [Phase 6: Standardize Naming Conventions](#phase-6-standardize-naming-conventions)
8. [Phase 7: Final Cleanup & Verification](#phase-7-final-cleanup--verification)
9. [Target Structure](#target-structure)

---

## 🔒 Pre-Cleanup Checklist

**CRITICAL: Do these before ANY changes**

```bash
# 1. Ensure you're on a clean branch
git status
git checkout -b cleanup/codebase-restructure

# 2. Verify the app builds and runs
npm run build
npm run dev  # Test manually

# 3. Run existing tests
npm test

# 4. Create a backup tag
git tag backup-before-cleanup-$(date +%Y%m%d)
```

### Files That MUST NOT Be Moved/Deleted
- `src/App.tsx` - Main app entry
- `src/index.tsx` - React entry point
- `src/store/` - Redux store (critical)
- `src/services/supabase/` - Database layer (critical)
- `src/db/` - IndexedDB layer (critical)
- `package.json`, `vite.config.ts`, `tsconfig.json` - Build config
- `.env`, `.env.example` - Environment config
- `CLAUDE.md` - AI instructions (keep at root)
- `README.md` - Project readme (keep at root)

---

## Phase 1: Root Directory Cleanup

**Goal:** Clean root directory to only essential files  
**Time:** 30 minutes  
**Risk:** Very Low

### 1.1 Move Analysis/Documentation Files to `docs/`

```bash
# Create docs subdirectories
mkdir -p docs/analysis
mkdir -p docs/implementation

# Move analysis files
mv CODEBASE_STRUCTURE_ANALYSIS.md docs/analysis/
mv DATA_FLOW_ANALYSIS.md docs/analysis/
mv DATA_FLOW_REVIEW_UPDATE.md docs/analysis/
mv DATA_RELATIONSHIP_VERIFICATION.md docs/analysis/
mv PRODUCTION_READINESS_ASSESSMENT.md docs/analysis/
mv AUDIT_SUMMARY.txt docs/analysis/
mv FINDINGS_SUMMARY.txt docs/analysis/

# Move implementation files
mv IMPLEMENTATION_COMPLETE.md docs/implementation/
mv IMPLEMENTATION_PLAN.md docs/implementation/
mv PRODUCTION_READINESS_IMPLEMENTATION_PLAN.md docs/implementation/
mv MIGRATION_GUIDE.md docs/implementation/
```

### 1.2 Delete/Archive Orphan Files

```bash
# Archive random files (review first, then delete if not needed)
mkdir -p archive/misc

# Move orphan files to archive
mv 2d5f95f3-e0de-4921-9291-1801d4d284bd.zip archive/misc/
mv ticket-preview.html archive/misc/
mv ticket-preview-accurate.html archive/misc/
mv adapt-reference.py archive/misc/
mv test-anthropic.ts archive/misc/
mv merge-design.cjs archive/misc/
mv fix-ts-errors.sh archive/misc/
mv build-final.sh archive/misc/

# Add archive to .gitignore
echo "archive/" >> .gitignore
```

### 1.3 Verification
```bash
# Root should now only have:
ls -la
# Expected: .env, .eslintrc.cjs, .gitignore, CLAUDE.md, Dockerfile, 
#           README.md, docker-compose.yml, index.html, nginx.conf,
#           package.json, package-lock.json, playwright.config.ts,
#           postcss.config.js, tailwind.config.js, tsconfig.json,
#           tsconfig.node.json, vercel.json, vite.config.ts, vitest.config.ts
#           + directories: docs/, src/, public/, scripts/, supabase/, backend/, e2e/
```

---

## Phase 2: Archive Experimental Modules

**Goal:** Remove duplicate/experimental modules that are not in use  
**Time:** 30 minutes  
**Risk:** Low (verified not imported anywhere)

### 2.1 Verify Modules Are Not Used

```bash
# Search for imports from these modules (should return nothing)
grep -r "from.*temp-checkout-module" src/
grep -r "from.*PosCheckoutModule" src/
grep -r "from.*temp-schedule-module" src/
grep -r "from.*tasks/" src/
```

### 2.2 Archive Experimental Modules

```bash
# Create archive directory
mkdir -p archive/experimental-modules

# Move experimental modules
mv temp-checkout-module archive/experimental-modules/
mv temp-schedule-module archive/experimental-modules/
mv PosCheckoutModule archive/experimental-modules/

# Move tasks (planning docs, not code)
mv tasks docs/tasks
```

### 2.3 Verification
```bash
# Verify app still builds
npm run build

# Verify app still runs
npm run dev
```

---

## Phase 3: Consolidate src/ Top-Level Folders

**Goal:** Reduce from 19 to ~12 well-organized top-level folders  
**Time:** 1 hour  
**Risk:** Medium (requires import updates)

### 3.1 Merge Testing Folders

```bash
# Merge tests/ into testing/
mv src/tests/* src/testing/
rmdir src/tests

# Update any imports if needed
grep -r "from.*tests/" src/ --include="*.ts" --include="*.tsx"
```

### 3.2 Remove Empty/Minimal Folders

```bash
# Check what's in these folders
ls -la src/lib/
ls -la src/features/
ls -la src/routes/
ls -la src/pages/
ls -la src/styles/

# If lib/ only has utils.ts, move to utils/
mv src/lib/utils.ts src/utils/lib-utils.ts
rmdir src/lib

# If features/ is empty or has 1 item, evaluate moving contents
# If routes/ has 1 file, consider moving to App.tsx or components/
# If styles/ has 1 file, move to index.css or constants/
```

### 3.3 Consolidate Contexts and Providers

```bash
# Check contents
ls -la src/contexts/
ls -la src/providers/

# If small, merge into one folder
mkdir -p src/providers
mv src/contexts/* src/providers/
rmdir src/contexts

# Update imports
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|from.*contexts/|from "@/providers/|g' {} \;
```

### 3.4 Target src/ Structure After Phase 3

```
src/
├── admin/           # Admin portal
├── api/             # API utilities
├── components/      # React components
├── constants/       # Design tokens, config
├── data/            # Static data, seeds
├── db/              # IndexedDB operations
├── design-system/   # Design system docs
├── hooks/           # Custom React hooks
├── i18n/            # Internationalization
├── providers/       # React contexts & providers (merged)
├── services/        # Business services
├── store/           # Redux store
├── testing/         # Test utilities (merged)
├── types/           # TypeScript types
├── utils/           # Utility functions
├── App.tsx
├── AppRouter.tsx
├── index.tsx
└── index.css
```

---

## Phase 4: Reorganize Components

**Goal:** Move flat component files into proper feature folders  
**Time:** 2-3 hours  
**Risk:** Medium (many import updates)

### 4.1 Create Component Index

First, document what goes where:

| Current Location | Target Location | Reason |
|------------------|-----------------|--------|
| `FrontDesk.tsx` | `frontdesk/FrontDesk.tsx` | Main frontdesk component |
| `FrontDeskMetrics.tsx` | `frontdesk/FrontDeskMetrics.tsx` | Frontdesk feature |
| `FrontDeskSettings.tsx` | `frontdesk/settings/FrontDeskSettings.tsx` | Frontdesk settings |
| `StaffCard.tsx` | `staff/StaffCard/index.tsx` | Staff feature (split later) |
| `StaffSidebar.tsx` | `staff/StaffSidebar.tsx` | Staff feature |
| `TeamSettingsPanel.tsx` | `team-settings/TeamSettingsPanel.tsx` | Team settings |
| `TurnQueue.tsx` | `turn-tracker/TurnQueue.tsx` | Turn tracker feature |
| `TurnQueueSettings.tsx` | `turn-tracker/TurnQueueSettings.tsx` | Turn tracker feature |
| `WaitListSection.tsx` | `frontdesk/WaitListSection.tsx` | Frontdesk feature |
| `ServiceSection.tsx` | `frontdesk/ServiceSection.tsx` | Frontdesk feature |
| `ClosedTickets.tsx` | `tickets/ClosedTickets.tsx` | Tickets feature |
| `PendingTickets.tsx` | `tickets/PendingTickets.tsx` | Tickets feature |
| `ComingAppointments.tsx` | `Book/ComingAppointments.tsx` | Book feature |
| `OperationTemplateSetup.tsx` | `settings/OperationTemplateSetup.tsx` | Settings |
| `HeaderColorPreview.tsx` | `settings/HeaderColorPreview.tsx` | Settings |
| `TicketColorPreview.tsx` | `settings/TicketColorPreview.tsx` | Settings |

### 4.2 Move FrontDesk Components

```bash
cd src/components

# Move main FrontDesk files
mv FrontDesk.tsx frontdesk/
mv FrontDeskMetrics.tsx frontdesk/
mv WaitListSection.tsx frontdesk/
mv ServiceSection.tsx frontdesk/

# Create settings subfolder
mkdir -p frontdesk/settings
mv FrontDeskSettings.tsx frontdesk/settings/

# Update barrel export
cat > frontdesk/index.ts << 'EOF'
export { FrontDesk } from './FrontDesk';
export { FrontDeskMetrics } from './FrontDeskMetrics';
export { WaitListSection } from './WaitListSection';
export { ServiceSection } from './ServiceSection';
export { FrontDeskSettings } from './settings/FrontDeskSettings';
EOF
```

### 4.3 Move Staff Components

```bash
# Create staff folder structure
mkdir -p staff

# Move staff-related components
mv StaffCard.tsx staff/
mv StaffSidebar.tsx staff/
# Note: StaffCard/ folder already exists, will consolidate in Phase 5

# Create barrel export
cat > staff/index.ts << 'EOF'
export { StaffCard } from './StaffCard';
export { StaffSidebar } from './StaffSidebar';
EOF
```

### 4.4 Move Turn Tracker Components

```bash
# Move to TurnTracker folder (already exists)
mv TurnQueue.tsx TurnTracker/
mv TurnQueueSettings.tsx TurnTracker/

# Update barrel export
cat > TurnTracker/index.ts << 'EOF'
export { TurnQueue } from './TurnQueue';
export { TurnQueueSettings } from './TurnQueueSettings';
// ... existing exports
EOF
```

### 4.5 Move Ticket Components

```bash
# Move to tickets folder (already exists)
mv ClosedTickets.tsx tickets/
mv PendingTickets.tsx tickets/

# Update barrel export
```

### 4.6 Move Settings Components

```bash
# Create settings folder
mkdir -p settings

mv OperationTemplateSetup.tsx settings/
mv HeaderColorPreview.tsx settings/
mv TicketColorPreview.tsx settings/
mv TeamSettingsPanel.tsx settings/

# Create barrel export
cat > settings/index.ts << 'EOF'
export { OperationTemplateSetup } from './OperationTemplateSetup';
export { HeaderColorPreview } from './HeaderColorPreview';
export { TicketColorPreview } from './TicketColorPreview';
export { TeamSettingsPanel } from './TeamSettingsPanel';
EOF
```

### 4.7 Move Remaining Flat Files

```bash
# Move appointment-related
mv ComingAppointments.tsx Book/

# Move ticket-related
mv AssignTicketModal.tsx tickets/
mv CompleteTicketModal.tsx tickets/
mv CreateTicketModal.tsx tickets/
mv EditTicketModal.tsx tickets/
mv TicketDetailsModal.tsx tickets/
mv TicketActions.tsx tickets/

# Move common/shared
mv Toast.tsx common/
mv NetworkStatus.tsx common/
mv OfflineIndicator.tsx common/
mv SyncStatusBar.tsx common/
mv FloatingActionButton.tsx common/
mv AnnouncementBanner.tsx common/
mv CreateTicketButton.tsx common/
mv AssignedStaffBadge.tsx common/
mv ServiceStatusBadge.tsx common/
mv PaymentProcessModal.tsx checkout/
```

### 4.8 Update All Imports

```bash
# Use find and sed to update imports
# Example for FrontDesk:
find src -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -exec grep -l "from.*components/FrontDesk" {} \; \
  -exec sed -i '' 's|from.*components/FrontDesk|from "@/components/frontdesk"|g' {} \;

# Repeat for each moved component
# OR use IDE refactoring tools (recommended)
```

### 4.9 Verification

```bash
# Check for broken imports
npm run build

# Run TypeScript check
npx tsc --noEmit

# Test the app
npm run dev
```

---

## Phase 5: Split Giant Components

**Goal:** Break down components >50KB into manageable subcomponents  
**Time:** 4-6 hours (can be done incrementally)  
**Risk:** Medium-High (requires careful refactoring)

### 5.1 Priority List (by size)

| Component | Size | Priority | Split Strategy |
|-----------|------|----------|----------------|
| `TicketPanel.tsx` | 152KB | 🔴 Critical | Split into folder with 8-10 subcomponents |
| `StaffCard.tsx` | 120KB | 🔴 Critical | Split into folder with 6-8 subcomponents |
| `FrontDeskSettings.tsx` | 97KB | 🔴 Critical | Split into settings sections |
| `NewAppointmentModal.v2.tsx` | 96KB | 🟡 High | Split into form sections |
| `OperationTemplateSetup.tsx` | 81KB | 🟡 High | Split into template sections |
| `WaitListSection.tsx` | 63KB | 🟡 High | Split into subcomponents |
| `ServiceSection.tsx` | 60KB | 🟡 High | Split into subcomponents |
| `FrontDesk.tsx` | 53KB | 🟢 Medium | Extract view components |

### 5.2 Split TicketPanel.tsx (Example)

**Target Structure:**
```
checkout/
├── TicketPanel/
│   ├── index.tsx              # Main component (orchestration only)
│   ├── TicketHeader.tsx       # Header section
│   ├── TicketItemList.tsx     # Line items list
│   ├── TicketTotals.tsx       # Subtotal, tax, total
│   ├── TicketActions.tsx      # Action buttons
│   ├── TicketPayment.tsx      # Payment section
│   ├── TicketNotes.tsx        # Notes section
│   ├── TicketDiscounts.tsx    # Discounts section
│   ├── hooks/
│   │   ├── useTicketPanel.ts  # Main hook
│   │   ├── useTicketItems.ts  # Items logic
│   │   └── useTicketPayment.ts # Payment logic
│   ├── types.ts               # Local types
│   └── constants.ts           # Local constants
├── TicketPanel.tsx            # DELETE after migration
```

**Migration Steps:**
1. Create the folder structure
2. Extract types and constants first
3. Extract hooks (business logic)
4. Extract UI subcomponents one by one
5. Update main component to compose subcomponents
6. Test thoroughly
7. Delete old monolith file

### 5.3 Split StaffCard.tsx (Example)

**Target Structure:**
```
staff/
├── StaffCard/
│   ├── index.tsx              # Main component
│   ├── StaffCardHeader.tsx    # Avatar, name, status
│   ├── StaffCardSchedule.tsx  # Schedule section
│   ├── StaffCardTickets.tsx   # Active tickets
│   ├── StaffCardMetrics.tsx   # Performance metrics
│   ├── StaffCardActions.tsx   # Action buttons
│   ├── hooks/
│   │   └── useStaffCard.ts
│   └── types.ts
```

### 5.4 Remove Duplicate Component Versions

```bash
# After verifying v2 is the canonical version:
cd src/components/Book

# Rename v2 to main
mv NewAppointmentModal.v2.tsx NewAppointmentModal.tsx

# Update all imports
find src -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i '' 's|NewAppointmentModal.v2|NewAppointmentModal|g' {} \;

# Delete old version if it exists and is not used
# (verify first!)
```

---

## Phase 6: Standardize Naming Conventions

**Goal:** Consistent naming across the codebase  
**Time:** 1-2 hours  
**Risk:** Low-Medium

### 6.1 Naming Standards

| Type | Convention | Example |
|------|------------|---------|
| **Component folders** | `kebab-case` | `front-desk/`, `turn-tracker/` |
| **Component files** | `PascalCase.tsx` | `FrontDesk.tsx`, `StaffCard.tsx` |
| **Hook files** | `camelCase.ts` | `useFrontDesk.ts`, `useStaffCard.ts` |
| **Utility files** | `camelCase.ts` | `formatDate.ts`, `validateInput.ts` |
| **Type files** | `camelCase.ts` | `appointment.ts`, `ticket.ts` |
| **Constant files** | `camelCase.ts` | `designSystem.ts`, `routes.ts` |
| **Test files** | `*.test.ts(x)` | `FrontDesk.test.tsx` |

### 6.2 Rename Inconsistent Folders

```bash
cd src/components

# Rename PascalCase folders to kebab-case
mv Book book
mv StaffCard staff-card
mv StaffManagement staff-management
mv TurnTracker turn-tracker
mv TurnTrackerButton turn-tracker-button
mv TicketManagement ticket-management
mv TimeOff time-off

# Update all imports
find src -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i '' 's|components/Book|components/book|g' {} \;
# ... repeat for each renamed folder
```

### 6.3 Create Barrel Exports for All Feature Folders

Every feature folder should have an `index.ts`:

```typescript
// src/components/book/index.ts
export { BookSidebar } from './BookSidebar';
export { CalendarHeader } from './CalendarHeader';
export { DaySchedule } from './DaySchedule.v2';
export { NewAppointmentModal } from './NewAppointmentModal';
// ... etc
```

---

## Phase 7: Final Cleanup & Verification

**Goal:** Ensure everything works and is clean  
**Time:** 1-2 hours  
**Risk:** Low

### 7.1 Run Full Verification

```bash
# 1. TypeScript check
npx tsc --noEmit

# 2. ESLint check
npm run lint

# 3. Build check
npm run build

# 4. Test check
npm test

# 5. Manual testing
npm run dev
# Test all major flows:
# - Login
# - Front Desk views
# - Booking flow
# - Checkout flow
# - Settings
```

### 7.2 Update Documentation

1. Update `CLAUDE.md` with new folder structure
2. Update `README.md` if needed
3. Update any architecture docs in `docs/`

### 7.3 Clean Up Unused Files

```bash
# Find potentially unused files
npx ts-prune

# Find unused dependencies
npx depcheck

# Remove unused imports
npx eslint --fix src/
```

### 7.4 Commit Strategy

```bash
# Commit each phase separately for easy rollback
git add .
git commit -m "Phase 1: Clean up root directory"

git add .
git commit -m "Phase 2: Archive experimental modules"

# ... etc

# Final merge
git checkout main
git merge cleanup/codebase-restructure
```

---

## 🎯 Target Structure

### Root Directory (After Cleanup)
```
/Mango POS Offline V2/
├── .env
├── .env.example
├── .eslintrc.cjs
├── .gitignore
├── CLAUDE.md
├── Dockerfile
├── README.md
├── docker-compose.yml
├── index.html
├── nginx.conf
├── package.json
├── package-lock.json
├── playwright.config.ts
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.node.json
├── vercel.json
├── vite.config.ts
├── vitest.config.ts
├── docs/                    # All documentation
├── src/                     # Source code
├── public/                  # Static assets
├── scripts/                 # Build/deploy scripts
├── supabase/                # Supabase config
├── backend/                 # Backend code (if any)
└── e2e/                     # E2E tests
```

### src/ Directory (After Cleanup)
```
src/
├── admin/                   # Admin portal
├── api/                     # API utilities
├── components/              # React components (reorganized)
│   ├── book/               # Booking module
│   ├── checkout/           # Checkout module
│   ├── common/             # Shared components
│   ├── frontdesk/          # Front desk module
│   ├── staff/              # Staff components
│   ├── tickets/            # Ticket components
│   ├── turn-tracker/       # Turn tracker
│   ├── settings/           # Settings components
│   ├── ui/                 # Base UI components
│   └── ... (other features)
├── constants/               # Design tokens, config
├── db/                      # IndexedDB operations
├── hooks/                   # Custom React hooks
├── providers/               # React contexts & providers
├── services/                # Business services
├── store/                   # Redux store
├── testing/                 # Test utilities
├── types/                   # TypeScript types
├── utils/                   # Utility functions
├── App.tsx
├── AppRouter.tsx
├── index.tsx
└── index.css
```

### components/ Directory (After Cleanup)
```
components/
├── book/                    # Booking/Calendar
│   ├── index.ts
│   ├── BookSidebar.tsx
│   ├── CalendarHeader.tsx
│   ├── DaySchedule.tsx      # (renamed from v2)
│   ├── NewAppointmentModal/  # (split into folder)
│   │   ├── index.tsx
│   │   ├── ClientSection.tsx
│   │   ├── ServiceSection.tsx
│   │   ├── TimeSection.tsx
│   │   └── hooks/
│   └── ...
├── checkout/
│   ├── index.ts
│   ├── CheckoutScreen.tsx
│   ├── TicketPanel/         # (split into folder)
│   │   ├── index.tsx
│   │   ├── TicketHeader.tsx
│   │   ├── TicketItems.tsx
│   │   ├── TicketTotals.tsx
│   │   └── hooks/
│   └── ...
├── common/                  # Shared components
│   ├── index.ts
│   ├── Toast.tsx
│   ├── NetworkStatus.tsx
│   ├── OfflineIndicator.tsx
│   └── ...
├── frontdesk/
│   ├── index.ts
│   ├── FrontDesk.tsx
│   ├── FrontDeskMetrics.tsx
│   ├── WaitListSection.tsx
│   ├── ServiceSection.tsx
│   ├── settings/
│   │   └── FrontDeskSettings/  # (split into folder)
│   └── ...
├── staff/
│   ├── index.ts
│   ├── StaffCard/           # (split into folder)
│   │   ├── index.tsx
│   │   ├── StaffCardHeader.tsx
│   │   ├── StaffCardSchedule.tsx
│   │   └── hooks/
│   └── StaffSidebar.tsx
├── tickets/
│   ├── index.ts
│   ├── ClosedTickets.tsx
│   ├── PendingTickets.tsx
│   └── ...
├── turn-tracker/
│   ├── index.ts
│   ├── TurnQueue.tsx
│   ├── TurnQueueSettings.tsx
│   └── ...
├── settings/
│   ├── index.ts
│   ├── TeamSettingsPanel.tsx
│   ├── OperationTemplateSetup.tsx
│   └── ...
└── ui/                      # Base UI (shadcn/radix)
    ├── index.ts
    ├── button.tsx
    ├── dialog.tsx
    └── ...
```

---

## 📊 Success Metrics

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| Root directory files | 30+ | ~15 | ✅ |
| Experimental folders | 3 | 0 | ✅ |
| src/ top-level folders | 19 | ~12 | ✅ |
| Flat component files | 25+ | 0 | ✅ |
| Components >50KB | 8 | 0 | ✅ |
| Duplicate versions | 3+ | 0 | ✅ |
| Naming inconsistencies | Many | 0 | ✅ |

---

## ⚠️ Rollback Plan

If anything goes wrong:

```bash
# Option 1: Revert specific commit
git revert <commit-hash>

# Option 2: Reset to backup tag
git reset --hard backup-before-cleanup-YYYYMMDD

# Option 3: Cherry-pick working commits
git cherry-pick <good-commit-hash>
```

---

## 📝 Notes

1. **Do phases incrementally** - Don't try to do everything at once
2. **Commit after each phase** - Makes rollback easier
3. **Test after each phase** - Catch issues early
4. **Use IDE refactoring** - VS Code/WebStorm can update imports automatically
5. **Pair program if possible** - Two eyes catch more issues
6. **Skip Phase 5 initially** - Splitting giant components is time-consuming; can be done later

---

**Document Version:** 1.0  
**Last Updated:** December 20, 2025
