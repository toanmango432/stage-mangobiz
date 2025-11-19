# Phase 1 Implementation Guide - Foundation
## Book Module Design System & Component Library

**Duration:** 4 Weeks
**Goal:** Modernize core UI and establish design system
**Status:** 🚧 In Progress

---

## TABLE OF CONTENTS

1. [Week 1: Design System Setup](#week-1-design-system-setup)
2. [Week 2: Core Components Part 1](#week-2-core-components-part-1)
3. [Week 3: Core Components Part 2](#week-3-core-components-part-2)
4. [Week 4: Calendar UI Overhaul](#week-4-calendar-ui-overhaul)
5. [Testing Strategy](#testing-strategy)
6. [Success Criteria](#success-criteria)

---

## WEEK 1: Design System Setup

### Day 1-2: Design Tokens

**Files to Create:**

1. **`src/design-system/tokens/colors.ts`**
   - Primary palette (Teal)
   - Secondary palette (Purple)
   - Status colors
   - Service category colors
   - Neutral grays

2. **`src/design-system/tokens/typography.ts`**
   - Font family
   - Font sizes
   - Font weights
   - Line heights

3. **`src/design-system/tokens/spacing.ts`**
   - Base spacing scale
   - Semantic spacing (gutter, cardPadding, etc.)

4. **`src/design-system/tokens/shadows.ts`**
   - Elevation levels (sm, md, lg, xl, 2xl)
   - Inner shadows

5. **`src/design-system/tokens/radius.ts`**
   - Border radius scale

6. **`src/design-system/tokens/index.ts`**
   - Central export file

### Day 3-4: Animation System

**Files to Create:**

1. **`src/design-system/animations/transitions.ts`**
   - Duration constants
   - Easing functions
   - Common transition strings

2. **`src/design-system/animations/keyframes.ts`**
   - Reusable CSS keyframes
   - Utility functions for animations

3. **`src/design-system/animations/hooks.ts`**
   - `useAnimation` hook
   - `useTransition` hook
   - `useReducedMotion` hook

### Day 5: Tailwind Configuration

**Update `tailwind.config.js`:**
- Extend theme with design tokens
- Add custom animations
- Configure color palette
- Add custom utilities

**Create `src/design-system/tailwind.preset.js`:**
- Reusable preset for Book module
- Can be extended by other modules

---

## WEEK 2: Core Components Part 1

### Day 1-2: BookButton

**File:** `src/design-system/components/BookButton.tsx`

**Features:**
- 4 variants: primary, secondary, ghost, danger
- 3 sizes: sm, md, lg
- Icon support (left/right)
- Loading state
- Disabled state
- Full width option

**Props Interface:**
```typescript
interface BookButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  onClick?: () => void;
  children: ReactNode;
}
```

**Tests:**
- Visual regression (all variants)
- Accessibility (keyboard, screen reader)
- Interactions (click, hover, disabled)

### Day 3: BookCard

**File:** `src/design-system/components/BookCard.tsx`

**Features:**
- Elevation levels
- Padding options
- Hoverable effect
- Clickable variant
- Border accent color

**Props Interface:**
```typescript
interface BookCardProps {
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  padding?: 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  clickable?: boolean;
  borderColor?: string;
  onClick?: () => void;
  children: ReactNode;
}
```

### Day 4: BookBadge

**File:** `src/design-system/components/BookBadge.tsx`

**Features:**
- Multiple variants
- Size options
- Dot indicator
- Pulse animation (for "new")

**Props Interface:**
```typescript
interface BookBadgeProps {
  variant?: 'status' | 'category' | 'count' | 'new';
  color?: string;
  size?: 'sm' | 'md';
  dot?: boolean;
  pulse?: boolean;
  children: ReactNode;
}
```

### Day 5: BookInput

**File:** `src/design-system/components/BookInput.tsx`

**Features:**
- Label with floating animation
- Error state
- Success state
- Hint text
- Icon support
- Size variants

**Props Interface:**
```typescript
interface BookInputProps {
  label?: string;
  placeholder?: string;
  error?: string;
  success?: boolean;
  hint?: string;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outlined';
  type?: string;
  value?: string;
  onChange?: (value: string) => void;
}
```

---

## WEEK 3: Core Components Part 2

### Day 1-2: BookSelect & BookDatePicker

**File:** `src/design-system/components/BookSelect.tsx`

**Features:**
- Custom dropdown design
- Search functionality
- Multi-select
- Keyboard navigation
- Loading state
- Icons per option

**File:** `src/design-system/components/BookDatePicker.tsx`

**Features:**
- Month/year navigation
- Today highlight
- Blocked dates
- Presets (Today, Tomorrow, Next Week)
- Range selection mode

### Day 3: BookTimePicker

**File:** `src/design-system/components/BookTimePicker.tsx`

**Features:**
- Visual time selector
- Blocked times
- Snap to intervals
- Keyboard input support
- 12h/24h format

### Day 4: BookAvatar & BookTooltip

**File:** `src/design-system/components/BookAvatar.tsx`

**Features:**
- Image with fallback
- Initials display
- Status indicator
- Badge overlay
- Size variants

**File:** `src/design-system/components/BookTooltip.tsx`

**Features:**
- Smart positioning
- Delay option
- Fade animation
- Arrow pointer
- Keyboard accessible

### Day 5: BookModal

**File:** `src/design-system/components/BookModal.tsx`

**Features:**
- Backdrop blur
- Focus trap
- Scroll lock
- Size options
- Footer support
- Close on backdrop/escape

---

## WEEK 4: Calendar UI Overhaul

### Day 1-2: Redesign AppointmentCard

**File:** `src/components/Book/AppointmentCard.tsx`

**Changes:**
- Use new design tokens
- Implement BookCard as base
- Add BookBadge for status
- Use BookAvatar for client
- Smooth hover animations
- Color coding by status/service

**Visual Improvements:**
- Remove paper ticket aesthetic
- Add modern card shadow
- Rounded corners
- Better spacing
- Color-coded left border

### Day 3: Update CalendarHeader

**File:** `src/components/Book/CalendarHeader.tsx`

**Changes:**
- Use BookButton components
- Add visual density toggle
- Improve layout spacing
- Add quick action buttons
- Better mobile responsiveness

**New Features:**
- Density selector (Comfortable, Compact, Spacious)
- Color coding toggle
- Export button
- Filter chips

### Day 4: Improve DayView Layout

**File:** `src/components/Book/DaySchedule.v2.tsx`

**Changes:**
- Apply new spacing tokens
- Update time ruler styling
- Add current time indicator
- Improve staff column headers
- Add capacity indicators

**Visual Improvements:**
- Better grid lines
- Clearer time labels
- Staff avatars in headers
- Utilization progress bars

### Day 5: Color Coding System

**File:** `src/design-system/utils/colorCoding.ts`

**Features:**
- Color scheme selector
- Service category colors
- Staff member colors
- Status colors
- Value-based colors (pricing)

**Implementation:**
- Add to AppointmentCard
- Add to Calendar views
- Settings toggle
- Color legend component

---

## DIRECTORY STRUCTURE

```
src/
├── design-system/
│   ├── tokens/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   ├── shadows.ts
│   │   ├── radius.ts
│   │   └── index.ts
│   │
│   ├── animations/
│   │   ├── transitions.ts
│   │   ├── keyframes.ts
│   │   └── hooks.ts
│   │
│   ├── components/
│   │   ├── BookButton.tsx
│   │   ├── BookCard.tsx
│   │   ├── BookBadge.tsx
│   │   ├── BookInput.tsx
│   │   ├── BookSelect.tsx
│   │   ├── BookDatePicker.tsx
│   │   ├── BookTimePicker.tsx
│   │   ├── BookAvatar.tsx
│   │   ├── BookTooltip.tsx
│   │   ├── BookModal.tsx
│   │   └── index.ts
│   │
│   ├── utils/
│   │   ├── colorCoding.ts
│   │   └── helpers.ts
│   │
│   └── index.ts
│
└── components/Book/
    ├── AppointmentCard.tsx (updated)
    ├── CalendarHeader.tsx (updated)
    ├── DaySchedule.v2.tsx (updated)
    └── ... (existing files)
```

---

## TESTING STRATEGY

### Unit Tests

**For Each Component:**
- [ ] Renders without crashing
- [ ] Accepts all props correctly
- [ ] Applies correct styles per variant
- [ ] Handles user interactions
- [ ] Fires event callbacks

**Tools:**
- Vitest
- React Testing Library
- @testing-library/user-event

### Visual Regression Tests

**Setup Storybook:**
```bash
npm install --save-dev @storybook/react @storybook/addon-essentials
```

**Create Stories:**
- One story per component
- All variants documented
- Interactive controls
- Accessibility checks

### Accessibility Tests

**For Each Component:**
- [ ] Keyboard navigation
- [ ] Screen reader labels
- [ ] Color contrast (4.5:1)
- [ ] Focus management
- [ ] Touch target size (44x44px)

**Tools:**
- axe-core
- @testing-library/jest-dom
- Manual testing with screen reader

---

## SUCCESS CRITERIA

### Week 1 Deliverables

✅ **Design Tokens Complete**
- All token files created
- Documented in Storybook
- Tailwind config updated

✅ **Animation System Ready**
- Transitions defined
- Hooks implemented
- Reduced motion support

### Week 2 Deliverables

✅ **Core Components (Part 1)**
- BookButton (4 variants)
- BookCard
- BookBadge
- BookInput
- All tested & documented

### Week 3 Deliverables

✅ **Core Components (Part 2)**
- BookSelect
- BookDatePicker
- BookTimePicker
- BookAvatar
- BookTooltip
- BookModal
- All tested & documented

### Week 4 Deliverables

✅ **Calendar UI Updated**
- AppointmentCard redesigned
- CalendarHeader modernized
- DayView improved
- Visual density toggle added
- Color coding system implemented

### Overall Phase 1 Success

- [ ] All 10 components built & tested
- [ ] Storybook with full documentation
- [ ] Design tokens in use across components
- [ ] Calendar views using new components
- [ ] 100% test coverage for components
- [ ] Accessibility audit passed
- [ ] Performance metrics met (< 150ms render)
- [ ] Zero TypeScript errors
- [ ] Code review completed

---

## DEPENDENCIES

### NPM Packages to Install

```bash
# Component development
npm install clsx
npm install @radix-ui/react-select
npm install @radix-ui/react-tooltip
npm install @radix-ui/react-dialog
npm install date-fns

# Testing
npm install --save-dev @storybook/react
npm install --save-dev @storybook/addon-essentials
npm install --save-dev @testing-library/jest-dom
npm install --save-dev @testing-library/user-event
npm install --save-dev @axe-core/react

# Animation
npm install framer-motion (optional, for advanced animations)
```

### Existing Dependencies

- React 18+
- TypeScript
- Tailwind CSS
- Lucide React (icons)
- Vitest (testing)

---

## ROLLOUT STRATEGY

### Progressive Enhancement

**Week 1-3: Component Development**
- Build in isolation
- No impact on existing code
- Test thoroughly

**Week 4: Integration**
- Replace old components gradually
- Feature flag for new design
- A/B test with users

### Feature Flags

**Create `src/config/featureFlags.ts`:**
```typescript
export const FEATURE_FLAGS = {
  NEW_DESIGN_SYSTEM: process.env.VITE_NEW_DESIGN === 'true',
  NEW_APPOINTMENT_CARD: process.env.VITE_NEW_CARD === 'true',
  VISUAL_DENSITY: process.env.VITE_DENSITY === 'true',
};
```

**Usage:**
```typescript
import { FEATURE_FLAGS } from '@/config/featureFlags';

{FEATURE_FLAGS.NEW_APPOINTMENT_CARD ? (
  <NewAppointmentCard />
) : (
  <OldAppointmentCard />
)}
```

---

## DAILY CHECKLIST

### Developer Daily Tasks

- [ ] Morning: Review current task
- [ ] Write component/feature
- [ ] Write tests (aim for 80%+ coverage)
- [ ] Create Storybook story
- [ ] Update documentation
- [ ] Code review (self or peer)
- [ ] Commit with meaningful message
- [ ] Update task status

### Code Quality Gates

Before marking task complete:

- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Storybook story created
- [ ] Accessibility checked
- [ ] Performance tested
- [ ] Documentation updated
- [ ] Peer reviewed

---

## COMMUNICATION PLAN

### Daily Standup (15 min)

**What did you do yesterday?**
**What will you do today?**
**Any blockers?**

### Weekly Demo (Friday)

- Show completed components
- Demo in Storybook
- Get feedback
- Plan next week

### Documentation

**Update Daily:**
- Task progress in todo.md
- Component README files
- Storybook stories

**Update Weekly:**
- Phase 1 progress report
- Blockers and solutions
- Next week priorities

---

## RISK MITIGATION

### Potential Risks

1. **Scope Creep**
   - Mitigation: Stick to defined component list
   - Only add features in backlog

2. **Performance Issues**
   - Mitigation: Performance testing after each component
   - Use React.memo, useMemo, useCallback

3. **Accessibility Gaps**
   - Mitigation: Test with screen reader weekly
   - Use automated tools (axe)

4. **Browser Compatibility**
   - Mitigation: Test on Chrome, Safari, Firefox
   - Use autoprefixer for CSS

5. **Design Changes**
   - Mitigation: Lock design in Week 1
   - Changes require design review

---

## NEXT STEPS AFTER PHASE 1

Once Phase 1 is complete:

✅ **Phase 2 Prep**
- Review Phase 1 learnings
- Refine Phase 2 plan
- Identify dependencies

✅ **Component Library**
- Export as npm package (optional)
- Share across modules
- Version control

✅ **User Feedback**
- Show to stakeholders
- Gather feedback
- Iterate on design

✅ **Performance Audit**
- Lighthouse scores
- Bundle size analysis
- Optimization opportunities

---

## APPENDIX

### Useful Resources

**Design:**
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Radix UI Primitives](https://www.radix-ui.com/)
- [Lucide Icons](https://lucide.dev/)

**Testing:**
- [React Testing Library](https://testing-library.com/react)
- [Storybook Docs](https://storybook.js.org/docs/react)
- [axe DevTools](https://www.deque.com/axe/devtools/)

**Accessibility:**
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Practices](https://www.w3.org/WAI/ARIA/apg/)

### Code Style Guide

**File Naming:**
- Components: PascalCase (BookButton.tsx)
- Utilities: camelCase (colorCoding.ts)
- Types: PascalCase (BookButtonProps)

**Component Structure:**
```typescript
// 1. Imports
import { memo } from 'react';
import { cn } from '@/lib/utils';

// 2. Types
interface BookButtonProps {
  // ...
}

// 3. Component
export const BookButton = memo(function BookButton(props) {
  // ...
});
```

**Testing Structure:**
```typescript
describe('BookButton', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {});
  });

  describe('Variants', () => {
    it('applies primary variant styles', () => {});
  });

  describe('Interactions', () => {
    it('calls onClick when clicked', () => {});
  });
});
```

---

**Let's begin! 🚀**
