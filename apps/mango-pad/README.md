# Mango Pad

Customer-facing payment display for Mango POS. Handles order review, tip selection, signature capture, payment instructions, split payments, and receipt preferences via MQTT communication.

## Overview

Mango Pad runs on a secondary display (iPad, Android tablet, or desktop screen) facing the customer during checkout. It receives transaction data from the POS via MQTT and guides customers through the payment flow.

### Key Features

- **Digital Signage** - Promotional carousel on idle screen with configurable slides
- **Order Review** - Display services, products, and totals for customer verification
- **Tip Selection** - Configurable percentage or dollar-based tip suggestions
- **Signature Capture** - Touch-friendly digital signature pad
- **Payment Instructions** - Guide customers to tap/insert card on terminal
- **Split Payments** - Equal or custom split between multiple cards
- **Receipt Options** - Email, SMS, print, or no receipt
- **Offline Support** - Message queuing during brief disconnections

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- MQTT broker (e.g., Mosquitto) running on the local network

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The app runs at `http://localhost:5176`.

### Configuration

Access settings via 4-finger long press (2 seconds) on the idle screen.

Required configuration:
- **Salon ID** - Your salon's unique identifier
- **MQTT Broker URL** - WebSocket URL to your MQTT broker (e.g., `ws://localhost:1883`)

## Development

### Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server (port 5176) |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run unit tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:coverage` | Run tests with coverage report |
| `pnpm test:e2e` | Run Playwright E2E tests |

### Project Structure

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
│   ├── SplitSelectionPage.tsx # Split setup
│   ├── SplitStatusPage.tsx  # Split progress
│   └── SettingsPage.tsx     # Configuration
├── components/          # Reusable UI components
├── store/
│   ├── index.ts             # Redux store config
│   └── slices/              # Redux slices
├── providers/
│   └── PadMqttProvider.tsx  # MQTT connection context
├── hooks/               # Custom React hooks
├── services/            # MQTT client, sync queue
├── types/               # TypeScript interfaces
├── utils/               # Utility functions
├── styles/              # CSS files
└── constants/           # Static values
```

### Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Redux Toolkit** - State management
- **MQTT.js** - MQTT client for POS communication
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **react-signature-canvas** - Signature capture
- **Vitest** - Unit testing
- **Playwright** - E2E testing

## Documentation

- [MQTT Topics](./docs/MQTT_TOPICS.md) - MQTT topic patterns and payloads
- [Configuration](./docs/CONFIGURATION.md) - All settings and options
- [Deployment](./docs/DEPLOYMENT.md) - Web, iOS, and Android deployment

## Testing

### Unit Tests

```bash
pnpm test           # Run all tests
pnpm test:coverage  # Run with coverage report
```

Coverage target: 70%+

### E2E Tests

```bash
pnpm test:e2e       # Run all E2E tests
pnpm test:e2e:ui    # Run with Playwright UI
```

E2E tests cover complete payment flows, split payments, cancellation, and error scenarios.

## Accessibility

Mango Pad is WCAG 2.1 AA compliant:

- Minimum 48x48px touch targets
- 4.5:1 color contrast ratio
- Large readable fonts (18px+ body)
- ARIA labels on all interactive elements
- High contrast mode option
- Large text mode option

## License

Proprietary - Mango Biz
