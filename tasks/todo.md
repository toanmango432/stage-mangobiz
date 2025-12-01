# Improve Sticky Header Scroll Shadow Effect

## Problem
Current sticky headers have a very subtle shadow that's barely visible. Need to create a more visible, modern Apple-style scroll shadow that shows clear visual depth when content scrolls underneath.

## Goal
Create a MORE VISIBLE scroll shadow effect that:
1. Shows a clear soft shadow at the bottom of sticky headers
2. Creates visual depth when content scrolls underneath
3. Uses frosted glass/blur effect for the header background
4. Is elegant and not too heavy

## Current Implementation
- Shadow: `shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_4px_12px_-2px_rgba(0,0,0,0.08)]`
- Background: `bg-white/85 backdrop-blur-xl backdrop-saturate-150`
- Issues: Too subtle, barely visible

## Affected Files
1. `/Users/seannguyen/Winsurf built/Mango POS Offline V2/src/components/frontdesk/headerTokens.ts`
2. `/Users/seannguyen/Winsurf built/Mango POS Offline V2/src/components/pending/PendingHeader.tsx`
3. `/Users/seannguyen/Winsurf built/Mango POS Offline V2/src/components/StaffSidebar.tsx`

## Tasks

### Phase 1: Design Improved Shadow
- [ ] Research Apple-style shadow patterns
- [ ] Create enhanced shadow token with multiple layers
- [ ] Design gradient overlay for "content scrolling under" effect
- [ ] Balance visibility with elegance

### Phase 2: Update Header Tokens
- [ ] Update `frontDeskHeaderBase` in headerTokens.ts with new shadow
- [ ] Update subordinateTabTheme shadow
- [ ] Add documentation for the new shadow pattern
- [ ] Ensure consistency across all header themes

### Phase 3: Update PendingHeader Component
- [ ] Apply new shadow token to header element
- [ ] Test visibility in different lighting conditions
- [ ] Verify responsive behavior

### Phase 4: Update StaffSidebar Component
- [ ] Update headerBg variable in compact view mode (line 654)
- [ ] Update headerBg variable in normal view mode (line 706)
- [ ] Ensure consistent shadow across different sidebar widths
- [ ] Test with different team styling modes (USE_NEW_TEAM_STYLING)

### Phase 5: Testing & Validation
- [ ] Test all headers in the Front Desk view
- [ ] Verify shadow visibility when scrolling content
- [ ] Check contrast and accessibility
- [ ] Test on different screen sizes
- [ ] Verify frosted glass effect works well with shadow

## Design Approach

### Enhanced Shadow Pattern
Use a 3-layer shadow approach for better visibility:
1. **Inner shadow**: Subtle dark line for definition (`0_1px_2px_0_rgba(0,0,0,0.12)`)
2. **Mid shadow**: Medium blur for depth (`0_4px_12px_-2px_rgba(0,0,0,0.15)`)
3. **Outer shadow**: Large blur for elevation (`0_8px_24px_-4px_rgba(0,0,0,0.12)`)

Combined: `shadow-[0_1px_2px_0_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.15),0_8px_24px_-4px_rgba(0,0,0,0.12)]`

## Success Criteria
- [ ] Shadow is clearly visible but not harsh
- [ ] Creates distinct visual separation when content scrolls
- [ ] Maintains elegant Apple-style aesthetic
- [ ] Works well with frosted glass background
- [ ] Consistent across all header implementations

## Review
_To be filled after implementation_
