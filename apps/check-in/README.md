# Mango Check-In App

Self-service kiosk application for salon walk-in registration and staff clock-in/out.

## Features

### Client Check-In
- Phone number lookup for returning clients
- Quick registration for new clients
- Guest check-in option
- Service selection with categories
- Technician preference selection
- Queue position display
- QR code appointment lookup
- SMS notifications

### Staff Clock-In
- 4-digit PIN entry
- Clock in/out functionality
- Time tracking integration

### Additional Features
- Loyalty points display
- Service upsells
- Admin assistance mode
- Analytics event tracking
- WCAG 2.1 AA accessibility
- Security hardening (input sanitization, session timeout)

## Tech Stack

- **Framework**: React 18 + TypeScript 5.5
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit
- **Testing**: Vitest (unit), Playwright (E2E)
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+

### Installation

```bash
# From monorepo root
pnpm install

# Or from this directory
cd apps/check-in
pnpm install
```

### Development

```bash
# Start development server (localhost:5175)
pnpm dev
```

### Build

```bash
# Production build
pnpm build

# Preview production build
pnpm preview
```

### Testing

```bash
# Run unit tests
pnpm test

# Run with coverage
pnpm test --coverage

# Run E2E tests
pnpm test:e2e

# Run E2E tests with UI
pnpm test:e2e:ui
```

## Project Structure

```
src/
├── components/          # Reusable components
│   └── LoadingSpinner.tsx
├── hooks/               # Custom React hooks
│   └── usePerformance.ts
├── pages/               # Route pages
│   ├── HomePage.tsx     # Landing page
│   ├── CheckInPage.tsx  # Client check-in flow
│   └── ClockInPage.tsx  # Staff clock-in
├── test/                # Test utilities
│   └── setup.ts
├── App.tsx              # Main app component
├── AppRoutes.tsx        # Route definitions (lazy-loaded)
├── main.tsx             # Entry point
└── index.css            # Global styles
```

## Performance

- **Code Splitting**: Routes are lazy-loaded using React.lazy
- **Bundle Size**: ~66 KB gzipped (target: <500 KB)
- **Loading States**: Suspense boundaries with LoadingSpinner
- **Minification**: Terser with console/debugger stripping

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for deployment instructions.

## License

Proprietary - Mango Biz © 2026
