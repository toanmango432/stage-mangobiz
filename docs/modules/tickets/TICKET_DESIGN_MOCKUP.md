# Ticket Design Mockup - Before & After

## Visual Comparison

### BEFORE: Separate Aesthetics

```
┌─────────────────────────────────────────────────────────────────┐
│ WAITING QUEUE                                                    │
│                                                                   │
│ ╔═══════════════════════════════════════════════════════════╗  │
│ ║ 🟨 Warm cream/amber gradient (#FFF9E8 → #FFF4D6)          ║  │
│ ║    Brown-tinted shadows                                    ║  │
│ ║    Warm paper edge (#D4B896)                               ║  │
│ ║    Strong visual warmth                                    ║  │
│ ╚═══════════════════════════════════════════════════════════╝  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ IN SERVICE                                                       │
│                                                                   │
│ ╔═══════════════════════════════════════════════════════════╗  │
│ ║ 🟦 Cool blue-tinted gradient (#F0F7FB → #E8F2F7)          ║  │
│ ║    Blue-tinted shadows                                     ║  │
│ ║    Cool paper edge (#B8D4E6)                               ║  │
│ ║    Strong visual coolness                                  ║  │
│ ╚═══════════════════════════════════════════════════════════╝  │
└─────────────────────────────────────────────────────────────────┘

**Problem**: High contrast between sections causes visual fatigue
```

---

### AFTER: Unified Harmony

```
┌─────────────────────────────────────────────────────────────────┐
│ WAITING QUEUE                                                    │
│                                                                   │
│ ┃╔═══════════════════════════════════════════════════════════╗ │
│ ┃║ Neutral ivory base (#FFF9F4)                              ║ │
│🟨║ Subtle paper texture (4% opacity)                          ║ │
│ ┃║ Soft neutral shadows                                       ║ │
│ ┃║ 5px amber accent strip on left                            ║ │
│ ┃╚═══════════════════════════════════════════════════════════╝ │
│                                                                   │
│ Status: Waiting - Identified by 🟡 amber strip                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ IN SERVICE                                                       │
│                                                                   │
│ ┃╔═══════════════════════════════════════════════════════════╗ │
│ ┃║ Neutral ivory base (#FFF9F4) — SAME AS WAITING           ║ │
│🟢║ Subtle paper texture (4% opacity) — SAME                  ║ │
│ ┃║ Soft neutral shadows — SAME                               ║ │
│ ┃║ 5px mint green accent strip on left                       ║ │
│ ┃╚═══════════════════════════════════════════════════════════╝ │
│                                                                   │
│ Status: In Service - Identified by 🟢 mint strip                │
└─────────────────────────────────────────────────────────────────┘

**Solution**: Same base, different accent = harmony + clarity
```

---

## Detailed Ticket Anatomy

### Unified Base Structure

```
┌─────────────────────────────────────────────────────────────┐
│ ALL TICKET TYPES (Waiting, In Service, Pending)             │
└─────────────────────────────────────────────────────────────┘

┃  ┌──────────────────────────────────────────────────────┐
┃  │ Base: #FFF9F4 (soft ivory)                           │
A  │ Texture: 4% opacity fractal noise                    │
C  │ Shadow: 0 1px 2px rgba(0,0,0,0.06)                   │
C  │         0 2px 4px rgba(0,0,0,0.04)                   │
E  │ Inset:  Subtle white highlights for depth            │
N  │ Border: 1px solid rgba(0,0,0,0.06)                   │
T  │                                                        │
┃  │ [Content: #, Name, Service, Actions, etc.]           │
S  │                                                        │
T  │ Hover: Background lightens to #FFFCF9 (+2%)          │
R  │        Shadow increases (8-6% opacity)                │
I  │        Accent strip darkens slightly                  │
P  │        Card lifts -0.5px                              │
┃  │                                                        │
┃  └──────────────────────────────────────────────────────┘
```

---

## Status Indicator Strip Details

### Left Edge Accent Strip (5px wide)

```
WAITING STATUS
┃━━━━━ 🟡 #FFE7B3 (light amber, pastel)
┃      ↓ hover
┃━━━━━ 🟡 #FFD280 (darker amber)

IN SERVICE STATUS
┃━━━━━ 🟢 #C9F3D1 (soft mint, pastel)
┃      ↓ hover
┃━━━━━ 🟢 #A5E8B0 (darker mint)

PENDING STATUS (Future)
┃━━━━━ ⚫ #EAEAEA @ 60% (light gray)
┃      ↓ hover
┃━━━━━ ⚫ #D4D4D4 (darker gray)
```

**Why It Works:**
- Thin strip = subtle but effective
- Left position = natural eye scanning
- Pastel saturation = calm, not overwhelming
- Color-coded = instant status recognition

---

## Hover State Visualization

### Default State
```
┃  ┌──────────────────────────────┐
┃  │ #FFF9F4                       │
┃  │ Shadow: light (6-4%)          │
┃  │ Position: 0px                 │
┃  │                               │
┃  │ [Ticket Content]              │
┃  │                               │
┃  └──────────────────────────────┘
   ▲ Surface level
```

### Hover State
```
┃  ┌──────────────────────────────┐  ← Lifts -0.5px
┃  │ #FFFCF9 (2% lighter)          │
┃  │ Shadow: stronger (8-6%)       │
┃  │ Accent: darker color          │
┃  │                               │
┃  │ [Ticket Content]              │
┃  │                               │
┃  └──────────────────────────────┘
   ▲ Elevated above surface
      ↓
   ███████ Enhanced shadow
```

**Effect:** Paper gently lifts off the desk, inviting interaction

---

## Typography Consistency

### Ticket Number
```
BOTH TYPES:
  Font: monospace
  Size: 11-12px (compact) → 18-24px (grid)
  Weight: bold/extrabold
  Color: #111827 (neutral dark gray)
  Letter spacing: -0.5px
```

### Client Name
```
BOTH TYPES:
  Font: system default
  Size: 11px (compact) → 16-18px (grid)
  Weight: semibold/bold
  Color: #111827
  Letter spacing: -0.2px
  Truncation: ellipsis on overflow
```

### Service Description
```
BOTH TYPES:
  Size: 9-10px (compact) → 13-14px (grid)
  Weight: 500-600
  Color: #6B7280 (medium gray)
  Line clamp: 1-2 lines depending on view
```

### Metadata (Time, Duration, Progress)
```
BOTH TYPES:
  Size: 8-9px (compact) → 11-12px (grid)
  Weight: medium/semibold
  Color: #6B7280
  Opacity: 0.7 for secondary info
```

**Result:** Perfect visual alignment across ticket types

---

## Shadow & Depth Layers

### Layer Breakdown

```
LAYER 4 (Top)
  inset 0 1px 1px rgba(255,255,255,0.9)
  ↑ Top highlight (paper sheen)

LAYER 3
  inset 0 0 0 1px rgba(255,255,255,0.8)
  ↑ Inner glow (edge highlight)

LAYER 2
  0 2px 4px rgba(0,0,0,0.04)
  ↑ Secondary shadow (ambient)

LAYER 1 (Bottom)
  0 1px 2px rgba(0,0,0,0.06)
  ↑ Primary shadow (direct)

═══════════════════════════
 Surface (desktop/table)
```

**Purpose:** Creates authentic paper depth without heavy drop shadows

---

## Design Tokens (CSS Variables Ready)

```css
/* Unified Ticket System */
--ticket-bg: #FFF9F4;
--ticket-bg-hover: #FFFCF9;
--ticket-border: rgba(0, 0, 0, 0.06);

/* Status Accents */
--status-waiting: #FFE7B3;
--status-waiting-hover: #FFD280;
--status-in-service: #C9F3D1;
--status-in-service-hover: #A5E8B0;
--status-pending: rgba(234, 234, 234, 0.6);
--status-pending-hover: #D4D4D4;

/* Shadows */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.06), 
             0 2px 4px rgba(0, 0, 0, 0.04);
--shadow-md: 0 2px 4px rgba(0, 0, 0, 0.08), 
             0 4px 8px rgba(0, 0, 0, 0.06);

/* Insets */
--inset-highlight: inset 0 0 0 1px rgba(255, 255, 255, 0.8),
                   inset 0 1px 1px rgba(255, 255, 255, 0.9);
--inset-highlight-hover: inset 0 0 0 1px rgba(255, 255, 255, 0.9),
                         inset 0 1px 1px rgba(255, 255, 255, 1);

/* Strip Width */
--status-strip-width: 5px;
```

---

## Client Type Badge System

### Badge Styling (Consistent Across All Tickets)

```
⭐ VIP
   ┌─────────┐
   │ ⭐       │ bg: #FFF9E6 (pale gold)
   └─────────┘ text: #8B6914 (warm brown)
                border: #E5D4A0

🔥 Priority
   ┌─────────┐
   │ 🔥       │ bg: #FFF1F0 (pale red)
   └─────────┘ text: #B91C1C (deep red)
                border: #FCA5A5

✨ New
   ┌─────────┐
   │ ✨       │ bg: #EEF2FF (pale indigo)
   └─────────┘ text: #4338CA (deep indigo)
                border: #C7D2FE

👤 Regular
   ┌─────────┐
   │ 👤       │ bg: #F9FAFB (pale gray)
   └─────────┘ text: #4B5563 (dark gray)
                border: #E5E7EB
```

**Size:** Icons scaled down slightly (0.9em) but higher contrast
**Purpose:** Quick visual identification without color clutter

---

## Responsive Behavior

### View Modes (All use same unified base)

**Compact (Line View)**
- Padding: 4-5px
- Border radius: 6px
- Height: ~28-32px
- 2-row layout

**Normal (Standard View)**
- Padding: 5-7px
- Border radius: 6px
- Height: ~50-60px
- 2-row responsive layout

**Grid Normal (Large Cards)**
- Padding: 11px
- Border radius: 8px
- Min height: 200-224px
- Flex column layout

**Grid Compact (Dense Grid)**
- Padding: 7-14px
- Border radius: 6px
- 4-row compact structure

**All views maintain:**
- Same base color
- Same texture
- Same shadow system
- Same accent strip position/width
- Same hover behavior

---

## Accessibility Features ✓

- **Focus States**: 2px blue outline, 2px offset
- **Keyboard Navigation**: All tickets are keyboard accessible
- **ARIA Labels**: Descriptive labels for screen readers
- **Color Contrast**: Text meets WCAG AA standards
- **Interactive Feedback**: Clear hover/active states
- **Role Attributes**: Proper button/clickable roles

---

## Benefits Summary

### Visual Harmony ✓
- **Unified base** eliminates jarring transitions
- **Consistent typography** improves readability
- **Same shadow system** creates cohesive depth

### Reduced Fatigue ✓
- **Neutral background** easier on eyes
- **Pastel accents** provide clarity without overwhelm
- **Minimal texture** avoids visual noise

### Status Clarity ✓
- **Color-coded strips** = instant recognition
- **Hover enhancement** = clear interactivity
- **Consistent position** = predictable scanning

### Scalability ✓
- **Token-based system** = easy updates
- **Extensible to new statuses** (Pending, etc.)
- **View-mode agnostic** = works everywhere

### Mango Brand Identity ✓
- **Premium feel** maintained
- **Paper-ticket metaphor** preserved
- **Modern aesthetic** enhanced
- **User-loved tactility** kept intact

---

*Designed for: Mango Biz Store POS*
*Date: Oct 31, 2025*
*Status: ✅ Implemented*
