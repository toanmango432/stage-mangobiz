# In-Service Card Design - Complete Analysis

**Date**: 2025-01-19
**Purpose**: Comprehensive breakdown of the In-Service card design to apply to Pending Payment tickets

---

## Executive Summary

The In-Service card design is a **premium, paper-like thermal receipt aesthetic** with sophisticated layering, shadows, and micro-interactions. It uses a modular architecture with **BasePaperTicket** as the foundation and **ServiceTicketCardRefactored** providing the content layout.

---

## Architecture Overview

### Component Hierarchy

```
ServiceTicketCardRefactored.tsx (Content & Layout)
    ↓
BasePaperTicket.tsx (Paper Effects Wrapper)
    ├── Perforation dots (top)
    ├── Notches (left/right)
    ├── Ticket number badge (wrap-around)
    ├── Edge shadows (paper thickness)
    ├── Textures (fiber + cross-hatch)
    └── Content children
```

### Design System Files

1. **BasePaperTicket.tsx** - Reusable paper wrapper component
2. **PaperTicketStyles.ts** - Design tokens and constants
3. **premiumDesignSystem.ts** - Global design system
4. **ServiceTicketCardRefactored.tsx** - Implementation example

---

## Grid-Normal View (The Reference Design)

This is the **primary view** we'll replicate for Pending Payment tickets.

### Container (Lines 363-364)

```tsx
<div
  className="relative overflow-visible transition-all duration-300 ease-out hover:-translate-y-[6px] hover:shadow-2xl flex flex-col min-w-[280px] max-w-full cursor-pointer"
  style={{
    background: 'linear-gradient(145deg, #FFFEFC 0%, #FFFDFB 50%, #FFFCFA 100%)',
    border: '1px dashed #D8D8D8',
    borderRadius: '10px',
    boxShadow: `
      inset 0 15px 15px -12px rgba(0,0,0,0.10),
      inset -2px 0 5px rgba(255,255,255,0.95),
      inset 2px 0 5px rgba(0,0,0,0.06),
      0 3px 8px rgba(0,0,0,0.12),
      0 8px 20px rgba(0,0,0,0.08),
      0 12px 30px rgba(0,0,0,0.06)
    `
  }}
>
```

**Key Features**:
- **6-layer shadow system** for depth
- **Dashed border** (#D8D8D8) for paper tear effect
- **3-color gradient** background (ivory → cream → vanilla)
- **Hover lift** (-6px translateY)
- **10px border radius** for soft corners

---

## Paper Effects (From BasePaperTicket)

### 1. Perforation Dots (Top Edge)

**Location**: BasePaperTicket.tsx lines 67-92

```tsx
<div className="absolute top-0 left-0 w-full flex justify-between items-center px-3 z-10"
     style={{ height: '6px', opacity: 0.108 }}>
  {[...Array(20)].map((_, i) => (
    <div key={i}
         className="w-[3px] h-[3px] rounded-full bg-[#c4b5a0]" />
  ))}
</div>
```

**Specifications**:
- **Count**: 20 dots
- **Size**: 3px × 3px
- **Color**: #c4b5a0 (dusty tan)
- **Opacity**: 0.108 (very subtle)
- **Spacing**: justify-between (evenly distributed)

### 2. Left & Right Notches (Hole Punches)

**Location**: BasePaperTicket.tsx lines 94-130

```tsx
// Left notch
<div className="absolute top-1/2 -translate-y-1/2"
     style={{
       left: '-6px',
       width: '12px',
       height: '12px',
       borderRadius: '50%',
       background: 'linear-gradient(to right, #f8f3eb, #f5f0e8)',
       borderRight: '1px solid rgba(212, 184, 150, 0.5)',
       boxShadow: 'inset -2px 0 3px rgba(139, 92, 46, 0.10)'
     }}
/>

// Right notch (mirror)
<div className="absolute top-1/2 -translate-y-1/2"
     style={{
       right: '-6px',
       width: '12px',
       height: '12px',
       borderRadius: '50%',
       background: 'linear-gradient(to left, #f8f3eb, #f5f0e8)',
       borderLeft: '1px solid rgba(212, 184, 150, 0.5)',
       boxShadow: 'inset 2px 0 3px rgba(139, 92, 46, 0.10)'
     }}
/>
```

**Specifications**:
- **Size**: 12px circle
- **Position**: Centered vertically, extends 6px outside
- **Gradient**: Two-tone beige (matches paper background)
- **Border**: Subtle tan on inner edge
- **Shadow**: Inset shadow for depth

### 3. Wrap-Around Ticket Number Badge

**Location**: ServiceTicketCardRefactored.tsx line 370

```tsx
<div className="absolute left-0 top-4 sm:top-5 w-11 sm:w-14 text-[#1a1614] flex items-center justify-center font-black text-lg sm:text-2xl z-20"
     style={{
       height: isFirstVisit ? 'clamp(2.25rem, 5vw, 2.75rem)' : 'clamp(2rem, 4.5vw, 2.5rem)',
       background: 'linear-gradient(135deg, #ffffff 0%, #fffcf7 50%, #fffbf5 100%)',
       borderTopRightRadius: '10px',
       borderBottomRightRadius: '10px',
       borderTop: '1.5px solid rgba(212, 184, 150, 0.5)',
       borderRight: '1.5px solid rgba(212, 184, 150, 0.5)',
       borderBottom: '1.5px solid rgba(212, 184, 150, 0.5)',
       boxShadow: `
         3px 0 8px rgba(139, 92, 46, 0.15),
         2px 0 4px rgba(139, 92, 46, 0.12),
         1px 0 2px rgba(139, 92, 46, 0.10),
         inset 0 2px 0 rgba(255, 255, 255, 1),
         inset 0 -2px 3px rgba(139, 92, 46, 0.08),
         inset -2px 0 2px rgba(255, 255, 255, 0.6)
       `,
       letterSpacing: '-0.02em',
       transform: 'translateX(-4px)'
     }}>
  {ticket.number}

  {/* Vertical accent line */}
  <div className="absolute top-0 right-0 w-[1.5px] h-full"
       style={{
         background: 'linear-gradient(to bottom, rgba(180, 150, 110, 0.3) 0%, rgba(139, 92, 46, 0.2) 50%, rgba(180, 150, 110, 0.3) 100%)'
       }}
  />
</div>
```

**Specifications**:
- **Width**: 44px (mobile), 56px (desktop)
- **Height**: 36px (regular), 44px (first visit - taller for emphasis)
- **Font**: Black weight, 18-24px, tight tracking
- **6-layer shadow system**:
  1. Far outer (8px blur)
  2. Mid outer (4px blur)
  3. Near outer (2px blur)
  4. Top inset highlight
  5. Bottom inset shadow
  6. Left inset highlight
- **3-stop gradient**: White → Cream → Vanilla
- **Vertical accent line**: Gradient from tan → brown → tan
- **Transform**: -4px translateX (wraps around edge)

### 4. Paper Textures (2 Layers)

**Location**: BasePaperTicket.tsx lines 181-222

#### Layer 1: Paper Fiber Texture
```tsx
<div className="absolute inset-0 pointer-events-none mix-blend-overlay"
     style={{
       backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")',
       backgroundSize: '200px 200px',
       opacity: 0.25,
       borderRadius: '10px'
     }}
/>
```

#### Layer 2: Cross-Hatch Line Pattern
```tsx
<div className="absolute inset-0 pointer-events-none"
     style={{
       backgroundImage: `
         repeating-linear-gradient(90deg, transparent 0px, rgba(180, 150, 110, 0.03) 1px, transparent 2px, transparent 3px),
         repeating-linear-gradient(0deg, transparent 0px, rgba(180, 150, 110, 0.03) 1px, transparent 2px, transparent 3px)
       `,
       backgroundSize: '3px 3px',
       opacity: 0.15,
       borderRadius: '10px'
     }}
/>
```

**Specifications**:
- **Fiber texture**: External image, 25% opacity, overlay blend
- **Cross-hatch**: CSS gradients, 3px grid, 15% opacity
- **Both**: Respect border radius

### 5. Edge Shadow (Paper Thickness)

**Location**: BasePaperTicket.tsx lines 225-251

```tsx
{/* Left edge shadow - 3 layers */}
<div className="absolute top-0 left-0 h-full"
     style={{
       width: '2px',
       boxShadow: 'inset 3px 0 4px rgba(0,0,0,0.20), inset 6px 0 8px rgba(0,0,0,0.12)'
     }}
/>

{/* Paper edge gradient */}
<div className="absolute top-0 left-0 h-full"
     style={{
       width: '0.5px',
       background: 'linear-gradient(to right, rgba(139, 92, 46, 0.15) 0%, transparent 100%)',
       boxShadow: 'inset 1px 0 1px rgba(139, 92, 46, 0.15)',
       borderTopLeftRadius: '10px',
       borderBottomLeftRadius: '10px'
     }}
/>
```

**Specifications**:
- **3-layer depth system**:
  1. Deep inset shadow (4px blur)
  2. Deeper inset shadow (8px blur)
  3. Gradient overlay
- **Creates**: 3D paper thickness illusion

---

## Content Layout (Grid-Normal)

### Header Section (Lines 371-373)

```tsx
<div className="flex items-start justify-between px-3 sm:px-4 pt-4 sm:pt-5 pb-1 pl-12 sm:pl-14">
  <div className="flex-1 min-w-0">
    <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
      <span className="text-base sm:text-lg md:text-xl font-bold text-[#1a1614] truncate tracking-tight">
        {ticket.clientName}
      </span>
      {hasStar && <span className="text-sm sm:text-base md:text-lg flex-shrink-0">⭐</span>}
      {hasNote && <StickyNote className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 flex-shrink-0" />}
    </div>
    <div className="text-[10px] sm:text-xs text-[#8b7968] font-medium tracking-wide">
      {getLastVisitText()}
    </div>
  </div>

  {/* Dropdown menu (MoreVertical icon) */}
</div>
```

**Specifications**:
- **Padding**: Left offset for number badge (48-56px)
- **Client name**: 16-20px, bold, tight tracking, #1a1614
- **VIP star**: 14-18px, inline
- **Last visit**: 10-13px, medium weight, #8b7968

### Service Name (Line 375)

```tsx
<div className="px-3 sm:px-4 pb-2 sm:pb-3 text-sm sm:text-base text-[#1a1614] font-semibold leading-snug tracking-tight line-clamp-2">
  {ticket.service}
</div>
```

**Specifications**:
- **Font**: 14-16px, semibold
- **Line clamp**: 2 lines max
- **Color**: #1a1614 (dark brown)

### Divider (Line 378)

```tsx
<div className="mx-3 sm:px-4 mb-2 sm:mb-3 border-t border-[#e8dcc8]/50" />
```

**Specifications**:
- **Color**: #e8dcc8 at 50% opacity
- **Style**: Single top border

### Progress Bar Section (Lines 381-384)

```tsx
{/* Time remaining + percentage */}
<div className="px-3 sm:px-4 pb-1.5 sm:pb-2 flex items-center justify-between">
  <div className="text-xs sm:text-sm text-[#5a4d44] font-medium">
    {formatTime(timeRemaining)} left
  </div>
  <div className="text-base sm:text-lg font-bold tracking-tight"
       style={{ color: currentStatus.text }}>
    {Math.round(progress)}%
  </div>
</div>

{/* Progress bar */}
<div className="px-3 sm:px-4 pb-4 sm:pb-5">
  <div className="h-1.5 sm:h-2 bg-[#f5f0e8] border border-[#e8dcc8]/40 overflow-hidden"
       style={{
         borderRadius: '6px',
         boxShadow: 'inset 0 1px 2px rgba(139, 92, 46, 0.08)'
       }}>
    <div className="h-full transition-all duration-300"
         style={{
           width: `${Math.min(progress, 100)}%`,
           background: currentStatus.progress,
           boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.5)',
           borderRadius: '5px'
         }}
    />
  </div>
</div>
```

**Specifications**:
- **Track**: 6-8px height, beige background, tan border
- **Fill**: Dynamic width, gradient (purple/green/red based on progress)
- **Smooth animation**: 300ms transition

### Staff Footer (Lines 386-389)

```tsx
<div className="mt-auto mx-2 sm:mx-3 px-2 sm:px-3 py-2 sm:py-3 rounded-lg flex items-center justify-between gap-3"
     style={{
       marginBottom: '6px',
       background: 'linear-gradient(135deg, rgba(255, 252, 247, 0.6) 0%, rgba(245, 240, 232, 0.5) 100%)',
       boxShadow: `
         inset 0 1px 3px rgba(139, 92, 46, 0.08),
         inset 0 -1px 0 rgba(255, 255, 255, 0.6),
         0 1px 2px rgba(255, 255, 255, 0.8)
       `,
       border: '1px solid rgba(212, 184, 150, 0.15)'
     }}>

  {/* Staff badges */}
  <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 flex-1">
    {staffList.map((staff, index) => (
      <div key={index}
           className="text-white text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg border border-white/30 cursor-pointer hover:scale-105 transition-transform tracking-wide"
           style={{
             background: getStaffColor(staff),
             boxShadow: `
               0 2.1px 4.2px rgba(0, 0, 0, 0.126),
               0 0.7px 2.1px rgba(0, 0, 0, 0.084),
               inset 0 1px 0 rgba(255, 255, 255, 0.5)
             `,
             textShadow: '0 1px 2px rgba(0, 0, 0, 0.25)'
           }}>
        {getFirstName(staff.name)}
      </div>
    ))}
  </div>

  {/* Done button */}
  <button className="w-12 h-12 min-w-[48px] min-h-[48px] flex items-center justify-center bg-white border-2 border-gray-300 text-gray-600 hover:border-green-500 hover:text-white hover:bg-green-500 hover:scale-105 active:scale-95 transition-all duration-250 rounded-full flex-shrink-0"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
    <Check size={24} strokeWidth={2.5} />
  </button>
</div>
```

**Specifications**:
- **Container**: Cream gradient, inset shadow, 6px margin bottom
- **Staff badges**:
  - Dynamic color (staff.color)
  - 10-13px text, white, semibold
  - 3-layer shadow for depth
  - Text shadow for legibility
  - Hover scale 105%
- **Done button**:
  - 48px circle
  - White → Green on hover
  - Scale 105% on hover, 95% on active

---

## Color Palette

### Paper Colors (PaperTicketStyles.ts)

```typescript
paperColors = {
  // Backgrounds
  ivory: '#FFFCF7',
  cream: '#FFFBF5',
  vanilla: '#FFF9F0',
  warmBeige: '#FFF8E8',

  // Borders
  borderBase: '#e8dcc8',      // Tan
  borderDusty: '#d4b896',     // Dusty tan

  // Text
  primaryText: '#1a1614',     // Dark brown (almost black)
  secondaryText: '#6B5948',   // Medium brown
  tertiaryText: '#6b5d52',    // Light brown

  // Perforation
  perforation: '#c4b5a0',     // Dusty tan

  // State borders
  states: {
    waiting: '#CD7854',       // Terracotta
    inService: '#10B981',     // Green
    pending: '#F59E0B',       // Amber ⭐
    completed: '#10B981',     // Green
    cancelled: '#EF4444'      // Red
  }
}
```

### For Pending Tickets

**Use**: `states.pending` = **#F59E0B (Amber)**

---

## Animations & Interactions

### 1. Hover Effect (ServiceTicketCardRefactored line 363)

```tsx
className="hover:-translate-y-[6px] hover:shadow-2xl transition-all duration-300 ease-out"
```

**Behavior**: Lifts 6px up, increases shadow

### 2. Amber Glow Animation (PaperTicketStyles.ts lines 212-221)

```css
@keyframes amberGlow {
  0%, 100% {
    border-color: #F59E0B;
    box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.1);
  }
  50% {
    border-color: #FCD34D;
    box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2), 0 0 8px rgba(245, 158, 11, 0.15);
  }
}
```

**Specifications**:
- **Duration**: 3 seconds
- **Loop**: Infinite
- **Effect**: Border pulses from amber → light amber → amber
- **Glow**: Expands from 1px to 2px + 8px outer glow

---

## Key Design Principles

### 1. Layered Depth System
- **6-layer container shadows** for realistic depth
- **6-layer number badge shadows** for wrap-around effect
- **3-layer edge shadows** for paper thickness
- **2-layer textures** for tangibility

### 2. Premium Typography
- **Hierarchy**: Bold names, semibold services, medium metadata
- **Spacing**: Tight tracking on headings (-0.02em)
- **Colors**: High contrast (#1a1614 on cream)

### 3. Subtle Details
- **Perforation dots**: 108 opacity (barely visible)
- **Notches**: Gradient fills with inset shadows
- **Textures**: Layered at different opacities
- **Border**: Dashed for tear effect

### 4. Responsive Sizing
- **Mobile**: Smaller fonts, tighter spacing
- **Desktop**: Larger fonts, more breathing room
- **Clamp**: Fluid sizing between breakpoints

---

## Differences from Current Pending Tickets

Based on the documentation, here's what needs to change:

### Current Pending Implementation
❌ Using custom inline styles (not BasePaperTicket)
❌ Amber border but no glow animation
❌ Missing some shadow layers
❌ Different content layout structure

### Required Changes
✅ Wrap in BasePaperTicket with `state="pending"`
✅ Apply amber glow animation
✅ Match exact shadow system (6 layers)
✅ Use same typography scale
✅ Match footer container styling
✅ Ensure all paper effects render

---

## Implementation Checklist for Pending Tickets

### Paper Effects
- [ ] Perforation dots (20 count, 3px, 0.108 opacity)
- [ ] Left/right notches (12px circles, gradient fill)
- [ ] Wrap-around number badge (6-layer shadow)
- [ ] Paper fiber texture (25% opacity)
- [ ] Cross-hatch texture (15% opacity)
- [ ] Edge shadow (3 layers)

### Container Styling
- [ ] 6-layer shadow system
- [ ] Dashed border #D8D8D8
- [ ] 3-stop gradient background
- [ ] Amber state border (#F59E0B)
- [ ] Amber glow animation (3s infinite)
- [ ] Hover lift (-6px)

### Content Layout
- [ ] Header with client name (16-20px bold)
- [ ] Service name (14-16px semibold)
- [ ] Divider line (#e8dcc8 50%)
- [ ] Price breakdown section
- [ ] Footer container (cream gradient, inset shadow)
- [ ] Payment method indicator
- [ ] Mark Paid button (green hover)

### Typography
- [ ] Primary text: #1a1614
- [ ] Secondary text: #6B5948
- [ ] Font weights: Bold/Semibold/Medium
- [ ] Tight tracking on headings

### Responsive Behavior
- [ ] Mobile: Smaller sizing, tighter spacing
- [ ] Desktop: Larger sizing, more breathing room
- [ ] Clamp() for fluid scaling

---

## File References

**To Study**:
1. `ServiceTicketCardRefactored.tsx` lines 361-394 (grid-normal view)
2. `BasePaperTicket.tsx` lines 1-315 (complete wrapper)
3. `PaperTicketStyles.ts` lines 1-238 (design tokens)

**To Update**:
1. `PendingTicketCard.tsx` - Apply BasePaperTicket wrapper
2. Content sub-components - Match layout structure

---

## Summary

The In-Service card is a **masterclass in layered design**:
- 6-layer container shadows
- 6-layer number badge
- 3-layer edge shadows
- 2-layer textures
- Perforation + notches + gradients

**Total**: ~20+ visual layers creating depth and realism

For Pending tickets, we need to:
1. Use **exact same paper effects** (via BasePaperTicket)
2. Change border color to **amber** (#F59E0B)
3. Add **amber glow animation**
4. Match **content layout structure**
5. Keep **payment-specific content** (price breakdown, payment type, mark paid button)

The result will be **pixel-perfect visual consistency** between In-Service and Pending tickets, with only the state-specific differences (border color, content).
