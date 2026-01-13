# AGENTS.md - Mango Pad

> AI agent instructions for the Mango Pad customer-facing payment display app.

---

## Quick Reference

| Item | Details |
|------|---------|
| **App Type** | Customer-facing payment display (secondary screen) |
| **Framework** | React 18 + TypeScript + Vite |
| **State** | Redux Toolkit |
| **Communication** | MQTT (mqtt.js) for POS integration |
| **UI** | Tailwind CSS + Radix UI + Framer Motion |
| **Signature** | react-signature-canvas |
| **Platforms** | Web, iPad (Capacitor), Android (Capacitor), Desktop secondary display |
| **Dev Server** | `pnpm dev` |
| **Build** | `pnpm build` |
| **Test** | `pnpm test` |
| **PRD** | `../../tasks/prd-mango-pad.md` |

---

## Architecture Overview

```
src/
├── pages/               # Screen components
│   ├── IdlePage.tsx         # Standby with digital signage
│   ├── OrderReviewPage.tsx  # Transaction details
│   ├── TipPage.tsx          # Tip selection
│   ├── SignaturePage.tsx    # Signature capture
│   ├── PaymentPage.tsx      # Payment instructions
│   ├── ResultPage.tsx       # Success/failure
│   ├── ReceiptPage.tsx      # Receipt options
│   ├── ThankYouPage.tsx     # Closing screen
│   ├── SplitPaymentPage.tsx # Split payment flow
│   └── SettingsPage.tsx     # Configuration
├── components/          # Reusable UI components
│   ├── NumericKeypad.tsx
│   ├── SignatureCanvas.tsx
│   ├── PromoCarousel.tsx
│   └── ConnectionStatus.tsx
├── store/
│   ├── index.ts             # Redux store config
│   └── slices/
│       ├── padSlice.ts      # Current screen, flow state
│       ├── transactionSlice.ts # Transaction data
│       ├── configSlice.ts   # Settings/preferences
│       └── uiSlice.ts       # UI state (loading, errors)
├── providers/
│   └── MqttProvider.tsx     # MQTT connection context
├── hooks/
│   ├── useMqtt.ts           # MQTT publish/subscribe
│   ├── useTransaction.ts    # Transaction helpers
│   └── useConfig.ts         # Settings access
├── services/
│   └── mqttService.ts       # MQTT connection logic
├── types/
│   └── index.ts             # TypeScript interfaces
├── utils/
│   ├── tipCalculations.ts   # Tip math utilities
│   ├── splitCalculations.ts # Split payment math
│   └── formatters.ts        # Currency, date formatting
└── constants/
    └── mqttTopics.ts        # MQTT topic definitions
```

---

## MQTT Topics

| Topic | Direction | Purpose |
|-------|-----------|---------|
| `salon/{id}/pad/ready_to_pay` | POS → Pad | Start payment flow |
| `salon/{id}/pad/tip_selected` | Pad → POS | Client tip choice |
| `salon/{id}/pad/signature` | Pad → POS | Captured signature |
| `salon/{id}/pad/payment_result` | POS → Pad | Terminal result |
| `salon/{id}/pad/receipt_preference` | Pad → POS | Receipt choice |
| `salon/{id}/pad/transaction_complete` | Pad → POS | Flow complete |
| `salon/{id}/pad/cancel` | POS → Pad | Cancel transaction |
| `salon/{id}/pad/help_requested` | Pad → POS | Client needs help |
| `salon/{id}/pad/split_payment` | Pad → POS | Split payment initiated |

---

## Key Types

```typescript
interface TransactionPayload {
  transactionId: string;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  staffName: string;
  items: TransactionItem[];
  subtotal: number;
  tax: number;
  discount?: number;
  total: number;
  loyaltyPoints?: number;
  suggestedTips: number[];
  showReceiptOptions: boolean;
  terminalType?: 'pax' | 'dejavoo' | 'clover' | 'generic';
}

interface TransactionItem {
  name: string;
  price: number;
  quantity: number;
  type: 'service' | 'product';
}

interface PadConfig {
  salonId: string;
  mqttBrokerUrl: string;
  tipEnabled: boolean;
  tipType: 'percentage' | 'dollar';
  tipSuggestions: number[];
  signatureRequired: boolean;
  showReceiptOptions: boolean;
  paymentTimeout: number;
  thankYouDelay: number;
  splitPaymentEnabled: boolean;
  maxSplits: number;
  logoUrl?: string;
  promoSlides: PromoSlide[];
  slideDuration: number;
  brandColors: { primary: string; secondary: string };
}
```

---

## Patterns & Conventions

### Screen Flow State Machine

```typescript
type PadScreen = 
  | 'idle'
  | 'order-review'
  | 'tip'
  | 'signature'
  | 'payment'
  | 'result'
  | 'receipt'
  | 'thank-you'
  | 'split-selection'
  | 'split-status'
  | 'settings';
```

### MQTT Message Handling

```typescript
// In MqttProvider or useMqtt hook
mqttClient.on('message', (topic, payload) => {
  const data = JSON.parse(payload.toString());
  
  if (topic.endsWith('/ready_to_pay')) {
    dispatch(setTransaction(data));
    dispatch(setScreen('order-review'));
  }
  
  if (topic.endsWith('/payment_result')) {
    dispatch(setPaymentResult(data));
    dispatch(setScreen('result'));
  }
  
  if (topic.endsWith('/cancel')) {
    dispatch(clearTransaction());
    dispatch(setScreen('idle'));
  }
});
```

### Settings Persistence

```typescript
// Load on app start
const savedConfig = localStorage.getItem('mango-pad-config');
if (savedConfig) {
  dispatch(setConfig(JSON.parse(savedConfig)));
}

// Save on change
useEffect(() => {
  localStorage.setItem('mango-pad-config', JSON.stringify(config));
}, [config]);
```

---

## Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm preview          # Preview production build
pnpm lint             # Lint code

# Testing
pnpm test             # Run unit tests
pnpm test:coverage    # Run with coverage
pnpm test:e2e         # Run Playwright E2E tests

# Native (requires Capacitor setup)
npx cap sync          # Sync web build to native
npx cap open ios      # Open in Xcode
npx cap open android  # Open in Android Studio
```

---

## Do

- ✅ Use Redux for all state management
- ✅ Communicate with POS only via MQTT
- ✅ Handle offline/reconnection gracefully
- ✅ Use TypeScript interfaces for all data
- ✅ Support touch gestures for tablet use
- ✅ Large touch targets (48px minimum)
- ✅ Persist settings to localStorage
- ✅ Use Framer Motion for smooth transitions

## Don't

- ❌ Call Supabase directly (POS handles data)
- ❌ Store sensitive data on the Pad
- ❌ Process payments on the Pad (external terminal)
- ❌ Hardcode salon IDs or broker URLs
- ❌ Use small fonts (minimum 18px body)
- ❌ Block UI during MQTT operations

---

## Codebase Patterns (Updated by Ralph)

> This section is updated by Ralph during autonomous builds.
> Add reusable patterns discovered during implementation.

<!-- Ralph will append patterns here -->

---

*Last updated: January 2026*
