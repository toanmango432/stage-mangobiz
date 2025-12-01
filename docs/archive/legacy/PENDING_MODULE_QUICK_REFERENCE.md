# Pending Module - Quick Reference Guide

## File Locations at a Glance

```
src/
├── components/
│   ├── modules/
│   │   └── Pending.tsx                    ← Main module entry point
│   ├── PendingTickets.tsx                 ← Ticket container & filtering
│   ├── tickets/
│   │   ├── PendingTicketCard.tsx          ← 4-mode card component
│   │   └── pending/
│   │       ├── TicketHeader.tsx           ← Ticket ID & menu
│   │       ├── ClientInfo.tsx             ← Client details
│   │       ├── PriceBreakdown.tsx         ← Price breakdown
│   │       ├── PaymentFooter.tsx          ← Payment method & mark paid button
│   │       ├── UnpaidWatermark.tsx        ← UNPAID overlay
│   │       └── index.ts                   ← Barrel exports
│   └── layout/
│       ├── AppShell.tsx                   ← Router - module switch
│       └── BottomNavBar.tsx               ← Navigation & badge
├── store/
│   └── slices/
│       └── uiTicketsSlice.ts              ← Redux state & reducers
├── hooks/
│   └── useTicketsCompat.ts                ← Data & stub functions
└── types/
    ├── Ticket.ts                          ← Ticket interface
    └── transaction.ts                     ← Transaction interface
```

---

## Component Hierarchy

```
Pending
  └── PendingTickets
      ├── Tab Filter (All, Card, Cash, Venmo)
      └── PendingTicketCard × N
          ├── UnpaidWatermark
          ├── TicketHeader (grid-normal only)
          ├── ClientInfo (grid-normal only)
          ├── PriceBreakdown (grid-normal only)
          └── PaymentFooter (grid-normal only)
```

---

## Key Data Flow

```
SERVICE COMPLETION
    ↓
completeTicket(ticketId, completionDetails)
    ↓
Create PendingTicket {
  id, number, clientName, clientType, service,
  subtotal, tax, tip,
  paymentType: 'card' (HARDCODED),
  technician, time
}
    ↓
Redux: Add to state.uiTickets.pendingTickets[]
    ↓
Sync Queue: syncQueueDB.add({ type: 'update', ... })
    ↓
DISPLAYED IN PENDING MODULE
    ↓
User clicks "Mark Paid"
    ↓
markTicketAsPaid(ticketId)  ← NOT IMPLEMENTED (console.log stub)
    ↓
[TODO] Create Transaction record
[TODO] Remove from pending
[TODO] Queue payment sync
```

---

## View Modes

| Mode | Size | Location | Use Case |
|------|------|----------|----------|
| **compact** | 60px | List | Fast scrolling |
| **normal** | 100px | List | Detailed workflow |
| **grid-compact** | 240px | Grid | Dashboard view |
| **grid-normal** | 300px | Grid | Premium detail view (DEFAULT) |

---

## Feature Status Checklist

| Feature | Status | Notes |
|---------|--------|-------|
| Display pending tickets | ✅ | Works perfectly |
| 4 view modes | ✅ | Fully implemented |
| Search | ⚠️ | UI only, no logic |
| Sort | ⚠️ | Options exist, not applied |
| Filter by type | ✅ | Tabs filter payment type |
| View toggle | ✅ | Grid ↔ List works |
| Responsive design | ✅ | Mobile/tablet/desktop |
| Mark Paid button | ⚠️ | Visible, doesn't work |
| Edit Receipt | ❌ | TODO stub |
| Print Receipt | ❌ | TODO stub |
| Email Receipt | ❌ | TODO stub |
| Void Receipt | ❌ | TODO stub |
| Create Transaction | ❌ | Not implemented |
| Payment sync | ❌ | Not queued |

---

## Critical TODO Items

### 1. Implement `markTicketAsPaid()`
**File**: `/src/hooks/useTicketsCompat.ts` (line 89)

```typescript
const markTicketAsPaid = (ticketId: string) => {
  // TODO: This needs to:
  // 1. Remove from pendingTickets
  // 2. Create Transaction record in IndexedDB
  // 3. Update original Ticket status to 'paid'
  // 4. Queue sync operation
  // 5. Show success toast
};
```

### 2. Add Payment Processing Modal
No component exists for:
- Selecting/confirming payment method
- Entering card details or payment reference
- Processing payment
- Showing receipt

### 3. Payment Type Selection
Currently hardcoded to 'card' in `completeTicket()` reducer.
Need to add payment type selection at service completion time.

### 4. Search & Sort Logic
Both UI components exist but have no actual filtering/sorting implementation.

### 5. Receipt Operations
All menu items (Edit, Print, Email, Void) are TODOs with console.log stubs.

---

## State Management

### Redux Slice: `uiTicketsSlice`

**State Structure**:
```typescript
{
  pendingTickets: PendingTicket[],  // ← Key state for this module
  waitlist: UITicket[],
  serviceTickets: UITicket[],
  completedTickets: UITicket[],
  loading: boolean,
  error: string | null,
  lastTicketNumber: number
}
```

**Key Selector**:
```typescript
selectPendingTickets = (state) => state.uiTickets.pendingTickets
```

**Key Reducer**:
```typescript
completeTicket.fulfilled → Adds to pendingTickets[]
```

---

## Styling Reference

### Colors
- **Pending Red**: `#EB5757` (accent)
- **Pending BG**: `#FDECEC` (light red)
- **Text**: `#1a1614` (dark brown)
- **Paper**: `#d4b896` (tan/beige border)
- **Card Badge**: `#4338CA` on `#E0E7FF` (blue)
- **Cash Badge**: `#059669` on `#D1FAE5` (green)
- **Venmo Badge**: `#0284C7` on `#E0F2FE` (blue)

### Typography
- **Font**: Tailwind defaults + monospace for amounts
- **Weights**: Bold (600) for numbers, semibold (500) for labels

### Paper Design Elements
- Perforation dots (top)
- Notches (left/right)
- Left edge shadow (3D thickness)
- Wrap-around ticket number badge
- "UNPAID" watermark (6% opacity)
- Paper texture overlay
- Subtle line patterns

---

## Testing Checklist

To verify Pending module functionality:

- [ ] Navigate to Pending tab - shows pending tickets
- [ ] Toggle list ↔ grid view - changes layout
- [ ] Toggle compact/normal in view menu - resizes cards
- [ ] Type in search - verify filter behavior (should work)
- [ ] Click sort dropdown - verify selected sort applies (should work)
- [ ] Click payment type tabs - filters by type (works)
- [ ] Click "Mark Paid" button - check console (logs stub)
- [ ] Click menu (more icon) - opens dropdown with 4 options
- [ ] Click any menu option - check console (logs stub)
- [ ] Scroll on mobile - should be smooth and responsive

---

## Integration Points

### How Pending Connects to Other Modules

1. **FrontDesk Module**
   - Service tickets → Complete → PendingTickets
   - Show pending count badge

2. **Checkout Module**
   - Should integrate with payment processing
   - (Currently separate, no integration)

3. **Transactions Module**
   - Should create records when paying
   - (Currently not connected)

4. **Bottom Navigation**
   - Badge shows pending count
   - Navigation to Pending module

---

## Database Connections

### Tables Used
1. **tickets** - Source of completed tickets
   - Index: `[salonId+status]` for queries
   - Status: `'completed'` before conversion

2. **transactions** - Target for payment records
   - Should be created on `markTicketAsPaid()`
   - Currently NOT USED by this module

3. **syncQueue** - For backend sync
   - Created on `completeTicket()`
   - NOT created on `markTicketAsPaid()`

### Current Gap
No actual data is written to IndexedDB when payment is processed.

---

## Performance Considerations

### Current Limitations
- **No pagination**: All tickets load/render at once
- **No virtualization**: Can be slow with 100+ tickets
- **No caching**: Full re-render on every change
- **Search/Sort**: UI only, no optimized queries

### For Large Data Sets (100+ pending)
- Consider implementing pagination or infinite scroll
- Add virtual scrolling for list/grid
- Cache filtered/sorted results

---

## Developer Notes

### Styling Approach
- Tailwind CSS utilities
- Inline styles for complex gradients/shadows
- Design tokens from constants (PremiumColors, PremiumTypography)

### State Management Pattern
- Redux Toolkit with thunks
- Persist to localStorage via persist middleware
- No IndexedDB writes from UI layer (use database.ts)

### Component Props Pattern
```typescript
interface PendingTicketCardProps {
  ticket: PendingTicket;
  viewMode?: 'compact' | 'normal' | 'grid-normal' | 'grid-compact';
  onMarkPaid: (id: string) => void;
  isMenuOpen: boolean;
  onOpenMenu: (id: string, e: React.MouseEvent) => void;
  onCloseMenu: () => void;
  onClick?: (ticketId: string) => void;
}
```

### Responsive Breakpoints
- Mobile: < 640px (sm)
- Tablet: 640px - 1024px (md, lg)
- Desktop: > 1024px (xl)
- Uses Tailwind's responsive prefixes (sm:, md:, lg:)

---

## Quick Implementation Guide

To implement payment processing, you need to:

1. **Create PaymentModal component**
   - Show ticket details
   - Select payment method
   - Input payment reference (card last 4, cash amount, etc.)

2. **Implement markTicketAsPaid Redux thunk**
   - Validate payment data
   - Create Transaction record via transactionsDB
   - Update Ticket status in IndexedDB
   - Remove from pendingTickets Redux state
   - Queue sync operation

3. **Connect to Payment Processing**
   - Call Payment API (if available)
   - Handle success/failure
   - Show receipts

4. **Implement Receipt Operations**
   - Generate receipt HTML
   - Integrate with print service
   - Email integration (SMTP)
   - Void workflow with authorization

5. **Add Search/Sort Logic**
   - Filter pending tickets by search query
   - Sort by wait time, amount, staff, client name
   - Apply both simultaneously

---

## Related Documentation
- Main Analysis: `PENDING_MODULE_ANALYSIS.md`
- Architecture: Check `CLAUDE.md` for project structure
