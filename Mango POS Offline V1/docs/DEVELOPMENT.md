# 🛠️ Development Guide

Complete guide for developing features in Mango POS Offline V1.

---

## 📋 Development Workflow

### 1. Feature Development

#### Creating a New Feature

1. **Create Feature Directory**
   ```bash
   mkdir -p client/src/features/[feature-name]/{components,hooks,store,types}
   ```

2. **Create Feature Structure**
   ```
   features/[feature-name]/
   ├── components/      # Feature-specific components
   ├── hooks/           # Feature-specific hooks
   ├── store/           # Redux slice (if needed)
   ├── types.ts         # Feature types
   ├── index.ts         # Public exports
   └── README.md        # Feature documentation
   ```

3. **Update Shared Types**
   - Add types to `shared/types/` if reusable
   - Update `shared/types/index.ts`

4. **Create Redux Slice** (if needed)
   - Create in `features/[feature-name]/store/`
   - Export from feature index
   - Add to root store in `core/store/`

#### Example: Creating Appointment Feature

```typescript
// client/src/features/appointments/types.ts
export interface Appointment {
  id: string;
  clientId: string;
  staffId: string;
  // ... other fields
}

// client/src/features/appointments/store/appointmentsSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { appointmentsDB } from '../../../core/db';

const appointmentsSlice = createSlice({
  name: 'appointments',
  initialState: { items: [], loading: false },
  reducers: {},
  extraReducers: (builder) => {
    // ... async thunks
  },
});

export default appointmentsSlice.reducer;

// client/src/features/appointments/components/AppointmentList.tsx
export function AppointmentList() {
  // Component implementation
}

// client/src/features/appointments/index.ts
export * from './components';
export * from './hooks';
export * from './types';
export { default as appointmentsReducer } from './store/appointmentsSlice';
```

---

## 🎨 Component Development

### Component Structure

```typescript
// Example component
import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/core/store';
import type { Appointment } from '../types';

interface AppointmentCardProps {
  appointment: Appointment;
  onEdit?: (id: string) => void;
}

export function AppointmentCard({ appointment, onEdit }: AppointmentCardProps) {
  const dispatch = useAppDispatch();
  
  // Component logic
  
  return (
    <div className="appointment-card">
      {/* JSX */}
    </div>
  );
}
```

### Component Guidelines

1. **Use TypeScript** - All components should be typed
2. **Use Shared Components** - Leverage components from `shared/components/`
3. **Keep Components Small** - Single responsibility
4. **Use Hooks** - Extract logic to custom hooks
5. **Memoization** - Use `React.memo` for expensive renders
6. **Error Boundaries** - Wrap feature components

---

## 🔄 State Management

### Redux Toolkit Patterns

#### Creating a Slice

```typescript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { appointmentsDB } from '@/core/db';

// Async thunk
export const fetchAppointments = createAsyncThunk(
  'appointments/fetch',
  async (salonId: string) => {
    return await appointmentsDB.getAll(salonId);
  }
);

// Slice
const appointmentsSlice = createSlice({
  name: 'appointments',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    // Synchronous reducers
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAppointments.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAppointments.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.error = action.error.message;
        state.loading = false;
      });
  },
});

export default appointmentsSlice.reducer;
```

### Using Redux in Components

```typescript
import { useAppDispatch, useAppSelector } from '@/core/store';
import { fetchAppointments } from '../store/appointmentsSlice';

function AppointmentsList() {
  const dispatch = useAppDispatch();
  const { items, loading } = useAppSelector((state) => state.appointments);
  
  useEffect(() => {
    dispatch(fetchAppointments(salonId));
  }, [dispatch, salonId]);
  
  // Component render
}
```

---

## 💾 Database Operations

### IndexedDB (Client-Side)

#### Using Database Helpers

```typescript
import { appointmentsDB } from '@/core/db';

// Create
const appointment = await appointmentsDB.create(input, userId, salonId);

// Read
const appointments = await appointmentsDB.getAll(salonId);
const appointment = await appointmentsDB.getById(id);

// Update
const updated = await appointmentsDB.update(id, updates, userId);

// Delete
await appointmentsDB.delete(id);
```

#### Adding to Sync Queue

```typescript
import { syncQueueDB } from '@/core/db';
import { syncManager } from '@/core/services/syncManager';

// When creating/updating
await appointmentsDB.create(appointment, userId, salonId);

// Add to sync queue
await syncQueueDB.add({
  entity: 'appointment',
  action: 'CREATE',
  entityId: appointment.id,
  data: appointment,
  priority: 3, // 1=highest, 3=lowest
});

// Trigger sync if online
if (navigator.onLine) {
  syncManager.syncNow();
}
```

---

## 🌐 API Integration

### Using API Client

```typescript
import { appointmentsAPI } from '@/core/api';

// Fetch appointments
const appointments = await appointmentsAPI.getAll(salonId, date);

// Create appointment
const newAppointment = await appointmentsAPI.create(appointmentData);

// Update appointment
const updated = await appointmentsAPI.update(id, updates);

// Delete appointment
await appointmentsAPI.delete(id);
```

### Error Handling

```typescript
try {
  const result = await appointmentsAPI.create(data);
} catch (error) {
  if (error.isNetworkError) {
    // Handle offline scenario
    // Save to IndexedDB and sync queue
  } else {
    // Handle API error
    console.error('API Error:', error);
  }
}
```

---

## 🔌 Real-Time Sync

### Using Socket.io

```typescript
import { socket } from '@/core/api/socket';

// Listen for updates
socket.on('appointment:updated', (appointment) => {
  // Update local database
  appointmentsDB.update(appointment.id, appointment, appointment.lastModifiedBy);
  
  // Update Redux state
  dispatch(updateAppointment(appointment));
});

// Emit events
socket.emit('appointment:create', appointmentData);
```

---

## 🧪 Testing

### Component Tests

```typescript
import { render, screen } from '@testing-library/react';
import { AppointmentCard } from './AppointmentCard';

describe('AppointmentCard', () => {
  it('renders appointment details', () => {
    const appointment = {
      id: '1',
      clientName: 'John Doe',
      // ... other fields
    };
    
    render(<AppointmentCard appointment={appointment} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

### Redux Tests

```typescript
import { configureStore } from '@reduxjs/toolkit';
import appointmentsReducer from './appointmentsSlice';

describe('appointmentsSlice', () => {
  it('fetches appointments', async () => {
    const store = configureStore({
      reducer: { appointments: appointmentsReducer },
    });
    
    await store.dispatch(fetchAppointments(salonId));
    
    const state = store.getState().appointments;
    expect(state.items).toHaveLength(5);
  });
});
```

---

## 📝 Code Style

### TypeScript Guidelines

1. **Always Type** - No `any` types
2. **Use Interfaces** - For object shapes
3. **Use Types** - For unions, intersections
4. **Export Types** - Export all public types
5. **Use Enums** - For fixed sets of values

### Naming Conventions

- **Components:** PascalCase (`AppointmentCard`)
- **Hooks:** camelCase with `use` prefix (`useAppointments`)
- **Utils:** camelCase (`formatDate`)
- **Types:** PascalCase (`Appointment`)
- **Constants:** UPPER_SNAKE_CASE (`API_BASE_URL`)

---

## 🐛 Debugging

### Redux DevTools

1. Install Redux DevTools browser extension
2. Store automatically configured
3. View state and actions in real-time

### IndexedDB Inspection

1. Open Chrome DevTools
2. Go to Application tab
3. Navigate to IndexedDB
4. View database tables and data

### Network Inspection

1. Check Network tab for API calls
2. View WebSocket connections in Network tab
3. Check sync queue in Application tab

---

## ✅ Best Practices

1. **Offline-First** - Always save to IndexedDB first
2. **Optimistic Updates** - Update UI immediately
3. **Error Handling** - Handle all error cases
4. **Loading States** - Show loading indicators
5. **Type Safety** - Use TypeScript strictly
6. **Code Reuse** - Use shared components/hooks
7. **Testing** - Write tests for critical paths
8. **Documentation** - Document complex logic

---

## 📚 Resources

- [React Documentation](https://react.dev/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [Dexie.js](https://dexie.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Happy Coding! 🎉**

