# Store App ↔ Mango Pad Integration Gap Analysis

> **Date:** January 2026
> **Status:** Analysis Complete
> **Based on:** Square Terminal, Toast, Clover, SpotOn, Lightspeed research

---

## Executive Summary

The current Mango Store App ↔ Mango Pad integration has fundamental architectural gaps compared to industry standards. **The two apps are not working as one unified system** - they operate independently with loose MQTT coupling instead of tight state synchronization.

### Critical Issues Identified

| Priority | Issue | Impact |
|----------|-------|--------|
| **P0** | Store App doesn't lock during Pad checkout | Staff can modify order while customer is paying |
| **P0** | No real-time status display on Store App | Staff has no visibility into customer progress |
| **P0** | Missing bi-directional state sync | Apps can get out of sync |
| **P1** | No timeout handling | Customer can leave Pad hanging indefinitely |
| **P1** | No "Continue without" option for staff | Staff cannot bypass stuck customers |
| **P1** | Payment initiation unclear | Who triggers actual card charge? |
| **P2** | No real-time order updates to Pad | Order changes after "Send" are invisible |
| **P2** | Missing progress indicators | Customer doesn't know how many steps remain |

---

## 1. Industry Standard vs Current Implementation

### 1.1 POS Screen State During Customer Interaction

| Feature | Industry Standard | Current Mango | Gap |
|---------|-------------------|---------------|-----|
| **POS Lock State** | POS enters "waiting" mode with clear status display | POS remains fully operational | **CRITICAL GAP** |
| **Real-time Status** | Shows customer's current screen (Tip, Signature, etc.) | No visibility into Pad state | **CRITICAL GAP** |
| **Order Modification** | Blocked once payment initiated | Always allowed | **CRITICAL GAP** |
| **Cancel Button** | Always visible with confirmation | Exists but not prominent | Minor gap |
| **Progress Indicator** | "Step 2 of 4" style progress | None | Missing |

**Square Terminal Behavior:**
- POS shows checkout status: `PENDING` → `IN_PROGRESS` → `COMPLETED`
- Cannot modify order after `IN_PROGRESS` state
- Clear "Cancel Checkout" button with confirmation

**Current Mango Behavior:**
- Checkout modal remains fully interactive
- Staff can close modal, modify ticket, start new transactions
- No indication of what customer is doing on Pad

### 1.2 The "Handoff" Moment

| Feature | Industry Standard | Current Mango | Gap |
|---------|-------------------|---------------|-----|
| **Visual Handoff** | POS shows "Customer is completing payment" overlay | Nothing | **CRITICAL GAP** |
| **State Lock** | POS locked until complete/cancel | No lock | **CRITICAL GAP** |
| **Timeout Warning** | "Customer inactive for X seconds" | None | Missing |
| **Staff Override** | "Continue without tip/signature" button | None | Missing |

**Toast Behavior:**
- "Continue without tip or signature" option for staff
- Allows bypassing stuck/abandoned customers
- Staff can force completion

**Current Mango Behavior:**
- Only option is "Cancel on Pad"
- No way to skip customer steps
- No timeout warnings

### 1.3 Tip Selection Flow

| Feature | Industry Standard | Current Mango | Gap |
|---------|-------------------|---------------|-----|
| **Real-time Tip Display** | POS shows selected tip amount live | Tip only visible after complete | Gap |
| **Running Total Update** | POS total updates with tip | No update until complete | Gap |
| **Staff Override** | Can skip tip step | Cannot skip | Missing |
| **Custom Tip on POS** | Staff can enter tip if customer asks | Not available | Missing |

**Current Mango Behavior:**
- Pad publishes `tip_selected` message
- Store App receives but doesn't display prominently
- No running total update on checkout modal

### 1.4 Signature Capture

| Feature | Industry Standard | Current Mango | Gap |
|---------|-------------------|---------------|-----|
| **Timeout** | 30-60 second timeout with warning | None | Missing |
| **Staff Skip** | "Continue without signature" | None | Missing |
| **Threshold** | Configurable signature threshold ($25+) | Always required | Missing |
| **Auto-accept** | Option to auto-accept all signatures | None | Missing |

### 1.5 Payment Processing

| Feature | Industry Standard | Current Mango | Gap |
|---------|-------------------|---------------|-----|
| **Payment Initiation** | CFD triggers card read → POS triggers charge | **Unclear** | **CRITICAL GAP** |
| **Real-time Status** | "Card Inserted" → "Processing" → "Approved" | Basic states only | Gap |
| **Retry Flow** | "Try another card" option | Returns to failed screen | Partial |
| **Staff Override** | Cancel payment mid-process | Limited | Gap |

**Industry Standard Flow:**
```
CFD: "Insert Card" → Customer inserts card → CFD reads card
CFD → POS: Card data/token
POS: Initiates charge with processor
POS → CFD: Result (approved/declined)
CFD: Shows result to customer
```

**Current Mango Flow:**
```
POS: Sends transaction to Pad
Pad: Shows screens (Review → Tip → Signature → Payment)
Pad: Shows "Insert Card" but WHO processes?
??? Payment processing ???
POS: Sends payment_result to Pad
```

**Gap:** It's unclear who/what processes the actual payment.

### 1.6 Error Handling

| Feature | Industry Standard | Current Mango | Gap |
|---------|-------------------|---------------|-----|
| **Payment Declined** | Clear retry flow on both screens | Pad shows failed, POS unclear | Gap |
| **Network Loss** | Offline queue + sync on reconnect | Basic reconnect | Partial |
| **Timeout Recovery** | Configurable timeouts with recovery | No timeouts | Missing |
| **Stuck Transaction** | "Dismiss" option clears both devices | Must manually cancel | Gap |

### 1.7 Receipt Flow

| Feature | Industry Standard | Current Mango | Gap |
|---------|-------------------|---------------|-----|
| **POS Visibility** | POS shows customer's receipt choice | Not visible on POS | Gap |
| **Skip Option** | Staff can select "No Receipt" | Customer must choose | Missing |
| **Email Validation** | Validates email format before accepting | Basic validation | Minor |

---

## 2. State Machine: How It Should Work

### 2.1 Current (Broken) State Machine

```
CURRENT FLOW (Disconnected)

Store App                              Mango Pad
──────────                             ─────────
[Checkout Modal Open]                  [Waiting Screen]
    │                                       │
    ├── "Send to Pad" ──────────────────────┤
    │   (fire and forget)                   │
    │                                       ↓
[Modal stays open]                     [Order Review]
[Can do anything]                           │
    │                                       ↓
    │                                  [Tip Selection]
    │                                       │
    │                                       ↓
    │                                  [Signature]
    │                                       │
    │                                       ↓
    │                                  [Payment]
    │                                       │
    │                                       ↓
    ├── payment_result ─────────────────────┤
    │                                       ↓
    │                                  [Complete]
    │                                       │
[Still can do anything]                [Back to Waiting]
```

**Problems:**
- Store App has no locked state
- Store App doesn't know what screen Pad is on
- Staff can modify order after sending
- No timeout handling
- Apps not synchronized

### 2.2 Correct State Machine (Industry Standard)

```
PROPER FLOW (Synchronized)

Store App                              Mango Pad
──────────                             ─────────
[Checkout Modal Open]                  [Waiting Screen]
    │                                       │
    ├── send_to_pad ────────────────────────┤
    │   + lock checkout                     │
    ↓                                       ↓
[LOCKED: "Sent to Pad"]                [Order Review]
[Shows: "Customer reviewing order"]         │
[Button: Cancel]                            │
    │                                       │
    │◄── customer_started ──────────────────┤
    ↓                                       │
[LOCKED: "Customer Active"]                 │
[Shows: "Order Review"]                     │
    │                                       │
    │◄── screen_changed(tip) ───────────────┤
    ↓                                       ↓
[LOCKED: "Selecting Tip"]              [Tip Selection]
[Shows: "Tip Selection"]                    │
[Button: Skip Tip]                          │
    │                                       │
    │◄── tip_selected($15.00) ──────────────┤
    ↓                                       ↓
[LOCKED: "Tip: $15.00"]                [Signature]
[Shows: Running total updated]              │
[Button: Skip Signature]                    │
    │                                       │
    │◄── screen_changed(signature) ─────────┤
    ↓                                       │
[LOCKED: "Awaiting Signature"]              │
[Shows: "Customer signing"]                 │
    │                                       │
    │◄── signature_captured ────────────────┤
    ↓                                       ↓
[LOCKED: "Processing Payment"]         [Payment Screen]
[Shows: "Waiting for card"]                 │
    │                                       │
    │◄── card_inserted ─────────────────────┤
    ↓                                       │
[LOCKED: "Card Detected"]                   │
[Shows: "Processing..."]                    │
    │                                       │
    │── payment_result(success) ────────────┤
    ↓                                       ↓
[LOCKED: "Payment Approved"]           [Receipt Selection]
[Shows: "Select receipt"]                   │
    │                                       │
    │◄── receipt_preference(email) ─────────┤
    ↓                                       ↓
[SUCCESS]                              [Thank You]
[Shows: "Transaction Complete"]             │
[Tip: $15 | Total: $85.53]                  │
[Receipt: Email]                            │
    │                                       │
    │◄── transaction_complete ──────────────┤
    ↓                                       ↓
[UNLOCKED: Ready for next]             [Back to Waiting]
```

---

## 3. Missing MQTT Messages

### 3.1 Messages Pad Should Send (Missing)

| Message | Purpose | Payload |
|---------|---------|---------|
| `pad:customer_started` | Customer began interacting | `{ transactionId, screen: 'order-review' }` |
| `pad:screen_changed` | Customer moved to new screen | `{ transactionId, screen, previousScreen }` |
| `pad:card_inserted` | Card detected in reader | `{ transactionId, cardType?, last4? }` |
| `pad:customer_idle` | No interaction for X seconds | `{ transactionId, idleSeconds, currentScreen }` |
| `pad:customer_returned` | Customer resumed after idle | `{ transactionId }` |

### 3.2 Messages Store App Should Send (Missing)

| Message | Purpose | Payload |
|---------|---------|---------|
| `pos:skip_tip` | Staff skips tip for customer | `{ transactionId }` |
| `pos:skip_signature` | Staff skips signature | `{ transactionId }` |
| `pos:force_complete` | Staff forces completion | `{ transactionId }` |
| `pos:update_order` | Order items changed | `{ transactionId, items[], total }` |
| `pos:timeout_warning` | Warn customer of timeout | `{ transactionId, secondsRemaining }` |

### 3.3 Recommended Topic Structure

```
# Current topics (keep)
salon/{storeId}/station/{stationId}/pad/ready_to_pay
salon/{storeId}/station/{stationId}/pad/payment_result
salon/{storeId}/station/{stationId}/pad/cancel
salon/{storeId}/station/{stationId}/pad/tip_selected
salon/{storeId}/station/{stationId}/pad/signature
salon/{storeId}/station/{stationId}/pad/receipt_preference
salon/{storeId}/station/{stationId}/pad/transaction_complete
salon/{storeId}/station/{stationId}/pad/help_requested

# New topics (add)
salon/{storeId}/station/{stationId}/pad/customer_started
salon/{storeId}/station/{stationId}/pad/screen_changed
salon/{storeId}/station/{stationId}/pad/card_inserted
salon/{storeId}/station/{stationId}/pad/customer_idle
salon/{storeId}/station/{stationId}/pos/skip_tip
salon/{storeId}/station/{stationId}/pos/skip_signature
salon/{storeId}/station/{stationId}/pos/force_complete
salon/{storeId}/station/{stationId}/pos/update_order
```

---

## 4. Store App Checkout Modal: Required Changes

### 4.1 Current State: Uncontrolled Modal

```
┌─────────────────────────────────────────────────────┐
│  Checkout                                    [X]    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Services     Tip      Payment     Complete         │
│    [1]        [2]        [3]         [4]            │
│  ═══════════════                                    │
│                                                     │
│  [Full checkout controls visible]                   │
│  [Can edit items, change tip, etc.]                 │
│  [No indication Pad is active]                      │
│                                                     │
│  [Send to Pad]  [Pay Here]  [Cash]                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 4.2 Required State: Locked Modal with Status

```
┌─────────────────────────────────────────────────────┐
│  Checkout - Mango Pad Active              [Cancel]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  📱 Customer on Mango Pad                     │  │
│  │                                               │  │
│  │  Current Step: Selecting Tip                  │  │
│  │  ████████████░░░░░  Step 2 of 5               │  │
│  │                                               │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │ Selected: 18% tip ($12.69)              │  │  │
│  │  │ Running Total: $83.22                   │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  │                                               │  │
│  │  Time on step: 0:23                          │  │
│  │                                               │  │
│  │  [Skip Tip]  [Skip All → Payment]            │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  [Cancel Transaction]                               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 4.3 Required States for Store App Modal

| Pad Screen | Store App Shows | Staff Actions Available |
|------------|-----------------|------------------------|
| Order Review | "Customer reviewing order" | Cancel |
| Tip Selection | "Selecting tip" + selected amount | Cancel, Skip Tip |
| Signature | "Awaiting signature" | Cancel, Skip Signature |
| Payment | "Waiting for card" / "Processing" | Cancel |
| Receipt | "Selecting receipt option" | Cancel, Skip Receipt |
| Complete | "Transaction Complete" + summary | Done (close modal) |
| Failed | "Payment Failed" + reason | Retry, Cancel |

---

## 5. Mango Pad: Required Changes

### 5.1 Screen Progression Updates

Each screen transition should publish `screen_changed`:

```typescript
// When navigating to new screen
const handleNavigation = (newScreen: PadScreen) => {
  publishScreenChanged({
    transactionId,
    screen: newScreen,
    previousScreen: currentScreen,
  });
  navigate(newScreen);
};
```

### 5.2 Idle Detection

Add idle timeout monitoring:

```typescript
const IDLE_TIMEOUT_WARNING = 30000; // 30 seconds
const IDLE_TIMEOUT_CANCEL = 60000;  // 60 seconds

useEffect(() => {
  let idleTimer: NodeJS.Timeout;
  let warningTimer: NodeJS.Timeout;

  const resetTimers = () => {
    clearTimeout(idleTimer);
    clearTimeout(warningTimer);

    warningTimer = setTimeout(() => {
      publishCustomerIdle({ transactionId, idleSeconds: 30 });
      showIdleWarning();
    }, IDLE_TIMEOUT_WARNING);

    idleTimer = setTimeout(() => {
      publishCustomerIdle({ transactionId, idleSeconds: 60 });
      // Could auto-cancel or wait for staff action
    }, IDLE_TIMEOUT_CANCEL);
  };

  // Reset on any interaction
  window.addEventListener('touchstart', resetTimers);
  window.addEventListener('click', resetTimers);

  resetTimers();

  return () => {
    clearTimeout(idleTimer);
    clearTimeout(warningTimer);
    window.removeEventListener('touchstart', resetTimers);
    window.removeEventListener('click', resetTimers);
  };
}, [transactionId]);
```

### 5.3 Progress Indicator

Add step indicator to all screens:

```tsx
<StepIndicator
  currentStep={2}
  totalSteps={5}
  steps={['Review', 'Tip', 'Sign', 'Pay', 'Receipt']}
/>
```

### 5.4 Handle Staff Skip Commands

Listen for skip commands from Store App:

```typescript
// In PadMqttProvider
mqttService.subscribe(`salon/${storeId}/station/${stationId}/pos/skip_tip`, (message) => {
  if (message.transactionId === activeTransactionId) {
    // Skip tip with $0
    dispatch(setTip({ amount: 0, percent: null }));
    navigate('signature');
  }
});

mqttService.subscribe(`salon/${storeId}/station/${stationId}/pos/skip_signature`, (message) => {
  if (message.transactionId === activeTransactionId) {
    // Skip signature
    navigate('payment');
  }
});
```

---

## 6. Payment Flow Clarification Required

### Current Ambiguity

The current implementation has a critical ambiguity around payment processing:

1. Store App sends `ready_to_pay` with transaction details
2. Pad shows Order Review → Tip → Signature → Payment
3. Payment screen shows "Insert or Tap Card"
4. **??? Who processes the payment ???**
5. Store App sends `payment_result` to Pad

### Questions That Need Answers

1. **Is there a physical card terminal connected?**
   - If yes: Does it connect to Pad or Store App?
   - If no: How does payment actually happen?

2. **Who integrates with the payment processor?**
   - Pad (Fiserv TTP on iPad)?
   - Store App (Electron with USB terminal)?
   - External terminal?

3. **What triggers the actual charge?**
   - Customer inserting card?
   - Staff clicking button?
   - Automatic after signature?

### Recommended Architecture

Based on industry standards (Square Terminal, Clover Mini):

```
RECOMMENDED PAYMENT FLOW

1. Customer completes Signature on Pad
2. Pad shows "Insert Card" and waits
3. Customer inserts/taps card
4. Pad reads card data (via Fiserv TTP SDK)
5. Pad sends card token to Store App
6. Store App processes charge with payment processor
7. Store App sends result to Pad
8. Pad shows success/failure
```

This requires:
- New message: `pad:card_read` with tokenized card data
- Store App payment processor integration
- Clear separation of card capture vs payment processing

---

## 7. Implementation Priority

### Phase 1: Critical Sync (Must Have)

1. **Store App Lock State**
   - Add `padTransactionActive` state
   - Lock checkout modal when active
   - Show current Pad screen

2. **Screen Change Publishing**
   - Pad publishes `screen_changed` on every navigation
   - Store App listens and updates UI

3. **Real-time Status Display**
   - Store App shows: "Customer on: [Screen Name]"
   - Progress bar with step count

### Phase 2: Staff Controls (Should Have)

4. **Skip Buttons**
   - Skip Tip button
   - Skip Signature button
   - Force Complete button

5. **Timeout Handling**
   - Idle detection on Pad
   - Warning after 30s
   - Staff notification after 60s

### Phase 3: Polish (Nice to Have)

6. **Running Total Updates**
   - Update Store App total when tip selected

7. **Receipt Visibility**
   - Show receipt preference on Store App

8. **Transaction Summary**
   - Show complete summary before closing modal

---

## 8. Appendix: MQTT Message Schemas

### New Message Types

```typescript
// Pad → Store App: Customer started interacting
interface PadCustomerStartedPayload {
  transactionId: string;
  screen: 'order-review';
  startedAt: string;
}

// Pad → Store App: Screen changed
interface PadScreenChangedPayload {
  transactionId: string;
  screen: PadScreen;
  previousScreen: PadScreen;
  changedAt: string;
}

// Pad → Store App: Card inserted/tapped
interface PadCardInsertedPayload {
  transactionId: string;
  cardType: 'chip' | 'tap' | 'swipe';
  insertedAt: string;
}

// Pad → Store App: Customer idle
interface PadCustomerIdlePayload {
  transactionId: string;
  idleSeconds: number;
  currentScreen: PadScreen;
}

// Store App → Pad: Skip tip
interface PosSkipTipPayload {
  transactionId: string;
  reason?: string;
}

// Store App → Pad: Skip signature
interface PosSkipSignaturePayload {
  transactionId: string;
  reason?: string;
}

// Store App → Pad: Force complete
interface PosForceCompletePayload {
  transactionId: string;
  reason?: string;
}

// Store App → Pad: Update order
interface PosUpdateOrderPayload {
  transactionId: string;
  items: PadTransactionItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
}
```

---

## Summary

The current Mango Store App ↔ Mango Pad integration is **fundamentally broken** from a UX perspective. The two apps operate independently rather than as a unified checkout system.

**Key Takeaways:**
1. Store App MUST lock and show real-time status during Pad checkout
2. Bi-directional state sync is required (not just events)
3. Staff needs override controls (skip tip, skip signature)
4. Timeout handling is essential for abandoned transactions
5. Payment flow architecture needs clarification

Implementing Phase 1 changes would bring the integration to minimum viable standard. Full implementation of all phases would match industry leaders like Square and Toast.
