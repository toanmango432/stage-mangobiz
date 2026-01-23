# Code Conventions

## TypeScript

### Strict Mode
- `strict: true` enabled
- No `any` types (use `unknown` + type guards)
- Explicit return types on exports

### Type Definitions
```typescript
// Prefer interfaces for objects
interface Appointment {
  id: string
  clientId: string
  startTime: Date
}

// Use type for unions/intersections
type Status = 'pending' | 'confirmed' | 'completed'
type AppointmentWithClient = Appointment & { client: Client }
```

### Props Typing
```typescript
// Always define props interface
interface ButtonProps {
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  children: React.ReactNode
}

export function Button({ variant = 'primary', size = 'md', onClick, children }: ButtonProps) {
  // ...
}
```

## React Components

### Functional Components Only
```typescript
// Good
export function AppointmentCard({ appointment }: Props) {
  return <div>...</div>
}

// Avoid class components
```

### Hook Usage
```typescript
// Custom hooks for reusable logic
export function useAppointments(date: Date) {
  const dispatch = useAppDispatch()
  const appointments = useSelector(selectAppointmentsByDate(date))

  useEffect(() => {
    dispatch(fetchAppointments(date))
  }, [date, dispatch])

  return appointments
}
```

### Component Structure
```typescript
// 1. Imports
// 2. Types/interfaces
// 3. Constants
// 4. Component
// 5. Sub-components (if small)
// 6. Styles (if CSS-in-JS)

interface Props {
  // ...
}

const ANIMATION_DURATION = 200

export function MyComponent({ prop }: Props) {
  // State
  const [isOpen, setIsOpen] = useState(false)

  // Derived state / selectors
  const data = useSelector(selectData)

  // Effects
  useEffect(() => {
    // ...
  }, [])

  // Handlers
  const handleClick = () => {
    // ...
  }

  // Render
  return (
    <div>...</div>
  )
}
```

## Styling

### TailwindCSS First
```tsx
// Good - use Tailwind utilities
<div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow">

// Use design system tokens via custom classes
<button className="btn-primary">  // Defined in design-system
```

### Design System Tokens
```typescript
// Import from design system
import { colors, spacing } from '@mango/design-system'

// ESLint warns on hardcoded colors
// Bad
<div style={{ color: '#3B82F6' }}>

// Good
<div className="text-primary-500">
```

### Conditional Classes
```typescript
import { cn } from '@/utils/cn'  // clsx + tailwind-merge

<div className={cn(
  'base-classes',
  isActive && 'active-classes',
  variant === 'primary' && 'primary-classes'
)}>
```

## State Management

### Redux Slice Pattern
```typescript
// slices/appointmentSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

export const fetchAppointments = createAsyncThunk(
  'appointments/fetch',
  async (date: Date, { rejectWithValue }) => {
    try {
      return await dataService.getAppointments(date)
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const appointmentSlice = createSlice({
  name: 'appointments',
  initialState,
  reducers: {
    // Sync actions
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAppointments.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchAppointments.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
  }
})
```

### Selector Pattern
```typescript
// Memoized selectors
export const selectAppointmentsByDate = createSelector(
  [selectAllAppointments, (_, date: Date) => date],
  (appointments, date) =>
    appointments.filter(a => isSameDay(a.startTime, date))
)
```

## Error Handling

### Try-Catch in Services
```typescript
// services/dataService.ts
export async function getAppointments(date: Date) {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('date', date)

    if (error) throw error
    return data.map(toAppointment)
  } catch (error) {
    console.error('Failed to fetch appointments:', error)
    throw error
  }
}
```

### Thunk Error Handling
```typescript
// Thunks handle errors and return rejectWithValue
export const createAppointment = createAsyncThunk(
  'appointments/create',
  async (input: CreateAppointmentInput, { rejectWithValue }) => {
    try {
      return await dataService.createAppointment(input)
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)
```

### Component Error Boundaries
```tsx
// Wrap feature modules with error boundaries
<ErrorBoundary fallback={<BookErrorFallback />}>
  <BookingCalendar />
</ErrorBoundary>
```

## Data Transformation

### Type Adapters
```typescript
// Database snake_case → App camelCase
export const toAppointment = (db: DbAppointment): Appointment => ({
  id: db.id,
  clientId: db.client_id,
  staffId: db.staff_id,
  startTime: new Date(db.start_time),
  endTime: new Date(db.end_time),
})

export const toDbAppointment = (app: Appointment): DbAppointment => ({
  id: app.id,
  client_id: app.clientId,
  staff_id: app.staffId,
  start_time: app.startTime.toISOString(),
  end_time: app.endTime.toISOString(),
})
```

## Validation

### Zod Schemas
```typescript
// Define schemas in @mango/api-contracts
import { z } from 'zod'

export const CreateAppointmentSchema = z.object({
  clientId: z.string().uuid(),
  staffId: z.string().uuid(),
  serviceId: z.string().uuid(),
  startTime: z.string().datetime(),
  duration: z.number().min(15).max(480),
})

export type CreateAppointmentInput = z.infer<typeof CreateAppointmentSchema>
```

### Form Validation
```typescript
// React Hook Form + Zod
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const form = useForm<CreateAppointmentInput>({
  resolver: zodResolver(CreateAppointmentSchema),
  defaultValues: {
    // ...
  }
})
```

## Testing

### Test File Location
```
src/
├── components/
│   ├── Button.tsx
│   └── __tests__/
│       └── Button.test.tsx
```

### Test Structure
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
```

### Mock Patterns
```typescript
// Mock Supabase
vi.mock('@mango/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ data: [], error: null })
    }))
  }
}))
```

## Comments & Documentation

### JSDoc for Utilities
```typescript
/**
 * Formats a duration in minutes to a human-readable string.
 * @param minutes - Duration in minutes
 * @returns Formatted string (e.g., "1h 30m")
 * @example
 * formatDuration(90) // "1h 30m"
 * formatDuration(45) // "45m"
 */
export function formatDuration(minutes: number): string {
  // ...
}
```

### TODO Comments
```typescript
// TODO: Implement caching for performance
// FIXME: Race condition when multiple users edit
// HACK: Workaround for Supabase realtime bug
```
