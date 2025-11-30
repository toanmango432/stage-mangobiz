# Front Desk UI Improvement Plan

**Based on:** FRONT_DESK_UI_ASSESSMENT.md
**Current Score:** 6.5/10
**Target Score:** 8.5/10
**Date:** November 30, 2025

---

## Phase 1: Typography & Readability (Quick Win)

### Task 1.1: Audit and Fix Small Text
- [ ] Find all instances of text smaller than 12px
- [ ] Update to minimum 12px for body text, 14px for important info
- [ ] Files to check: MobileTabBar, ticket cards, header tokens

### Task 1.2: Improve Text Contrast
- [ ] Check light gray text on light backgrounds
- [ ] Ensure WCAG AA compliance (4.5:1 ratio minimum)
- [ ] Update slate-400 text to slate-500 or darker where needed

---

## Phase 2: Visual Hierarchy & Priority

### Task 2.1: Add Urgency Indicators
- [ ] Create visual emphasis for urgent/overdue items
- [ ] Add "critical" state styling for VIP waiting > 30 min
- [ ] Reduce pulsing animations (currently overused in PendingSectionFooter)

### Task 2.2: Simplify Visual Noise
- [ ] Remove excessive pulsing animations on ticket cards
- [ ] Consolidate floating action buttons
- [ ] Reduce competing visual elements

---

## Phase 3: Action Clarity & Accessibility

### Task 3.1: Touch Targets
- [ ] Ensure all interactive elements are 44x44px minimum (WCAG 2.2)
- [ ] Currently: MobileTabBar has 36px targets - needs fixing
- [ ] Currently: ViewModeToggle has 48px - good

### Task 3.2: Add Tooltips
- [ ] Add tooltips to icon-only buttons
- [ ] Explain view mode options (Grid vs List)
- [ ] Add keyboard shortcut hints

---

## Phase 4: Terminology Consistency

### Task 4.1: Naming Audit
- [ ] "Coming" vs "Coming Appointments" - standardize
- [ ] "Turn Tracker" - add explanation or rename
- [ ] Review all section headers for clarity

---

## Implementation Priority

1. **Phase 1** - Typography (biggest impact, easiest to implement)
2. **Phase 2** - Visual hierarchy (reduces cognitive load)
3. **Phase 3** - Accessibility (compliance + usability)
4. **Phase 4** - Terminology (polish)

---

## Files to Modify

| File | Changes Needed |
|------|----------------|
| MobileTabBar.tsx | Increase touch targets from 36px to 44px |
| PendingSectionFooter.tsx | Remove excessive pulsing animations |
| headerTokens.ts | Review font size tokens |
| tailwind.config.js | Add minimum font size utility if needed |
| Ticket cards | Ensure text is 12px minimum |

---

## Success Criteria

- [ ] No text smaller than 12px
- [ ] All touch targets 44px minimum
- [ ] Reduced animation on non-critical elements
- [ ] Improved contrast ratios
- [ ] Consistent terminology

---

## Review Section

### Changes Made:
(To be filled after implementation)

### Issues Encountered:
(To be filled during implementation)

### Final Score:
(To be assessed after implementation)
