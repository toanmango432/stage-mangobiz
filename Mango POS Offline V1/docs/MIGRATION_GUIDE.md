# 🔄 Migration Guide

**Moving from Existing Codebase to Mango POS Offline V1**

---

## 📋 Overview

This guide helps you migrate your existing codebase to the new organized structure in `Mango POS Offline V1`.

---

## 🗺️ Migration Strategy

### Phase 1: Setup New Structure ✅
- [x] Create new folder structure
- [x] Set up configuration files
- [x] Create documentation

### Phase 2: Copy Core Files
- [ ] Copy database setup (`src/db/` → `client/src/core/db/`)
- [ ] Copy API client (`src/api/` → `client/src/core/api/`)
- [ ] Copy Redux store config (`src/store/index.ts` → `client/src/core/store/`)

### Phase 3: Organize by Feature
- [ ] Move appointments code to `features/appointments/`
- [ ] Move tickets code to `features/tickets/`
- [ ] Move staff code to `features/staff/`
- [ ] Move clients code to `features/clients/`
- [ ] Move transactions code to `features/transactions/`
- [ ] Move auth code to `features/auth/`
- [ ] Move sync code to `features/sync/`

### Phase 4: Organize Shared Code
- [ ] Move shared components to `shared/components/`
- [ ] Move shared hooks to `shared/hooks/`
- [ ] Move shared utilities to `shared/utils/`
- [ ] Move shared types to `shared/types/`

### Phase 5: Update Imports
- [ ] Update all import paths
- [ ] Update path aliases
- [ ] Fix TypeScript errors

### Phase 6: Test & Verify
- [ ] Test all features
- [ ] Verify offline functionality
- [ ] Verify sync functionality

---

## 📝 Step-by-Step Migration

### Step 1: Copy Configuration Files

```bash
# Copy configuration files
cp package.json "Mango POS Offline V1/client/package.json"
cp vite.config.ts "Mango POS Offline V1/client/"
cp tsconfig.json "Mango POS Offline V1/client/"
cp tailwind.config.js "Mango POS Offline V1/client/"
cp postcss.config.js "Mango POS Offline V1/client/"

# Copy public assets
cp -r public/* "Mango POS Offline V1/client/public/"
```

### Step 2: Copy Core Systems

#### Database (`src/db/` → `client/src/core/db/`)

```bash
# Copy database files
cp src/db/schema.ts "Mango POS Offline V1/client/src/core/db/"
cp src/db/database.ts "Mango POS Offline V1/client/src/core/db/"
cp src/db/seed.ts "Mango POS Offline V1/client/src/core/db/"
cp src/db/hooks.ts "Mango POS Offline V1/client/src/core/db/"
```

#### API Client (`src/api/` → `client/src/core/api/`)

```bash
# Copy API files
cp src/api/client.ts "Mango POS Offline V1/client/src/core/api/"
cp src/api/endpoints.ts "Mango POS Offline V1/client/src/core/api/"
cp src/api/socket.ts "Mango POS Offline V1/client/src/core/api/"
```

#### Redux Store (`src/store/` → `client/src/core/store/`)

```bash
# Copy store configuration
cp src/store/index.ts "Mango POS Offline V1/client/src/core/store/"
cp src/store/hooks.ts "Mango POS Offline V1/client/src/core/store/hooks.ts"
```

### Step 3: Organize Features

#### Appointments Feature

```bash
# Create directory
mkdir -p "Mango POS Offline V1/client/src/features/appointments/{components,hooks,store}"

# Copy Redux slice
cp src/store/slices/appointmentsSlice.ts "Mango POS Offline V1/client/src/features/appointments/store/"

# Copy components (from Book module)
cp -r src/components/Book/* "Mango POS Offline V1/client/src/features/appointments/components/"
cp -r src/components/calendar/* "Mango POS Offline V1/client/src/features/appointments/components/Calendar/"

# Copy hooks
cp src/hooks/useAppointmentCalendar.ts "Mango POS Offline V1/client/src/features/appointments/hooks/"

# Copy types
cp src/types/appointment.ts "Mango POS Offline V1/client/src/features/appointments/types.ts"
```

#### Tickets Feature

```bash
# Create directory
mkdir -p "Mango POS Offline V1/client/src/features/tickets/{components,hooks,store}"

# Copy Redux slices
cp src/store/slices/ticketsSlice.ts "Mango POS Offline V1/client/src/features/tickets/store/"
cp src/store/slices/uiTicketsSlice.ts "Mango POS Offline V1/client/src/features/tickets/store/uiSlice.ts"

# Copy components
cp src/components/Ticket*.tsx "Mango POS Offline V1/client/src/features/tickets/components/"
cp src/components/ServiceSection.tsx "Mango POS Offline V1/client/src/features/tickets/components/"
cp src/components/WaitListSection.tsx "Mango POS Offline V1/client/src/features/tickets/components/"
cp src/components/PendingTickets.tsx "Mango POS Offline V1/client/src/features/tickets/components/"
cp src/components/ClosedTickets.tsx "Mango POS Offline V1/client/src/features/tickets/components/"
cp -r src/components/TurnTracker/* "Mango POS Offline V1/client/src/features/tickets/components/TurnTracker/"
cp -r src/components/tickets/* "Mango POS Offline V1/client/src/features/tickets/components/"

# Copy hooks
cp src/hooks/useTicketsCompat.ts "Mango POS Offline V1/client/src/features/tickets/hooks/useTickets.ts"

# Copy types
cp src/types/Ticket.ts "Mango POS Offline V1/client/src/features/tickets/types.ts"
```

#### Staff Feature

```bash
# Create directory
mkdir -p "Mango POS Offline V1/client/src/features/staff/{components,hooks,store}"

# Copy Redux slices
cp src/store/slices/staffSlice.ts "Mango POS Offline V1/client/src/features/staff/store/"
cp src/store/slices/uiStaffSlice.ts "Mango POS Offline V1/client/src/features/staff/store/uiSlice.ts"

# Copy components
cp src/components/StaffCard.tsx "Mango POS Offline V1/client/src/features/staff/components/"
cp src/components/StaffSidebar.tsx "Mango POS Offline V1/client/src/features/staff/components/"
cp src/components/TeamSidebar.tsx "Mango POS Offline V1/client/src/features/staff/components/"
cp -r src/components/StaffManagement/* "Mango POS Offline V1/client/src/features/staff/components/StaffManagement/"

# Copy types
cp src/types/staff.ts "Mango POS Offline V1/client/src/features/staff/types.ts"
```

#### Continue for other features...

### Step 4: Organize Shared Code

```bash
# Shared components
mkdir -p "Mango POS Offline V1/client/src/shared/components"
cp src/components/ServiceCard.tsx "Mango POS Offline V1/client/src/shared/components/"
cp src/components/Toast.tsx "Mango POS Offline V1/client/src/shared/components/"
cp src/components/OfflineIndicator.tsx "Mango POS Offline V1/client/src/shared/components/"

# Shared hooks
mkdir -p "Mango POS Offline V1/client/src/shared/hooks"
cp src/hooks/useDebounce.ts "Mango POS Offline V1/client/src/shared/hooks/"
cp src/hooks/useSync.ts "Mango POS Offline V1/client/src/shared/hooks/"
cp src/hooks/useDragAndDrop.ts "Mango POS Offline V1/client/src/shared/hooks/"

# Shared utilities
mkdir -p "Mango POS Offline V1/client/src/shared/utils"
cp -r src/utils/* "Mango POS Offline V1/client/src/shared/utils/"
cp -r src/lib/* "Mango POS Offline V1/client/src/shared/utils/"

# Shared types
mkdir -p "Mango POS Offline V1/client/src/shared/types"
cp src/types/common.ts "Mango POS Offline V1/client/src/shared/types/"
cp src/types/sync.ts "Mango POS Offline V1/client/src/shared/types/"
cp src/types/service.ts "Mango POS Offline V1/client/src/shared/types/"
cp src/types/index.ts "Mango POS Offline V1/client/src/shared/types/"

# Shared constants
mkdir -p "Mango POS Offline V1/client/src/shared/constants"
cp -r src/constants/* "Mango POS Offline V1/client/src/shared/constants/"

# Layout components
mkdir -p "Mango POS Offline V1/client/src/shared/components/layout"
cp -r src/components/layout/* "Mango POS Offline V1/client/src/shared/components/layout/"
```

### Step 5: Copy Services

```bash
# Core services
mkdir -p "Mango POS Offline V1/client/src/core/services"
cp src/services/syncManager.ts "Mango POS Offline V1/client/src/core/services/"
cp src/services/syncService.ts "Mango POS Offline V1/client/src/core/services/"
```

### Step 6: Copy Entry Points

```bash
# Copy main files
cp src/index.tsx "Mango POS Offline V1/client/src/main.tsx"
cp src/App.tsx "Mango POS Offline V1/client/src/App.tsx"
cp src/index.css "Mango POS Offline V1/client/src/index.css"
cp index.html "Mango POS Offline V1/client/"
```

---

## 🔧 Update Imports

After copying files, update all imports:

### Old Import Pattern
```typescript
import { appointmentsDB } from '../db/database';
import { useAppDispatch } from '../hooks/redux';
import { Appointment } from '../types/appointment';
```

### New Import Pattern
```typescript
import { appointmentsDB } from '@/core/db';
import { useAppDispatch } from '@/core/store';
import { Appointment } from '@/features/appointments/types';
```

---

## ✅ Verification Steps

1. **Check File Structure**
   ```bash
   tree -L 3 "Mango POS Offline V1/client/src"
   ```

2. **Install Dependencies**
   ```bash
   cd "Mango POS Offline V1/client"
   npm install
   ```

3. **Type Check**
   ```bash
   npm run type-check
   ```

4. **Build**
   ```bash
   npm run build
   ```

5. **Test**
   ```bash
   npm run test
   ```

---

## 🚨 Common Issues

### Issue: Module Not Found

**Solution:** Check import paths match new structure

### Issue: Type Errors

**Solution:** Update type imports to use new paths

### Issue: Redux Store Errors

**Solution:** Update store imports and ensure all slices are added

---

## 📚 Next Steps

After migration:
1. Update all imports
2. Test all features
3. Update documentation
4. Commit changes

---

**Migration Complete! 🎉**

