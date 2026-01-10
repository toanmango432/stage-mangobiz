# Mango Check-In App Design System

> Design tokens, color palette, typography, and spacing guidelines for the Check-In kiosk application.

---

## Design Philosophy

**Operational + Tactile + Premium + Modern Simplicity**

The Check-In App is a self-service kiosk optimized for **7-10 inch tablets** in a busy salon environment. Every design decision prioritizes:

1. **Speed** — Complete check-in in under 60 seconds
2. **Clarity** — One primary action per screen, clear visual hierarchy
3. **Touch-First** — 44px minimum touch targets, no hover-dependent interactions
4. **Accessibility** — WCAG 2.1 AA compliant, 4.5:1 contrast ratios

### The "Busy Saturday Test"

Every screen must pass: **Can a stressed client use this successfully with one hand in under 30 seconds?**

---

## Color Palette

### Primary Colors
```css
/* Rich Blue-Green (Mango Brand) */
--mango-primary:      #1a5f4a;   /* Main brand color */
--mango-primary-50:   #e8f5f0;   /* Lightest tint - selected states */
--mango-primary-100:  #c5e6d8;   /* Hover backgrounds */
--mango-primary-600:  #154d3c;   /* Hover state for buttons */
--mango-primary-700:  #103b2e;   /* Active/pressed state */
```

### Secondary Colors (Accent)
```css
/* Warm Gold/Amber - CTAs, rewards, highlights */
--mango-secondary:      #d4a853;   /* Accent color */
--mango-secondary-50:   #fdf8eb;   /* Light background */
--mango-secondary-100:  #f9ecc7;   /* Subtle highlight */
```

### Neutral Colors
```css
/* Warm neutrals - not pure gray */
--mango-gray-50:   #faf9f7;   /* Background (tactile cream) */
--mango-gray-100:  #f5f4f1;   /* Card hover backgrounds */
--mango-gray-200:  #e5e7eb;   /* Borders, dividers */
--mango-gray-300:  #d1d5db;   /* Disabled states */
--mango-gray-400:  #9ca3af;   /* Placeholder text */
--mango-gray-500:  #6b7280;   /* Secondary text */
--mango-gray-600:  #4b5563;   /* Body text */
--mango-gray-700:  #374151;   /* Strong text */
--mango-gray-800:  #1f2937;   /* Headings, primary text */
--mango-gray-900:  #111827;   /* Highest contrast */
```

### Semantic Colors
```css
/* Success - Check-in complete, positive actions */
--mango-success:     #22c55e;
--mango-success-bg:  #dcfce7;

/* Warning - Attention needed, pending states */
--mango-warning:     #eab308;
--mango-warning-bg:  #fef9c3;

/* Error - Validation errors, problems */
--mango-error:       #ef4444;
--mango-error-bg:    #fee2e2;

/* Info - Helpful information */
--mango-info:        #3b82f6;
--mango-info-bg:     #dbeafe;
```

### Special Purpose Colors
```css
/* VIP/Loyalty */
--mango-vip:         #d4a853;
--mango-vip-bg:      #fdf8eb;

/* Offline Indicator */
--mango-offline:     #6b7280;
--mango-offline-bg:  #f3f4f6;

/* Sync Pending */
--mango-pending:     #f59e0b;
```

### Accessibility: Color Contrast

| Combination | Ratio | Status |
|-------------|-------|--------|
| Primary on White | 6.2:1 | ✅ AAA |
| Gray-800 on Gray-50 | 14.7:1 | ✅ AAA |
| Gray-600 on White | 4.5:1 | ✅ AA |
| White on Primary | 6.2:1 | ✅ AAA |
| White on Secondary | 3.0:1 | ⚠️ Large text only |

---

## Typography

### Font Stack

**Display/Headers**: `Plus Jakarta Sans` — Geometric, modern, premium
```css
font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
```

**Body/Operational**: `Work Sans` — Functional, highly readable
```css
font-family: 'Work Sans', system-ui, sans-serif;
```

**Monospace (Prices, Numbers)**: Native monospace
```css
font-family: 'JetBrains Mono', 'SF Mono', 'Consolas', monospace;
```

### Type Scale

| Token | Size | Line Height | Usage |
|-------|------|-------------|-------|
| `text-xs` | 12px | 16px | Captions, labels, fine print |
| `text-sm` | 14px | 20px | Secondary text, metadata |
| `text-base` | 16px | 24px | Body text (minimum for kiosk) |
| `text-lg` | 18px | 28px | Large body, emphasized content |
| `text-xl` | 20px | 28px | Subheadings |
| `text-2xl` | 24px | 32px | Section headers |
| `text-3xl` | 30px | 36px | Page titles |
| `text-4xl` | 36px | 40px | Hero numbers (check-in number) |
| `text-5xl` | 48px | 52px | Large display (phone input) |
| `text-6xl` | 60px | 64px | Extra large display |

### Font Weights

| Weight | Value | Usage |
|--------|-------|-------|
| Normal | 400 | Body text |
| Medium | 500 | Labels, emphasis |
| Semibold | 600 | Buttons, subheadings |
| Bold | 700 | Headings, key information |

### Kiosk-Specific Typography Rules

1. **Minimum body text**: 16px (no 14px body text on kiosk)
2. **Minimum labels**: 14px
3. **Maximum line length**: 60 characters
4. **Contrast**: All text meets 4.5:1 minimum

---

## Spacing System (8pt Grid)

All spacing uses multiples of 8px for visual consistency.

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Micro: icon padding, tight gaps |
| `space-2` | 8px | Tight: inline elements, compact lists |
| `space-3` | 12px | Compact: form field gaps |
| `space-4` | 16px | Default: most common spacing |
| `space-5` | 20px | Comfortable: card padding |
| `space-6` | 24px | Generous: section gaps |
| `space-8` | 32px | Large: major section padding |
| `space-10` | 40px | Extra: page margins |
| `space-12` | 48px | Section: between major sections |

### Common Spacing Patterns

```
Page padding:        24px (p-6)
Card padding:        20px (p-5)
Card gap:            16px (gap-4)
Form field gap:      12px (gap-3)
Button internal:     16px horizontal, 12px vertical
Icon-text gap:       8px (gap-2)
```

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | 4px | Tags, badges |
| `rounded-md` | 8px | Buttons, inputs |
| `rounded-lg` | 12px | Cards, service cards |
| `rounded-xl` | 16px | Large cards, panels |
| `rounded-2xl` | 24px | Modals, prominent cards |
| `rounded-3xl` | 32px | Hero elements, main containers |
| `rounded-full` | 9999px | Pills, avatars, circular buttons |

### Kiosk-Specific Radii

```
Keypad buttons:      12px (rounded-xl)
Phone input:         24px (rounded-2xl)
Main CTA:            12px (rounded-xl)
Category tabs:       12px (rounded-xl)
Service cards:       16px (rounded-2xl)
Modal dialogs:       32px (rounded-3xl)
```

---

## Shadows

| Token | CSS | Usage |
|-------|-----|-------|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle elevation |
| `shadow` | `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)` | Default cards |
| `shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.1)` | Hover state |
| `shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.1)` | Elevated elements |
| `shadow-xl` | `0 20px 25px -5px rgba(0,0,0,0.1)` | Modals |
| `shadow-paper` | `0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)` | Tactile paper feel |

### Button-Specific Shadows

```css
/* Primary button shadow */
box-shadow: 0 4px 14px rgba(26, 95, 74, 0.25);  /* Primary color */

/* Hover state */
box-shadow: 0 8px 20px rgba(26, 95, 74, 0.30);
```

---

## Touch Targets

### Minimum Sizes

| Element | Minimum Size | Recommended |
|---------|-------------|-------------|
| Buttons | 44 × 44px | 48 × 48px |
| Keypad keys | 48 × 48px | 56 × 56px |
| Links/icons | 44 × 44px | 44 × 44px |
| Checkboxes | 24 × 24px (visual) + 44px tap area | 32 × 32px |

### Spacing Between Targets

Minimum 8px gap between adjacent touch targets to prevent accidental taps.

---

## Animations & Transitions

### Duration Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `duration-fast` | 100ms | Micro-interactions (button press) |
| `duration-normal` | 200ms | Most transitions |
| `duration-slow` | 300ms | Page transitions, modals |

### Easing Functions

```css
--ease-out: cubic-bezier(0, 0, 0.2, 1);     /* Most common */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Standard Transitions

```css
/* Button hover/press */
transition: all 150ms ease-out;

/* Card hover */
transition: all 200ms ease;

/* Modal/panel appearance */
transition: all 300ms ease-out;
```

### Key Animations

| Animation | Usage | Duration |
|-----------|-------|----------|
| `scale-95 → scale-100` | Button press feedback | 150ms |
| `fade-in` | Page transitions | 200ms |
| `slide-up` | Modals, bottom sheets | 300ms |
| `bounce-subtle` | Success indicators | 2s (infinite) |
| `confetti-fall` | Celebration | 3s |

---

## Z-Index Scale

| Level | Value | Usage |
|-------|-------|-------|
| Base | 0 | Default content |
| Elevated | 10 | Cards, dropdowns |
| Sticky | 20 | Headers, toolbars |
| Overlay | 30 | Backdrop |
| Modal | 40 | Dialogs, bottom sheets |
| Popover | 50 | Tooltips, popovers |
| Toast | 60 | Toast notifications |

---

## Background Patterns

### Ambient Gradients

```css
/* Top-right ambient circle */
.ambient-top {
  background: radial-gradient(
    circle at top right,
    rgba(26, 95, 74, 0.08) 0%,
    transparent 50%
  );
}

/* Bottom-left ambient circle */
.ambient-bottom {
  background: radial-gradient(
    circle at bottom left,
    rgba(212, 168, 83, 0.10) 0%,
    transparent 50%
  );
}
```

### Paper Texture

```css
/* Subtle noise texture for tactile feel */
.paper-texture {
  background-image: url("data:image/svg+xml,...");
  opacity: 0.03;
}
```

---

## Tailwind CSS Classes Reference

### Quick Reference

```jsx
// Colors
bg-[#faf9f7]      // Cream background
bg-[#1a5f4a]      // Primary
bg-[#154d3c]      // Primary dark (hover)
bg-[#e8f5f0]      // Primary light (selected)
bg-[#d4a853]      // Secondary/accent
text-[#1f2937]    // Heading text
text-[#6b7280]    // Secondary text
text-[#9ca3af]    // Muted text

// Typography
font-['Plus_Jakarta_Sans']  // Display font
font-['Work_Sans']          // Body font

// Common patterns
rounded-xl rounded-2xl rounded-3xl
shadow-sm shadow-md shadow-lg shadow-xl
p-4 p-5 p-6 p-8
gap-2 gap-3 gap-4 gap-6
```

---

*Last updated: January 2026*
*Version: 1.0*
