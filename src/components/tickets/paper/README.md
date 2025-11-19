# Unified Paper Ticket Design System

## Overview

This folder contains the **unified paper ticket design system** that provides a consistent, sophisticated paper aesthetic for all ticket cards in the FrontDesk module. The system preserves the beautiful paper effects while introducing state-based differentiation through borders and indicators.

## 🎨 Design Philosophy

- **Same premium paper design** for all ticket types
- **State differentiation via borders** instead of different paper styles
- **Equal visual weight** between waiting and in-service tickets
- **Consistent user experience** across all view modes

## 📁 File Structure

```
/paper/
├── BasePaperTicket.tsx       # Core paper ticket component
├── PaperTicketStyles.ts      # Design tokens and style definitions
├── StateIndicators.tsx       # State badges and indicators
├── README.md                 # This file
└── index.ts                  # Barrel exports
```

## 🎯 Core Components

### 1. BasePaperTicket

The foundation component that provides all paper effects:

**Features:**
- Multi-layer shadow system (6+ shadow layers)
- Perforation dots at the top
- Side notches with gradients
- Wrap-around ticket number badge
- Paper texture overlays (fibers + grain)
- Edge shadows for thickness effect
- State-based border colors
- Responsive sizing across 4 view modes

**Usage:**
```typescript
import { BasePaperTicket } from './paper';

<BasePaperTicket
  state="waiting"
  viewMode="normal"
  ticketNumber={42}
  onClick={handleClick}
>
  {/* Your ticket content */}
</BasePaperTicket>
```

**Props:**
- `state`: 'waiting' | 'inService' | 'pending' | 'completed' | 'cancelled'
- `viewMode`: 'compact' | 'normal' | 'gridNormal' | 'gridCompact'
- `ticketNumber`: Ticket number for wrap badge
- `onClick`: Click handler
- `onKeyDown`: Keyboard handler
- `showPerforations`: Toggle perforation dots (default: true)
- `showNotches`: Toggle side notches (default: true)
- `showNumberBadge`: Toggle ticket number badge (default: true)
- `showTexture`: Toggle paper texture (default: true)
- `showEdgeShadow`: Toggle edge shadow (default: true)

### 2. PaperTicketStyles

Design tokens and style definitions for consistency.

**Exports:**
- `paperColors`: Color palette
- `paperShadows`: Shadow system
- `paperGradients`: Gradient definitions
- `paperAnimations`: Animation timings
- `stateBorderStyles`: State-specific borders
- `getViewModeStyles()`: Get styles for view mode
- `getHoverStyles()`: Get hover animation styles

**Example:**
```typescript
import { paperColors, paperShadows } from './paper';

const customStyle = {
  color: paperColors.primaryText,
  boxShadow: paperShadows.normal,
};
```

### 3. StateIndicators

Visual indicators for ticket states and priorities.

**Components:**
- `StateIndicator`: Shows ticket state with icon
- `PriorityBadge`: VIP/Priority/New badges
- `CompletionStamp`: Stamp overlay for completed tickets
- `WaitTimeIndicator`: Shows wait duration
- `ProgressIndicator`: Progress bar

**Example:**
```typescript
import { StateIndicator, PriorityBadge, WaitTimeIndicator } from './paper';

<StateIndicator state="waiting" position="top-right" />
<PriorityBadge priority="VIP" position="top-left" />
<WaitTimeIndicator minutes={15} position="bottom-right" />
```

## 🎨 State Differentiation

Tickets use the **same paper design** but different **border colors** to indicate state:

| State | Border Color | Border Style | Visual Effect |
|-------|-------------|--------------|---------------|
| **Waiting** | Terracotta (#CD7854) | 2px solid + pulse animation | Warm, earthy, authentic |
| **In Service** | Green (#10B981) | 2px solid | Active/processing |
| **Pending** | Gray (#6B7280) | 2px dashed | On hold |
| **Completed** | Green (#10B981) | 2px solid + glow | Done |
| **Cancelled** | Red (#EF4444) | 2px solid | Cancelled |

## 📐 View Modes

Four responsive view modes with automatic sizing:

1. **Compact**: Minimal height, condensed info (12 perforation dots)
2. **Normal**: Standard desktop view (15 perforation dots)
3. **Grid Normal**: Large grid cards (20 perforation dots)
4. **Grid Compact**: Medium grid cards (12 perforation dots)

All paper effects scale automatically with view mode.

## 🎭 Paper Effects Breakdown

### Gradient Background
```css
background: linear-gradient(145deg, #FFFCF7 0%, #FFFBF5 40%, #FFF9F0 100%)
```
Warm ivory → cream → vanilla gradient for realistic paper shading.

### Perforation Dots
- Positioned at top edge
- Color: `#c4b5a0` (dusty tan)
- Opacity: 20-25%
- Count scales with view mode

### Side Notches
- Semi-circle punch holes
- Gradient backgrounds for 3D depth
- Inset shadows for realism
- Positioned at 50% height

### Wrap-Around Number Badge
- **6-layer shadow system** for depth
- Extends beyond card edge (-3px transform)
- Gradient background
- Vertical accent line

### Paper Textures
1. **Fiber texture**: External PNG pattern
2. **Line grain**: CSS gradient stripes
3. **Inset highlight**: White border glow (normal view)

### Edge Shadows
- Dual-layer inset shadow for thickness
- Gradient fade for paper edge visibility

## 🎬 Animations

### Border Pulse (Waiting State)
```css
@keyframes terracottaPulse {
  0%, 100% { border-color: #CD7854; }
  50% { border-color: #E39876; }
}
```

### Hover Effect
- Lifts ticket: `translateY(-2px)`
- Subtle rotation: `rotate(0.5deg)`
- Intensifies border color
- Duration: 300-500ms based on view mode

### Active/Pressed
- Scales down: `scale(0.99)`
- Immediate feedback

## 💡 Usage Examples

### Basic Waiting Ticket
```typescript
<BasePaperTicket
  state="waiting"
  viewMode="normal"
  ticketNumber={42}
  onClick={() => console.log('Clicked')}
>
  <StateIndicator state="waiting" position="top-right" />
  <PriorityBadge priority="VIP" position="top-left" />

  <div className="p-4">
    <h3>John Doe</h3>
    <p>Haircut • 30min</p>
  </div>

  <WaitTimeIndicator minutes={15} />
</BasePaperTicket>
```

### Service Ticket with Progress
```typescript
<BasePaperTicket
  state="inService"
  viewMode="gridNormal"
  ticketNumber={34}
>
  <StateIndicator state="inService" position="top-right" />

  <div className="p-6">
    <h3>Jane Smith</h3>
    <p>Color Treatment • 90min</p>
    <div>Staff: Maria, Tom</div>
  </div>

  <ProgressIndicator percentage={65} position="bottom" />
</BasePaperTicket>
```

### Custom Styling
```typescript
<BasePaperTicket
  state="pending"
  viewMode="compact"
  ticketNumber={18}
  showPerforations={false}  // Hide perforations
  showTexture={false}       // Hide texture
  style={{ opacity: 0.7 }}  // Custom opacity
>
  {/* Content */}
</BasePaperTicket>
```

## 🎨 Color Palette

### Paper Colors
- Ivory: `#FFFCF7` (highlight)
- Cream: `#FFFBF5` (mid-tone)
- Vanilla: `#FFF9F0` (shadow)
- Warm Beige: `#FFF8E8` (alternative)

### Border Colors
- Waiting: `#CD7854` (terracotta - warm earth tone, preserves paper aesthetic)
- In Service: `#10B981` (green)
- Pending: `#6B7280` (gray)
- Completed: `#10B981` (green)
- Cancelled: `#EF4444` (red)

### Text Colors
- Primary: `#1a1614` (dark brown-black)
- Secondary: `#6B5948` (warm gray, WCAG AA compliant)
- Tertiary: `#6b5d52` (darker gray)

### Accent Colors
- Perforation: `#c4b5a0` (dusty tan)
- Border: `#e8dcc8` (warm beige)
- Shadow: `rgba(139, 92, 46, ...)` (brown tints)

## ♿ Accessibility

### Contrast Compliance
- All text passes **WCAG AA** standards (4.5:1 ratio)
- Secondary text improved from `#8b7968` to `#6B5948`

### Keyboard Navigation
- `role="button"` for semantic HTML
- `tabIndex={0}` for focus management
- `onKeyDown` handlers for Enter/Space
- Focus-visible states (can be enhanced)

### Screen Readers
- `aria-label` describes ticket state and number
- State changes announced via indicators

### Touch Targets
- Minimum 44x44px for mobile (not yet fully implemented)
- Touch-friendly spacing recommended

## 🚀 Performance

### Optimizations
- Use `useMemo` for style calculations
- GPU-accelerated transforms
- CSS containment recommended
- `will-change` hints for animations

### Best Practices
```typescript
// Memoize expensive calculations
const paperStyle = useMemo(() => ({
  background: paperGradients.background,
  boxShadow: viewStyles.shadow,
}), [viewStyles]);

// Add will-change for smooth animations
style={{ willChange: 'transform' }}
```

## 📊 Before vs After

### Before Unification
- ❌ WaitListTicket: Simpler design (2 shadows)
- ❌ ServiceTicket: Premium design (6 shadows)
- ❌ Different perforation styles (dots vs dashes)
- ❌ Inconsistent paper colors
- ❌ Duplicate code (hard to maintain)

### After Unification
- ✅ Both tickets: Same premium design
- ✅ Consistent 6-layer shadow system
- ✅ Unified perforation pattern (dots)
- ✅ Same warm paper gradient
- ✅ 60% less code (shared component)
- ✅ State differentiation via borders
- ✅ Easier maintenance and updates

## 🔧 Migration Guide

### Step 1: Import New Components
```typescript
import { BasePaperTicket, StateIndicator } from './paper';
```

### Step 2: Replace Old Ticket Card
```typescript
// OLD:
<div className="paper-ticket" style={paperStyle}>
  {/* All paper effects inline */}
</div>

// NEW:
<BasePaperTicket state="waiting" viewMode="normal">
  {/* Just content */}
</BasePaperTicket>
```

### Step 3: Add State Indicators
```typescript
<StateIndicator state="waiting" position="top-right" />
<PriorityBadge priority="VIP" position="top-left" />
```

### Step 4: Test All View Modes
- Compact
- Normal
- Grid Normal
- Grid Compact

## 📝 Future Enhancements

### Planned Features
1. **Paper Curl Effect**: 3D curl on hover
2. **Tear Animation**: Animated perforation tear when dragging
3. **Stamp Effects**: Animated stamps for completed tickets
4. **Paper Shine**: Moving highlight gradient
5. **Loading State**: Typewriter print effect
6. **Corner Fold**: Dog-ear fold for priority tickets

### Accessibility TODO
- [ ] Enhanced focus indicators
- [ ] Increase touch targets to 44px minimum
- [ ] Add ARIA live regions for state changes
- [ ] Improve screen reader support

### Performance TODO
- [ ] Add CSS containment
- [ ] Implement virtual scrolling for lists
- [ ] Lazy load texture images
- [ ] Optimize shadow rendering

## 🎓 Design Principles

1. **Consistency**: Same design everywhere
2. **Clarity**: State differentiation is obvious
3. **Elegance**: Subtle, sophisticated effects
4. **Performance**: GPU-accelerated where possible
5. **Accessibility**: WCAG AA compliance
6. **Maintainability**: Single source of truth

## 📚 References

- [Material Design 3](https://m3.material.io/)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Created**: 2025-11-07
**Version**: 1.0.0
**Maintainer**: Mango POS Team