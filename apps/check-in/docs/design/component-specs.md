# Component Specifications

> Detailed specifications for all UI components in the Mango Check-In App.

---

## Buttons

### Primary Button (CTA)

The main call-to-action button used for primary actions like "Continue", "Check In", "Confirm".

```
┌─────────────────────────────────────┐
│       Continue           →         │
└─────────────────────────────────────┘
```

**Specifications:**
| Property | Value |
|----------|-------|
| Height | 56px (mobile), 52px (tablet) |
| Padding | 16px vertical, 24px horizontal |
| Border Radius | 12px (rounded-xl) |
| Font | Plus Jakarta Sans, 18px, semibold (600) |
| Background | #1a5f4a |
| Text Color | white |
| Shadow | 0 4px 14px rgba(26, 95, 74, 0.25) |

**States:**
| State | Background | Shadow | Transform |
|-------|------------|--------|-----------|
| Default | #1a5f4a | Yes | — |
| Hover | #154d3c | Increased | translateY(-1px) |
| Active/Pressed | #154d3c | Reduced | scale(0.98) |
| Disabled | #e5e7eb | None | — |
| Loading | #1a5f4a | Yes | — (spinner shown) |

**Implementation:**
```jsx
<button className="
  w-full py-4 rounded-xl
  font-['Plus_Jakarta_Sans'] text-lg font-semibold
  bg-[#1a5f4a] text-white
  shadow-lg shadow-[#1a5f4a]/25
  hover:bg-[#154d3c] hover:shadow-xl
  active:scale-[0.98]
  disabled:bg-[#e5e7eb] disabled:text-[#9ca3af] disabled:shadow-none
  transition-all duration-150
  flex items-center justify-center gap-2
">
  Continue
  <ChevronRight className="w-5 h-5" />
</button>
```

---

### Secondary Button

Used for secondary actions like "Back", "Cancel", "Scan QR".

**Specifications:**
| Property | Value |
|----------|-------|
| Height | 44px |
| Padding | 10px vertical, 16px horizontal |
| Border Radius | 12px |
| Font | Work Sans, 14px, medium (500) |
| Background | white |
| Border | 1px solid #e5e7eb |
| Text Color | #1a5f4a |

**States:**
| State | Background | Border |
|-------|------------|--------|
| Default | white | #e5e7eb |
| Hover | #f9fafb | #1a5f4a/20 |
| Active | #f3f4f6 | #1a5f4a/30 |

---

### Icon Button (Delete, etc.)

Used for icon-only actions like backspace on keypad.

**Specifications:**
| Property | Value |
|----------|-------|
| Size | 56 × 56px (keypad), 44 × 44px (general) |
| Border Radius | 12px |
| Background | #f3f4f6 |
| Icon Size | 20px |
| Icon Color | #6b7280 |

---

## Text Inputs

### Phone Input Display

Large display showing formatted phone number entry.

```
┌──────────────────────────────────────────┐
│                                          │
│             555-123-4567                 │
│                                          │
└──────────────────────────────────────────┘
```

**Specifications:**
| Property | Value |
|----------|-------|
| Height | 76px |
| Padding | 20px |
| Border Radius | 24px (rounded-2xl) |
| Font | Plus Jakarta Sans, 36-40px, bold |
| Background | white |
| Border | 2px solid (dynamic) |
| Text Color | #1f2937 |
| Placeholder Color | #d1d5db |

**Border States:**
| State | Border Color |
|-------|-------------|
| Empty | #e5e7eb |
| Focused/Has Value | #1a5f4a |
| Error | #ef4444 |

---

### Standard Text Input

Used for registration form fields.

**Specifications:**
| Property | Value |
|----------|-------|
| Height | 52px |
| Padding | 12px 16px |
| Border Radius | 12px |
| Font | Work Sans, 16px, normal |
| Background | white |
| Border | 1px solid #d1d5db |
| Placeholder | #9ca3af |

**States:**
| State | Border | Shadow |
|-------|--------|--------|
| Default | #d1d5db | — |
| Focus | #1a5f4a | 0 0 0 3px #e8f5f0 |
| Error | #ef4444 | 0 0 0 3px #fee2e2 |
| Disabled | #e5e7eb | — |

---

## Keypad

### Numeric Keypad

10-digit phone number entry keypad optimized for touch.

```
┌────┐  ┌────┐  ┌────┐
│ 1  │  │ 2  │  │ 3  │
└────┘  └────┘  └────┘
┌────┐  ┌────┐  ┌────┐
│ 4  │  │ 5  │  │ 6  │
└────┘  └────┘  └────┘
┌────┐  ┌────┐  ┌────┐
│ 7  │  │ 8  │  │ 9  │
└────┘  └────┘  └────┘
┌────┐  ┌────┐  ┌────┐
│    │  │ 0  │  │ ⌫  │
└────┘  └────┘  └────┘
```

**Key Specifications:**
| Property | Value |
|----------|-------|
| Key Size | 56px height |
| Gap | 10px (gap-2.5) |
| Border Radius | 12px |
| Font | Plus Jakarta Sans, 20-24px, semibold |
| Background | white |
| Border | 1px solid #e5e7eb |

**Key States:**
| State | Background | Border | Transform |
|-------|------------|--------|-----------|
| Default | white | #e5e7eb | — |
| Hover | #f9fafb | #1a5f4a/20 | — |
| Pressed | #e8f5f0 | #1a5f4a/30 | scale(0.95) |
| Disabled | white (40% opacity) | #e5e7eb | — |

---

## Cards

### Service Card

Selectable card for service selection.

```
┌───────────────────────────────────┐
│  Gel Manicure              ○/●   │
│                                   │
│  🕐 45 min    💵 $40             │
└───────────────────────────────────┘
```

**Specifications:**
| Property | Value |
|----------|-------|
| Padding | 20px (p-5) |
| Border Radius | 16px (rounded-2xl) |
| Border | 2px solid (dynamic) |
| Background | white |

**States:**
| State | Background | Border |
|-------|------------|--------|
| Default | white | #e5e7eb |
| Hover | white | #1a5f4a/50 |
| Selected | #e8f5f0 | #1a5f4a |

**Checkbox indicator:**
- Unselected: 24px circle, 2px border #d1d5db
- Selected: 24px circle, filled #1a5f4a, white checkmark

---

### Technician Card

Selectable card for technician preference.

```
┌───────────────────────────────────┐
│  ┌────┐                          │
│  │ 👤 │  Lisa Chen         ○/●   │
│  └────┘  Available               │
│          ~10 min wait            │
└───────────────────────────────────┘
```

**Specifications:**
| Property | Value |
|----------|-------|
| Padding | 16px |
| Border Radius | 16px |
| Border | 2px solid (dynamic) |
| Avatar | 48px circle |

**Status Badge Colors:**
| Status | Color | Background |
|--------|-------|------------|
| Available | #22c55e | #dcfce7 |
| With Client | #eab308 | #fef9c3 |
| On Break | #6b7280 | #f3f4f6 |

---

### Summary Card

Shows selected services in the summary panel.

```
┌───────────────────────────────────┐
│  Gel Manicure                    │
│  45 min                     $40  │
└───────────────────────────────────┘
```

**Specifications:**
| Property | Value |
|----------|-------|
| Padding | 12px |
| Border Radius | 12px |
| Background | #f9fafb |

---

## Category Tabs

### Vertical Category Navigation

```
┌─────────────────┐
│ 💅 Nails    •   │  ← Active (selected)
├─────────────────┤
│ ✨ Waxing       │
├─────────────────┤
│ 👁️ Lashes       │
├─────────────────┤
│ 🧴 Skincare     │
└─────────────────┘
```

**Tab Specifications:**
| Property | Value |
|----------|-------|
| Height | 48px |
| Padding | 12px 16px |
| Border Radius | 12px |
| Font | Work Sans, 14px, medium |

**States:**
| State | Background | Text Color |
|-------|------------|------------|
| Default | transparent | #4b5563 |
| Hover | #f3f4f6 | #4b5563 |
| Active | #1a5f4a | white |

**Selection Indicator:**
- Small dot (8px) when category has selected items

---

## Checkboxes

### Agreement Checkbox

```
┌────┐
│ ✓  │  I agree to the salon policies...
└────┘
```

**Specifications:**
| Property | Value |
|----------|-------|
| Box Size | 24px |
| Border Radius | 8px |
| Border | 2px solid |
| Checkmark | 16px, white, strokeWidth 3 |

**States:**
| State | Background | Border |
|-------|------------|--------|
| Unchecked | white | #d1d5db |
| Checked | #1a5f4a | #1a5f4a |
| Focus | — | — (outline ring) |

---

## Modals

### Standard Modal

```
┌──────────────────────────────────────────┐
│  Modal Title                        ✕    │
├──────────────────────────────────────────┤
│                                          │
│  Modal content area                      │
│                                          │
├──────────────────────────────────────────┤
│         [ Cancel ]    [ Confirm ]        │
└──────────────────────────────────────────┘
```

**Specifications:**
| Property | Value |
|----------|-------|
| Max Width | 600px (md), 400px (sm) |
| Border Radius | 32px (rounded-3xl) |
| Padding | Header 24px, Content 24px, Footer 24px |
| Background | white |
| Backdrop | black/50 with blur-sm |

**Animation:**
- Entry: slide-up 300ms ease-out + fade-in
- Exit: slide-down 200ms ease-in + fade-out

---

### Idle Warning Modal

Centered modal with icon, message, and single CTA.

**Specifications:**
| Property | Value |
|----------|-------|
| Max Width | 360px |
| Padding | 32px |
| Border Radius | 32px |
| Icon Size | 64px circle |

---

## Status Indicators

### Queue Position Badge

```
┌──────────────────────────────────────────┐
│     Your Check-In Number                 │
│                                          │
│            #042                          │
│                                          │
└──────────────────────────────────────────┘
```

**Specifications:**
| Property | Value |
|----------|-------|
| Padding | 32px |
| Border Radius | 24px |
| Border | 2px solid #1a5f4a |
| Number Font | Plus Jakarta Sans, 60px, bold |
| Number Color | #1a5f4a |

---

### Offline Banner

```
┌──────────────────────────────────────────┐
│  ☁️ Offline — Changes will sync when     │
│     online                               │
└──────────────────────────────────────────┘
```

**Specifications:**
| Property | Value |
|----------|-------|
| Height | 40px |
| Background | #f3f4f6 |
| Text | Work Sans, 14px, #6b7280 |
| Icon | 16px, #6b7280 |
| Position | Fixed top |

---

## Progress Indicators

### Loyalty Points Bar

```
                450/500
├██████████████████████░░░░│
```

**Specifications:**
| Property | Value |
|----------|-------|
| Height | 12px |
| Border Radius | 6px (rounded-full) |
| Background | white/30 (on dark bg) |
| Fill | white |
| Animation | width transition 500ms |

---

### Loading Spinner

**Specifications:**
| Property | Value |
|----------|-------|
| Size | 20px (button), 40px (page) |
| Border | 2px |
| Border Color | white/30, top: white |
| Animation | spin 1s linear infinite |

---

## Icons

### Icon Sizes

| Context | Size |
|---------|------|
| Inline with text | 16px |
| Button icon | 20px |
| Feature icon | 24px |
| Large decorative | 32px |
| Hero icon | 48-64px |

### Icon Library

Using **Lucide React** icons. Common icons:

| Icon | Usage |
|------|-------|
| `ChevronRight` | Navigation forward |
| `ArrowLeft` | Back button |
| `Check` | Confirmation, selected |
| `X` | Close, cancel |
| `Clock` | Duration, wait time |
| `DollarSign` | Price |
| `QrCode` | QR scan |
| `Delete` | Backspace |
| `Sparkles` | Special, promo |
| `Gift` | Rewards, loyalty |
| `Home` | Return to start |

---

## Animations Reference

### Button Press
```css
transition: all 150ms ease-out;
transform: scale(0.98);
```

### Card Select
```css
transition: all 200ms ease;
border-color: #1a5f4a;
background-color: #e8f5f0;
```

### Modal Entry
```css
@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
animation: slide-up 300ms ease-out;
```

### Success Bounce
```css
@keyframes bounce-subtle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
animation: bounce-subtle 2s ease-in-out infinite;
```

### Confetti Fall
```css
@keyframes fall {
  0% {
    transform: translateY(-100vh) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}
animation: fall 3s linear forwards;
```

---

*Last updated: January 2026*
