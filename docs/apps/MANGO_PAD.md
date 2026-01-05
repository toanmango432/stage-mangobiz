# Mango Pad

> Signature capture and receipt display for iPad

---

## Overview

Mango Pad is an iPad application for capturing customer signatures during checkout. It displays receipt details and tip options, then captures the signature for transaction records.

---

## Platform

| Property | Value |
|----------|-------|
| **Framework** | React + Capacitor |
| **Target Devices** | iPad (primary), Android tablet |
| **Connection** | Local MQTT (primary), Cloud MQTT (fallback) |
| **Offline Capable** | Limited (signatures queued with QoS 1) |

---

## Key Features

### Receipt Display
- Transaction summary
- Itemized services/products
- Tax and discounts
- Total amount

### Tip Selection
- Preset tip percentages (15%, 18%, 20%, 25%)
- Custom tip amount
- No tip option
- Real-time total update

### Signature Capture
- Full-screen signature canvas
- Clear and redo options
- Multi-touch support
- High-resolution capture

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       MANGO PAD (Capacitor)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                      SCREENS                             │   │
│   │                                                          │   │
│   │   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌────────┐  │   │
│   │   │ Waiting │──▶│ Receipt │──▶│   Tip   │──▶│  Sign  │  │   │
│   │   │         │   │ Display │   │ Select  │   │        │  │   │
│   │   └─────────┘   └─────────┘   └─────────┘   └────────┘  │   │
│   │                                                          │   │
│   └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                  SIGNATURE CANVAS                        │   │
│   │                                                          │   │
│   │   Native touch handling ──► Vector path capture         │   │
│   │   ──► PNG/SVG export                                    │   │
│   │                                                          │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Local (< 50ms)
                              ▼
                    ┌─────────────────┐
                    │   STORE APP     │
                    │   (Local Hub)   │
                    └─────────────────┘
```

---

## Workflow

### Receipt → Signature Flow

```
Store App                    Mango Pad
    │                            │
    │  receipt:ready             │
    ├───────────────────────────▶│
    │                            │  Display receipt
    │                            │
    │                            │  Customer selects tip
    │                            │
    │  tip:selected              │
    │◀────────────────────────────┤
    │                            │
    │                            │  Customer signs
    │                            │
    │  signature:captured        │
    │◀────────────────────────────┤
    │                            │
    │  Complete checkout         │
    │                            │
    │  checkout:complete         │
    ├───────────────────────────▶│
    │                            │  Show "Thank You"
    │                            │
```

---

## MQTT Topics

### Subscribed Topics (Incoming)

```typescript
import mqtt from 'mqtt';

// Subscribe to receipt-ready events
client.subscribe(`salon/${salonId}/receipts/ready`);
client.subscribe(`salon/${salonId}/checkout/complete`);

client.on('message', (topic, message) => {
  const data = JSON.parse(message.toString());

  if (topic.endsWith('receipts/ready')) {
    setReceipt(data.receipt);
    setScreen('receipt');
  }

  if (topic.endsWith('checkout/complete')) {
    setScreen('thank-you');
    setTimeout(() => setScreen('waiting'), 5000);
  }
});
```

### Published Topics (Outgoing)

```typescript
// Send tip selection (QoS 1)
client.publish(`salon/${salonId}/pad/tip`, JSON.stringify({
  ticketId: ticket.id,
  tipAmount: selectedTip,
  tipPercent: selectedPercent
}), { qos: 1 });

// Send captured signature (QoS 1 - guaranteed delivery)
client.publish(`salon/${salonId}/pad/signature`, JSON.stringify({
  ticketId: ticket.id,
  signatureData: canvas.toDataURL('image/png'),
  timestamp: new Date().toISOString()
}), { qos: 1 });
```

---

## Signature Canvas

### Implementation

```typescript
interface SignatureCanvasProps {
  onCapture: (dataUrl: string) => void;
  onClear: () => void;
}

function SignatureCanvas({ onCapture, onClear }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // High-resolution for quality
  const SCALE = 2;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set up high-DPI canvas
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * SCALE;
    canvas.height = rect.height * SCALE;

    const ctx = canvas.getContext('2d');
    ctx?.scale(SCALE, SCALE);
  }, []);

  // Touch handling for iPad
  const handleTouch = (e: TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    // Draw at touch point...
  };

  return (
    <canvas
      ref={canvasRef}
      onTouchStart={handleTouch}
      onTouchMove={handleTouch}
      className="w-full h-64 border rounded-lg"
    />
  );
}
```

---

## Tip Calculation

```typescript
const TIP_PRESETS = [
  { label: '15%', value: 0.15 },
  { label: '18%', value: 0.18 },
  { label: '20%', value: 0.20 },
  { label: '25%', value: 0.25 },
];

function calculateTip(subtotal: number, percent: number): number {
  return Math.round(subtotal * percent * 100) / 100;
}
```

---

## Offline Mode

When Store App is unavailable:

1. **Cannot receive receipts**: Shows "Waiting for receipt" screen
2. **Queue signatures**: MQTT QoS 1 auto-queues and retries on reconnect
3. **Auto-retry**: MQTT reconnects automatically every 5 seconds
4. **Visual indicator**: "Offline" badge displayed
5. **Retained messages**: Last receipt cached on broker for instant display on reconnect

---

## UI Requirements

### iPad Optimization
- Landscape orientation
- Full-screen signature area
- Large tip buttons (min 60px height)
- High contrast for visibility

### Customer-Facing
- Simple, clean interface
- Minimal text
- Clear call-to-action buttons
- "Thank You" screen after completion

---

## Development

```bash
# Start dev server
pnpm dev --filter=mango-pad

# Build for iPad
npx cap sync ios
npx cap open ios

# Build for Android tablet
npx cap sync android
npx cap open android
```

---

## Related Documentation

- [REALTIME_COMMUNICATION.md](../architecture/REALTIME_COMMUNICATION.md)
- [DEVICE_DISCOVERY.md](../architecture/DEVICE_DISCOVERY.md)
- [PRD-Sales-Checkout-Module.md](../product/PRD-Sales-Checkout-Module.md)

---

*Last updated: January 2025*
