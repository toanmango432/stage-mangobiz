# Service Text Styling Standard

## Overview
Standardized service text styling across all view modes in both WaitListTicketCard and ServiceTicketCard components to ensure consistent readability and visual hierarchy.

---

## ✅ Unified Service Text Style

### Color Standard: `#6B7280` (medium gray)
All service text now uses the same neutral medium gray across all view modes for consistency.

### Font Weight by View Mode

| View Mode | Size | Weight | Color | Notes |
|-----------|------|--------|-------|-------|
| **Compact** | 10px | 500 (medium) | #6B7280 | Single line, truncated |
| **Normal** | 12-14px (xs-sm) | 500 (medium) | #6B7280 | Single line, responsive |
| **Grid Normal** | 14px (sm) | 600 (semibold) | #6B7280 | 2-line clamp for longer services |
| **Grid Compact** | 9px | 600 (semibold) | #6B7280 | Single line, truncated |

**Rationale**: 
- Smaller text (9-10px) needs slightly heavier weight (600) for readability
- Larger text (12-14px) can use medium weight (500) while maintaining legibility
- Consistent color (#6B7280) provides visual harmony across all views

---

## Changes Made

### WaitListTicketCard.tsx

#### ✅ Before (Inconsistent)
```javascript
// Compact: #6B7280, 10px, 500 ✓
// Normal: #6B7280, xs/sm, 500 ✓
// Grid Normal: text-gray-700 (different!), sm, semibold ✗
// Grid Compact: #4B5563 (different!), 9px, 600 ✗
```

#### ✅ After (Standardized)
```javascript
// Compact: #6B7280, 10px, 500 ✓
// Normal: #6B7280, xs/sm, 500 ✓
// Grid Normal: #6B7280, sm, 600 ✓
// Grid Compact: #6B7280, 9px, 600 ✓
```

### ServiceTicketCard.tsx

#### ✅ Before (Inconsistent)
```javascript
// Compact: #6B7280, 10px, 500 ✓
// Normal: #6B7280, xs/sm, 500 ✓
// Grid Normal: text-gray-700 (different!), sm, semibold ✗
// Grid Compact: #4B5563 (different!), 9px, 600 ✗
```

#### ✅ After (Standardized)
```javascript
// Compact: #6B7280, 10px, 500 ✓
// Normal: #6B7280, xs/sm, 500 ✓
// Grid Normal: #6B7280, sm, 600 ✓
// Grid Compact: #6B7280, 9px, 600 ✓
```

---

## Implementation Details

### Compact View (Line)
```javascript
<div className="truncate" style={{ 
  color: '#6B7280', 
  fontSize: '10px', 
  fontWeight: 500 
}} title={ticket.service}>
  {ticket.service}
</div>
```

### Normal View
```javascript
<div className="truncate flex-1 text-xs sm:text-sm" style={{ 
  color: '#6B7280', 
  fontWeight: 500 
}}>
  {ticket.service}
</div>
```

### Grid Normal View
```javascript
<div 
  className="text-sm"
  style={{
    color: '#6B7280',
    fontWeight: 600,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    lineHeight: '1.4',
  }}
  title={ticket.service}
>
  {ticket.service}
</div>
```

### Grid Compact View
```javascript
<div className="truncate" style={{ 
  color: '#6B7280', 
  fontSize: '9px', 
  fontWeight: 600 
}} title={ticket.service}>
  {ticket.service}
</div>
```

---

## Visual Hierarchy Maintained

### Typography Scale
```
Grid Normal (Largest)
  14px, weight 600, 2-line clamp
  ↓
Normal View (Standard)
  12-14px responsive, weight 500, truncated
  ↓
Compact View (Line)
  10px, weight 500, truncated
  ↓
Grid Compact (Smallest)
  9px, weight 600, truncated
```

### Color Consistency
All service text: `#6B7280` (medium gray)
- Part of unified ticket design system
- Provides clear secondary information hierarchy
- Maintains readability against ivory background (#FFF9F4)

---

## Benefits

### ✅ Consistency
- Same color across all views and ticket types
- Predictable visual scanning
- Unified brand experience

### ✅ Readability
- Appropriate weight for each size
- Sufficient contrast (WCAG AA compliant)
- Clear text hierarchy

### ✅ Maintainability
- Single color token (#6B7280)
- Clear documentation
- Easy to update globally

### ✅ Accessibility
- Title attributes for truncated text
- Consistent semantic structure
- Proper text contrast ratios

---

## Design Token

```javascript
// Service text color token
const SERVICE_TEXT_COLOR = '#6B7280'; // medium gray

// Usage in all view modes
style={{ color: SERVICE_TEXT_COLOR }}
```

---

## Testing Checklist

### Both WaitListTicketCard and ServiceTicketCard

- [x] Compact view: 10px, weight 500, #6B7280
- [x] Normal view: xs/sm, weight 500, #6B7280
- [x] Grid Normal: sm, weight 600, #6B7280, 2-line clamp
- [x] Grid Compact: 9px, weight 600, #6B7280
- [x] Hover states maintain color
- [x] Title attributes present for truncation
- [x] Responsive breakpoints work correctly

---

## Related Documentation

- **UNIFIED_TICKET_DESIGN_SYSTEM.md** - Overall design system
- **TICKET_DESIGN_MOCKUP.md** - Visual specifications
- **TICKET_REDESIGN_SUMMARY.md** - Complete redesign summary

---

*Last Updated: Oct 31, 2025*
*Components: WaitListTicketCard.tsx, ServiceTicketCard.tsx*
*Status: ✅ Standardized Across All Views*
