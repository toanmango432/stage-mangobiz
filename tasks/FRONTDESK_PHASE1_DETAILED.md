# Front Desk Module - Phase 1 Detailed Implementation Plan

## Overview
**Timeline:** Week 1
**Goal:** Fix critical visual and UX issues to achieve production quality
**Risk Level:** Low to Medium (mostly additive changes)

---

## Existing Design System Reference

### Color Sources (MUST USE THESE)

**1. Tailwind Config (`tailwind.config.js`)** - Front Desk Module Colors:
```javascript
waitList: {        // Purple for Waiting
  500: '#A855F7',  // Primary
  50-900: full scale
},
service: {         // Green for In Service
  500: '#22C55E',  // Primary
  50-900: full scale
},
comingAppointments: {  // Sky Blue
  500: '#0EA5E9',      // Primary
  50-900: full scale
},
pendingTickets: {  // Gold for Pending
  500: '#F59E0B',  // Primary
  50-900: full scale
},
closedTickets: {   // Slate for Closed
  400: '#94A3B8',  // Primary
  50-900: full scale
}
```

**2. Premium Design Tokens (`premiumDesignTokens.ts`):**
```typescript
PremiumColors.status.waiting.icon: '#D97706'    // Amber-600
PremiumColors.status.inService.icon: '#059669'  // Emerald-600
PremiumColors.text.primary: '#111827'           // Gray-900
PremiumColors.text.secondary: '#6B7280'         // Gray-500
PremiumColors.text.tertiary: '#9CA3AF'          // Gray-400
```

**3. Design System (`designSystem.ts`):**
```typescript
colors.neutral: { 50-900 scale }
colors.text: { primary, secondary, disabled, inverse }
colors.border: { light, medium, dark }
spacing: { 8px grid }
transitions: { fast: 150ms, base: 200ms, slow: 300ms }
```

### Usage Rules
1. Use Tailwind classes: `bg-waitList-50`, `text-service-600`, etc.
2. Use neutral colors from Tailwind: `text-gray-900`, `bg-gray-50`
3. NO hardcoded hex values in components
4. Reference `designSystem.ts` for spacing/transitions
5. Reference `premiumDesignTokens.ts` for ticket-specific styles

---

## Phase 1 Tasks Breakdown

### Task 1.1: Fix Visual Hierarchy in Combined View Tabs
**Priority:** Critical
**Estimated Effort:** 2-3 hours
**Files to modify:**
- `src/components/FrontDesk.tsx` (lines 615-759)
- `src/components/frontdesk/headerTokens.ts`

#### Problem Analysis
The combined view tabs (In Service / Waiting) at line 615 use styling that competes with the main header:
```jsx
// Current styling - too prominent
className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg
  text-sm font-medium transition-all duration-150 min-h-[36px]
  ${activeCombinedTab === 'service'
    ? 'text-gray-900 bg-white shadow-sm border border-gray-200'  // Too prominent
    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
  }`}
```

#### Implementation Steps

**Step 1.1a: Add subordinate tab theme to headerTokens.ts**
```typescript
// Add to headerTokens.ts - using designSystem neutrals
export const subordinateTabTheme = {
  container: 'bg-surface-secondary border-b border-gray-100',  // Use surface tokens
  tab: {
    base: 'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 min-h-[32px]',
    active: 'text-gray-700 bg-white shadow-premium-xs border border-gray-200/60',
    inactive: 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/60',
  },
  countBadge: {
    active: 'bg-gray-100 text-gray-600 text-2xs px-1.5 py-0.5 rounded-full min-w-[18px]',
    inactive: 'bg-gray-100/70 text-gray-400 text-2xs px-1.5 py-0.5 rounded-full min-w-[18px]',
  },
  icon: {
    active: 'text-gray-600',
    inactive: 'text-gray-300',
  },
};
```

**Step 1.1b: Update FrontDesk.tsx combined view tabs**
- Reduce tab container height from h-11 to h-10
- Reduce tab font size from text-sm to text-xs
- Reduce tab padding from px-3 py-1.5 to px-2.5 py-1
- Reduce count badge size from text-xs to text-2xs (custom in tailwind)
- Lighten inactive tab color from text-gray-500 to text-gray-400
- Import and use subordinateTabTheme

**Validation:**
- [ ] Main header visually more prominent than sub-tabs
- [ ] Clear visual separation between navigation levels
- [ ] Tabs still readable and accessible (min touch target 44px maintained)

---

### Task 1.2: Simplify Information Display
**Priority:** Critical
**Estimated Effort:** 3-4 hours
**Files to modify:**
- `src/components/frontdesk/FrontDeskHeader.tsx`
- `src/components/frontdesk/MobileTabBar.tsx`

#### Problem Analysis
Too many elements displayed at once:
- FrontDeskHeader: icon + title + count + subtitle + metric pills + actions
- MobileTabBar: icon + label + count + urgent indicator per tab

#### Implementation Steps

**Step 1.2a: Make metric pills collapsible in FrontDeskHeader**
```typescript
// Add prop to FrontDeskHeader
interface FrontDeskHeaderProps {
  // ... existing props
  showMetricPills?: boolean;  // Default true for backward compatibility
  collapsibleMetrics?: boolean;  // New: allow toggle
}
```

**Step 1.2b: Simplify MobileTabBar for extra-small screens**
```typescript
// In MobileTabBar.tsx, add responsive hiding
<span className="hidden xs:inline truncate">  // Hide label on xs
  {tab.shortLabel || tab.label}
</span>

// Show only icon + count on very small screens
// Add xs breakpoint to tailwind.config.js if needed: xs: '375px'
```

**Step 1.2c: Progressive disclosure for Coming Appointments metrics**
- Show only count by default
- Show late/next/later metrics on hover or tap
- Add expand/collapse toggle

**Validation:**
- [ ] Mobile view shows only essential info (icon + count)
- [ ] Metrics expandable on demand
- [ ] No horizontal overflow on 320px screens

---

### Task 1.3: Standardize Color System (Use Existing Tailwind Colors)
**Priority:** Critical
**Estimated Effort:** 3-4 hours
**Files to modify:**
- `src/components/FrontDesk.tsx` (lines 532-588, 775-998)
- `src/components/frontdesk/headerTokens.ts`

#### Problem Analysis
Current state shows inconsistent color usage:
```typescript
// In FrontDesk.tsx - colorTokens using custom Tailwind colors (GOOD)
waitList: { bg: 'bg-waitList-50', text: 'text-waitList-700' }

// But headerStyles uses hardcoded hex values! (BAD)
headerStyles={{ accentColor: '#F59E0B', iconColor: 'text-[#9CA3AF]' }}
```

#### Existing Color System (ALREADY DEFINED in tailwind.config.js)
```javascript
// These are already in your tailwind config - USE THESE!
waitList-500: '#A855F7'      // Purple
service-500: '#22C55E'       // Green
comingAppointments-500: '#0EA5E9'  // Sky Blue
pendingTickets-500: '#F59E0B'      // Gold
closedTickets-400: '#94A3B8'       // Slate
```

#### Implementation Steps

**Step 1.3a: Update FrontDesk.tsx colorTokens (keep but clean up)**
The existing `colorTokens` object at line 532 is already using Tailwind classes correctly:
```typescript
// This is GOOD - keep it, just ensure consistency
const colorTokens = {
  waitList: {
    primary: 'waitList-400',
    bg: 'bg-waitList-50',
    text: 'text-waitList-700',
    // ... etc
  }
}
```

**Step 1.3b: Fix headerStyles to use Tailwind classes instead of hex**

BEFORE (Bad - hardcoded hex):
```typescript
headerStyles={{
  bg: 'bg-[#F9FAFB]',
  accentColor: '#F59E0B',           // ❌ Hardcoded hex
  iconColor: 'text-[#9CA3AF]',      // ❌ Arbitrary value
  activeIconColor: 'text-[#F59E0B]', // ❌ Arbitrary value
  titleColor: 'text-[#111827]',
  borderColor: 'border-[#E5E7EB]',
  counterBg: 'bg-[#E5E7EB]',
  counterText: 'text-[#6B7280]'
}}
```

AFTER (Good - Tailwind classes):
```typescript
headerStyles={{
  bg: 'bg-gray-50',                    // ✅ Tailwind neutral
  accentColor: 'pendingTickets-500',   // ✅ Custom Tailwind color
  iconColor: 'text-gray-400',          // ✅ Tailwind gray
  activeIconColor: 'text-pendingTickets-500', // ✅ Custom Tailwind
  titleColor: 'text-gray-900',         // ✅ Tailwind gray
  borderColor: 'border-gray-200',      // ✅ Tailwind gray
  counterBg: 'bg-gray-200',            // ✅ Tailwind gray
  counterText: 'text-gray-500'         // ✅ Tailwind gray
}}
```

**Step 1.3c: Create helper object for section header styles**
Add to `headerTokens.ts`:
```typescript
// Section-specific header styles using existing Tailwind colors
export const sectionHeaderStyles = {
  waitList: {
    bg: 'bg-waitList-50',
    accentColor: 'waitList-500',
    iconColor: 'text-gray-400',
    activeIconColor: 'text-waitList-500',
    titleColor: 'text-gray-900',
    borderColor: 'border-waitList-100',
    counterBg: 'bg-gray-100',
    counterText: 'text-gray-600',
  },
  service: {
    bg: 'bg-service-50',
    accentColor: 'service-500',
    iconColor: 'text-gray-400',
    activeIconColor: 'text-service-500',
    titleColor: 'text-gray-900',
    borderColor: 'border-service-100',
    counterBg: 'bg-gray-100',
    counterText: 'text-gray-600',
  },
  comingAppointments: {
    bg: 'bg-comingAppointments-50',
    accentColor: 'comingAppointments-500',
    iconColor: 'text-gray-400',
    activeIconColor: 'text-comingAppointments-500',
    titleColor: 'text-gray-900',
    borderColor: 'border-comingAppointments-100',
    counterBg: 'bg-gray-100',
    counterText: 'text-gray-600',
  },
  pending: {
    bg: 'bg-pendingTickets-50',
    accentColor: 'pendingTickets-500',
    iconColor: 'text-gray-400',
    activeIconColor: 'text-pendingTickets-500',
    titleColor: 'text-gray-900',
    borderColor: 'border-pendingTickets-100',
    counterBg: 'bg-gray-100',
    counterText: 'text-gray-600',
  },
  closed: {
    bg: 'bg-closedTickets-50',
    accentColor: 'closedTickets-400',
    iconColor: 'text-gray-400',
    activeIconColor: 'text-closedTickets-400',
    titleColor: 'text-gray-900',
    borderColor: 'border-closedTickets-200',
    counterBg: 'bg-gray-100',
    counterText: 'text-gray-600',
  },
} as const;
```

**Step 1.3d: Update all headerStyles in FrontDesk.tsx**
Replace inline objects with imports:
```typescript
import { sectionHeaderStyles } from './frontdesk/headerTokens';

// Then use:
<WaitListSection headerStyles={sectionHeaderStyles.waitList} ... />
<ServiceSection headerStyles={sectionHeaderStyles.service} ... />
```

**Validation:**
- [ ] No hardcoded hex values (no `#XXXXXX` in component files)
- [ ] No arbitrary Tailwind values (no `text-[#XXX]` or `bg-[#XXX]`)
- [ ] All colors use existing Tailwind config colors
- [ ] Visual appearance unchanged
- [ ] TypeScript provides autocomplete

---

### Task 1.4: Add Loading Skeletons (Use Existing Skeleton Component)
**Priority:** High
**Estimated Effort:** 2-3 hours
**Files to create:**
- `src/components/frontdesk/skeletons/TicketCardSkeleton.tsx`
- `src/components/frontdesk/skeletons/SectionSkeleton.tsx`
- `src/components/frontdesk/skeletons/index.ts`
**Files to modify:**
- `src/components/WaitListSection.tsx`
- `src/components/ServiceSection.tsx`

#### Existing Resources
- `src/components/common/Skeleton.tsx` - Already has Skeleton, SkeletonText, SkeletonCard, SkeletonCircle
- `tailwind.config.js` - Has `animate-shimmer` keyframe
- `premiumDesignTokens.ts` - Has spacing for cards: `PremiumSpacing.card`

#### Implementation Steps

**Step 1.4a: Create TicketCardSkeleton.tsx**
```typescript
// src/components/frontdesk/skeletons/TicketCardSkeleton.tsx
import { memo } from 'react';
import { Skeleton, SkeletonCircle } from '../../common/Skeleton';
import { PremiumSpacing } from '../../../constants/premiumDesignTokens';

interface TicketCardSkeletonProps {
  viewMode?: 'grid' | 'list';
  isCompact?: boolean;
}

export const TicketCardSkeleton = memo(function TicketCardSkeleton({
  viewMode = 'list',
  isCompact = false,
}: TicketCardSkeletonProps) {
  if (viewMode === 'grid') {
    return (
      <div
        className="bg-white rounded-premium-sm border border-gray-200 p-4 space-y-3 shadow-premium-xs"
        aria-hidden="true"
      >
        <div className="flex items-center gap-3">
          <SkeletonCircle size="md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        {!isCompact && <Skeleton className="h-3 w-full" />}
      </div>
    );
  }

  // List view skeleton - matches PremiumSpacing.card.minHeight.normal (60px)
  return (
    <div
      className="bg-white rounded-premium-sm border border-gray-200 p-3 flex items-center gap-3 shadow-premium-xs min-h-[60px]"
      aria-hidden="true"
    >
      <SkeletonCircle size="sm" className="flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full flex-shrink-0" />
    </div>
  );
});
```

**Step 1.4b: Create SectionSkeleton.tsx**
```typescript
// src/components/frontdesk/skeletons/SectionSkeleton.tsx
import { memo } from 'react';
import { Skeleton } from '../../common/Skeleton';
import { TicketCardSkeleton } from './TicketCardSkeleton';

interface SectionSkeletonProps {
  viewMode?: 'grid' | 'list';
  itemCount?: number;
  showHeader?: boolean;
  accentColor?: string;  // e.g., 'waitList', 'service', etc.
}

export const SectionSkeleton = memo(function SectionSkeleton({
  viewMode = 'list',
  itemCount = 4,
  showHeader = true,
  accentColor = 'gray',
}: SectionSkeletonProps) {
  return (
    <div className="h-full flex flex-col" aria-busy="true" aria-label="Loading content">
      {showHeader && (
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3 bg-white/70 backdrop-blur-md">
          <Skeleton className={`h-11 w-11 rounded-xl bg-${accentColor}-100`} />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      )}

      <div className={`flex-1 p-4 ${viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-2'}`}>
        {Array.from({ length: itemCount }).map((_, i) => (
          <TicketCardSkeleton key={i} viewMode={viewMode} />
        ))}
      </div>
    </div>
  );
});
```

**Step 1.4c: Create index.ts barrel export**
```typescript
// src/components/frontdesk/skeletons/index.ts
export { TicketCardSkeleton } from './TicketCardSkeleton';
export { SectionSkeleton } from './SectionSkeleton';
```

**Step 1.4d: Add isLoading prop to WaitListSection and ServiceSection**
```typescript
// Add to section props interface
interface WaitListSectionProps {
  // ... existing props
  isLoading?: boolean;
}

// In component render
if (isLoading) {
  return <SectionSkeleton viewMode={viewMode} showHeader={!hideHeader} accentColor="waitList" />;
}
```

**Validation:**
- [ ] Skeleton uses existing Skeleton component
- [ ] Uses premium border radius (rounded-premium-sm)
- [ ] Uses premium shadows (shadow-premium-xs)
- [ ] Skeleton height matches actual card (60px for list)
- [ ] Accessible (aria-busy, aria-hidden)

---

### Task 1.5: Fix Pending Footer Positioning
**Priority:** High
**Estimated Effort:** 2-3 hours
**Files to modify:**
- `src/components/frontdesk/PendingSectionFooter.tsx`
- `src/index.css` (add CSS custom property)

#### Problem Analysis
Current implementation:
```typescript
// Gets sidebar width from localStorage - may be stale
const [staffSidebarWidth, setStaffSidebarWidth] = useState(() => {
  const savedWidth = localStorage.getItem('staffSidebarWidth');
  return savedWidth ? parseInt(savedWidth) : 256;
});

// Uses inline style - not reactive to sidebar changes
style={{ left: `${staffSidebarWidth}px` }}
```

#### Implementation Steps

**Step 1.5a: Add CSS custom property for sidebar width**
```css
/* In src/index.css or App.css */
:root {
  --staff-sidebar-width: 256px;
}

/* Media query for mobile where sidebar is hidden */
@media (max-width: 768px) {
  :root {
    --staff-sidebar-width: 0px;
  }
}
```

**Step 1.5b: Update StaffSidebar to set CSS variable on resize**
```typescript
// In StaffSidebar.tsx resize handler
const handleResize = (newWidth: number) => {
  document.documentElement.style.setProperty('--staff-sidebar-width', `${newWidth}px`);
  localStorage.setItem('staffSidebarWidth', newWidth.toString());
  // ... existing logic
};
```

**Step 1.5c: Update PendingSectionFooter to use CSS variable**
```typescript
// Replace inline style with CSS class
<div className="fixed bottom-0 right-0 left-[var(--staff-sidebar-width)] md:left-[var(--staff-sidebar-width)]">
```

**Step 1.5d: Add safe area padding for mobile**
```typescript
// Add safe area for iOS notch/home indicator
className="pb-safe" // or use env(safe-area-inset-bottom)
```

**Validation:**
- [ ] Footer adjusts when sidebar resizes
- [ ] Footer full-width on mobile (sidebar hidden)
- [ ] Content not cut off on any screen size
- [ ] iOS safe areas respected

---

### Task 1.6: Add Empty States (Use PremiumDesignTokens)
**Priority:** High
**Estimated Effort:** 2-3 hours
**Files to create:**
- `src/components/frontdesk/EmptyState.tsx`
**Files to modify:**
- `src/components/WaitListSection.tsx`
- `src/components/ServiceSection.tsx`

#### Existing Resources
- `premiumDesignTokens.ts` - Has colors, typography, motion
- `designSystem.ts` - Has spacing, transitions
- MobileTeamSection has good empty state pattern to follow

#### Implementation Steps

**Step 1.6a: Create reusable EmptyState component**
```typescript
// src/components/frontdesk/EmptyState.tsx
import { memo } from 'react';
import { LucideIcon } from 'lucide-react';
import { PremiumColors, PremiumMotion } from '../../constants/premiumDesignTokens';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Use Tailwind color name: 'waitList', 'service', 'gray', etc. */
  accentColor?: 'waitList' | 'service' | 'comingAppointments' | 'pendingTickets' | 'gray';
  className?: string;
}

// Map section colors to Tailwind classes
const accentColorClasses = {
  waitList: {
    iconBg: 'bg-waitList-50',
    iconText: 'text-waitList-300',
    buttonBg: 'bg-waitList-500 hover:bg-waitList-600',
  },
  service: {
    iconBg: 'bg-service-50',
    iconText: 'text-service-300',
    buttonBg: 'bg-service-500 hover:bg-service-600',
  },
  comingAppointments: {
    iconBg: 'bg-comingAppointments-50',
    iconText: 'text-comingAppointments-300',
    buttonBg: 'bg-comingAppointments-500 hover:bg-comingAppointments-600',
  },
  pendingTickets: {
    iconBg: 'bg-pendingTickets-50',
    iconText: 'text-pendingTickets-300',
    buttonBg: 'bg-pendingTickets-500 hover:bg-pendingTickets-600',
  },
  gray: {
    iconBg: 'bg-gray-50',
    iconText: 'text-gray-300',
    buttonBg: 'bg-gray-900 hover:bg-gray-800',
  },
};

export const EmptyState = memo(function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  accentColor = 'gray',
  className = '',
}: EmptyStateProps) {
  const colors = accentColorClasses[accentColor];

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      {/* Icon container - using premium border radius */}
      <div className={`p-4 rounded-premium-lg ${colors.iconBg} mb-4`}>
        <Icon size={40} strokeWidth={1.5} className={colors.iconText} />
      </div>

      {/* Title - using PremiumColors.text.primary */}
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        {title}
      </h3>

      {/* Description - using PremiumColors.text.secondary */}
      <p className="text-sm text-gray-500 text-center max-w-xs mb-4">
        {description}
      </p>

      {/* Action button */}
      {action && (
        <button
          onClick={action.onClick}
          className={`
            px-4 py-2 text-white text-sm font-medium rounded-premium-sm
            transition-all duration-200
            ${colors.buttonBg}
            shadow-premium-sm hover:shadow-premium-md
            active:scale-[0.98]
          `}
        >
          {action.label}
        </button>
      )}
    </div>
  );
});
```

**Step 1.6b: Add empty state to WaitListSection**
```typescript
// In WaitListSection.tsx
import { Users } from 'lucide-react';
import { EmptyState } from './frontdesk/EmptyState';

// After filtering tickets
if (filteredTickets.length === 0) {
  return (
    <EmptyState
      icon={Users}
      title="No one waiting"
      description="When customers arrive, they'll appear here in the waiting queue"
      accentColor="waitList"
      action={{
        label: "Add Walk-in",
        onClick: () => setShowCreateTicketModal(true)
      }}
    />
  );
}
```

**Step 1.6c: Add empty state to ServiceSection**
```typescript
// In ServiceSection.tsx
import { Briefcase } from 'lucide-react';
import { EmptyState } from './frontdesk/EmptyState';

if (serviceTickets.length === 0) {
  return (
    <EmptyState
      icon={Briefcase}
      title="No tickets in service"
      description="When staff start serving customers, active tickets will appear here"
      accentColor="service"
    />
  );
}
```

**Validation:**
- [ ] Uses Tailwind color classes from config (waitList-*, service-*)
- [ ] Uses premium border radius (rounded-premium-lg)
- [ ] Uses premium shadows (shadow-premium-sm)
- [ ] Uses premium transitions (duration-200)
- [ ] Text colors match PremiumColors.text hierarchy
- [ ] Empty state is centered and visually balanced

---

## Phase 1 Summary

| Task | Priority | Effort | Risk |
|------|----------|--------|------|
| 1.1 Fix Visual Hierarchy | Critical | 2-3h | Low |
| 1.2 Simplify Information | Critical | 3-4h | Low |
| 1.3 Standardize Colors | Critical | 4-5h | Low |
| 1.4 Add Loading Skeletons | High | 3-4h | Low |
| 1.5 Fix Pending Footer | High | 2-3h | Medium |
| 1.6 Add Empty States | High | 2-3h | Low |

**Total Estimated Effort:** 16-22 hours (3-4 days)

---

## Validation Checklist

### Before Starting
- [ ] Run current build to ensure no errors: `npm run build`
- [ ] Take screenshots of current state for comparison
- [ ] Create git branch: `git checkout -b feature/frontdesk-phase1`

### After Each Task
- [ ] Run type check: `npm run type-check`
- [ ] Test on desktop (1920px, 1440px, 1024px)
- [ ] Test on tablet (768px)
- [ ] Test on mobile (375px, 320px)
- [ ] Commit with descriptive message

### After Phase 1 Complete
- [ ] Full regression test of Front Desk module
- [ ] Verify no console errors
- [ ] Compare before/after screenshots
- [ ] Get stakeholder approval
- [ ] Merge to main branch

---

## Implementation Order

Recommended sequence to minimize risk:

1. **Task 1.3: Standardize Colors** - Foundation for other changes
2. **Task 1.6: Add Empty States** - Independent, low risk
3. **Task 1.4: Add Loading Skeletons** - Independent, enhances UX
4. **Task 1.1: Fix Visual Hierarchy** - Depends on color system
5. **Task 1.2: Simplify Information** - Can be incremental
6. **Task 1.5: Fix Pending Footer** - Test thoroughly last

---

*Document created: December 1, 2025*
*Ready for implementation approval*
