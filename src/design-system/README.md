# Mango Design System

> Single source of truth for design tokens and styling in Mango POS.

## Quick Start

```typescript
// Main tokens
import { brand, colors, typography, spacing } from '@/design-system';

// Module-specific tokens
import { bookTokens } from '@/design-system/modules/book';
import { frontDeskTokens } from '@/design-system/modules/frontdesk';
import { ticketPanelTokens } from '@/design-system/modules/ticketPanel';
```

## Architecture

```
src/design-system/
├── tokens.ts              # Main design tokens (SSOT)
├── tokens/                # Modular token files
│   ├── colors.ts          # Color definitions
│   ├── typography.ts      # Font settings
│   └── ...
├── modules/               # Module-specific adapters
│   ├── book.ts           # Calendar/booking tokens
│   ├── frontdesk.ts      # Front desk ticket tokens
│   └── ticketPanel.ts    # Checkout panel tokens
└── index.ts              # Main export
```

## Brand Colors

The primary brand color is **Golden Amber** (#E6A000):

```typescript
import { brand } from '@/design-system';

// Primary palette
brand.primary[500]  // #E6A000 - Main brand color
brand.primary[400]  // #F5B800 - Lighter
brand.primary[600]  // #CC8800 - Darker
```

## Semantic Colors

```typescript
import { colors } from '@/design-system';

// Status colors
colors.status.success.main  // Green for success states
colors.status.error.main    // Red for errors
colors.status.warning.main  // Amber for warnings
colors.status.info.main     // Blue for information

// Background colors
colors.background.primary   // Main background
colors.background.secondary // Secondary/muted background

// Text colors
colors.text.primary        // Main text
colors.text.secondary      // Muted text
```

## Module Adapters

### Book Module (Calendar/Appointments)

```typescript
import { bookTokens, getBookStatusColor, getStaffColor } from '@/design-system/modules/book';

// Get appointment status colors
const statusColor = getBookStatusColor('confirmed');
// Returns: { bg, border, text, icon }

// Get staff color by index (for calendar columns)
const staffColor = getStaffColor(0);  // Golden amber
```

**Available status colors:**
- `scheduled` - Blue
- `confirmed` - Green
- `requested` - Yellow
- `inProgress` - Purple
- `checkedIn` - Cyan
- `completed` - Gray
- `cancelled` - Red
- `noShow` - Orange

### Front Desk Module (Tickets/Queue)

```typescript
import { frontDeskTokens, getStatusColors, getBadgeColors } from '@/design-system/modules/frontdesk';

// Paper ticket styling
frontDeskTokens.paper.base      // Warm beige paper color
frontDeskTokens.paper.texture   // Subtle texture overlay

// Status colors (waiting, in-service, etc.)
const status = getStatusColors('waiting');

// Badge colors (VIP, Priority, New, Regular)
const badge = getBadgeColors('vip');
```

### Ticket Panel Module (Checkout)

```typescript
import { ticketPanelTokens, StaffGroupStyles, ServiceRowStyles } from '@/design-system/modules/ticketPanel';

// Tailwind class strings
ticketPanelTokens.typography.staffName    // 'text-base font-semibold text-foreground'
ticketPanelTokens.colors.staffActive      // 'ring-2 ring-primary/30 bg-primary/5'

// Pre-built component styles
StaffGroupStyles.container    // Combined classes for staff group
ServiceRowStyles.name         // Service name styling
```

## CSS Variables

CSS variables are defined in `src/index.css` for shadcn/ui compatibility:

```css
/* Primary (Golden Amber) */
--primary: 40 100% 45%;
--primary-foreground: 0 0% 100%;

/* Status colors */
--success: 142 76% 36%;
--warning: 38 92% 50%;
--destructive: 0 84% 60%;

/* Sidebar (for navigation) */
--sidebar-background: 0 0% 100%;
--sidebar-primary: 40 100% 45%;
```

## Migration Guide

### From Hardcoded Colors

**Before:**
```tsx
<div className="bg-[#27AE60] text-white">Success</div>
```

**After:**
```tsx
<div className="bg-emerald-500 text-white">Success</div>
// Or using design tokens:
<div style={{ backgroundColor: colors.status.success.main }}>Success</div>
```

### From Legacy Token Files

The following files are deprecated and will be removed:
- `src/constants/premiumDesignSystem.ts`
- `src/constants/premiumDesignTokens.ts`
- `src/constants/bookDesignTokens.ts`

**Migration path:**
```typescript
// Before (deprecated)
import { PREMIUM_DESIGN_SYSTEM } from '@/constants/premiumDesignSystem';

// After
import { colors, typography, spacing } from '@/design-system';
```

## Best Practices

1. **Use Tailwind semantic classes** for common colors:
   - `bg-emerald-500` instead of `bg-[#10B981]`
   - `text-gray-700` instead of `text-[#374151]`

2. **Use design tokens** for brand/theme colors:
   - `brand.primary[500]` for primary actions
   - `colors.status.success.main` for success states

3. **Use module adapters** for feature-specific styling:
   - `bookTokens` for calendar components
   - `frontDeskTokens` for ticket components

4. **Use CSS variables** for shadcn/ui components:
   - `hsl(var(--primary))` in custom styles
   - Pre-configured via `tailwind.config.js`

## File Reference

| Purpose | Import Path |
|---------|------------|
| Main tokens | `@/design-system` |
| Book module | `@/design-system/modules/book` |
| Front Desk module | `@/design-system/modules/frontdesk` |
| Ticket Panel module | `@/design-system/modules/ticketPanel` |
| CSS variables | `src/index.css` |
| Tailwind config | `tailwind.config.js` |
