# Navigation Restructuring Plan

> Main Nav & MORE Menu Module Reorganization
> Last Updated: December 2024
> Status: Ready for Implementation

---

## Executive Summary

This plan restructures the navigation to create clear separation between:
- **Operational views** (Main Nav) - Daily workflow, quick access
- **Administrative views** (MORE Menu) - Full history, management functions

---

## Navigation Changes Overview

### Before (Current)

| Location | Label | Component | Issue |
|----------|-------|-----------|-------|
| Main Nav | Sales | `Sales.tsx` | Generic name, shows all transactions |
| MORE Menu | Today's Sales | `Sales.tsx` | **DUPLICATE** - same component |

### After (New Structure)

| Location | Label | Component | Purpose |
|----------|-------|-----------|---------|
| **Main Nav** | Closed (or Closed Tickets) | `ClosedTickets.tsx` | **NEW** - Only closed/completed tickets |
| **MORE Menu** | Transaction Records | `TransactionRecords.tsx` | **MOVE** - Existing Sales.tsx (no changes) |
| **MORE Menu** | Today's Sales | `TodaysSales.tsx` | **NEW** - EOD summary + closeout functions |

---

## Implementation Tasks

### Task 1: Move Sales.tsx → TransactionRecords

**Action:** Rename/relocate only. NO code changes.

```
BEFORE: src/components/modules/Sales.tsx
AFTER:  src/components/modules/TransactionRecords.tsx
```

**Files to Update:**
| File | Change |
|------|--------|
| `Sales.tsx` | Rename to `TransactionRecords.tsx` |
| `More.tsx` | Update menu item: `id: 'transaction-records'`, `label: 'Transaction Records'` |
| `AppShell.tsx` | Add case: `'transaction-records'` → `<TransactionRecords />` |

**Checklist:**
- [ ] Rename `Sales.tsx` to `TransactionRecords.tsx`
- [ ] Update component export name
- [ ] Update MORE menu item
- [ ] Add route handler in AppShell
- [ ] Remove old 'sales' route from MORE (if exists)
- [ ] Test navigation works

---

### Task 2: Build Closed Tickets Component (Main Nav)

**Action:** Create NEW component for quick operational access to closed tickets.

**File:** `src/components/modules/ClosedTickets.tsx`

#### Component Requirements

| Feature | Description |
|---------|-------------|
| **Data** | Only closed/completed tickets |
| **Default View** | Today's closed tickets |
| **Quick Filters** | Today, Yesterday, This Week |
| **Search** | By client name, ticket #, staff |
| **Actions** | View details, Reprint receipt, Process refund |
| **Design** | Clean, fast, minimal - optimized for quick lookups |

#### Wireframe Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  Closed Tickets                              [Search] [Filter]  │
├─────────────────────────────────────────────────────────────────┤
│  [Today] [Yesterday] [This Week]                     Total: 24  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ #1234  Sarah M.  |  Haircut, Color  |  $125.00  | 2:30pm │   │
│  │        Staff: Maria  |  Card ****4242                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ #1233  John D.   |  Men's Cut       |  $35.00   | 2:15pm │   │
│  │        Staff: Tony   |  Cash                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ...                                                            │
└─────────────────────────────────────────────────────────────────┘
```

#### Data Source

```typescript
// Filter from existing uiTickets slice
const closedTickets = useAppSelector(state =>
  state.uiTickets.items.filter(t =>
    t.status === 'closed' || t.status === 'completed'
  )
);
```

#### Files to Create/Update

| File | Action |
|------|--------|
| `src/components/modules/ClosedTickets.tsx` | CREATE - Main component |
| `src/components/modules/ClosedTickets/TicketCard.tsx` | CREATE - Ticket row component |
| `src/components/modules/ClosedTickets/TicketFilters.tsx` | CREATE - Filter controls |
| `TopHeaderBar.tsx` | UPDATE - Change "Sales" to "Closed" |
| `BottomNavBar.tsx` | UPDATE - Change "Sales" to "Closed" |
| `AppShell.tsx` | UPDATE - Change 'sales' case to 'closed' |

#### Navigation Updates

**TopHeaderBar.tsx** (line ~99):
```typescript
// BEFORE
{ id: 'sales', label: 'Sales', icon: FileText },

// AFTER
{ id: 'closed', label: 'Closed', icon: CheckCircle },
// OR for more space:
{ id: 'closed', label: 'Closed Tickets', icon: CheckCircle },
```

**BottomNavBar.tsx** (line ~46):
```typescript
// BEFORE
{ id: 'sales', label: 'Sales', icon: FileText },

// AFTER
{ id: 'closed', label: 'Closed', icon: CheckCircle },
```

**AppShell.tsx** (renderModule):
```typescript
// BEFORE
case 'sales':
  return <Sales />;

// AFTER
case 'closed':
  return <ClosedTickets />;
```

---

### Task 3: Build Today's Sales Component (MORE Menu)

**Action:** Create NEW component for EOD summary and closeout functions.

**File:** `src/components/modules/TodaysSales.tsx`

#### Component Requirements

| Feature | Description |
|---------|-------------|
| **Summary Cards** | Total Revenue, Transactions, Avg Ticket, Tips |
| **Payment Breakdown** | Cash, Card, Other - with totals |
| **Staff Performance** | Revenue per staff member |
| **Quick Actions** | Print Z-Report, Start Closeout, Export |
| **Date Selector** | View other days' summaries |

#### Wireframe Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  Today's Sales                               [< Dec 12, 2024 >] │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌─────────┐ │
│  │ Total Revenue│ │ Transactions │ │  Avg Ticket  │ │  Tips   │ │
│  │   $2,450.00  │ │      24      │ │   $102.08    │ │ $367.50 │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └─────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  Payment Breakdown                                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Cash      ████████████████████     $980.00   (40%)      │   │
│  │ Card      ██████████████████████████ $1,350.00 (55%)    │   │
│  │ Other     ███                        $120.00   (5%)     │   │
│  └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  Staff Performance                                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Maria      $850.00  |  8 tickets  |  Tips: $127.50      │   │
│  │ Tony       $720.00  |  7 tickets  |  Tips: $108.00      │   │
│  │ Lisa       $880.00  |  9 tickets  |  Tips: $132.00      │   │
│  └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  [Print Z-Report]  [Export CSV]  [Start End-of-Day Closeout]   │
└─────────────────────────────────────────────────────────────────┘
```

#### Data Source

```typescript
// Use dashboard selectors + transaction data
import {
  selectTodayRevenue,
  selectTodayTransactionCount,
  selectTodayPaymentBreakdown,
  selectTodayStaffPerformance
} from '@/store/selectors/dashboardSelectors';
```

#### Files to Create/Update

| File | Action |
|------|--------|
| `src/components/modules/TodaysSales.tsx` | CREATE - Main component |
| `src/components/modules/TodaysSales/SummaryCards.tsx` | CREATE - Top stats cards |
| `src/components/modules/TodaysSales/PaymentBreakdown.tsx` | CREATE - Payment chart |
| `src/components/modules/TodaysSales/StaffPerformance.tsx` | CREATE - Staff table |
| `src/store/selectors/dashboardSelectors.ts` | UPDATE - Add new selectors |
| `More.tsx` | UPDATE - Add menu item |
| `AppShell.tsx` | UPDATE - Add route handler |

#### MORE Menu Update

**More.tsx** (menuItems array):
```typescript
{
  id: 'todays-sales',
  label: "Today's Sales",
  icon: TrendingUp,
  color: 'text-green-600',
  bg: 'bg-green-50'
},
```

**AppShell.tsx** (renderModule):
```typescript
case 'todays-sales':
  return <TodaysSales onBack={() => setActiveModule('more')} />;
```

---

## Implementation Order

```
Step 1: Move Sales.tsx → TransactionRecords.tsx
        └── Rename file
        └── Update exports
        └── Update MORE menu
        └── Add route handler
        └── Test

Step 2: Build ClosedTickets.tsx
        └── Create component structure
        └── Implement ticket filtering
        └── Add quick filters (Today/Yesterday/Week)
        └── Add search
        └── Update Main Nav (TopHeaderBar, BottomNavBar)
        └── Update AppShell route
        └── Test

Step 3: Build TodaysSales.tsx
        └── Create component structure
        └── Build summary cards
        └── Build payment breakdown
        └── Build staff performance
        └── Add dashboard selectors
        └── Update MORE menu
        └── Add route handler
        └── Test
        └── Connect to EOD Closeout
```

---

## File Changes Summary

### New Files
```
src/components/modules/ClosedTickets.tsx
src/components/modules/ClosedTickets/TicketCard.tsx
src/components/modules/ClosedTickets/TicketFilters.tsx
src/components/modules/TodaysSales.tsx
src/components/modules/TodaysSales/SummaryCards.tsx
src/components/modules/TodaysSales/PaymentBreakdown.tsx
src/components/modules/TodaysSales/StaffPerformance.tsx
```

### Renamed Files
```
src/components/modules/Sales.tsx → src/components/modules/TransactionRecords.tsx
```

### Modified Files
```
src/components/layout/TopHeaderBar.tsx    # "Sales" → "Closed"
src/components/layout/BottomNavBar.tsx    # "Sales" → "Closed"
src/components/layout/AppShell.tsx        # Route handlers
src/components/modules/More.tsx           # Menu items
src/store/selectors/dashboardSelectors.ts # New selectors
```

---

## Mental Model

```
USER WORKFLOW:

Daily Operations (Main Nav):
┌────────┐   ┌────────────┐   ┌──────────┐   ┌────────┐
│  Book  │ → │ Front Desk │ → │ Checkout │ → │ Closed │
└────────┘   └────────────┘   └──────────┘   └────────┘
    ↓              ↓               ↓              ↓
 Schedule    Active Tickets    Payment      Done Today


Administrative (MORE Menu):
┌─────────────────────┐
│ Transaction Records │  ← All history (what Sales.tsx currently shows)
├─────────────────────┤
│    Today's Sales    │  ← Daily summary + EOD functions
├─────────────────────┤
│   End of Day Close  │  ← Closeout wizard
└─────────────────────┘
```

---

## Success Criteria

| Metric | Target |
|--------|--------|
| Main Nav "Closed" shows only closed tickets | Yes |
| TransactionRecords has full Sales.tsx functionality | 100% |
| Today's Sales shows accurate daily totals | Real-time |
| No duplicate navigation items | Yes |
| All routes work correctly | Yes |
| No TypeScript errors | Yes |

---

## Estimated Effort

| Task | Time |
|------|------|
| Task 1: Move Sales → TransactionRecords | 0.5 hours |
| Task 2: Build ClosedTickets | 4-6 hours |
| Task 3: Build TodaysSales | 4-6 hours |
| Testing & Polish | 2 hours |
| **Total** | **~1.5-2 days** |

---

## Next Steps

1. Start with Task 1 (Move Sales.tsx) - lowest risk, quickest win
2. Build ClosedTickets for Main Nav
3. Build TodaysSales for MORE Menu
4. Connect TodaysSales to existing EOD Closeout wizard
