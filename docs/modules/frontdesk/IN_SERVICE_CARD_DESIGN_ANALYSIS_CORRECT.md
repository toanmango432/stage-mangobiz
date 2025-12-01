# In-Service Card Design - Complete Analysis (CORRECT FILE)

**Date**: 2025-01-19
**Source File**: `ServiceTicketCard.tsx` (lines 359-387 - grid-normal view)
**Purpose**: Exact breakdown of the current In-Service card design to apply to Pending Payment tickets

---

## 🎯 Critical Finding

The In-Service card **does NOT use BasePaperTicket**. It's a **fully custom inline implementation** with all paper effects built directly into the component. This is the actual production design.

---

## Container & Base Structure (Line 362)

```tsx
<div
  onClick={() => onClick?.(ticket.id)}
  className="relative rounded-lg sm:rounded-xl overflow-visible transition-all duration-500 ease-out hover:-translate-y-2 hover:rotate-[0.5deg] flex flex-col min-w-[280px] max-w-full cursor-pointer"
  role="button"
  tabIndex={0}
  aria-label={`Service ticket ${ticket.number} for ${ticket.clientName}`}
  style={{
    background: 'linear-gradient(145deg, #FFFCF7 0%, #FFFBF5 40%, #FFF9F0 100%)',
    border: '2px solid #e8dcc8',
    boxShadow: `
      inset 0 0.5px 0 rgba(255,255,255,0.70),
      inset 0 -0.8px 1px rgba(0,0,0,0.05),
      0.5px 0.5px 0 rgba(255,255,255,0.80),
      -3px 0 8px rgba(0,0,0,0.08),
      2px 3px 4px rgba(0,0,0,0.04),
      4px 8px 12px rgba(0,0,0,0.08)
    `
  }}
>
```

### Key Specifications:

**Border**:
- Width: `2px solid`
- Color: `#e8dcc8` (tan/beige) ⭐ **NOT dashed**

**Border Radius**:
- Mobile: `rounded-lg` (8px)
- Desktop: `sm:rounded-xl` (12px)

**Background Gradient** (3-stop):
1. `#FFFCF7` at 0% (ivory)
2. `#FFFBF5` at 40% (cream)
3. `#FFF9F0` at 100% (vanilla)

**Box Shadow** (6 layers):
1. `inset 0 0.5px 0 rgba(255,255,255,0.70)` - Top inner highlight
2. `inset 0 -0.8px 1px rgba(0,0,0,0.05)` - Bottom inner shadow
3. `0.5px 0.5px 0 rgba(255,255,255,0.80)` - Right/bottom edge light
4. `-3px 0 8px rgba(0,0,0,0.08)` - Left edge depth
5. `2px 3px 4px rgba(0,0,0,0.04)` - Soft outer shadow
6. `4px 8px 12px rgba(0,0,0,0.08)` - Deep outer shadow

**Hover Animation**:
- Transform: `-translate-y-2` (lift 8px)
- Rotation: `rotate-[0.5deg]` (slight tilt)
- Duration: `500ms`
- Easing: `ease-out`

**Layout**:
- Display: `flex flex-col` (vertical stack)
- Min-width: `280px`
- Max-width: `full` (100%)

---

## Paper Effects Layer by Layer

### 1. Perforation Dots (Line 363)

```tsx
<div className="absolute top-0 left-0 w-full h-[6px] flex justify-between items-center px-3 sm:px-4 z-10 opacity-25">
  {[...Array(20)].map((_, i) => (
    <div key={i} className="w-[2px] h-[2px] sm:w-[3px] sm:h-[3px] rounded-full bg-[#c4b5a0]" />
  ))}
</div>
```

**Specifications**:
- **Count**: 20 dots
- **Size**: 2px × 2px (mobile), 3px × 3px (desktop)
- **Color**: `#c4b5a0` (dusty tan)
- **Opacity**: `0.25` (25%)
- **Distribution**: `justify-between` (evenly spaced)
- **Container height**: 6px
- **Padding**: 12px (mobile), 16px (desktop)

### 2. Left Notch (Line 364)

```tsx
<div
  className="absolute left-[-6px] sm:left-[-8px] top-[50%] w-3 h-3 sm:w-4 sm:h-4 rounded-full border-r border-[#d4b896]/50"
  style={{
    background: 'linear-gradient(to right, #f8f3eb, #f5f0e8)',
    boxShadow: 'inset -2px 0 3px rgba(139, 92, 46, 0.10)'
  }}
/>
```

**Specifications**:
- **Size**: 12px × 12px (mobile), 16px × 16px (desktop)
- **Position**:
  - Left: -6px (mobile), -8px (desktop) - extends outside
  - Top: 50% (centered vertically)
- **Shape**: Circle (`rounded-full`)
- **Background**: Gradient from `#f8f3eb` → `#f5f0e8` (beige tones)
- **Border**: Right edge, `#d4b896` at 50% opacity
- **Shadow**: Inset shadow on right side for depth

### 3. Left Edge Shadow (Paper Thickness) - 3 LAYERS (Lines 365-368)

#### Layer 1: Deep Shadow
```tsx
<div
  className="absolute top-0 left-0 w-2 h-full"
  style={{
    boxShadow: 'inset 3px 0 4px rgba(0,0,0,0.20), inset 6px 0 8px rgba(0,0,0,0.12)'
  }}
/>
```

#### Layer 2: Edge Gradient
```tsx
<div
  className="absolute top-0 left-0 w-1 h-full rounded-l-xl"
  style={{
    background: `linear-gradient(to right, rgba(139, 92, 46, 0.03) 0%, rgba(139, 92, 46, 0.02) 20%, transparent 40%)`,
    boxShadow: `inset 0.5px 0 1px rgba(0,0,0,0.04)`
  }}
/>
```

#### Layer 3: Subtle Overlay
```tsx
<div
  className="absolute top-0 left-0 w-1 h-full"
  style={{
    background: 'linear-gradient(to right, rgba(139, 92, 46, 0.01) 0%, transparent 100%)',
    boxShadow: 'inset 0.5px 0 0.5px rgba(0,0,0,0.02)'
  }}
/>
```

**Combined Effect**: Creates 3D paper thickness illusion on left edge

### 4. Right Notch (Line 369)

```tsx
<div
  className="absolute right-[-6px] sm:right-[-8px] top-[50%] w-3 h-3 sm:w-4 sm:h-4 rounded-full border-l border-[#d4b896]/50"
  style={{
    background: 'linear-gradient(to left, #f8f3eb, #f5f0e8)',
    boxShadow: 'inset 2px 0 3px rgba(139, 92, 46, 0.10), -1px 0 3px rgba(0,0,0,0.08)'
  }}
/>
```

**Specifications**:
- **Size**: Same as left notch (12px/16px)
- **Position**: Right edge, centered vertically
- **Gradient**: Mirrored (left direction)
- **Shadows**: Inset (left side) + outer shadow

### 5. Wrap-Around Ticket Number Badge (Line 370)

```tsx
<div
  className="absolute left-0 top-4 sm:top-5 w-11 sm:w-14 text-[#1a1614] flex items-center justify-center font-black text-lg sm:text-2xl z-20"
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
  }}
>
  {ticket.number}

  {/* Vertical accent line */}
  <div
    className="absolute top-0 right-0 w-[1.5px] h-full"
    style={{
      background: 'linear-gradient(to bottom, rgba(180, 150, 110, 0.3) 0%, rgba(139, 92, 46, 0.2) 50%, rgba(180, 150, 110, 0.3) 100%)'
    }}
  />
</div>
```

**Specifications**:

**Size**:
- Width: 44px (mobile), 56px (desktop)
- Height (first visit): 36-44px (fluid)
- Height (return): 32-40px (fluid)

**Text**:
- Color: `#1a1614` (dark brown)
- Size: 18px (mobile), 24px (desktop)
- Weight: `font-black` (900)
- Tracking: `-0.02em` (tight)

**Background**:
- 3-stop gradient: White → Cream → Vanilla
- Direction: 135deg diagonal

**Border**:
- Top, Right, Bottom: `1.5px solid rgba(212, 184, 150, 0.5)`
- Radius: 10px (top-right and bottom-right only)

**Box Shadow** (6 layers):
1. `3px 0 8px rgba(139, 92, 46, 0.15)` - Far right outer
2. `2px 0 4px rgba(139, 92, 46, 0.12)` - Mid right outer
3. `1px 0 2px rgba(139, 92, 46, 0.10)` - Near right outer
4. `inset 0 2px 0 rgba(255, 255, 255, 1)` - Top highlight (full white!)
5. `inset 0 -2px 3px rgba(139, 92, 46, 0.08)` - Bottom inset shadow
6. `inset -2px 0 2px rgba(255, 255, 255, 0.6)` - Left inset highlight

**Transform**:
- `translateX(-4px)` - Shifts left to wrap around edge

**Vertical Accent Line**:
- Width: 1.5px
- Position: Absolute right edge
- Gradient: Tan → Brown → Tan (vertical)

---

## Content Layout (Grid-Normal)

### Header Section (Line 371)

```tsx
<div className="flex items-start justify-between px-3 sm:px-4 pt-4 sm:pt-5 pb-1 pl-12 sm:pl-14">
  <div className="flex-1 min-w-0">
    <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
      <span className="text-base sm:text-lg md:text-xl font-bold text-[#1a1614] truncate tracking-tight">
        {ticket.clientName}
      </span>
      {hasStar && <span className="text-sm sm:text-base md:text-lg flex-shrink-0">⭐</span>}
      {hasNote && <span className="text-sm sm:text-base md:text-lg flex-shrink-0">📋</span>}
    </div>
    <div className="text-2xs sm:text-xs text-[#8b7968] font-medium tracking-wide">
      {getLastVisitText()}
    </div>
  </div>

  {/* Dropdown menu with Tippy */}
  <Tippy content={...} visible={showMenu} onClickOutside={() => setShowMenu(false)}>
    <button className="text-[#8b7968] hover:text-[#2d2520] p-1 sm:p-1.5 rounded-lg hover:bg-[#f5f0eb]/50">
      <MoreVertical size={16} className="sm:w-[18px] sm:h-[18px]" />
    </button>
  </Tippy>
</div>
```

**Specifications**:
- **Padding**:
  - Left: 48px (mobile), 56px (desktop) - offset for number badge
  - Top: 16px (mobile), 20px (desktop)
  - Right: 12px (mobile), 16px (desktop)
  - Bottom: 4px
- **Client name**:
  - Size: 16px (base), 18px (sm), 20px (md+)
  - Weight: Bold (700)
  - Color: `#1a1614`
  - Tracking: Tight (-0.01em)
- **Last visit**:
  - Size: 11px (mobile), 12px (desktop)
  - Weight: Medium (500)
  - Color: `#8b7968` (medium brown)
  - Tracking: Wide (0.025em)

### Service Name (Line 374)

```tsx
<div className="px-3 sm:px-4 pb-3 sm:pb-4 text-sm sm:text-base text-[#1a1614] font-semibold leading-snug tracking-tight line-clamp-2">
  {ticket.service}
</div>
```

**Specifications**:
- Size: 14px (mobile), 16px (desktop)
- Weight: Semibold (600)
- Color: `#1a1614`
- Line height: `leading-snug` (1.375)
- Tracking: Tight
- Max lines: 2 (`line-clamp-2`)

### Divider (Line 375)

```tsx
<div className="mx-3 sm:px-4 mb-3 sm:mb-4 border-t border-[#e8dcc8]/50" />
```

**Specifications**:
- Style: Top border only
- Color: `#e8dcc8` at 50% opacity
- Margin: 12px (mobile), 16px (desktop)

### Progress Section (Lines 376-377)

```tsx
{/* Time + Percentage */}
<div className="px-3 sm:px-4 pb-1.5 sm:pb-2 flex items-center justify-between">
  <div className="text-xs sm:text-sm text-[#6b5d52] font-medium">
    {formatTime(timeRemaining)} left
  </div>
  <div className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: currentStatus.text }}>
    {Math.round(progress)}%
  </div>
</div>

{/* Progress Bar */}
<div className="px-3 sm:px-4 pb-4 sm:pb-5">
  <div
    className="h-2 sm:h-2.5 bg-[#f5f0e8] rounded-full border border-[#e8dcc8]/40 overflow-hidden"
    style={{ boxShadow: 'inset 0 1px 2px rgba(139, 92, 46, 0.08)' }}
  >
    <div
      className="h-full transition-all duration-300 rounded-full"
      style={{
        width: `${Math.min(progress, 100)}%`,
        background: currentStatus.progress,
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.5)'
      }}
    />
  </div>
</div>
```

**Specifications**:
- **Time text**: 12-14px, medium weight, `#6b5d52`
- **Percentage**: 20-24px, bold, dynamic color (purple/green/red)
- **Progress bar**:
  - Height: 8px (mobile), 10px (desktop)
  - Background: `#f5f0e8` (light beige)
  - Border: `#e8dcc8` at 40% opacity
  - Shadow: Inset shadow for depth
  - Fill: Dynamic gradient based on progress
  - Fill shadow: Inset top highlight

### Footer Section (Lines 378-380)

```tsx
<div
  className="mt-auto mx-2 sm:mx-3 mb-2 sm:mb-3 px-2 sm:px-3 py-2 sm:py-3 rounded-lg relative"
  style={{
    background: 'linear-gradient(135deg, rgba(255, 252, 247, 0.6) 0%, rgba(245, 240, 232, 0.5) 100%)',
    boxShadow: `
      inset 0 1px 3px rgba(139, 92, 46, 0.08),
      inset 0 -1px 0 rgba(255, 255, 255, 0.6),
      0 1px 2px rgba(255, 255, 255, 0.8)
    `,
    border: '1px solid rgba(212, 184, 150, 0.15)'
  }}
>
  {/* Staff badges */}
  <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 pr-11 sm:pr-12">
    {staffList.map((staff, index) => (
      <div
        key={index}
        className="text-white text-2xs sm:text-xs font-semibold px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg border border-white/30 cursor-pointer hover:scale-105 transition-transform tracking-wide"
        style={{
          background: getStaffColor(staff),
          boxShadow: `
            0 3px 6px rgba(0, 0, 0, 0.18),
            0 1px 3px rgba(0, 0, 0, 0.12),
            inset 0 1px 0 rgba(255, 255, 255, 0.5)
          `,
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.25)'
        }}
      >
        {getFirstName(staff.name)}
      </div>
    ))}
  </div>

  {/* Done button */}
  <button
    onClick={(e) => { e.stopPropagation(); onComplete?.(ticket.id); }}
    className="absolute top-1/2 right-2 md:right-3 -translate-y-1/2 w-11 h-11 md:w-10 md:h-10 rounded-full flex items-center justify-center bg-white border-2 border-gray-200 text-gray-400 hover:border-green-500 hover:text-green-500 hover:bg-green-50 transition-all"
    title="Mark as Done"
  >
    <CheckCircle size={20} className="md:w-5 md:h-5" strokeWidth={2} />
  </button>
</div>
```

**Footer Container Specifications**:
- **Background**: Cream gradient (diagonal)
- **Border**: Tan at 15% opacity
- **Box Shadow** (3 layers):
  1. Inset top shadow (creates depth)
  2. Inset bottom highlight
  3. Outer white glow
- **Padding**: 8-12px
- **Margin**: 8-12px (sides and bottom)
- **Border radius**: `rounded-lg` (8px)

**Staff Badge Specifications**:
- **Size**: 11-13px text
- **Padding**: 8-12px horizontal, 4-6px vertical
- **Background**: Dynamic staff color
- **Border**: White at 30% opacity
- **Box Shadow** (3 layers):
  1. Far outer shadow (6px blur)
  2. Near outer shadow (3px blur)
  3. Inset top highlight
- **Text shadow**: Dark for legibility on colored background
- **Hover**: Scale 105%

**Done Button Specifications**:
- **Size**: 44px (mobile), 40px (desktop) circle
- **Position**: Absolute, centered vertically, right aligned
- **Default**: White bg, gray border/icon
- **Hover**: Green border/icon, light green background
- **Icon**: CheckCircle, 20px
- **Animation**: Scale + color transition

---

## Texture Overlays (Lines 381-383)

### Fiber Texture
```tsx
<div
  className="absolute inset-0 pointer-events-none opacity-25 mix-blend-overlay rounded-xl"
  style={{
    backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")',
    backgroundSize: '200px 200px'
  }}
/>
```

**Specifications**:
- **Source**: External texture image (paper fibers)
- **Opacity**: 25%
- **Blend mode**: `overlay`
- **Size**: 200px × 200px repeat
- **Respects**: Border radius (`rounded-xl`)

### Cross-Hatch Pattern
```tsx
<div
  className="absolute inset-0 pointer-events-none opacity-15 rounded-xl"
  style={{
    backgroundImage: `
      repeating-linear-gradient(90deg, transparent 0px, rgba(180, 150, 110, 0.03) 1px, transparent 2px, transparent 3px),
      repeating-linear-gradient(0deg, transparent 0px, rgba(180, 150, 110, 0.03) 1px, transparent 2px, transparent 3px)
    `,
    backgroundSize: '3px 3px'
  }}
/>
```

**Specifications**:
- **Type**: CSS gradient (no external image)
- **Pattern**: Horizontal + vertical lines (cross-hatch)
- **Grid**: 3px × 3px
- **Line color**: Tan at 3% opacity
- **Overlay opacity**: 15%

### Inset Highlight
```tsx
<div
  className="absolute inset-0 pointer-events-none rounded-xl"
  style={{
    boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.4)'
  }}
/>
```

**Specifications**:
- **Type**: Inset box shadow
- **Effect**: Subtle white inner border
- **Opacity**: 40%
- **Purpose**: Creates "shine" on card edges

---

## Color Specifications

### Text Colors
```typescript
primaryText: '#1a1614'      // Dark brown (client name, service)
secondaryText: '#8b7968'    // Medium brown (last visit, menu icon)
tertiaryText: '#6b5d52'     // Light brown (time remaining)
```

### Background Colors
```typescript
ivory: '#FFFCF7'           // Gradient start
cream: '#FFFBF5'           // Gradient middle
vanilla: '#FFF9F0'         // Gradient end
lightBeige: '#f5f0e8'      // Progress bar background
```

### Border Colors
```typescript
tan: '#e8dcc8'             // Main border
dustyTan: '#d4b896'        // Notch borders, badge borders
```

### State Colors (For Pending)
```typescript
inService: '#e8dcc8'       // Current (tan)
pending: '#F59E0B'         // FOR PENDING TICKETS (amber)
```

---

## Key Differences from BasePaperTicket

| Feature | BasePaperTicket | ServiceTicketCard (Actual) |
|---------|----------------|----------------------------|
| **Architecture** | Wrapper component | Inline implementation |
| **Border style** | Dashed | **Solid** |
| **Border color** | Configurable | `#e8dcc8` (tan) |
| **Shadow layers** | Configurable | **6 layers (hardcoded)** |
| **Number badge** | Generic | **6-layer shadow, dynamic height** |
| **Edge shadows** | 2 layers | **3 layers** |
| **Textures** | Optional | **Always rendered** |
| **Notch shadows** | Single | **Dual (inset + outer)** |

---

## For Pending Payment Tickets

### What to Change

1. **Border Color**: `#e8dcc8` → `#F59E0B` (amber)
2. **Add Amber Glow Animation**:
   ```css
   @keyframes amberGlow {
     0%, 100% {
       border-color: #F59E0B;
       box-shadow: [6 layers] + 0 0 0 1px rgba(245, 158, 11, 0.1);
     }
     50% {
       border-color: #FCD34D;
       box-shadow: [6 layers] + 0 0 0 2px rgba(245, 158, 11, 0.2), 0 0 8px rgba(245, 158, 11, 0.15);
     }
   }
   ```
3. **Content Section**: Replace progress section with price breakdown
4. **Footer**: Replace "Done" button with "Mark Paid" button (blue → green)

### What to Keep Identical

✅ All paper effects (perforations, notches, edge shadows, textures)
✅ 6-layer container shadow
✅ 6-layer number badge with vertical accent line
✅ 3-layer edge thickness
✅ Header layout (client name, last visit)
✅ Divider styling
✅ Footer container (cream gradient, 3-layer shadow)
✅ Typography scale and colors
✅ Hover animations
✅ Responsive sizing

---

## Implementation Checklist

### Container
- [ ] 6-layer box shadow (exact values)
- [ ] Solid 2px border
- [ ] Amber color (#F59E0B)
- [ ] Amber glow animation (3s infinite)
- [ ] 3-stop gradient background
- [ ] Rounded corners (8px → 12px responsive)
- [ ] Hover lift (-8px) and rotate (0.5deg)

### Paper Effects
- [ ] 20 perforation dots (2-3px, 25% opacity)
- [ ] Left notch (12-16px circle, gradient fill, inset shadow)
- [ ] Right notch (mirror of left)
- [ ] 3-layer left edge shadow
- [ ] Wrap-around number badge (6-layer shadow)
- [ ] Vertical accent line in badge
- [ ] Fiber texture overlay (25% opacity)
- [ ] Cross-hatch texture (15% opacity)
- [ ] Inset highlight border (40% white)

### Content Layout
- [ ] Header: Client name + last visit + menu
- [ ] Service name (semibold, 14-16px)
- [ ] Divider (tan 50%)
- [ ] **Price breakdown** (subtotal, tax, tip, total)
- [ ] Footer: Payment method + Mark Paid button

### Typography
- [ ] Client name: 16-20px bold, #1a1614, tight tracking
- [ ] Last visit: 11-12px medium, #8b7968, wide tracking
- [ ] Service: 14-16px semibold, #1a1614
- [ ] Prices: Monospace font, tabular-nums

### Footer
- [ ] Cream gradient background
- [ ] 3-layer box shadow (inset + outer)
- [ ] Tan border (15% opacity)
- [ ] Payment icon + label (11-13px)
- [ ] Mark Paid button (44-40px circle, blue → green)

---

## Critical Notes

1. **DO NOT use BasePaperTicket** - It's not used for In-Service cards
2. **Border is SOLID, not dashed** - Important visual difference
3. **All measurements are exact** - No approximations
4. **Responsive sizing** - Mobile → Desktop transitions
5. **6-layer shadows are crucial** - Creates depth and realism
6. **Number badge height is dynamic** - Taller for first-time clients
7. **Footer container is essential** - Cream gradient with shadows

---

## Summary

The In-Service card is a **fully custom inline component** with:
- **6-layer container shadow system**
- **6-layer wrap-around number badge**
- **3-layer edge thickness effect**
- **2-layer texture overlays**
- **Solid tan border** (not dashed)
- **20 perforation dots**
- **Left/right notches with gradients**
- **Cream gradient footer container**

For Pending tickets, we copy **100% of this design** and only change:
- Border color: Tan → Amber
- Add: Amber glow animation
- Content: Progress → Price breakdown
- Button: Done → Mark Paid

**Total Layers**: ~15+ visual layers creating premium paper effect
