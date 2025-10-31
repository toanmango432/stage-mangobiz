# 📁 Project Structure

**Complete overview of Mango POS Offline V1 structure**

---

## 🗂️ Directory Tree

```
Mango POS Offline V1/
│
├── client/                      # Frontend React Application
│   ├── src/
│   │   ├── features/           # Feature modules (domain-driven)
│   │   │   ├── appointments/   # Appointment booking & management
│   │   │   ├── tickets/        # Service ticket operations
│   │   │   ├── staff/          # Staff management
│   │   │   ├── clients/       # Client database
│   │   │   ├── transactions/   # Payment processing
│   │   │   ├── auth/           # Authentication
│   │   │   ├── sync/           # Sync management UI
│   │   │   ├── book/           # Calendar module
│   │   │   └── checkout/       # Checkout module
│   │   │
│   │   ├── shared/             # Shared/reusable code
│   │   │   ├── components/     # Reusable UI components
│   │   │   ├── hooks/          # Reusable React hooks
│   │   │   ├── utils/          # Utility functions
│   │   │   ├── types/          # Shared TypeScript types
│   │   │   ├── constants/      # App constants
│   │   │   └── services/       # Shared services
│   │   │
│   │   ├── core/               # Core systems/infrastructure
│   │   │   ├── store/          # Redux store configuration
│   │   │   ├── db/             # IndexedDB setup (Dexie)
│   │   │   ├── api/            # API client (Axios)
│   │   │   └── config/         # App configuration
│   │   │
│   │   ├── App.tsx             # Root component
│   │   └── main.tsx            # Entry point
│   │
│   ├── public/                 # Static assets
│   ├── tests/                  # Frontend tests
│   ├── .env                    # Environment variables
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── server/                     # Backend Node.js API
│   ├── src/
│   │   ├── api/                # API routes
│   │   │   ├── appointments/   # Appointment routes
│   │   │   ├── tickets/        # Ticket routes
│   │   │   ├── staff/          # Staff routes
│   │   │   ├── clients/        # Client routes
│   │   │   ├── transactions/   # Transaction routes
│   │   │   ├── auth/           # Authentication routes
│   │   │   └── sync/           # Sync routes
│   │   │
│   │   ├── services/           # Business logic
│   │   │   ├── appointmentService.ts
│   │   │   ├── ticketService.ts
│   │   │   ├── staffService.ts
│   │   │   └── syncService.ts
│   │   │
│   │   ├── models/             # Data models
│   │   ├── middleware/         # Express middleware
│   │   ├── utils/              # Server utilities
│   │   ├── config/             # Server configuration
│   │   └── index.ts             # Entry point
│   │
│   ├── prisma/                  # Database schema
│   │   └── schema.prisma
│   │
│   ├── tests/                   # Backend tests
│   ├── .env                     # Environment variables
│   ├── package.json
│   └── tsconfig.json
│
├── shared/                      # Shared code (if using monorepo)
│   ├── types/                   # Shared TypeScript types
│   ├── utils/                   # Shared utility functions
│   └── constants/              # Shared constants
│
├── docs/                        # Documentation
│   ├── GETTING_STARTED.md       # Initial setup guide
│   ├── SETUP_INSTRUCTIONS.md    # Complete setup instructions
│   ├── ARCHITECTURE.md          # System architecture
│   ├── DEVELOPMENT.md           # Development guide
│   ├── CODE_ORGANIZATION.md     # Code organization guide
│   └── MIGRATION_GUIDE.md      # Migration instructions
│
├── config/                       # Configuration files
└── scripts/                      # Build/deployment scripts
│
├── README.md                     # Main README
├── MIGRATION_INSTRUCTIONS.md     # Quick migration guide
└── PROJECT_STRUCTURE.md          # This file
```

---

## 📦 Package Structure

### Client (`client/`)

**Features** - Each feature is self-contained:
- Components specific to that feature
- Hooks specific to that feature
- Redux slice for that feature
- Types for that feature
- Services for that feature (optional)

**Shared** - Reusable across features:
- Common UI components
- Shared React hooks
- Utility functions
- Shared types
- App constants
- Shared services

**Core** - Infrastructure:
- Redux store configuration
- IndexedDB setup
- API client configuration
- App configuration

### Server (`server/`)

**API Routes** - REST endpoints:
- Resource-based routing
- Request validation
- Response formatting

**Services** - Business logic:
- Domain logic
- Database operations
- External API calls

**Models** - Data models:
- TypeScript interfaces
- Validation schemas

**Middleware** - Express middleware:
- Authentication
- Error handling
- Validation
- Rate limiting

---

## 🎯 Key Files

### Client Entry Points

- `client/src/main.tsx` - Application entry point
- `client/src/App.tsx` - Root component

### Server Entry Points

- `server/src/index.ts` - Server entry point

### Configuration

- `client/.env` - Client environment variables
- `server/.env` - Server environment variables
- `client/vite.config.ts` - Vite configuration
- `client/tsconfig.json` - TypeScript configuration
- `client/tailwind.config.js` - Tailwind CSS configuration

### Documentation

- `README.md` - Main project README
- `docs/GETTING_STARTED.md` - Setup guide
- `docs/ARCHITECTURE.md` - Architecture overview
- `docs/DEVELOPMENT.md` - Development guide

---

## 🔄 Data Flow

```
User Action
    ↓
Feature Component
    ↓
Redux Action/Thunk
    ↓
┌──────────────┬──────────────┐
│  IndexedDB   │   API Client │
│  (Local)     │   (Server)    │
└──────┬───────┴──────┬───────┘
       │              │
       └──────┬───────┘
              │
         Sync Manager
              │
         Update Redux
              │
         UI Re-render
```

---

## 📝 Naming Conventions

### Files
- **Components:** PascalCase (`AppointmentCard.tsx`)
- **Hooks:** camelCase with `use` prefix (`useAppointments.ts`)
- **Utils:** camelCase (`formatDate.ts`)
- **Types:** PascalCase (`Appointment.ts`)
- **Constants:** UPPER_SNAKE_CASE (`API_BASE_URL`)

### Directories
- **Features:** lowercase (`appointments/`)
- **Components:** PascalCase (`AppointmentCard/`)
- **Hooks:** camelCase (`useAppointments/`)

---

## 🎨 Feature Template

Each feature should follow this structure:

```
features/[feature-name]/
├── components/              # Feature components
│   ├── [ComponentName]/
│   │   ├── [ComponentName].tsx
│   │   └── index.ts
│   └── index.ts
│
├── hooks/                   # Feature hooks
│   ├── use[Feature]Hook.ts
│   └── index.ts
│
├── store/                   # Redux slice
│   ├── [feature]Slice.ts
│   └── index.ts
│
├── services/                # Feature services (optional)
│   └── [feature]Service.ts
│
├── types.ts                 # Feature types
├── constants.ts             # Feature constants (optional)
├── utils.ts                 # Feature utilities (optional)
├── index.ts                 # Public exports
└── README.md                # Feature documentation
```

---

## ✅ Organization Checklist

When creating a feature:

- [ ] Create feature directory
- [ ] Add components directory
- [ ] Add hooks directory
- [ ] Add store directory (if using Redux)
- [ ] Add types.ts file
- [ ] Add index.ts for exports
- [ ] Add README.md for documentation
- [ ] Update feature exports
- [ ] Update Redux store (if needed)
- [ ] Update routing (if needed)

---

**This structure supports:**
- ✅ Feature-based organization
- ✅ Code reusability
- ✅ Clear separation of concerns
- ✅ Scalable architecture
- ✅ Easy navigation
- ✅ Maintainable codebase

---

**Follow this structure for organized, maintainable code! 🎉**

