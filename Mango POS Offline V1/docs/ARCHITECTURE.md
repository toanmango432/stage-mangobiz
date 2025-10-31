# 🏗️ Architecture Overview

Complete architecture documentation for Mango POS Offline V1.

---

## 🎯 Design Principles

1. **Offline-First** - All operations work without internet
2. **Progressive Enhancement** - Basic features offline, enhanced features online
3. **Feature-Based Organization** - Self-contained feature modules
4. **Type Safety** - Full TypeScript coverage
5. **Separation of Concerns** - Clear boundaries between layers

---

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT APPLICATION                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Features   │  │   Features   │  │   Features   │     │
│  │ (Appointments)│  │  (Tickets)   │  │   (Staff)    │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                  │               │
│         └─────────────────┼──────────────────┘              │
│                           │                                   │
│                  ┌────────▼────────┐                        │
│                  │  Shared Layer    │                        │
│                  │  (Components,    │                        │
│                  │   Hooks, Utils)  │                        │
│                  └────────┬────────┘                        │
│                           │                                   │
│         ┌─────────────────┼─────────────────┐               │
│         │                 │                 │                │
│  ┌──────▼──────┐  ┌───────▼──────┐  ┌──────▼──────┐       │
│  │   Redux     │  │   IndexedDB   │  │  API Client │       │
│  │   Store     │  │    (Dexie)    │  │   (Axios)   │       │
│  └─────────────┘  └───────────────┘  └─────────────┘       │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Sync Manager (Offline/Online)              │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└───────────────────────────┬───────────────────────────────────┘
                            │
                            │ HTTP/WebSocket
                            │
┌───────────────────────────▼───────────────────────────────────┐
│                    SERVER APPLICATION                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  API Routes  │  │  API Routes  │  │  API Routes  │     │
│  │  (REST)      │  │  (REST)      │  │  (WebSocket) │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                  │               │
│         └─────────────────┼──────────────────┘              │
│                           │                                   │
│                  ┌────────▼────────┐                        │
│                  │  Service Layer  │                        │
│                  │  (Business      │                        │
│                  │   Logic)        │                        │
│                  └────────┬────────┘                        │
│                           │                                   │
│                  ┌────────▼────────┐                        │
│                  │   Data Layer    │                        │
│                  │   (Prisma ORM)  │                        │
│                  └────────┬────────┘                        │
│                           │                                   │
│                  ┌────────▼────────┐                        │
│                  │   PostgreSQL    │                        │
│                  │   / SQL Server  │                        │
│                  └─────────────────┘                        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Folder Structure Deep Dive

### Client Structure

```
client/
├── src/
│   ├── features/              # Feature modules
│   │   ├── appointments/      # Appointment booking
│   │   │   ├── components/    # Feature-specific components
│   │   │   ├── hooks/         # Feature-specific hooks
│   │   │   ├── store/         # Feature Redux slice
│   │   │   ├── types.ts       # Feature types
│   │   │   └── index.ts       # Public exports
│   │   │
│   │   ├── tickets/           # Ticket management
│   │   ├── staff/             # Staff management
│   │   └── ...
│   │
│   ├── shared/                # Shared code
│   │   ├── components/        # Reusable UI components
│   │   ├── hooks/             # Reusable React hooks
│   │   ├── utils/             # Utility functions
│   │   ├── types/             # Shared TypeScript types
│   │   ├── constants/         # App constants
│   │   └── services/          # Shared services
│   │
│   ├── core/                  # Core systems
│   │   ├── store/            # Redux store config
│   │   ├── db/               # IndexedDB setup
│   │   ├── api/              # API client config
│   │   └── config/           # App configuration
│   │
│   ├── App.tsx               # Root component
│   └── main.tsx              # Entry point
│
├── public/                   # Static assets
└── tests/                    # Test files
```

### Server Structure

```
server/
├── src/
│   ├── api/                  # API routes
│   │   ├── appointments/     # Appointment routes
│   │   ├── tickets/          # Ticket routes
│   │   └── ...
│   │
│   ├── services/             # Business logic
│   │   ├── appointmentService.ts
│   │   ├── ticketService.ts
│   │   └── syncService.ts
│   │
│   ├── models/               # Data models
│   │   └── index.ts
│   │
│   ├── middleware/           # Express middleware
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── validation.ts
│   │
│   ├── utils/                # Server utilities
│   └── config/               # Server config
│
├── prisma/                    # Database schema
│   └── schema.prisma
│
└── tests/                    # Test files
```

---

## 🔄 Data Flow

### 1. User Action (Create Appointment)

```
User clicks "Create Appointment"
    ↓
Component dispatches Redux action
    ↓
Redux Thunk executes:
    1. Save to IndexedDB (immediate)
    2. Update Redux state (optimistic)
    3. Add to sync queue
    ↓
If online:
    Sync Manager → API → Server → Database
    ↓
Update IndexedDB with server response
    ↓
Update Redux state
    ↓
UI re-renders
```

### 2. Offline Operation

```
User creates appointment (offline)
    ↓
Save to IndexedDB
    ↓
Update Redux state
    ↓
Add to sync queue (priority: 3)
    ↓
UI shows "pending sync" indicator
    ↓
When online:
    Sync Manager processes queue
    ↓
Push to server
    ↓
Update status to "synced"
```

### 3. Real-Time Sync

```
Device A: Creates appointment
    ↓
Saves to IndexedDB
    ↓
Syncs to server
    ↓
Server broadcasts via WebSocket
    ↓
Device B: Receives update
    ↓
Updates IndexedDB
    ↓
Updates Redux state
    ↓
UI updates automatically
```

---

## 💾 Storage Strategy

### IndexedDB (Client-Side)

- **Purpose:** Offline storage, fast access
- **Tables:**
  - appointments
  - tickets
  - transactions
  - staff
  - clients
  - services
  - settings
  - syncQueue
- **Library:** Dexie.js

### PostgreSQL/SQL Server (Server-Side)

- **Purpose:** Centralized data storage, backup
- **ORM:** Prisma
- **Sync:** Periodic sync with IndexedDB

---

## 🔐 Authentication Flow

```
User Login
    ↓
API validates credentials
    ↓
Server returns JWT tokens
    ↓
Store in IndexedDB (secure storage)
    ↓
Add to API client headers
    ↓
Token refresh on expiry
    ↓
Logout clears tokens
```

---

## 🔄 Sync Strategy

### Priority System

1. **Priority 1:** Payments/Transactions (highest)
2. **Priority 2:** Tickets
3. **Priority 3:** Appointments
4. **Priority 4:** Other entities

### Conflict Resolution

- **Last-Write-Wins (LWW)** for most entities
- **Server-Wins** for financial transactions
- **Manual Resolution** for critical conflicts

### Sync Queue

- Stores pending operations
- Retries failed operations
- Tracks sync status
- Provides sync history

---

## 🧪 Testing Strategy

### Unit Tests
- Individual functions/components
- Redux reducers/selectors
- Utility functions

### Integration Tests
- Feature workflows
- API endpoints
- Database operations

### E2E Tests
- Complete user flows
- Cross-browser testing
- Offline scenarios

---

## 📊 Performance Considerations

### Frontend
- Code splitting by feature
- Lazy loading routes
- Memoization of expensive operations
- Virtual scrolling for large lists
- Image optimization

### Backend
- Database indexing
- Query optimization
- Caching (Redis)
- Rate limiting
- Connection pooling

---

## 🔒 Security

- JWT authentication
- HTTPS in production
- Input validation
- SQL injection prevention (Prisma)
- XSS protection
- CORS configuration
- Rate limiting

---

## 📈 Scalability

### Horizontal Scaling
- Stateless server design
- Load balancing
- Database replication
- CDN for static assets

### Vertical Scaling
- Database optimization
- Caching layer
- Background job processing

---

## 🛠️ Development Tools

- **TypeScript** - Type safety
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Vitest** - Testing
- **Husky** - Git hooks
- **Conventional Commits** - Commit messages

---

**This architecture supports:**
- ✅ Offline-first operations
- ✅ Multi-device coordination
- ✅ Real-time updates
- ✅ Scalable growth
- ✅ Maintainable codebase

