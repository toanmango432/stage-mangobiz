# Mango POS Offline V1 - Client

## Overview

This is the client (frontend) application for Mango POS Offline V1, a fully offline-capable salon management system.

## Features

- **Offline-First Architecture**: Full functionality without internet connection
- **Real-time Sync**: Automatic synchronization when connection is restored
- **Multiple Modules**:
  - Book: Appointment scheduling and calendar
  - Front Desk: Main salon operations dashboard
  - Tickets: Ticket management (waitlist, in-service, coming)
  - Team: Staff management and status
  - Pending: Pending checkouts
  - Checkout: Payment processing
  - Transactions: Transaction history
  - More: Additional settings and features

## Tech Stack

- React 18+ with TypeScript
- Redux Toolkit for state management
- Vite for build tooling
- Tailwind CSS for styling
- Dexie.js (IndexedDB) for local storage
- Axios for API communication
- Socket.io Client for real-time updates

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

The production build will be in the `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── api/              # API client and endpoints
├── components/        # React components
│   ├── layout/       # Layout components (AppShell, TopHeaderBar, BottomNavBar)
│   ├── modules/      # Module components (Book, FrontDesk, Tickets, etc.)
│   └── ...           # Feature components
├── db/               # IndexedDB schema and operations
├── hooks/            # React hooks
├── services/          # Business logic services
├── store/             # Redux store and slices
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Key Features

### Offline Support

- All data is stored locally in IndexedDB
- Changes are queued for sync when offline
- Automatic retry on connection restore
- Conflict resolution (Last-Write-Wins strategy)

### State Management

- Redux Toolkit with feature-based slices
- Async thunks for data fetching
- Optimistic updates for better UX

### Real-time Updates

- Socket.io integration for live updates
- Automatic state synchronization
- Multi-device support

## Development Notes

- The app uses localStorage for some settings
- IndexedDB is auto-seeded on first run
- Mock data is available for development
- All API calls have offline fallbacks

## Testing

```bash
npm test
```

## License

Private - Mango POS System

