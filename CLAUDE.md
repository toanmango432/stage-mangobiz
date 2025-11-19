# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mango POS Offline V2 is an offline-first salon management system built with React, TypeScript, and IndexedDB. The application provides comprehensive salon operations management including appointment scheduling, ticket management, payment processing, and staff coordination - all designed to work seamlessly without internet connectivity.

## Common Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Run a specific test file
npm test src/utils/__tests__/timeUtils.test.ts
```

## High-Level Architecture

### State Management
The application uses Redux Toolkit with the following key slices:
- **appointmentsSlice**: Manages appointment scheduling and calendar state
- **ticketsSlice**: Handles service tickets and checkout flow
- **staffSlice**: Staff management and assignment
- **clientsSlice**: Customer data and history
- **transactionsSlice**: Payment and transaction records
- **authSlice**: Authentication and user sessions
- **syncSlice**: Offline/online synchronization state
- **uiSlice, uiTicketsSlice, uiStaffSlice**: UI-specific state management

### Data Persistence
IndexedDB via Dexie.js provides local database functionality:
- **Primary Database**: `src/db/database.ts` - Contains all CRUD operations for entities
- **Schema Definition**: `src/db/schema.ts` - Defines IndexedDB tables and indexes
- **Sync Queue**: Manages pending operations for server synchronization when online

### Core Modules

1. **Book Module** (`src/components/Book/`)
   - Calendar views (day, week, month)
   - Appointment creation and management
   - Smart staff assignment with conflict detection
   - Drag-and-drop rescheduling support

2. **Front Desk** (`src/components/frontdesk/`)
   - Ticket management system
   - Three view modes: Grid Normal, Grid Compact, Line View
   - Real-time status updates
   - Staff turn tracking

3. **Checkout System** (`src/components/checkout/`)
   - Payment processing
   - Multiple payment methods support
   - Receipt generation
   - Transaction history

### Key Architectural Patterns

1. **Offline-First Design**
   - All data operations work through IndexedDB first
   - Sync queue captures changes for later server sync
   - Optimistic UI updates for better user experience

2. **Component Organization**
   - `/components/common/` - Reusable UI components
   - `/components/shared/` - Shared business logic components
   - `/components/modules/` - Feature-specific modules
   - `/hooks/` - Custom React hooks for business logic

3. **Smart Features** (`src/utils/`)
   - `smartAutoAssign.ts` - Intelligent staff assignment based on availability and skills
   - `conflictDetection.ts` - Prevents double-booking
   - `bufferTimeUtils.ts` - Manages service buffer times
   - `clientHistoryAnalysis.ts` - Customer preference tracking

### Design System
The application uses Tailwind CSS with custom design tokens:
- `src/constants/designSystem.ts` - Core design system configuration
- `src/constants/bookDesignTokens.ts` - Book module specific styling
- `src/constants/premiumDesignTokens.ts` - Premium UI components styling

### Testing Strategy
- Unit tests use Vitest with React Testing Library
- Database operations tested with fake-indexeddb
- Component tests focus on user interactions
- Test files co-located with source files in `__tests__` folders

## Important Files and Locations

- **Entry Point**: `src/index.tsx`
- **App Router**: `src/App.tsx`
- **Redux Store**: `src/store/index.ts`
- **Database Operations**: `src/db/database.ts`
- **Type Definitions**: `src/types/` directory
- **API Layer**: `src/api/` (for future backend integration)
- **Utility Functions**: `src/utils/`

## Development Workflow

1. **Feature Development**
   - Create feature branch from main
   - Implement changes with TypeScript strict mode
   - Ensure IndexedDB operations are properly handled
   - Test offline functionality

2. **State Updates**
   - Always update Redux state first for UI consistency
   - Then persist to IndexedDB
   - Queue sync operations when needed

3. **Component Development**
   - Use TypeScript interfaces for all props
   - Implement proper loading and error states
   - Consider offline scenarios in all components

4. **Database Operations**
   - Use the database access layer in `src/db/database.ts`
   - Never access IndexedDB directly from components
   - Always handle async operations properly

## Current Implementation Status

**Completed Features:**
- Full IndexedDB integration with Dexie.js
- Redux state management with persistence
- Book module with calendar views
- Front desk ticket management
- Smart booking with conflict detection
- Multiple view modes for front desk
- Customer search and management

**In Progress:**
- Testing and QA improvements
- Edit appointment functionality
- Advanced status management

**Planned Features:**
- Backend API integration
- Real-time multi-device synchronization
- Advanced reporting and analytics