# UI Component Library

This is the **standardized UI component library** for the Mango POS application. All components use design tokens from `tailwind.config.js` to ensure visual consistency across the entire application.

## Design Principles

1. **Consistency**: All components use the same color palette (brand teal), shadows (premium-*), and animations
2. **Accessibility**: Proper focus states, ARIA support, and keyboard navigation
3. **Flexibility**: Variants and sizes for different use cases
4. **Type Safety**: Full TypeScript support with exported prop types

## Components

### Button

Standardized button with 5 variants and loading states.

```tsx
import { Button } from '@/components/ui';

// Primary button (brand teal)
<Button variant="primary" size="md" onClick={handleSave}>
  Save Changes
</Button>

// Secondary button (outlined)
<Button variant="secondary" size="md">
  Cancel
</Button>

// With icon
<Button variant="primary" icon={<Plus size={16} />}>
  Add Item
</Button>

// Loading state
<Button variant="primary" loading>
  Processing...
</Button>

// Full width
<Button variant="primary" fullWidth>
  Continue
</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' (default: 'primary')
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `loading`: boolean (shows spinner, disables button)
- `icon`: React.ReactNode
- `fullWidth`: boolean

---

### Card

Container component with elevation variants.

```tsx
import { Card } from '@/components/ui';

// Default card
<Card variant="default" padding="md">
  <h3>Card Title</h3>
  <p>Card content</p>
</Card>

// Elevated card with hover effect
<Card variant="elevated" padding="lg" hoverable>
  <h3>Hoverable Card</h3>
</Card>

// Outlined card (no shadow)
<Card variant="outlined" padding="sm">
  <p>Outlined content</p>
</Card>
```

**Props:**
- `variant`: 'default' | 'elevated' | 'outlined' (default: 'default')
- `padding`: 'none' | 'sm' | 'md' | 'lg' (default: 'md')
- `hoverable`: boolean (adds hover lift effect)

---

### Input

Text input with label, icons, and error states.

```tsx
import { Input } from '@/components/ui';
import { Mail, Search } from 'lucide-react';

// Basic input
<Input
  label="Email"
  type="email"
  placeholder="Enter your email"
/>

// With icon
<Input
  label="Search"
  icon={<Search size={16} />}
  placeholder="Search..."
/>

// With error
<Input
  label="Password"
  type="password"
  error="Password must be at least 8 characters"
/>

// With helper text
<Input
  label="Username"
  helperText="Choose a unique username"
/>

// Full width
<Input
  label="Full Name"
  fullWidth
/>
```

**Props:**
- `label`: string (optional)
- `error`: string (shows error message in red)
- `helperText`: string (shows helper text in gray)
- `icon`: React.ReactNode
- `iconPosition`: 'left' | 'right' (default: 'left')
- `fullWidth`: boolean

---

### Badge

Status indicator with color variants.

```tsx
import { Badge } from '@/components/ui';

// Success badge
<Badge variant="success" size="md">
  Active
</Badge>

// Warning badge
<Badge variant="warning" size="sm">
  Pending
</Badge>

// With status dot
<Badge variant="info" dot>
  In Progress
</Badge>
```

**Props:**
- `variant`: 'default' | 'success' | 'warning' | 'danger' | 'info' (default: 'default')
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `dot`: boolean (shows colored dot indicator)

---

### Select

Dropdown select with custom styling.

```tsx
import { Select } from '@/components/ui';

// Basic select
<Select label="Status" fullWidth>
  <option value="">Select status...</option>
  <option value="active">Active</option>
  <option value="inactive">Inactive</option>
</Select>

// With error
<Select
  label="Category"
  error="Please select a category"
>
  <option value="">Choose...</option>
  <option value="1">Category 1</option>
</Select>
```

**Props:**
- `label`: string (optional)
- `error`: string (shows error message in red)
- `helperText`: string (shows helper text in gray)
- `fullWidth`: boolean

---

## Design Tokens Reference

All components use these tokens from `tailwind.config.js`:

### Colors
- **Brand**: `brand-50` through `brand-900` (teal palette)
- **Surface**: `surface-primary`, `surface-secondary`, `surface-tertiary`, `surface-elevated`

### Shadows
- `shadow-premium-xs`: Subtle shadow
- `shadow-premium-sm`: Small shadow
- `shadow-premium-md`: Medium shadow (default for elevated elements)
- `shadow-premium-lg`: Large shadow
- `shadow-premium-xl`: Extra large shadow

### Border Radius
- `rounded-lg`: 8px (inputs, small buttons)
- `rounded-xl`: 12px (cards, large buttons)
- `rounded-premium-md`: 12px
- `rounded-premium-lg`: 16px

### Animations
- `transition-all duration-200`: Standard transition
- `ease-smooth`: Cubic bezier easing

---

## Migration Guide

### Replacing Old Buttons

**Before:**
```tsx
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
  Save
</button>
```

**After:**
```tsx
<Button variant="primary" size="md">
  Save
</Button>
```

### Replacing Old Cards

**Before:**
```tsx
<div className="bg-white rounded-xl shadow-lg p-6">
  Content
</div>
```

**After:**
```tsx
<Card variant="elevated" padding="lg">
  Content
</Card>
```

### Replacing Old Inputs

**Before:**
```tsx
<input
  type="text"
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
  placeholder="Search..."
/>
```

**After:**
```tsx
<Input
  placeholder="Search..."
  fullWidth
/>
```

---

## Next Steps

1. **Refactor existing modules** to use these components
2. **Remove duplicate button/input/card implementations**
3. **Add more components** as needed (Modal, Tabs, Dropdown, etc.)
4. **Create a Storybook** for visual documentation and testing

---

## Notes

- All components forward refs for advanced use cases
- All components support `className` prop for additional customization
- TypeScript prop types are exported for use in other components
- Components are designed to be composable and extendable
