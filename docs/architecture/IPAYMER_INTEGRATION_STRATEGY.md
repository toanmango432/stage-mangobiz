# iPaymer Integration Strategy for Mango POS

> Integration plan for leveraging iPaymer's fintech features in Mango Store App

---

## Executive Summary

iPaymer provides a comprehensive fintech platform with payment processing, invoicing, customer management, and accounting integrations. This document outlines how to integrate iPaymer with Mango POS's existing payment infrastructure.

**Key Benefit:** Replace mock/Fiserv payment provider with iPaymer while gaining access to:
- Card processing (Stripe, CardConnect)
- Invoicing and receipts
- Customer management with payment profiles
- QuickBooks/Xero accounting sync
- Subscription billing (for membership/packages)

---

## 1. Architecture Fit

### Mango's Current Payment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     PaymentModal Component                       │
│  (usePaymentModal hook manages UI state and calls paymentBridge) │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PaymentBridge Service                       │
│  • Platform-agnostic payment abstraction                         │
│  • Singleton pattern: paymentBridge.processPayment()             │
│  • Routes to provider based on platform                          │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   PaymentProvider Interface                      │
│  • processCardPayment(request): Promise<PaymentResult>           │
│  • processCashPayment(request): Promise<PaymentResult>           │
│  • processGiftCardPayment(request): Promise<PaymentResult>       │
│  • processCustomPayment(request): Promise<PaymentResult>         │
│  • voidTransaction(transactionId): Promise<PaymentResult>        │
│  • isAvailable(): Promise<boolean>                               │
└───────────────────────────────┬─────────────────────────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                 ▼
     ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
     │ MockProvider   │ │ FiservProvider │ │ iPaymerProvider│
     │ (current)      │ │ (planned)      │ │ (NEW)          │
     └────────────────┘ └────────────────┘ └────────────────┘
```

### Integration Point

**Create `iPaymerProvider.ts`** that implements `PaymentProvider` interface and uses iPaymer's REST API.

---

## 2. iPaymer API Mapping

### Authentication

```typescript
// iPaymer uses Bearer token authentication
const headers = {
  'Authorization': `Bearer ${IPAYMER_API_KEY}`,
  'Content-Type': 'application/json',
};
```

### Key Endpoints for Mango POS

| Mango Operation | iPaymer Endpoint | Method | Notes |
|-----------------|------------------|--------|-------|
| Process Card Payment | `POST /v1/customer/quick-sale` | POST | Single call: create invoice + charge |
| Process Card Payment (Alt) | `POST /v1/invoice/process-payment/{id}` | POST | Charge existing invoice |
| Void/Refund | `POST /v1/transaction/refund` | POST | Full or partial refund |
| Check Balance | `GET /v1/invoice/{id}` | GET | Check payment status |
| Create Customer | `POST /v1/customer/store` | POST | Sync Mango clients |
| Get Customer | `GET /v1/customer/{id}` | GET | Retrieve customer data |
| Save Card | `POST /v1/customer/add-card/{id}` | POST | Tokenize card for future use |

### Quick Sale - The Key Endpoint

iPaymer's Quick Sale endpoint is ideal for Mango's checkout flow:

```typescript
// POST /v1/customer/quick-sale
interface QuickSaleRequest {
  customer_id?: string;          // Optional - for repeat customers
  email?: string;                // Required if no customer_id
  phone?: string;
  first_name?: string;
  last_name?: string;

  // Payment details
  amount: number;                // Total in cents
  description?: string;          // e.g., "Haircut, Color - Jane"

  // Card details (or use saved card)
  card_token?: string;           // From saved card
  card_number?: string;          // For new card
  expiry_month?: string;
  expiry_year?: string;
  cvv?: string;

  // Options
  send_receipt?: boolean;
  tip_amount?: number;
}
```

---

## 3. Type Mapping

### Mango → iPaymer

```typescript
// apps/store-app/src/services/payment/iPaymerAdapter.ts

import type { PaymentRequest, PaymentResult } from './types';

interface IPaymerQuickSaleRequest {
  customer_id?: string;
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  amount: number;
  description?: string;
  tip_amount?: number;
  send_receipt?: boolean;
  // Card tokenization handled by iPaymer's frontend SDK
  payment_method_id?: string;
}

interface IPaymerTransactionResponse {
  id: string;
  status: 'approved' | 'declined' | 'pending' | 'failed';
  auth_code?: string;
  amount: number;
  tip?: number;
  created_at: string;
  error_message?: string;
  error_code?: string;
}

// Convert Mango PaymentRequest → iPaymer QuickSaleRequest
export function toIPaymerRequest(
  request: PaymentRequest,
  clientInfo?: { name?: string; email?: string; phone?: string }
): IPaymerQuickSaleRequest {
  return {
    amount: Math.round(request.amount * 100), // iPaymer uses cents
    description: `Ticket #${request.ticketId}`,
    email: clientInfo?.email,
    phone: clientInfo?.phone,
    first_name: clientInfo?.name?.split(' ')[0],
    last_name: clientInfo?.name?.split(' ').slice(1).join(' '),
    send_receipt: true,
  };
}

// Convert iPaymer Response → Mango PaymentResult
export function toMangoResult(response: IPaymerTransactionResponse): PaymentResult {
  if (response.status === 'approved') {
    return {
      success: true,
      transactionId: response.id,
      authCode: response.auth_code,
      amountProcessed: response.amount / 100, // Convert cents to dollars
      timestamp: response.created_at,
    };
  }

  // Map iPaymer error codes to Mango error codes
  const errorCodeMap: Record<string, PaymentResult['errorCode']> = {
    'card_declined': 'DECLINED',
    'insufficient_funds': 'INSUFFICIENT_FUNDS',
    'invalid_card': 'INVALID_CARD',
    'network_error': 'NETWORK_ERROR',
    'processing_error': 'PROCESSING_ERROR',
  };

  return {
    success: false,
    error: response.error_message || 'Payment failed',
    errorCode: errorCodeMap[response.error_code || ''] || 'PROCESSING_ERROR',
  };
}
```

---

## 4. iPaymer Provider Implementation

```typescript
// apps/store-app/src/services/payment/iPaymerProvider.ts

import type { PaymentProvider, PaymentRequest, PaymentResult } from './types';
import { toIPaymerRequest, toMangoResult } from './iPaymerAdapter';

const IPAYMER_BASE_URL = 'https://api.ipaymer.com/v1';

export class IPaymerProvider implements PaymentProvider {
  name = 'iPaymer';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: unknown
  ): Promise<T> {
    const response = await fetch(`${IPAYMER_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `iPaymer API error: ${response.status}`);
    }

    return response.json();
  }

  async processCardPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      const iPaymerRequest = toIPaymerRequest(request);

      // Use Quick Sale for seamless checkout
      const response = await this.makeRequest<IPaymerTransactionResponse>(
        '/customer/quick-sale',
        'POST',
        iPaymerRequest
      );

      return toMangoResult(response);
    } catch (error) {
      console.error('[iPaymer] Card payment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed',
        errorCode: 'PROCESSING_ERROR',
      };
    }
  }

  async processCashPayment(request: PaymentRequest): Promise<PaymentResult> {
    // Cash payments don't need external processing
    // Just record locally - same as MockProvider
    const tendered = request.tendered || request.amount;
    const changeToReturn = Math.max(0, tendered - request.amount);

    return {
      success: true,
      transactionId: `CASH-${Date.now()}`,
      amountProcessed: request.amount,
      changeToReturn,
      timestamp: new Date().toISOString(),
    };
  }

  async processGiftCardPayment(
    request: PaymentRequest,
    giftCardCode?: string
  ): Promise<PaymentResult> {
    // iPaymer may not have gift card support
    // Use Mango's internal gift card system (giftCardDB)
    // Just record the payment
    return {
      success: true,
      transactionId: `GC-${Date.now()}`,
      amountProcessed: request.amount,
      timestamp: new Date().toISOString(),
    };
  }

  async processCustomPayment(request: PaymentRequest): Promise<PaymentResult> {
    // Custom payments (Venmo, Check, etc.) are recorded locally
    return {
      success: true,
      transactionId: `CUSTOM-${Date.now()}`,
      amountProcessed: request.amount,
      timestamp: new Date().toISOString(),
    };
  }

  async voidTransaction(transactionId: string): Promise<PaymentResult> {
    try {
      const response = await this.makeRequest<IPaymerTransactionResponse>(
        '/transaction/refund',
        'POST',
        { transaction_id: transactionId }
      );

      return {
        success: response.status === 'approved',
        transactionId: response.id,
        timestamp: response.created_at,
        error: response.error_message,
      };
    } catch (error) {
      console.error('[iPaymer] Void error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Void failed',
        errorCode: 'PROCESSING_ERROR',
      };
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Check API connectivity
      await this.makeRequest('/health');
      return true;
    } catch {
      return false;
    }
  }
}
```

---

## 5. Integration with PaymentBridge

Update `paymentBridge.ts` to support iPaymer:

```typescript
// apps/store-app/src/services/payment/paymentBridge.ts

import { IPaymerProvider } from './iPaymerProvider';

// Add to constructor
constructor() {
  this.platform = detectPlatform();
  const paymentProcessor = import.meta.env.VITE_PAYMENT_PROCESSOR || 'mock';

  switch (paymentProcessor) {
    case 'ipaymer':
      const apiKey = import.meta.env.VITE_IPAYMER_API_KEY;
      if (!apiKey) {
        console.warn('[PaymentBridge] iPaymer API key not configured, falling back to mock');
        this.provider = mockPaymentProvider;
      } else {
        this.provider = new IPaymerProvider(apiKey);
      }
      break;
    case 'fiserv':
      // Future: Fiserv TTP provider
      this.provider = mockPaymentProvider;
      break;
    default:
      this.provider = mockPaymentProvider;
  }
}
```

---

## 6. Additional iPaymer Features to Leverage

### 6.1 Customer Sync

Sync Mango clients to iPaymer for:
- Saved payment methods
- Purchase history
- Recurring billing (memberships)

```typescript
// Sync client to iPaymer when created/updated in Mango
export async function syncClientToIPaymer(client: Client): Promise<string> {
  const response = await iPaymerApi.post('/customer/store', {
    email: client.email,
    phone: client.phone,
    first_name: client.firstName,
    last_name: client.lastName,
    external_id: client.id, // Mango client ID
  });

  return response.id; // Store iPaymer customer ID in Mango
}
```

### 6.2 Invoicing

Use iPaymer's invoicing for:
- Detailed service line items
- Professional receipts
- Tax handling

```typescript
// Create detailed invoice before payment
const invoice = await iPaymerApi.post('/invoice/store', {
  customer_id: iPaymerCustomerId,
  items: ticket.services.map(s => ({
    description: s.name,
    quantity: 1,
    unit_price: s.price * 100, // cents
    staff_name: s.staffName,
  })),
  tax_rate: taxRate,
  tip_amount: tip * 100,
});
```

### 6.3 Accounting Integration

iPaymer supports:
- **QuickBooks Online** - Auto-sync transactions
- **Xero** - Invoice sync
- **CardConnect** - Direct processor integration

Configure in iPaymer dashboard, transactions auto-sync.

### 6.4 Subscription/Recurring Billing

For salon memberships and packages:

```typescript
// Create subscription for monthly membership
const subscription = await iPaymerApi.post('/subscription/store', {
  customer_id: iPaymerCustomerId,
  plan_id: 'monthly-unlimited',
  billing_cycle: 'monthly',
  start_date: new Date().toISOString(),
});
```

---

## 7. Implementation Phases

### Phase 1: Basic Card Processing (1-2 weeks)

1. Create `iPaymerProvider.ts` implementing `PaymentProvider`
2. Add environment variables for iPaymer API key
3. Update `PaymentBridge` to use iPaymer when configured
4. Test card payments through checkout flow
5. Handle error states and edge cases

**Files to create/modify:**
- `src/services/payment/iPaymerProvider.ts` (NEW)
- `src/services/payment/iPaymerAdapter.ts` (NEW)
- `src/services/payment/paymentBridge.ts` (MODIFY)
- `.env` (ADD VITE_IPAYMER_API_KEY)

### Phase 2: Customer Sync (1 week)

1. Add iPaymer customer ID field to Mango client type
2. Create sync service for client → iPaymer customer
3. Sync on client create/update
4. Enable saved payment methods

**Files to create/modify:**
- `src/services/ipaymer/customerSync.ts` (NEW)
- `src/types/client.ts` (MODIFY - add iPaymerCustomerId)
- `src/store/slices/clientsSlice.ts` (MODIFY)

### Phase 3: Enhanced Invoicing (1 week)

1. Create invoices with line items before payment
2. Use iPaymer's receipt system
3. Add email receipt option to checkout

### Phase 4: Accounting Integration (Optional)

1. Configure QuickBooks/Xero in iPaymer dashboard
2. Map Mango transaction fields to accounting codes
3. Test auto-sync

---

## 8. Environment Configuration

```bash
# .env
VITE_PAYMENT_PROCESSOR=ipaymer          # 'mock' | 'ipaymer' | 'fiserv'
VITE_IPAYMER_API_KEY=your_api_key_here
VITE_IPAYMER_BASE_URL=https://api.ipaymer.com  # Optional override
```

---

## 9. Testing Strategy

### Unit Tests

```typescript
// src/services/payment/__tests__/iPaymerProvider.test.ts
describe('IPaymerProvider', () => {
  it('should process card payment successfully', async () => {
    // Mock iPaymer API response
    fetchMock.mockResponseOnce(JSON.stringify({
      id: 'txn_123',
      status: 'approved',
      auth_code: 'ABC123',
      amount: 5000,
    }));

    const provider = new IPaymerProvider('test_key');
    const result = await provider.processCardPayment({
      amount: 50.00,
      method: 'card',
      ticketId: 'ticket_1',
    });

    expect(result.success).toBe(true);
    expect(result.transactionId).toBe('txn_123');
    expect(result.amountProcessed).toBe(50.00);
  });

  it('should handle declined cards', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({
      status: 'declined',
      error_code: 'card_declined',
      error_message: 'Card was declined',
    }));

    const provider = new IPaymerProvider('test_key');
    const result = await provider.processCardPayment({
      amount: 50.00,
      method: 'card',
      ticketId: 'ticket_1',
    });

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('DECLINED');
  });
});
```

### Integration Tests

Test with iPaymer sandbox environment before production.

---

## 10. Security Considerations

1. **API Key Storage**: Use environment variables, never commit keys
2. **Card Data**: Use iPaymer's frontend SDK for tokenization - never handle raw card numbers
3. **PCI Compliance**: iPaymer handles PCI, Mango only receives tokens
4. **Audit Logging**: Log all payment attempts (already in paymentBridge)

---

## 11. Rollback Plan

If iPaymer integration fails:

1. Set `VITE_PAYMENT_PROCESSOR=mock` to revert to mock provider
2. All transaction records remain in Mango's local database
3. No data loss - only processing route changes

---

## Summary

| Component | Current State | After iPaymer |
|-----------|---------------|---------------|
| Payment Provider | MockPaymentProvider | IPaymerProvider |
| Card Processing | Simulated | Real via iPaymer |
| Invoicing | Internal only | iPaymer + Mango |
| Customer Data | Mango only | Synced to iPaymer |
| Accounting | Manual export | Auto-sync (optional) |
| Subscriptions | Not available | Available via iPaymer |

**Next Steps:**
1. Get iPaymer API credentials (sandbox first)
2. Create `iPaymerProvider.ts` following this spec
3. Test checkout flow with sandbox
4. Roll out to production
