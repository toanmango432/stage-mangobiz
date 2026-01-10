# React Frontend Best Practices Reference

A concise reference guide for building modern React applications with Vite, TypeScript, and Tailwind CSS.

> **Mango POS Note:** This project uses **Redux Toolkit** for state management and **dataService** for data operations. See `src/store/` for Redux patterns and `src/services/dataService.ts` for data access.

---

## Table of Contents

1. [Component Design](#1-component-design)
2. [State Management (Redux)](#2-state-management-redux)
3. [Data Fetching (dataService)](#3-data-fetching-dataservice)
4. [Forms & Validation](#4-forms--validation)
5. [Styling with Tailwind](#5-styling-with-tailwind)
6. [Performance](#6-performance)
7. [Hooks Patterns](#7-hooks-patterns)
8. [Error Handling](#8-error-handling)
9. [Testing](#9-testing)
10. [Accessibility](#10-accessibility)
11. [Anti-Patterns](#11-anti-patterns)

---

## 1. Component Design

### Functional Components with TypeScript

```tsx
// Define props interface
interface HabitCardProps {
  habit: Habit;
  onComplete: (id: string) => void;
  showStreak?: boolean;
}

// Simple component
function HabitCard({ habit, onComplete, showStreak = true }: HabitCardProps) {
  return (
    <div className="p-4 border rounded">
      <h3>{habit.name}</h3>
      {showStreak && <span>Streak: {habit.streak}</span>}
      <button onClick={() => onComplete(habit.id)}>Complete</button>
    </div>
  );
}
```

### Component Composition

```tsx
// Compound components pattern
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

function Card({ children, className }: CardProps) {
  return <div className={`border rounded ${className}`}>{children}</div>;
}

Card.Header = function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="p-4 border-b font-bold">{children}</div>;
};

Card.Body = function CardBody({ children }: { children: React.ReactNode }) {
  return <div className="p-4">{children}</div>;
};

// Usage
<Card>
  <Card.Header>Ticket Details</Card.Header>
  <Card.Body>Content here</Card.Body>
</Card>
```

### Props Design

```tsx
// Prefer specific props over spreading
// Good
interface ButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
}

function Button({ onClick, disabled, children, variant = 'primary' }: ButtonProps) {
  return <button onClick={onClick} disabled={disabled}>{children}</button>;
}

// Accept className for styling flexibility
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

function Card({ children, className = '' }: CardProps) {
  return <div className={`base-styles ${className}`}>{children}</div>;
}
```

---

## 2. State Management (Redux)

### Mango POS uses Redux Toolkit

| State Type | Solution |
|------------|----------|
| Server/async data | Redux Toolkit + dataService |
| Form state | react-hook-form or useState |
| Local UI state | useState |
| Global UI state | Redux slices |

### Redux Slice Pattern

```typescript
// store/slices/appointmentsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { dataService } from '@/services/dataService';
import type { Appointment } from '@/types';

interface AppointmentsState {
  items: Appointment[];
  loading: boolean;
  error: string | null;
}

const initialState: AppointmentsState = {
  items: [],
  loading: false,
  error: null,
};

// Async thunk
export const fetchAppointments = createAsyncThunk(
  'appointments/fetch',
  async (date: string) => {
    const rows = await dataService.appointments.getByDate(date);
    return toAppointments(rows); // Use adapter
  }
);

const appointmentsSlice = createSlice({
  name: 'appointments',
  initialState,
  reducers: {
    setAppointments: (state, action: PayloadAction<Appointment[]>) => {
      state.items = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAppointments.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAppointments.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch';
      });
  },
});
```

### Using Redux in Components

```tsx
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchAppointments } from '@/store/slices/appointmentsSlice';

function AppointmentList({ date }: { date: string }) {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector(state => state.appointments);

  useEffect(() => {
    dispatch(fetchAppointments(date));
  }, [dispatch, date]);

  if (loading) return <Spinner />;
  if (error) return <Error message={error} />;

  return (
    <ul>
      {items.map(apt => <AppointmentCard key={apt.id} appointment={apt} />)}
    </ul>
  );
}
```

### Selectors

```typescript
// store/selectors/appointmentSelectors.ts
import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/store';

export const selectAppointments = (state: RootState) => state.appointments.items;

export const selectTodayAppointments = createSelector(
  [selectAppointments],
  (appointments) => appointments.filter(apt => isToday(apt.date))
);

export const selectAppointmentsByStaff = createSelector(
  [selectAppointments, (_, staffId: string) => staffId],
  (appointments, staffId) => appointments.filter(apt => apt.staffId === staffId)
);
```

---

## 3. Data Fetching (dataService)

### Mango POS Data Flow

```
Component → Redux Thunk → dataService → Supabase/IndexedDB
                              ↓
                         Type Adapters (snake_case → camelCase)
```

### dataService Pattern

```typescript
// Always use dataService, never direct Supabase/IndexedDB calls
import { dataService } from '@/services/dataService';
import { toAppointments } from '@/services/supabase/adapters';

// In Redux thunk
export const fetchAppointments = createAsyncThunk(
  'appointments/fetch',
  async (date: string) => {
    const rows = await dataService.appointments.getByDate(date);
    return toAppointments(rows);
  }
);

// Create
export const createAppointment = createAsyncThunk(
  'appointments/create',
  async (data: AppointmentCreate) => {
    const row = await dataService.appointments.create(data);
    return toAppointment(row);
  }
);
```

### Type Adapters

```typescript
// services/supabase/adapters/appointmentAdapter.ts
import type { AppointmentRow } from '../types';
import type { Appointment } from '@/types';

export function toAppointment(row: AppointmentRow): Appointment {
  return {
    id: row.id,
    clientId: row.client_id,      // snake_case → camelCase
    staffId: row.staff_id,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
    createdAt: row.created_at,
  };
}

export function toAppointments(rows: AppointmentRow[]): Appointment[] {
  return rows.map(toAppointment);
}

export function toAppointmentRow(apt: Partial<Appointment>): Partial<AppointmentRow> {
  return {
    client_id: apt.clientId,      // camelCase → snake_case
    staff_id: apt.staffId,
    start_time: apt.startTime,
    end_time: apt.endTime,
    status: apt.status,
  };
}
```

---

## 4. Forms & Validation

### React Hook Form + Zod

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const clientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
});

type ClientFormData = z.infer<typeof clientSchema>;

function ClientForm({ onSubmit, defaultValues }: ClientFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues,
  });

  const handleFormSubmit = async (data: ClientFormData) => {
    await onSubmit(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <div>
        <label htmlFor="firstName">First Name</label>
        <input
          id="firstName"
          {...register('firstName')}
          className={errors.firstName ? 'border-red-500' : ''}
        />
        {errors.firstName && (
          <span className="text-red-500">{errors.firstName.message}</span>
        )}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}
```

---

## 5. Styling with Tailwind

### Use Design System Tokens

```tsx
// Always import from design-system
import { brand, colors } from '@/design-system';
import { bookTokens } from '@/design-system/modules/book';

// Component with design tokens
function BookingCard({ booking }: { booking: Booking }) {
  return (
    <div
      className="p-4 rounded-lg"
      style={{ backgroundColor: bookTokens.cardBackground }}
    >
      {booking.title}
    </div>
  );
}
```

### Conditional Classes with clsx

```tsx
import clsx from 'clsx';

function TicketCard({ ticket, isSelected }: TicketCardProps) {
  return (
    <div className={clsx(
      'p-4 border rounded transition-colors',
      isSelected && 'bg-primary-50 border-primary-500',
      !isSelected && 'bg-white border-gray-200 hover:border-gray-300'
    )}>
      {ticket.clientName}
    </div>
  );
}
```

### Responsive Design

```tsx
// Mobile-first approach
<div className="
  p-2 md:p-4 lg:p-6
  grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4
  text-sm md:text-base
">
  {/* Content */}
</div>

// Breakpoints: sm(640px) md(768px) lg(1024px) xl(1280px) 2xl(1536px)
```

---

## 6. Performance

### React.memo

```tsx
// Only re-renders when props change
const AppointmentCard = memo(function AppointmentCard({
  appointment,
  onSelect
}: AppointmentCardProps) {
  return (
    <div onClick={() => onSelect(appointment.id)}>
      <h3>{appointment.clientName}</h3>
      <span>{appointment.time}</span>
    </div>
  );
});
```

### useCallback and useMemo

```tsx
function AppointmentList({ appointments }: { appointments: Appointment[] }) {
  // Memoize callback passed to children
  const handleSelect = useCallback((id: string) => {
    dispatch(selectAppointment(id));
  }, [dispatch]);

  // Memoize expensive calculations
  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) =>
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }, [appointments]);

  return sortedAppointments.map(apt => (
    <AppointmentCard key={apt.id} appointment={apt} onSelect={handleSelect} />
  ));
}
```

### Code Splitting

```tsx
import { lazy, Suspense } from 'react';

// Lazy load routes
const Settings = lazy(() => import('./pages/Settings'));
const Analytics = lazy(() => import('./pages/Analytics'));

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </Suspense>
  );
}
```

---

## 7. Hooks Patterns

### Custom Hooks

```typescript
// useDebounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// useToggle
function useToggle(initialValue = false): [boolean, () => void] {
  const [value, setValue] = useState(initialValue);
  const toggle = useCallback(() => setValue(v => !v), []);
  return [value, toggle];
}

// useLocalStorage
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
```

### useEffect Best Practices

```tsx
// Always cleanup
useEffect(() => {
  const controller = new AbortController();

  fetchData({ signal: controller.signal })
    .then(setData)
    .catch(err => {
      if (err.name !== 'AbortError') setError(err);
    });

  return () => controller.abort();
}, []);

// Event listeners
useEffect(() => {
  const handleResize = () => setWidth(window.innerWidth);
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

---

## 8. Error Handling

### Error Boundaries

```tsx
class ErrorBoundary extends Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorPage />;
    }
    return this.props.children;
  }
}

// Usage
<ErrorBoundary fallback={<ErrorPage />}>
  <App />
</ErrorBoundary>
```

### Loading/Error States

```tsx
function AppointmentList() {
  const { items, loading, error } = useAppSelector(state => state.appointments);

  if (loading) return <Spinner />;

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded">
        <p>Failed to load: {error}</p>
        <button onClick={() => dispatch(fetchAppointments())}>Retry</button>
      </div>
    );
  }

  return <ul>{items.map(/* ... */)}</ul>;
}
```

---

## 9. Testing

### Component Testing with Vitest

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Test wrapper with Redux
function renderWithStore(ui: React.ReactElement, preloadedState = {}) {
  const store = configureStore({
    reducer: rootReducer,
    preloadedState,
  });

  return render(
    <Provider store={store}>
      {ui}
    </Provider>
  );
}

describe('AppointmentCard', () => {
  it('renders appointment details', () => {
    const appointment = { id: '1', clientName: 'John Doe', time: '10:00 AM' };
    render(<AppointmentCard appointment={appointment} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('10:00 AM')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', async () => {
    const onSelect = vi.fn();
    const appointment = { id: '1', clientName: 'John Doe' };

    render(<AppointmentCard appointment={appointment} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button'));

    expect(onSelect).toHaveBeenCalledWith('1');
  });
});
```

---

## 10. Accessibility

### Semantic HTML & ARIA

```tsx
// Use semantic elements
<header>...</header>
<nav>...</nav>
<main>...</main>

// ARIA labels
<button aria-label="Close modal">×</button>

// Live regions
<div aria-live="polite">{statusMessage}</div>

// States
<button aria-pressed={isCompleted}>Complete</button>
<button aria-expanded={isOpen}>Menu</button>
```

### Keyboard Navigation

```tsx
function ListItem({ onSelect }: { onSelect: () => void }) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
    >
      Item
    </div>
  );
}
```

---

## 11. Anti-Patterns

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| Direct Supabase calls | Bypasses dataService | Use `dataService.table.method()` |
| Props drilling | Hard to maintain | Redux or Context |
| useEffect for derived state | Unnecessary renders | Compute during render |
| Index as key | Bugs with reordering | Use stable unique IDs |
| Inline styles | Inconsistent styling | Use design-system tokens |

### Code Examples

```tsx
// BAD: Derived state in useEffect
const [fullName, setFullName] = useState('');
useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);

// GOOD: Compute during render
const fullName = `${firstName} ${lastName}`;

// BAD: Direct Supabase call
const { data } = await supabase.from('clients').select('*');

// GOOD: Use dataService
const data = await dataService.clients.getAll();

// BAD: Hardcoded colors
<div style={{ color: '#10B981' }}>

// GOOD: Design system tokens
import { colors } from '@/design-system';
<div style={{ color: colors.primary }}>
```

---

## Quick Reference

### Import Order (Mango Convention)

```typescript
// 1. React and core libraries
import React, { useState, useEffect } from 'react';

// 2. Third-party libraries
import { format } from 'date-fns';

// 3. Store and hooks
import { useAppDispatch, useAppSelector } from '@/store/hooks';

// 4. Components
import { Button } from '@/components/ui/button';

// 5. Utils and services
import { dataService } from '@/services/dataService';

// 6. Types (use 'import type')
import type { Client } from '@/types';

// 7. Local files
import { STATUS_OPTIONS } from './constants';
```

---

## Resources

- [React Documentation](https://react.dev/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)
