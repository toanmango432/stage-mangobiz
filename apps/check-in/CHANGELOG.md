# Changelog

All notable changes to the Mango Check-In App will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-01-10

### Added

#### Core Features (US-001 to US-010)
- **Phone Lookup** - Returning client identification via phone number
- **New Client Registration** - Quick form for walk-in clients
- **Service Selection** - Category-based service browsing with prices/durations
- **Technician Selection** - Staff preference with availability display
- **Check-In Confirmation** - Summary page with queue position
- **Guest Check-In** - Anonymous walk-in option without registration
- **QR Code Lookup** - Appointment lookup via QR scan
- **SMS Notifications** - Queue position and ready-to-serve alerts
- **Admin Assistance Mode** - Staff help request button
- **Analytics Tracking** - Event logging for business insights

#### Enhanced Features (US-011 to US-015)
- **Service Upsells** - Recommended add-on services display
- **Loyalty Points** - Client loyalty status and points balance
- **Duration Formatting** - Human-readable service duration display
- **Price Formatting** - Currency formatting with locale support
- **Staff Clock-In/Out** - 4-digit PIN-based time tracking

#### Quality & Security (US-016 to US-020)
- **Accessibility** - WCAG 2.1 AA compliance
- **Security Hardening** - Input sanitization, XSS prevention, session timeout
- **Error Boundaries** - Graceful error handling
- **Responsive Design** - Mobile-first, kiosk-optimized layout
- **Offline Support** - Basic offline detection and messaging

#### Testing & Performance (US-021 to US-023)
- **Unit Tests** - 70%+ code coverage with Vitest
- **E2E Tests** - Playwright tests for all user flows
- **Performance Optimization**:
  - React.lazy for route-based code splitting
  - Suspense boundaries with loading states
  - Bundle size optimization (~66 KB gzipped)
  - Terser minification with console stripping

#### Documentation (US-024)
- README.md with setup and usage instructions
- CHANGELOG.md (this file)
- docs/DEPLOYMENT.md with deployment guide

### Technical Details
- React 18 with TypeScript 5.5
- Vite build tooling
- Tailwind CSS styling
- Redux Toolkit state management
- Lucide React icons

---

## [Unreleased]

### Planned
- Native mobile builds (Capacitor)
- Biometric staff authentication
- Multi-language support
- Theme customization
- Hardware integration (receipt printer, barcode scanner)
