# Mango POS Code Patterns

> **Last Updated:** January 4, 2026
> **Purpose:** Document common code patterns for AI agents and developers

This guide documents the established patterns in the Mango POS codebase. Follow these patterns for consistency and maintainability.

---

## Table of Contents

1. [State Management Patterns](#1-state-management-patterns)
2. [Component Patterns](#2-component-patterns)
3. [Data Flow Patterns](#3-data-flow-patterns)
4. [Form Patterns](#4-form-patterns)
5. [Styling Patterns](#5-styling-patterns)
6. [File Organization Patterns](#6-file-organization-patterns)
7. [TypeScript Patterns](#7-typescript-patterns)
8. [Testing Patterns](#8-testing-patterns)

---

## 1. State Management Patterns

### Redux Slice Structure

All Redux slices follow this structure:

```typescript
// src/store/slices/exampleSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { dataService } from '@/services/dataService';
import type { RootState } from '../index';
import type { Example } from '@/types';

// ==================== STATE INTERFACE ====================

interface ExampleState {
  items: Example[];
  selectedItem: Example | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: ExampleState = {
  items: [],
  selectedItem: null,
  loading: false,
  saving: false,
  error: null,
};

// ==================== ASYNC THUNKS ====================

export const fetchExamples = createAsyncThunk(
  'examples/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const items = await dataService.examples.getAll();
      return items;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch');
    }
  }
);

export const createExample = createAsyncThunk(
  'examples/create',
  async (input: CreateExampleInput, { rejectWithValue }) => {
    try {
      const created = await dataService.examples.create(input);
      return created;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create');
    }
  }
);

// ==================== SLICE ====================

const exampleSlice = createSlice({
  name: 'examples',
  initialState,
  reducers: {
    setSelectedItem: (state, action: PayloadAction<Example | null>) => {
      state.selectedItem = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchExamples.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExamples.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchExamples.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create
      .addCase(createExample.pending, (state) => {
        state.saving = true;
      })
      .addCase(createExample.fulfilled, (state, action) => {
        state.saving = false;
        state.items.push(action.payload);
      })
      .addCase(createExample.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedItem, clearError } = exampleSlice.actions;
export default exampleSlice.reducer;

// ==================== SELECTORS ====================

export const selectExamples = (state: RootState) => state.examples.items;
export const selectSelectedExample = (state: RootState) => state.examples.selectedItem;
export const selectExamplesLoading = (state: RootState) => state.examples.loading;
```

### When to Use Redux vs Local State

| Use Redux For | Use Local State For |
|---------------|---------------------|
| Data shared across components | Form input values |
| Server-synced data (clients, tickets) | UI toggle states |
| Global UI state (modals, panels) | Animation states |
| Offline-capable data | Temporary calculations |

### Redux Usage in Components

```typescript
// Correct pattern
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchClients, selectClients, selectClientsLoading } from '@/store/slices/clientsSlice';

function ClientList() {
  const dispatch = useAppDispatch();
  const clients = useAppSelector(selectClients);
  const loading = useAppSelector(selectClientsLoading);

  useEffect(() => {
    dispatch(fetchClients());
  }, [dispatch]);

  // ...
}
```

---

## 2. Component Patterns

### Module Structure (For Large Components)

When a component exceeds ~300 lines, split into a module:

```
src/components/ExampleModule/
├── index.ts                 # Public exports (barrel file)
├── ExampleModule.tsx        # Main component (~200-300 lines)
├── types.ts                 # Interfaces and types
├── constants.ts             # Default values, options
├── hooks/
│   └── useExampleLogic.ts   # Complex state logic
├── components/
│   ├── Header.tsx           # Sub-components
│   ├── Content.tsx
│   └── Footer.tsx
└── utils/
    └── helpers.ts           # Utility functions
```

**Barrel Export Pattern:**
```typescript
// index.ts
export { ExampleModule } from './ExampleModule';
export type { ExampleModuleProps } from './types';
```

### Component Props Interface

```typescript
// Always define props interface with JSDoc
interface TicketCardProps {
  /** The ticket to display */
  ticket: Ticket;
  /** Callback when ticket is clicked */
  onClick?: (ticketId: string) => void;
  /** Whether the card is in compact mode */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function TicketCard({ ticket, onClick, compact = false, className }: TicketCardProps) {
  // ...
}
```

### Container vs Presentational Components

**Container (Smart) Components:**
- Connect to Redux
- Handle data fetching
- Manage complex state
- Located in: `src/pages/` or module root

**Presentational (Dumb) Components:**
- Receive data via props
- Focus on rendering
- Minimal internal state
- Located in: `src/components/ui/` or `components/` subfolder

```typescript
// Container - handles logic
function TicketListContainer() {
  const tickets = useAppSelector(selectTickets);
  const dispatch = useAppDispatch();

  const handleSelect = (id: string) => {
    dispatch(selectTicket(id));
  };

  return <TicketList tickets={tickets} onSelect={handleSelect} />;
}

// Presentational - renders UI
function TicketList({ tickets, onSelect }: TicketListProps) {
  return (
    <ul>
      {tickets.map(ticket => (
        <TicketCard key={ticket.id} ticket={ticket} onClick={onSelect} />
      ))}
    </ul>
  );
}
```

### Dialog/Modal Pattern

```typescript
interface ExampleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: ExampleData) => void;
  initialData?: ExampleData;
}

export function ExampleDialog({
  open,
  onOpenChange,
  onConfirm,
  initialData,
}: ExampleDialogProps) {
  const [data, setData] = useState(initialData);

  const handleConfirm = () => {
    onConfirm(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Example Dialog</DialogTitle>
        </DialogHeader>
        {/* Content */}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 3. Data Flow Patterns

### dataService Abstraction

**NEVER call IndexedDB or Supabase directly from components.** Always use `dataService`:

```typescript
// CORRECT - Use dataService
import { dataService } from '@/services/dataService';

async function loadClients() {
  const clients = await dataService.clients.getAll();
  return clients;
}

// WRONG - Direct database access
import { clientsDB } from '@/db/database';  // Don't do this!
const clients = await clientsDB.toArray();
```

### Local-First Data Flow

```
Component → Redux Thunk → dataService → IndexedDB (instant)
                                      ↓
                              Background Sync Queue
                                      ↓
                                  Supabase
```

### CRUD Operations Pattern

```typescript
// In Redux thunk
export const updateClient = createAsyncThunk(
  'clients/update',
  async ({ id, updates }: { id: string; updates: Partial<Client> }, { rejectWithValue }) => {
    try {
      // 1. Update via dataService (handles local + sync)
      const updated = await dataService.clients.update(id, updates);

      // 2. Return for Redux state update
      return updated;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Update failed');
    }
  }
);
```

---

## 4. Form Patterns

### React Hook Form + Zod

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// 1. Define schema with Zod
const clientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
});

type ClientFormData = z.infer<typeof clientSchema>;

// 2. Use in component
function ClientForm({ onSubmit, initialData }: ClientFormProps) {
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: initialData || {
      name: '',
      email: '',
      phone: '',
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit(data);
  });

  return (
    <form onSubmit={handleSubmit}>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {/* More fields... */}
    </form>
  );
}
```

---

## 5. Styling Patterns

### cn() Utility for Class Merging

```typescript
import { cn } from '@/lib/utils';

// Merge classes with proper Tailwind precedence
<div className={cn(
  'base-classes px-4 py-2',
  isActive && 'bg-blue-500',
  className // Allow override from props
)} />
```

### Design Tokens

Import from `@/design-system` for consistent styling:

```typescript
import { brand, colors, spacing } from '@/design-system';

// Use tokens instead of hardcoded values
<div style={{ backgroundColor: brand.primary }} />
```

### Responsive Design Pattern

```typescript
// Mobile-first approach
<div className="
  flex flex-col          // Mobile: stack vertically
  md:flex-row            // Tablet+: horizontal
  lg:gap-6               // Desktop: more spacing
">
  {/* content */}
</div>
```

### Conditional Styling

```typescript
// Use cn() for conditional classes
<button
  className={cn(
    'px-4 py-2 rounded-md font-medium transition-colors',
    variant === 'primary' && 'bg-brand-500 text-white hover:bg-brand-600',
    variant === 'secondary' && 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    disabled && 'opacity-50 cursor-not-allowed'
  )}
>
  {children}
</button>
```

---

## 6. File Organization Patterns

### File Size Guidelines

| File Type | Target Lines | Max Lines |
|-----------|--------------|-----------|
| Component | <300 | 500 |
| Redux slice | <400 | 600 |
| Hook | <150 | 250 |
| Utility | <100 | 200 |

**If a file exceeds max lines:** Split into a module structure.

### Import Order Convention

```typescript
// 1. React and core libraries
import React, { useState, useEffect } from 'react';

// 2. Third-party libraries
import { format } from 'date-fns';
import { motion } from 'framer-motion';

// 3. Store and hooks
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectClients } from '@/store/slices/clientsSlice';

// 4. Components
import { Button } from '@/components/ui/button';
import { TicketCard } from '@/components/tickets/TicketCard';

// 5. Utils and services
import { dataService } from '@/services/dataService';
import { formatCurrency } from '@/utils/format';

// 6. Types
import type { Client, Ticket } from '@/types';

// 7. Styles and constants
import { colors } from '@/design-system';
import { STATUS_OPTIONS } from './constants';
```

### Path Aliases

Use `@/` prefix for src imports:

```typescript
// CORRECT
import { Button } from '@/components/ui/button';
import { Client } from '@/types';

// WRONG
import { Button } from '../../../components/ui/button';
```

---

## 7. TypeScript Patterns

### Type Exports

```typescript
// Export types separately for clear imports
export interface Client {
  id: string;
  name: string;
  // ...
}

export type ClientStatus = 'active' | 'blocked' | 'vip';

// Allow importing type-only
import type { Client, ClientStatus } from '@/types';
```

### Discriminated Unions for State

```typescript
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

// Usage
function handleState(state: AsyncState<Client[]>) {
  switch (state.status) {
    case 'loading':
      return <Spinner />;
    case 'error':
      return <Error message={state.error} />;
    case 'success':
      return <ClientList clients={state.data} />;
    default:
      return null;
  }
}
```

### Props with Ref Forwarding

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', className, children, ...props }, ref) => {
    return (
      <button ref={ref} className={cn(baseStyles, variantStyles[variant], className)} {...props}>
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
```

---

## 8. Testing Patterns

### Unit Test Structure

```typescript
// ExampleComponent.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ExampleComponent } from './ExampleComponent';

describe('ExampleComponent', () => {
  // Group by feature/behavior
  describe('rendering', () => {
    it('renders with default props', () => {
      render(<ExampleComponent />);
      expect(screen.getByText('Expected Text')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onClick when button is clicked', () => {
      const handleClick = vi.fn();
      render(<ExampleComponent onClick={handleClick} />);

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});
```

### Redux Testing

```typescript
import { renderWithProviders } from '@/testing/utils';
import { ClientList } from './ClientList';

describe('ClientList', () => {
  it('displays clients from store', () => {
    const preloadedState = {
      clients: {
        items: [{ id: '1', name: 'John Doe' }],
        loading: false,
      },
    };

    renderWithProviders(<ClientList />, { preloadedState });
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

---

## Quick Reference

### Do's

- Use `dataService` for all data operations
- Use `cn()` for conditional class names
- Use Zod for form validation
- Use barrel exports (`index.ts`) for modules
- Keep files under 500 lines
- Add JSDoc to exported functions

### Don'ts

- Don't access IndexedDB/Supabase directly from components
- Don't use inline styles (use Tailwind)
- Don't hardcode colors (use design tokens)
- Don't create deep import paths (use `@/` aliases)
- Don't skip TypeScript interfaces for props

---

## Related Documentation

- [CLAUDE.md](../CLAUDE.md) - Quick reference and architecture
- [TECHNICAL_DOCUMENTATION.md](./architecture/TECHNICAL_DOCUMENTATION.md) - Full tech stack
- [DATA_STORAGE_STRATEGY.md](./architecture/DATA_STORAGE_STRATEGY.md) - Storage patterns
- [STATE_MACHINES.md](./architecture/STATE_MACHINES.md) - State transitions

---

*Document Version: 1.0*
*Last Updated: January 4, 2026*
