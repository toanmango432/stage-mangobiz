# Gift Card Module - Implementation Plan

## Project Context
- **App**: Mango POS Store App (React + TypeScript + IndexedDB)
- **Goal**: Complete gift card sell, redeem, manage, and report features
- **Phase 1 DONE**: Database operations layer (`src/db/giftCardOperations.ts`)

## Critical Fix Required
**BUG**: `giftCardOperations.issueGiftCard()` is NEVER called when selling gift cards.
Current flow only adds to ticket metadata but never creates actual DB records.

---

## File Paths

| Component | Path |
|-----------|------|
| Gift card operations | `src/db/giftCardOperations.ts` |
| Gift card types | `src/types/gift-card.ts` |
| Sell modal | `src/components/checkout/modals/SellGiftCardModal.tsx` |
| Grid component | `src/components/checkout/GiftCardGrid.tsx` |
| Ticket panel | `src/components/checkout/TicketPanel.tsx` |
| Service list | `src/components/checkout/ServiceList.tsx` |
| Payment selector | `src/components/checkout/PaymentMethodSelector.tsx` |

---

## Phase 2: Sell Flow (Tasks 1-5)

### Task 1: Redesign SellGiftCardModal
**File**: `src/components/checkout/modals/SellGiftCardModal.tsx`

Add two-mode tabs:
```tsx
const [mode, setMode] = useState<'digital' | 'physical'>('digital');

// Digital mode: generate code, select delivery
// Physical mode: enter existing card number
```

UI sections:
1. Mode tabs: "New Gift Card" | "Activate Physical Card"
2. Amount display (passed from grid)
3. Delivery selection (email/print/none) - digital only
4. Recipient form (conditional on email delivery)
5. Physical card number input - physical only
6. Generated/entered code preview
7. Add to ticket button

### Task 2: Simplify GiftCardGrid
**File**: `src/components/checkout/GiftCardGrid.tsx`

Changes:
- Remove inline custom amount input
- Add "Custom Amount" as a card that opens modal
- Pass `isCustomAmount: true` to modal for custom flow

### Task 3: Add processGiftCardSales (CRITICAL)
**File**: `src/components/checkout/TicketPanel.tsx`

Add after checkout completion:
```tsx
import { giftCardOperations } from '@/db/giftCardOperations';
import { generateGiftCardCode } from '@/types/gift-card';

const processGiftCardSales = async (ticketId: string, services: TicketService[]) => {
  for (const service of services) {
    if (service.metadata?.type === 'gift_card') {
      await giftCardOperations.issueGiftCard({
        storeId,
        code: service.metadata.giftCardCode,
        initialBalance: service.price,
        purchaserId: ticket.clientId,
        purchaseTicketId: ticketId,
        recipientName: service.metadata.recipientName,
        recipientEmail: service.metadata.recipientEmail,
        deliveryMethod: service.metadata.deliveryMethod,
      });
    }
  }
};
```

Call this in the checkout success handler.

### Task 4: Show code in ServiceList
**File**: `src/components/checkout/ServiceList.tsx`

For gift card items, display the code:
```tsx
{service.metadata?.type === 'gift_card' && (
  <span className="text-xs text-gray-500">
    {service.metadata.giftCardCode}
  </span>
)}
```

### Task 5: Verify sell flow
Manual test:
1. Select denomination → modal opens
2. Configure → add to ticket
3. Complete checkout
4. Check IndexedDB: `giftCards` table has new record
5. Check `giftCardTransactions` has `purchase` entry

---

## Phase 3: Redeem Flow (Tasks 6-9)

### Task 6: Add Gift Card payment method
**File**: `src/components/checkout/PaymentMethodSelector.tsx`

Add gift card option to payment methods array.

### Task 7: Create GiftCardRedeemModal
**New file**: `src/components/checkout/modals/GiftCardRedeemModal.tsx`

Features:
- Code input field (GC-XXXX-XXXX-XXXX format)
- Check balance button
- Display: code, balance, status
- Amount to apply input (max = balance or ticket total)
- Apply button

### Task 8: Integrate redemption
**File**: `src/components/checkout/TicketPanel.tsx`

When gift card payment applied:
```tsx
await giftCardOperations.redeemGiftCard(code, amount, ticketId);
```

### Task 9: Partial redemption UI
Show remaining balance after partial use in the modal.

---

## Phase 4: Management (Tasks 10-12)

### Task 10: GiftCardManagement page
**New file**: `src/components/giftcards/GiftCardManagement.tsx`

Features:
- List all gift cards with pagination
- Filter tabs: All / Active / Depleted / Expired
- Search by code or recipient
- Click to open detail modal

### Task 11: GiftCardDetails component
**New file**: `src/components/giftcards/GiftCardDetails.tsx`

Display:
- Card info (code, balance, status, dates)
- Transaction history list
- Action buttons: Reload, Adjust, Void

### Task 12: Reload functionality
**New file**: `src/components/giftcards/GiftCardReload.tsx`

Form to add balance:
```tsx
await giftCardOperations.reloadGiftCard(code, amount, ticketId);
```

---

## Phase 5: Reports (Tasks 13-14)

### Task 13: Sales Report
**New file**: `src/components/reports/GiftCardSalesReport.tsx`

Use: `giftCardOperations.getGiftCardSalesSummary(storeId, startDate, endDate)`

Display: total sold, total value, by denomination breakdown.

### Task 14: Liability Report
**New file**: `src/components/reports/GiftCardLiabilityReport.tsx`

Use: `giftCardOperations.getGiftCardLiability(storeId)`

Display: outstanding balance total, aging breakdown.

---

## Phase 7: Final (Task 15)

Full end-to-end test:
1. Sell gift card → DB record created
2. Redeem gift card → balance decremented
3. View in management → shows correctly
4. Reports → data accurate

---

## Data Structures

### GiftCardSaleData (modal → ticket)
```tsx
interface GiftCardSaleData {
  amount: number;
  deliveryMethod: 'email' | 'print' | 'none';
  recipientName?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  message?: string;
  giftCardCode: string;      // Generated or physical
  isPhysicalCard: boolean;   // true if activating existing card
}
```

### TicketService metadata for gift cards
```tsx
metadata: {
  type: 'gift_card',
  giftCardCode: string,
  deliveryMethod: string,
  recipientName?: string,
  recipientEmail?: string,
  isPhysicalCard: boolean,
}
```

---

## Gift Card Code Format
```
Format: GC-XXXX-XXXX-XXXX
Characters: A-Z (no O,I) + 2-9 (no 0,1) = 32 chars
Use: generateGiftCardCode() from src/types/gift-card.ts
```

---

## Validation Checkpoints

After each phase, verify:
- [ ] `npm run build` passes
- [ ] Feature works in browser
- [ ] Data persists in IndexedDB
- [ ] No TypeScript errors
