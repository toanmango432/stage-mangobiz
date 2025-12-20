# Pending Tickets - Phase 1 Implementation Plan

## Overview
Refactor PendingTickets component to use the unified BasePaperTicket design system while preserving payment-specific functionality.

## Current Issues
- ❌ Random paper colors (5 variations)
- ❌ Random texture patterns (5 patterns)
- ❌ Inconsistent shadow system (2 layers vs 6 layers)
- ❌ Flat ticket number badge (no wrap-around effect)
- ❌ Left accent bar with no depth
- ❌ Semicircle dots don't match notch system
- ❌ Missing perforation dots at top

## Goals
- ✅ Use BasePaperTicket for consistent premium design
- ✅ Keep payment-specific features (price breakdown, payment type, mark paid)
- ✅ Maintain grid layout and responsive behavior
- ✅ Preserve tab filtering and dropdown menus
- ✅ Keep UNPAID watermark (refined)

---

## Implementation Steps

### Step 1: Create PendingTicketCard Component
**File**: `src/components/tickets/PendingTicketCard.tsx`

**Purpose**: Wrapper component that combines BasePaperTicket with payment-specific content.

**Structure**:
```typescript
import { BasePaperTicket } from './paper';
import { PremiumColors, PremiumTypography } from '../../constants/premiumDesignTokens';

interface PendingTicketCardProps {
  ticket: PendingTicket;
  onMarkPaid: (id: string) => void;
  onOpenMenu: (id: string) => void;
  isMenuOpen: boolean;
}

export function PendingTicketCard({ ticket, onMarkPaid, onOpenMenu, isMenuOpen }) {
  return (
    <BasePaperTicket
      state="pending"
      viewMode="grid-normal"  // Single view mode for grid layout
      ticketNumber={ticket.number}
      onClick={() => console.log('Ticket clicked')}
    >
      {/* Content layers */}
      <UnpaidWatermark />
      <TicketHeader ticket={ticket} onOpenMenu={onOpenMenu} isMenuOpen={isMenuOpen} />
      <ClientInfo ticket={ticket} />
      <PriceBreakdown ticket={ticket} />
      <PaymentFooter ticket={ticket} onMarkPaid={onMarkPaid} />
    </BasePaperTicket>
  );
}
```

**Components to Extract**:
1. `UnpaidWatermark` - The faded "UNPAID" stamp
2. `TicketHeader` - Ticket number + ID + dropdown menu
3. `ClientInfo` - Client name + service
4. `PriceBreakdown` - Subtotal, tax, tip, total
5. `PaymentFooter` - Payment type icon + Mark Paid button

### Step 2: Extract Sub-Components

#### 2.1 UnpaidWatermark.tsx
```typescript
export function UnpaidWatermark() {
  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-12 opacity-[0.06] pointer-events-none select-none">
      <div
        className="text-[#FF6B6B] font-bold text-3xl tracking-[0.2em] uppercase"
        style={{
          fontFamily: PremiumTypography.fontFamily.mono,
          textShadow: '0 0 1px rgba(255,107,107,0.2)',
        }}
      >
        UNPAID
      </div>
    </div>
  );
}
```

#### 2.2 TicketHeader.tsx
```typescript
interface TicketHeaderProps {
  ticket: { id: string; number: number };
  onOpenMenu: (id: string) => void;
  isMenuOpen: boolean;
}

export function TicketHeader({ ticket, onOpenMenu, isMenuOpen }: TicketHeaderProps) {
  return (
    <div className="flex justify-between items-center px-4 py-3 border-b border-dashed"
         style={{ borderColor: PremiumColors.borders.light }}>
      {/* Ticket ID badge */}
      <div className="flex items-center gap-2">
        <div
          className="text-xs px-2 py-0.5 rounded-md border"
          style={{
            background: '#EEF2FF',
            color: '#4338CA',
            borderColor: '#C7D2FE',
          }}
        >
          #{ticket.id}
        </div>
      </div>

      {/* Dropdown menu */}
      <DropdownMenu ticket={ticket} onOpenMenu={onOpenMenu} isOpen={isMenuOpen} />
    </div>
  );
}
```

#### 2.3 ClientInfo.tsx
```typescript
export function ClientInfo({ ticket }: { ticket: PendingTicket }) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <UserCheck size={14} style={{ color: PremiumColors.status.pending.icon }} />
        <div
          className="truncate"
          style={PremiumTypography.ticketText.clientName}
        >
          {ticket.clientName}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <Tag size={12} style={{ color: PremiumColors.text.secondary }} />
        <span
          className="truncate"
          style={PremiumTypography.ticketText.service}
        >
          {ticket.service}
          {ticket.additionalServices > 0 && (
            <span className="ml-1 text-[9px] bg-gray-100 px-1 rounded-sm border border-gray-200">
              +{ticket.additionalServices}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
```

#### 2.4 PriceBreakdown.tsx
```typescript
export function PriceBreakdown({ ticket }: { ticket: PendingTicket }) {
  const total = ticket.subtotal + ticket.tax + ticket.tip;

  return (
    <div className="px-4 py-3 space-y-1">
      <PriceRow label="Subtotal" amount={ticket.subtotal} />
      <PriceRow label="Tax" amount={ticket.tax} />
      <PriceRow label="Tip" amount={ticket.tip} />

      <div
        className="flex justify-between pt-2 mt-2 border-t"
        style={{ borderColor: PremiumColors.borders.light }}
      >
        <span
          className="font-semibold"
          style={{
            fontSize: '14px',
            color: PremiumColors.text.primary
          }}
        >
          Total:
        </span>
        <span
          className="font-bold"
          style={{
            fontSize: '14px',
            color: PremiumColors.text.primary,
            fontFamily: PremiumTypography.fontFamily.mono,
          }}
        >
          ${total.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

function PriceRow({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex justify-between text-xs">
      <span style={{ color: PremiumColors.text.secondary }}>{label}:</span>
      <span style={{
        color: PremiumColors.text.primary,
        fontWeight: 500,
        fontFamily: PremiumTypography.fontFamily.mono,
      }}>
        ${amount.toFixed(2)}
      </span>
    </div>
  );
}
```

#### 2.5 PaymentFooter.tsx
```typescript
const paymentTypeConfig = {
  card: { icon: CreditCard, label: 'Card Payment', color: '#3B82F6' },
  cash: { icon: DollarSign, label: 'Cash Payment', color: '#10B981' },
  venmo: { icon: Share2, label: 'Venmo', color: '#8B5CF6' },
};

export function PaymentFooter({
  ticket,
  onMarkPaid
}: {
  ticket: PendingTicket;
  onMarkPaid: (id: string) => void;
}) {
  const config = paymentTypeConfig[ticket.paymentType];
  const Icon = config.icon;

  return (
    <div
      className="flex items-center justify-between px-4 py-3 border-t"
      style={{
        background: PremiumColors.paper.base,
        borderColor: PremiumColors.borders.light,
      }}
    >
      <div className="flex items-center gap-1.5">
        <Icon size={14} style={{ color: config.color }} />
        <span
          className="text-xs font-medium"
          style={{ color: PremiumColors.text.secondary }}
        >
          {config.label}
        </span>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onMarkPaid(ticket.id);
        }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
        style={{
          background: '#3B82F6',
          color: '#FFFFFF',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#2563EB';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#3B82F6';
        }}
      >
        <CheckCircle size={12} />
        Mark Paid
      </button>
    </div>
  );
}
```

### Step 3: Update PendingTickets.tsx

**Changes**:
1. Import PendingTicketCard instead of inline rendering
2. Remove paperTextures and paperVariations arrays
3. Simplify ticket rendering to use new component

**Before** (lines 140-268):
```typescript
{filteredTickets.map((ticket, index) => {
  const paperColor = paperVariations[ticket.id % paperVariations.length];
  const texturePattern = paperTextures[ticket.id % paperTextures.length];
  return (
    <div key={ticket.id} style={{ backgroundColor: paperColor, ... }}>
      {/* 128 lines of inline JSX */}
    </div>
  );
})}
```

**After**:
```typescript
{filteredTickets.map((ticket) => (
  <PendingTicketCard
    key={ticket.id}
    ticket={ticket}
    onMarkPaid={markTicketAsPaid}
    onOpenMenu={(id) => setOpenDropdownId(id)}
    isMenuOpen={openDropdownId === ticket.id}
  />
))}
```

**Removed**:
- Lines 50-53: paperTextures and paperVariations arrays
- Lines 140-268: Inline ticket rendering with custom styling
- Lines 151-157: Semicircle cut-outs and flat accent bar

**Kept**:
- Header section (minimized/expanded views)
- Tab navigation (All, Card, Cash, Venmo)
- Empty state message
- Dropdown menu logic
- markTicketAsPaid function

---

## File Structure After Changes

```
src/components/
├── PendingTickets.tsx (updated)
└── tickets/
    ├── PendingTicketCard.tsx (new)
    ├── pending/
    │   ├── UnpaidWatermark.tsx
    │   ├── TicketHeader.tsx
    │   ├── ClientInfo.tsx
    │   ├── PriceBreakdown.tsx
    │   ├── PaymentFooter.tsx
    │   └── index.ts
    └── paper/
        ├── BasePaperTicket.tsx (existing)
        └── ...
```

---

## Testing Checklist

### Visual Consistency
- [ ] Same paper gradient as In-Service tickets
- [ ] Same 6-layer shadow system
- [ ] Perforation dots appear at top
- [ ] Left/right notches with gradients
- [ ] Wrap-around ticket number badge
- [ ] Paper textures render correctly
- [ ] UNPAID watermark is visible but subtle

### Functionality
- [ ] Tab filtering works (All, Card, Cash, Venmo)
- [ ] Dropdown menu opens/closes
- [ ] Mark Paid button calls function
- [ ] Grid layout responsive (1-4 columns)
- [ ] Hover effects work
- [ ] Click handlers work

### Responsive Behavior
- [ ] Mobile (1 column)
- [ ] Tablet (2 columns)
- [ ] Desktop (3 columns)
- [ ] Large desktop (4 columns)

### Accessibility
- [ ] Keyboard navigation
- [ ] Focus indicators
- [ ] Screen reader labels
- [ ] ARIA attributes

---

## Before/After Code Comparison

### Ticket Rendering

**Before** (128 lines):
```typescript
<div
  key={ticket.id}
  style={{
    backgroundColor: paperColor, // Random
    backgroundImage: texturePattern, // Random
    boxShadow: '0 1px 3px rgba(0,0,0,0.05), ...' // Basic
  }}
>
  {/* Semicircle dots */}
  <div className="absolute ... opacity-60">
    <div className="w-2 h-2 bg-gray-50 rounded-full" />
    {/* ... */}
  </div>

  {/* Flat accent bar */}
  <div className="absolute w-1 h-full bg-[#FF6B6B]" />

  {/* Flat ticket number */}
  <div className="w-7 h-7 bg-gray-900 text-white rounded-full">
    {ticket.number}
  </div>

  {/* 115 more lines of inline content */}
</div>
```

**After** (6 lines):
```typescript
<PendingTicketCard
  key={ticket.id}
  ticket={ticket}
  onMarkPaid={markTicketAsPaid}
  onOpenMenu={(id) => setOpenDropdownId(id)}
  isMenuOpen={openDropdownId === ticket.id}
/>
```

---

## Benefits

### Code Quality
- **95% reduction** in PendingTickets.tsx complexity
- **Reusable components** for payment tickets
- **Consistent styling** via design tokens
- **Type safety** with TypeScript interfaces

### Design Consistency
- **Same premium paper** as In-Service tickets
- **Unified visual language** across modules
- **Professional appearance** with 6-layer shadows
- **Accessible** with WCAG AA compliance

### Maintainability
- **Single source of truth** (BasePaperTicket)
- **Easy to update** all tickets at once
- **Clear component hierarchy**
- **Well-documented** with inline comments

---

## Rollback Plan

If issues arise:
1. Keep old PendingTickets.tsx as `PendingTickets.backup.tsx`
2. Revert by renaming files
3. No database changes required
4. No API changes required

---

## Next Steps After Phase 1

### Phase 2: Enhanced Features (Future)
- Add staff badges if staff data available
- Add last visit date indicator
- Add time waiting indicator
- Add drag-and-drop support

### Phase 3: Polish (Future)
- Add loading states
- Add error boundaries
- Add success/error toasts
- Add keyboard shortcuts

---

**Created**: 2025-01-19
**Status**: Ready for Implementation
**Estimated Time**: 2-3 hours
