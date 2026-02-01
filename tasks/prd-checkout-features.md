# PRD: Checkout Features (Payment & Receipts)

## Introduction

Add payment processing enhancements and complete receipt delivery integration to the checkout module. This PRD builds on top of **PRD: Ticket Builder Foundation** which must be completed first.

**Prerequisites:** Run `ralph/ticket-builder-foundation` first to ensure:
- Ticket persistence works (IndexedDB)
- Service status syncs via MQTT
- Client alerts display correctly
- Draft auto-save is functional

This PRD covers: Tip Distribution visibility, Fiserv Tap-to-Pay Integration, Receipt delivery wiring, Transaction recording integration, and Analytics.

## Existing Infrastructure (Do NOT Recreate)

The following already exists and should be **used, not recreated**:

| Component | Location | Status |
|-----------|----------|--------|
| Receipt formatter | `src/services/receiptService.ts` | ✅ Complete (379 lines) |
| Email receipt | `sendReceiptEmail()` in receiptService | ✅ Complete |
| SMS receipt | `sendReceiptSMS()` in receiptService | ✅ Complete |
| Print receipt | `printReceipt()` in receiptService | ✅ Complete |
| Payment bridge | `src/services/payment/paymentBridge.ts` | ✅ Complete |
| Payment types | `src/services/payment/types.ts` | ✅ Complete |
| Mock provider | `src/services/payment/mockPaymentProvider.ts` | ✅ Complete |
| Transaction slice | `src/store/slices/transactionsSlice.ts` | ✅ Complete |
| Sync slice | `src/store/slices/syncSlice.ts` | ✅ Complete |
| Tip distribution UI | `TipSection.tsx` | Partial (needs visibility fix) |

## Goals

- Make Tip Distribution ALWAYS visible when tip > 0 (currently hidden behind flag)
- Add manual tip editing capability
- Integrate Fiserv CommerceHub for Tap-to-Pay card payments via Capacitor plugins
- Wire existing receipt services into payment completion flow
- Add NFC payment progress states to ProcessingOverlay
- Add checkout analytics events
- Improve offline payment handling UX

## User Stories

---

### US-001: Show TipDistribution always when tip > 0
**Description:** As a front desk staff, I want to see how tips will be distributed across staff before payment.

**Files to modify:**
- `apps/store-app/src/components/checkout/PaymentModal/components/TipSection.tsx` (~10 lines)
- `apps/store-app/src/components/checkout/PaymentModal/hooks/usePaymentModal.ts` (~5 lines)

**Acceptance Criteria:**
- [ ] Remove the `showTipDistribution` conditional check on line 115
- [ ] Always show tip distribution card when `tipAmount > 0` AND `staffMembers.length > 1`
- [ ] Auto-trigger `handleAutoDistributeTip` when tip is first set (if not already distributed)
- [ ] Distribution updates when tip amount changes
- [ ] No forbidden strings: 'as any', 'void _'
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] Verify in browser: add 20% tip → see distribution preview immediately

**Notes:**
- TipSection.tsx line 115: `{showTipDistribution && tipDistribution.length > 0 && (` should be just `{tipDistribution.length > 0 && (`
- In usePaymentModal.ts, auto-call handleAutoDistributeTip when tipAmount changes from 0

**Priority:** 1

---

### US-002: Add manual tip distribution editing
**Description:** As a front desk staff, I want to manually adjust tip amounts per staff member.

**Files to modify:**
- `apps/store-app/src/components/checkout/PaymentModal/components/TipSection.tsx` (~60 lines)
- `apps/store-app/src/components/checkout/PaymentModal/hooks/usePaymentModal.ts` (~40 lines)

**Acceptance Criteria:**
- [ ] Add "Edit" button next to distribution display
- [ ] In edit mode: show Input field for each staff member's tip amount
- [ ] Track `isEditingTips` state in hook
- [ ] Validate: sum of manual tips must equal total tip amount (show error if mismatch)
- [ ] Save button applies manual distribution, exits edit mode
- [ ] Cancel button reverts to last auto-calculated distribution
- [ ] Add `handleManualTipChange(staffId: string, amount: number)` to hook
- [ ] No forbidden strings: 'as any', 'void _'
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] Verify in browser: click Edit → change amounts → save → distribution updated

**Notes:**
- Use Input component from `@/components/ui/Input`
- Store manual distribution separately from auto-calculated
- Show red text validation error if sum doesn't match total

**Priority:** 2

---

### US-003: Create Fiserv TTP plugin TypeScript interface
**Description:** As a developer, I need TypeScript interfaces for the Fiserv Tap-to-Pay plugin.

**Files to modify:**
- `apps/store-app/src/services/payment/fiservTypes.ts` (NEW, ~100 lines)

**Acceptance Criteria:**
- [ ] Define `FiservTTPPlugin` interface with methods: `initialize`, `startPayment`, `cancelPayment`, `getDeviceStatus`
- [ ] Define `FiservPaymentRequest` interface: amount, currency, referenceId, merchantId, metadata
- [ ] Define `FiservPaymentResult` interface: success, transactionId, authCode, cardType, cardBrand, lastFour, errorCode, errorMessage
- [ ] Define `FiservDeviceStatus` interface: isReady, batteryLevel, nfcEnabled, sdkVersion
- [ ] Define `FiservCardBrand` type: 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown'
- [ ] Export all types
- [ ] No forbidden strings: 'as any'
- [ ] `pnpm exec tsc --noEmit` passes

**Notes:**
- Based on Fiserv CommerceHub API documentation
- This is the JS bridge interface for Capacitor plugin
- Native plugin implementation will be in separate iOS/Android files

**Priority:** 3

---

### US-004: Create Fiserv payment provider
**Description:** As a developer, I need a Fiserv provider that implements the PaymentProvider interface.

**Files to modify:**
- `apps/store-app/src/services/payment/fiservProvider.ts` (NEW, ~150 lines)

**Acceptance Criteria:**
- [ ] Implement `PaymentProvider` interface from `./types.ts`
- [ ] Create `FiservProvider` class with `name = 'Fiserv TTP'`
- [ ] `processCardPayment()`: call Fiserv plugin, map result to PaymentResult
- [ ] `processCashPayment()`: delegate to mock (Fiserv is card-only)
- [ ] `processGiftCardPayment()`: delegate to mock (Fiserv is card-only)
- [ ] `isAvailable()`: check if Capacitor plugin is registered and NFC enabled
- [ ] Handle Fiserv-specific error codes and map to our error types
- [ ] Log all payment attempts with `auditLogger.logPayment()`
- [ ] No forbidden strings: 'as any', 'void _'
- [ ] `pnpm exec tsc --noEmit` passes

**Notes:**
- Follow pattern from `mockPaymentProvider.ts`
- Use `Capacitor.isPluginAvailable('FiservTTP')` to check availability
- Export singleton instance

**Priority:** 4

---

### US-005: Create Fiserv mock for web development
**Description:** As a developer, I need a mock Fiserv plugin for testing payments on web.

**Files to modify:**
- `apps/store-app/src/services/payment/fiservMock.ts` (NEW, ~80 lines)

**Acceptance Criteria:**
- [ ] Implement `FiservTTPPlugin` interface with mock responses
- [ ] `initialize()`: return success after 100ms delay
- [ ] `startPayment()`: simulate 2-second delay, return success with mock transaction ID
- [ ] Amounts ending in .99 simulate decline (for testing)
- [ ] `cancelPayment()`: return cancelled status
- [ ] `getDeviceStatus()`: return { isReady: true, batteryLevel: 100, nfcEnabled: true }
- [ ] No forbidden strings: 'as any'
- [ ] `pnpm exec tsc --noEmit` passes

**Notes:**
- Only used in development/web testing
- Real plugin will be registered via Capacitor on native
- Use setTimeout/Promise to simulate async behavior

**Priority:** 5

---

### US-006: Integrate Fiserv provider into payment bridge
**Description:** As a developer, I need the payment bridge to use Fiserv on native platforms.

**Files to modify:**
- `apps/store-app/src/services/payment/paymentBridge.ts` (~30 lines)
- `apps/store-app/src/services/payment/index.ts` (~5 lines)

**Acceptance Criteria:**
- [ ] Import FiservProvider from `./fiservProvider`
- [ ] In `detectPlatform()`: use `Capacitor.getPlatform()` properly
- [ ] In constructor: use `fiservProvider` for iOS/Android when `Capacitor.isPluginAvailable('FiservTTP')`
- [ ] Fall back to mock if Fiserv plugin not available
- [ ] Export Fiserv types from `./index.ts`
- [ ] No forbidden strings: 'as any', 'void _'
- [ ] `pnpm exec tsc --noEmit` passes

**Notes:**
- Replace TODO comments on lines 36-38 with actual Fiserv integration
- Keep mockPaymentProvider as fallback

**Priority:** 6

---

### US-007: Add NFC payment progress states to ProcessingOverlay
**Description:** As a front desk staff, I want visual feedback during card payment.

**Files to modify:**
- `apps/store-app/src/components/checkout/PaymentModal/components/ProcessingOverlay.tsx` (~80 lines)
- `apps/store-app/src/components/checkout/PaymentModal/types.ts` (~10 lines)

**Acceptance Criteria:**
- [ ] Add `PaymentProcessingState` type: 'idle' | 'waiting_card' | 'card_detected' | 'processing' | 'approved' | 'declined'
- [ ] Update props to accept `processingState: PaymentProcessingState`
- [ ] Add "Waiting for Card" state with NFC icon (Smartphone icon) and pulse animation
- [ ] Add "Card Detected" state with card brand text (Visa, MC, Amex)
- [ ] "Processing..." already exists with spinner
- [ ] "Approved" state with green checkmark
- [ ] "Declined" state with red X and error message prop
- [ ] Use Framer Motion for smooth transitions between states
- [ ] No forbidden strings: 'as any'
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] Verify in browser: card payment shows animated state transitions

**Notes:**
- Import motion from 'framer-motion'
- Use AnimatePresence for enter/exit transitions
- Card brand icons can use simple text labels initially (Visa, MC, etc.)

**Priority:** 7

---

### US-008: Wire NFC states into payment flow
**Description:** As a developer, I need the payment modal to control NFC progress states.

**Files to modify:**
- `apps/store-app/src/components/checkout/PaymentModal/hooks/usePaymentModal.ts` (~30 lines)
- `apps/store-app/src/components/checkout/PaymentModal/PaymentModal.tsx` (~10 lines)

**Acceptance Criteria:**
- [ ] Add `paymentProcessingState` state to hook (default: 'idle')
- [ ] When card payment starts: set state to 'waiting_card'
- [ ] Add callback for `onCardDetected` (future: from Fiserv plugin) → set 'card_detected'
- [ ] During `paymentBridge.processPayment()`: set 'processing'
- [ ] On success: set 'approved', wait 1.5s, then add payment
- [ ] On failure: set 'declined', show for 2s, then reset to 'idle'
- [ ] Export `paymentProcessingState` from hook return
- [ ] Pass state to ProcessingOverlay in PaymentModal.tsx
- [ ] No forbidden strings: 'as any', 'void _'
- [ ] `pnpm exec tsc --noEmit` passes

**Notes:**
- Replace `isProcessing` boolean with richer state machine
- Keep `isProcessing` computed as `state !== 'idle' && state !== 'approved' && state !== 'declined'`

**Priority:** 8

---

### US-009: Wire receipt services into CompletionSection
**Description:** As a front desk staff, I want to send receipt after successful payment.

**Files to modify:**
- `apps/store-app/src/components/checkout/PaymentModal/components/CompletionSection.tsx` (~100 lines)

**Acceptance Criteria:**
- [ ] Import `sendReceiptEmail`, `sendReceiptSMS`, `printReceipt`, `generateReceiptData` from `@/services/receiptService`
- [ ] Add receipt delivery buttons: Print, Email, SMS, No Receipt
- [ ] Email button: show input if client has no email, pre-fill if available
- [ ] SMS button: show input if client has no phone, pre-fill if available
- [ ] Print button: call `printReceipt()` directly
- [ ] Show loading spinner on button during send
- [ ] Show success checkmark after send completes
- [ ] Allow multiple selections (e.g., print AND email)
- [ ] No forbidden strings: 'as any', 'void _'
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] Verify in browser: complete payment → select Email → send → success indicator

**Notes:**
- Add `client`, `businessInfo`, `ticket` props to CompletionSection
- Use Button group with toggle selection
- Toast already exists for errors

**Priority:** 9

---

### US-010: Pass receipt data through payment completion
**Description:** As a developer, I need receipt context available in CompletionSection.

**Files to modify:**
- `apps/store-app/src/components/checkout/PaymentModal/PaymentModal.tsx` (~30 lines)
- `apps/store-app/src/components/checkout/PaymentModal/types.ts` (~10 lines)

**Acceptance Criteria:**
- [ ] Add `client?: Client` prop to PaymentModal
- [ ] Add `businessInfo?: BusinessInfo` prop to PaymentModal
- [ ] Add `ticketData?: Partial<Ticket>` prop to PaymentModal
- [ ] Pass these through to CompletionSection
- [ ] Update PaymentModalProps interface in types.ts
- [ ] No forbidden strings: 'as any', 'void _'
- [ ] `pnpm exec tsc --noEmit` passes

**Notes:**
- BusinessInfo type from receiptService.ts
- Client and Ticket types from @/types

**Priority:** 10

---

### US-011: Remember receipt preference per client
**Description:** As a front desk staff, I want receipt preferences remembered for each client.

**Files to modify:**
- `apps/store-app/src/components/checkout/PaymentModal/components/CompletionSection.tsx` (~30 lines)

**Acceptance Criteria:**
- [ ] On component mount: check localStorage for `receipt-pref-{clientId}`
- [ ] Pre-select last used delivery method(s) for this client
- [ ] After sending: save preference to localStorage
- [ ] Preference format: `{ methods: ['print', 'email'], email?: string, phone?: string }`
- [ ] "Remember for this client" checkbox (default checked)
- [ ] No forbidden strings: 'as any', 'void _'
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] Verify in browser: send email → close → reopen for same client → email pre-selected

**Notes:**
- Only save if checkbox is checked
- Clear preference if client is walk-in (no clientId)

**Priority:** 11

---

### US-012: Create checkout analytics service
**Description:** As a product manager, I want to track checkout behavior for analytics.

**Files to modify:**
- `apps/store-app/src/services/analytics/checkoutEvents.ts` (NEW, ~100 lines)

**Acceptance Criteria:**
- [ ] Create `trackCheckoutEvent(event: CheckoutEvent, properties: CheckoutEventProperties)` function
- [ ] Define `CheckoutEvent` type: 'checkout_started' | 'tip_selected' | 'payment_method_selected' | 'payment_processed' | 'checkout_completed' | 'checkout_abandoned'
- [ ] Properties include: source, staffCount, itemCount, total, tipPercent, paymentMethod, durationMs
- [ ] Generate unique `sessionId` per checkout session
- [ ] Log to console in development with `[Analytics]` prefix
- [ ] Prepare for future integration (export hook or function)
- [ ] No PII in events (no names, emails, phones)
- [ ] No forbidden strings: 'as any', 'void _'
- [ ] `pnpm exec tsc --noEmit` passes

**Notes:**
- Keep analytics generic - specific provider (Mixpanel/Amplitude) TBD
- Export types for use in components

**Priority:** 12

---

### US-013: Integrate analytics into payment flow
**Description:** As a developer, I need to fire analytics events at key checkout moments.

**Files to modify:**
- `apps/store-app/src/components/checkout/PaymentModal/hooks/usePaymentModal.ts` (~40 lines)

**Acceptance Criteria:**
- [ ] Import `trackCheckoutEvent` from analytics service
- [ ] Fire `checkout_started` when modal opens (useEffect on mount)
- [ ] Fire `tip_selected` when tip percentage or amount changes
- [ ] Fire `payment_method_selected` when method is chosen
- [ ] Fire `payment_processed` after successful payment with method and amount
- [ ] Fire `checkout_completed` when fully paid
- [ ] Track checkout `startTime` and calculate duration for completed event
- [ ] No forbidden strings: 'as any', 'void _'
- [ ] `pnpm exec tsc --noEmit` passes

**Notes:**
- Only track once per state change (debounce tip_selected)
- Include item count and staff count in events

**Priority:** 13

---

### US-014: Add offline payment indicator
**Description:** As a front desk staff, I want to know when I'm offline during checkout.

**Files to modify:**
- `apps/store-app/src/components/checkout/PaymentModal/PaymentModal.tsx` (~25 lines)
- `apps/store-app/src/components/checkout/PaymentModal/components/PaymentMethodSelector.tsx` (~20 lines)

**Acceptance Criteria:**
- [ ] Import `selectIsOnline` from `@/store/slices/syncSlice`
- [ ] Show banner at top of modal when offline: "Offline - Card payments unavailable"
- [ ] Disable Card payment option when offline (gray out, show tooltip)
- [ ] Cash payment remains fully functional offline
- [ ] Gift Card disabled when offline (needs validation)
- [ ] Custom/Other payments allowed offline
- [ ] Banner uses warning color (yellow/amber)
- [ ] No forbidden strings: 'as any', 'void _'
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] Verify in browser: disable network → banner shows → card disabled

**Notes:**
- Use Alert component for banner
- syncSlice already tracks `isOnline` state

**Priority:** 14

---

### US-015: Queue offline transactions for sync
**Description:** As a system, I want offline transactions synced when connection returns.

**Files to modify:**
- `apps/store-app/src/components/checkout/PaymentModal/hooks/usePaymentModal.ts` (~30 lines)

**Acceptance Criteria:**
- [ ] When offline AND cash payment completes:
- [ ] Create transaction via `createTransactionFromPending` thunk
- [ ] Transaction gets `syncStatus: 'pending'`
- [ ] Show toast: "Payment saved locally - will sync when online"
- [ ] When back online: transactions auto-sync via existing sync mechanism
- [ ] Add `isOfflinePayment` flag to completion data
- [ ] No forbidden strings: 'as any', 'void _'
- [ ] `pnpm exec tsc --noEmit` passes

**Notes:**
- transactionsSlice already has `createTransactionFromPending` thunk
- syncService handles the actual upload when online

**Priority:** 15

---

## Functional Requirements

- FR-1 (US-001, US-002): Tip distribution always visible and manually editable
- FR-2 (US-003, US-004, US-005, US-006): Fiserv card payments via Tap-to-Pay
- FR-3 (US-007, US-008): NFC payment progress with visual states
- FR-4 (US-009, US-010, US-011): Receipt delivery wired into completion
- FR-5 (US-012, US-013): Analytics events tracked
- FR-6 (US-014, US-015): Offline payments work with sync queue

## Non-Goals

- Ticket persistence (covered in PRD: Ticket Builder Foundation)
- Service status tracking (covered in PRD: Ticket Builder Foundation)
- Client alerts (covered in PRD: Ticket Builder Foundation)
- Draft auto-save (covered in PRD: Ticket Builder Foundation)
- Creating new receipt services (they already exist)
- Self-checkout SMS link (future PRD)
- Refund/void processing (handled in PRD-Transactions-Module)
- Inventory management (separate module)
- Multi-currency support
- Recurring payments / subscriptions

## Technical Considerations

### Existing Patterns to Follow
- `apps/store-app/src/services/payment/mockPaymentProvider.ts` - Provider pattern
- `apps/store-app/src/services/receiptService.ts` - Receipt formatting
- `apps/store-app/src/store/slices/transactionsSlice.ts` - Transaction recording
- `apps/store-app/src/store/slices/syncSlice.ts` - Online/offline state

### Do NOT Recreate
- receiptService.ts - Already complete
- Payment types in types.ts - Already complete
- Transaction thunks - Already complete

## Open Questions

1. Should we support multiple printers (receipt + kitchen)?
2. What's the Fiserv merchant account status? (affects live testing)
3. Should offline transactions have a visual distinction in reports?
4. What analytics provider will be used? (Mixpanel, Amplitude, PostHog?)

## Success Criteria

| Metric | Target |
|--------|--------|
| Tip distribution visible | 100% when tip > 0 |
| Manual tip editing | Works without errors |
| Payment success rate (mock) | 100% |
| Receipt delivery rate | 90%+ when requested |
| Offline cash checkout | Works 100% offline |
| Analytics events firing | All 6 events tracked |
