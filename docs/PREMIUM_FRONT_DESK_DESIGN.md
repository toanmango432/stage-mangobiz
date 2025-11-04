# Premium Front Desk Design System

## Overview
Comprehensive documentation for the elevated, handcrafted Front Desk interface that maintains the beloved paper-ticket personality while achieving premium polish and modern refinement.

---

## 🎨 Design Philosophy

### Core Principles
1. **Handcrafted Quality** - Every element feels intentionally designed and refined
2. **Tactile Personality** - Maintain the paper-ticket charm that users love
3. **Visual Harmony** - Unified design language across all components
4. **Effortless Interaction** - Feedback that delights without overwhelming
5. **Long-Shift Comfort** - Calm, readable interface for extended use

---

## 1. Unified Card Foundation ✓

### Base Styling
- **Background**: `#FFF9F4` (soft ivory) - single neutral tone for all tickets
- **Texture**: 4% opacity fractal noise for subtle paper feel
- **Shadow**: Layered depth (1-2px blur, 6-4% opacity)
- **Border**: `1px solid rgba(0, 0, 0, 0.06)` - clean, minimal

```typescript
const ticketBase = {
  background: '#FFF9F4',
  borderRadius: '6px',
  border: '1px solid rgba(0, 0, 0, 0.06)',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.04)',
  transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
};
```

### Consistent Dimensions
All tickets share:
- **Height**: Standardized per view mode (32px compact → 200px grid-normal)
- **Padding**: Consistent spacing (4-16px depending on view)
- **Border Radius**: 6-8px for modern softness
- **Truncation**: Ellipsis with hover tooltips for long text

---

## 2. Elegant Status Indicators ✓

### Thin Colored Strip (Left Edge)

**Implementation**: 5px solid color on left border

| Status | Color | Hover Color | Icon | Purpose |
|--------|-------|-------------|------|---------|
| **Waiting** | `#FFE7B3` (pastel amber) | `#FFD280` | Clock ⏱️ | Queue position |
| **In Service** | `#C9F3D1` (soft mint) | `#A5E8B0` | Play ▶️ | Active service |
| **Pending** | `#ECECEC` (light gray) | `#D4D4D4` | Pause ⏸️ | On hold |
| **Completed** | `#D1F4E0` (light green) | `#B7F0D0` | Check ✓ | Done |

```typescript
borderLeft: '5px solid #FFE7B3', // Waiting example
```

### Status Icons (Right-Aligned)
- **Position**: Bottom-right corner
- **Size**: 14-20px depending on view mode
- **Opacity**: 0.6 (60%) for subtle presence
- **Purpose**: Quick visual scanning without disrupting text

### Client Type Badges
Smaller but higher contrast for visibility:
- **⭐ VIP**: Gold tones (#FFF9E6 bg, #8B6914 text)
- **🔥 Priority**: Red tones (#FFF1F0 bg, #B91C1C text)
- **✨ New**: Indigo tones (#EEF2FF bg, #4338CA text)
- **👤 Regular**: Gray tones (#F9FAFB bg, #4B5563 text)

---

## 3. Interaction & Feedback ✓

### Hover State
**Effect**: Gentle lift with brightness increase

```typescript
hover = {
  background: '#FFFCF9',           // 2% lighter
  transform: 'translateY(-2px)',    // 2px elevation lift
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.06)',
  borderLeft: '#FFD280',           // Darker accent
  transition: '200ms ease-out',
};
```

**Visual Effect**:
- Card gently lifts 2px
- Background lightens 2%
- Shadow strengthens for depth
- Border accent darkens
- Smooth 200ms transition

### Selection State
**Effect**: More pronounced than hover

```typescript
selected = {
  background: '#FFF6EF',           // Warmer tone
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.08)',
  borderColor: 'rgba(0, 0, 0, 0.08)',
};
```

### Animated Progress Bar (In-Service Tickets)
**Specifications**:
- **Height**: 3px (premium thickness)
- **Position**: Bottom edge of card
- **Animation**: Smooth 500ms transitions
- **Color Logic**:
  - 0-33%: Blue (`#3B82F6`) - Starting
  - 33-66%: Purple (`#8B5CF6`) - Mid-point
  - 66-100%: Green (`#10B981`) - Nearly done

```typescript
progressBar = {
  height: '3px',
  borderRadius: '999px',
  transition: 'width 500ms cubic-bezier(0.4, 0, 0.2, 1)',
  background: getProgressColor(percentage),
};
```

**Real-Time Updates**: Updates every 10 seconds via useEffect

### Drag States
**Dragging**:
```typescript
dragging = {
  opacity: 0.9,
  transform: 'scale(1.02)',
  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
  cursor: 'grabbing',
};
```

**Drop Zone**:
```typescript
dropZone = {
  border: '2px dashed #3B82F6',
  background: 'rgba(59, 130, 246, 0.1)',
  borderRadius: '8px',
  padding: '16px',
  minHeight: '80px',
  animation: 'pulse 2s ease-in-out infinite',
};
```

**Snap Animation**: 300ms spring easing when card drops

---

## 4. Typography & Content Hierarchy ✓

### Text Priority System

#### 1. Client Name (Primary)
```typescript
{
  fontSize: '14px',
  fontWeight: 600,
  letterSpacing: '-0.2px',
  color: '#111827', // Gray-900
}
```

#### 2. Service Description (Secondary)
```typescript
{
  fontSize: '12px',
  fontWeight: 500,
  color: '#6B7280', // Gray-500
  truncate: 'ellipsis',
}
```

#### 3. Time Information (Tertiary)
```typescript
{
  fontSize: '10px',
  fontWeight: 500,
  color: '#9CA3AF', // Gray-400
}
```

### Consistent Alignment
- **Icons & Badges**: Right-aligned or bottom-right
- **Actions**: Always right-aligned
- **Text flow**: Never disrupted by icons

### Tooltips on Hover
- **Trigger**: Long service names (truncated)
- **Delay**: 500ms
- **Style**: Dark background, white text, 12px font
- **Content**: Full service name + duration + time

```typescript
<Tippy content="Full service description" delay={[500, 0]}>
  <div className="truncate">{ticket.service}</div>
</Tippy>
```

---

## 5. Top Bar & Controls

### Metrics Bar (Interactive)
**Components**: 4 key metrics displayed as cards

```
┌────────────────────────────────────────────────────────────┐
│  [Clients Waiting] [Next VIP] [Avg Wait] [Revenue Today]  │
└────────────────────────────────────────────────────────────┘
```

#### Metric Card Design
```typescript
metricsCard = {
  background: '#FFF9F4',
  borderRadius: '8px',
  padding: '12px 16px',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.06)',
  border: '1px solid rgba(0, 0, 0, 0.06)',
  cursor: 'pointer',
  transition: '150ms ease-out',
  hover: {
    background: '#FFFCF9',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
};
```

#### Interactive Behavior
- **Click to Filter**: Clicking a metric highlights relevant tickets
- **Visual Feedback**: Gentle pulse animation on filtered tickets
- **Clear State**: Click again or click "Clear Filter" to reset

#### Metric Specifications

**1. Clients Waiting**
- Count of tickets in wait queue
- Click → Highlights all waiting tickets
- Icon: Clock ⏱️
- Color accent: Amber (#F59E0B)

**2. Next VIP**
- Shows next VIP client name
- Click → Scrolls to and highlights VIP ticket
- Icon: Star ⭐
- Color accent: Gold (#F59E0B)

**3. Avg Wait Time**
- Calculates average wait in queue
- Click → Sorts tickets by wait time
- Icon: Timer ⏲️
- Color accent: Blue (#3B82F6)

**4. Revenue Today**
- Total revenue from completed tickets
- Click → Opens revenue breakdown modal
- Icon: Dollar $
- Color accent: Green (#10B981)

### Search & Filters Bar
- **Position**: Sticky while scrolling
- **Background**: Slightly translucent with blur effect
- **Blend**: Matches top bar style
- **Height**: 48px for easy reach
- **Search**: Instant filter as you type

```typescript
searchBar = {
  position: 'sticky',
  top: 0,
  zIndex: 10,
  background: 'rgba(255, 249, 244, 0.95)',
  backdropFilter: 'blur(8px)',
  borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
};
```

---

## 6. Visual Rhythm & Spacing

### Section Margins
- **Between sections**: 16px gap
- **Inside sections**: 12px padding
- **Card gaps**: 8-16px depending on view mode

### Grid System (In Service Section)

#### Desktop (3 columns)
```
┌─────┬─────┬─────┐
│  1  │  2  │  3  │
├─────┼─────┼─────┤
│  4  │  5  │  6  │
└─────┴─────┴─────┘
```
- **Columns**: 3
- **Gap**: 16px
- **Alignment**: Perfect grid alignment

#### Tablet (2 columns)
```
┌──────┬──────┐
│  1   │  2   │
├──────┼──────┤
│  3   │  4   │
└──────┴──────┘
```
- **Columns**: 2
- **Gap**: 12px
- **Responsive**: Maintains rhythm

#### Mobile (1 column)
```
┌────────────┐
│     1      │
├────────────┤
│     2      │
└────────────┘
```
- **Columns**: 1
- **Gap**: 8px
- **Stack**: Full width

### Staff Lanes (Optional)
Faint horizontal separators between staff assignments:
```typescript
staffSeparator = {
  height: '1px',
  background: 'rgba(0, 0, 0, 0.04)',
  margin: '8px 0',
};
```

**Purpose**: Improves scanability on long lists with many staff members

---

## 🎨 Color Tokens Reference

### Base Palette
```typescript
export const PremiumColors = {
  paper: {
    base: '#FFF9F4',
    hover: '#FFFCF9',
    selected: '#FFF6EF',
  },
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    muted: '#D1D5DB',
  },
  borders: {
    light: 'rgba(0, 0, 0, 0.06)',
    medium: 'rgba(0, 0, 0, 0.1)',
    accent: 'rgba(0, 0, 0, 0.08)',
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.04)',
    md: '0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.06)',
    lg: '0 4px 8px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.08)',
  },
};
```

### Status Colors
```typescript
export const StatusColors = {
  waiting: { primary: '#FFE7B3', hover: '#FFD280', icon: '#D97706' },
  inService: { primary: '#C9F3D1', hover: '#A5E8B0', icon: '#059669' },
  pending: { primary: '#ECECEC', hover: '#D4D4D4', icon: '#6B7280' },
  completed: { primary: '#D1F4E0', hover: '#B7F0D0', icon: '#10B981' },
};
```

---

## 📐 Spacing Scale

```typescript
export const Spacing = {
  card: {
    gap: { tight: 4, normal: 8, relaxed: 12, loose: 16 },
    padding: { compact: '4px 8px', normal: '8px 12px', grid: '16px' },
    borderRadius: { sm: 6, md: 8, lg: 10 },
  },
  section: {
    padding: 16,
    gap: 12,
    marginBottom: 16,
  },
  grid: {
    gap: { mobile: 8, tablet: 12, desktop: 16 },
  },
};
```

---

## ⚡ Motion & Animation

### Transition Durations
```typescript
export const Motion = {
  fast: '150ms',      // Quick feedback
  normal: '200ms',    // Standard interactions
  slow: '300ms',      // Deliberate movements
  slower: '400ms',    // Emphasized transitions
};
```

### Easing Functions
```typescript
export const Easing = {
  easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',        // Smooth deceleration
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',            // Smooth acceleration
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',       // Smooth both
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',     // Springy bounce
};
```

### Key Animations

**Hover Lift**:
```css
transform: translateY(-2px);
transition: 200ms cubic-bezier(0.16, 1, 0.3, 1);
```

**Progress Bar Fill**:
```css
transition: width 500ms cubic-bezier(0.4, 0, 0.2, 1);
```

**Drag Scale**:
```css
transform: scale(1.02);
transition: 150ms ease-out;
```

**Drop Snap**:
```css
animation: snap 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
```

---

## 📱 Responsive Behavior

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### View Modes
1. **Compact (Line)**: High-density, 32px height
2. **Normal**: Standard, 60px height
3. **Grid Normal**: Large cards, 200px min-height
4. **Grid Compact**: Dense grid, 120px min-height

### Adaptive Features
- Font sizes scale responsively (sm:text-base pattern)
- Padding adjusts per breakpoint
- Grid columns collapse: 3 → 2 → 1
- Icons scale: 14-20px
- Touch targets: Minimum 44x44px on mobile

---

## 🎯 Implementation Status

### ✅ Completed
1. Unified card foundation (#FFF9F4 base)
2. Status indicator strips (5px left border)
3. Enhanced hover states (2px elevation)
4. Animated progress bars (color-coded)
5. Typography hierarchy standardization
6. Service text consistency (all views)
7. Premium design tokens file

### 🚧 In Progress
1. Metrics bar component with interactions
2. Drag-and-drop visual feedback
3. Status icons (clock, play, check)
4. Tooltip refinements

### 📋 Planned
1. Dark mode support
2. Custom theme engine
3. Accessibility enhancements
4. Performance optimizations

---

## 📚 Design Deliverables

### Documentation
- ✅ Premium design tokens (`premiumDesignTokens.ts`)
- ✅ This comprehensive guide
- 🚧 Component API documentation
- 🚧 Storybook stories

### Visual Assets
- 🚧 Desktop mockups (light mode)
- 🚧 Tablet mockups (responsive)
- 🚧 Hover state variants
- 🚧 Drag state examples
- 🚧 Interactive metrics demo

### Code Examples
- ✅ Updated ticket card components
- ✅ Hover handler patterns
- 🚧 Metrics bar component
- 🚧 Drag-and-drop implementation

---

## 🎨 Design Variants

### Hover State
```
┌────────────────────────────┐
│ ↑ Lifted 2px               │
│ Background: 2% lighter     │
│ Shadow: Stronger           │
│ Border: Darker accent      │
└────────────────────────────┘
```

### Selected State
```
┌────────────────────────────┐
│ Background: Warmer tone    │
│ Shadow: Most pronounced    │
│ Border: Accent highlighted │
└────────────────────────────┘
```

### Dragging State
```
┌────────────────────────────┐
│ Scale: 102%                │
│ Opacity: 90%               │
│ Shadow: Dramatic           │
│ Cursor: Grabbing           │
└────────────────────────────┘
```

---

## 🌟 Goal Achievement

### Cohesive Modern Interface ✓
- Unified color palette across all components
- Consistent shadows and depth system
- Harmonious spacing rhythm

### Handcrafted for Mango ✓
- Paper-ticket charm preserved
- Premium polish on every detail
- Intentional, purposeful design

### Long-Shift Comfort ✓
- Calm, neutral base reduces eye strain
- Clear hierarchy improves scanning
- Smooth animations feel natural

### Intuitive & Enjoyable ✓
- Delightful hover feedback
- Real-time progress visibility
- Interactive metrics engagement

---

*Design System Version: 1.0*
*Last Updated: Oct 31, 2025*
*Status: Implementation In Progress*
*Components: WaitListTicketCard, ServiceTicketCard, Premium Design Tokens*
