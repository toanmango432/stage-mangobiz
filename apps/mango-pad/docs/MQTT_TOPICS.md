# MQTT Topics

Mango Pad communicates with Mango POS via MQTT. All topics follow the pattern `salon/{salonId}/pad/{action}`.

## Topic Overview

| Topic | Direction | QoS | Purpose |
|-------|-----------|-----|---------|
| `salon/{id}/pad/ready_to_pay` | POS → Pad | 1 | Start payment flow |
| `salon/{id}/pad/tip_selected` | Pad → POS | 1 | Client tip choice |
| `salon/{id}/pad/signature` | Pad → POS | 1 | Captured signature |
| `salon/{id}/pad/payment_result` | POS → Pad | 1 | Terminal result |
| `salon/{id}/pad/receipt_preference` | Pad → POS | 1 | Receipt choice |
| `salon/{id}/pad/transaction_complete` | Pad → POS | 1 | Flow complete |
| `salon/{id}/pad/cancel` | POS → Pad | 1 | Cancel transaction |
| `salon/{id}/pad/help_requested` | Pad → POS | 1 | Client needs help |
| `salon/{id}/pad/split_payment` | Pad → POS | 1 | Split payment initiated |

## Subscribed Topics (POS → Pad)

### ready_to_pay

Initiates a payment flow on the Pad.

**Topic:** `salon/{salonId}/pad/ready_to_pay`

**Payload:**
```typescript
interface ReadyToPayPayload {
  transactionId: string;       // Unique transaction ID
  clientId: string;            // Client's ID
  clientName: string;          // Display name
  clientEmail?: string;        // For email receipt
  clientPhone?: string;        // For SMS receipt
  staffName: string;           // Staff who served client
  items: Array<{
    name: string;
    price: number;             // Individual item price
    quantity: number;
    type: 'service' | 'product';
  }>;
  subtotal: number;            // Sum before tax
  tax: number;                 // Tax amount
  discount?: number;           // Discount if applied
  total: number;               // Final total
  loyaltyPoints?: number;      // Points earned
  suggestedTips: number[];     // Tip suggestions (% or $)
  showReceiptOptions: boolean; // Show receipt screen
  terminalType?: 'pax' | 'dejavoo' | 'clover' | 'generic';
}
```

**Example:**
```json
{
  "transactionId": "txn-123456",
  "clientId": "client-001",
  "clientName": "Sarah Johnson",
  "clientEmail": "sarah@example.com",
  "staffName": "Jennifer",
  "items": [
    { "name": "Haircut", "price": 45.00, "quantity": 1, "type": "service" },
    { "name": "Shampoo", "price": 12.00, "quantity": 1, "type": "product" }
  ],
  "subtotal": 57.00,
  "tax": 4.70,
  "total": 61.70,
  "suggestedTips": [18, 20, 25, 30],
  "showReceiptOptions": true,
  "terminalType": "pax"
}
```

---

### payment_result

Reports payment terminal result to the Pad.

**Topic:** `salon/{salonId}/pad/payment_result`

**Payload:**
```typescript
interface PaymentResultPayload {
  transactionId: string;
  success: boolean;            // true = approved
  cardLast4?: string;          // Last 4 digits of card
  authCode?: string;           // Authorization code
  failureReason?: string;      // Reason if declined
}
```

**Success Example:**
```json
{
  "transactionId": "txn-123456",
  "success": true,
  "cardLast4": "4242",
  "authCode": "AUTH123"
}
```

**Failure Example:**
```json
{
  "transactionId": "txn-123456",
  "success": false,
  "failureReason": "Card declined - insufficient funds"
}
```

---

### cancel

Cancels the current transaction and returns to idle.

**Topic:** `salon/{salonId}/pad/cancel`

**Payload:**
```typescript
interface CancelPayload {
  transactionId?: string;      // Optional - cancel specific transaction
  reason?: string;             // Optional reason
}
```

**Example:**
```json
{
  "transactionId": "txn-123456",
  "reason": "Staff cancelled"
}
```

---

## Published Topics (Pad → POS)

### tip_selected

Sent when client selects a tip amount.

**Topic:** `salon/{salonId}/pad/tip_selected`

**Payload:**
```typescript
interface TipSelectedPayload {
  transactionId: string;
  tipAmount: number;           // Dollar amount
  tipPercent: number | null;   // Percentage (null if custom amount)
}
```

**Example:**
```json
{
  "transactionId": "txn-123456",
  "tipAmount": 12.34,
  "tipPercent": 20
}
```

---

### signature

Sent when client completes signature.

**Topic:** `salon/{salonId}/pad/signature`

**Payload:**
```typescript
interface SignatureCapturedPayload {
  transactionId: string;
  signatureBase64: string;     // PNG image as base64
  agreedAt: string;            // ISO timestamp
}
```

**Example:**
```json
{
  "transactionId": "txn-123456",
  "signatureBase64": "data:image/png;base64,iVBORw0KGgo...",
  "agreedAt": "2026-01-10T15:30:00.000Z"
}
```

---

### receipt_preference

Sent when client selects receipt option.

**Topic:** `salon/{salonId}/pad/receipt_preference`

**Payload:**
```typescript
interface ReceiptPreferencePayload {
  transactionId: string;
  preference: 'email' | 'sms' | 'print' | 'none';
  email?: string;              // If email selected
  phone?: string;              // If SMS selected
}
```

**Example:**
```json
{
  "transactionId": "txn-123456",
  "preference": "email",
  "email": "sarah@example.com"
}
```

---

### transaction_complete

Sent when payment flow finishes.

**Topic:** `salon/{salonId}/pad/transaction_complete`

**Payload:**
```typescript
interface TransactionCompletePayload {
  transactionId: string;
  completedAt: string;         // ISO timestamp
}
```

**Example:**
```json
{
  "transactionId": "txn-123456",
  "completedAt": "2026-01-10T15:35:00.000Z"
}
```

---

### help_requested

Sent when client taps "Need Help" button.

**Topic:** `salon/{salonId}/pad/help_requested`

**Payload:**
```typescript
interface HelpRequestedPayload {
  transactionId?: string;
  currentScreen: 'idle' | 'order-review' | 'tip' | 'signature' | 'payment' | 'result' | 'receipt' | 'thank-you' | 'split-selection' | 'split-status' | 'settings';
  requestedAt: string;         // ISO timestamp
}
```

**Example:**
```json
{
  "transactionId": "txn-123456",
  "currentScreen": "payment",
  "requestedAt": "2026-01-10T15:32:00.000Z"
}
```

---

### split_payment

Sent when client initiates a split payment.

**Topic:** `salon/{salonId}/pad/split_payment`

**Payload:**
```typescript
interface SplitPaymentPayload {
  transactionId: string;
  splitType: 'equal' | 'custom';
  splits: Array<{
    index: number;             // 0-based split index
    amount: number;            // Amount for this split
  }>;
}
```

**Example (2-way equal split):**
```json
{
  "transactionId": "txn-123456",
  "splitType": "equal",
  "splits": [
    { "index": 0, "amount": 30.85 },
    { "index": 1, "amount": 30.85 }
  ]
}
```

---

## Connection Configuration

Default broker URL: `ws://localhost:1883`

Configure via Settings screen:
- **Salon ID** - Used in topic paths
- **MQTT Broker URL** - WebSocket URL to broker

The Pad automatically subscribes to:
- `salon/{salonId}/pad/ready_to_pay`
- `salon/{salonId}/pad/payment_result`
- `salon/{salonId}/pad/cancel`

## Offline Handling

If MQTT connection is lost:
1. Connection status updates to `reconnecting`
2. Outbound messages are queued in localStorage
3. "Reconnecting" overlay displays on active transactions
4. On reconnect, queued messages replay in order
5. Staff alerted after 30 seconds offline

## Topic Utilities

```typescript
import { 
  PAD_TOPICS, 
  buildPadTopic, 
  getSubscribeTopics, 
  getPublishTopics 
} from '@/constants/mqttTopics';

// Build specific topic
const topic = buildPadTopic(PAD_TOPICS.TIP_SELECTED, { salonId: 'salon-123' });
// → 'salon/salon-123/pad/tip_selected'

// Get all subscribe topics
const subscribeTo = getSubscribeTopics('salon-123');
// → ['salon/salon-123/pad/ready_to_pay', ...]

// Get all publish topics
const publishTo = getPublishTopics('salon-123');
// → { tipSelected: '...', signature: '...', ... }
```
