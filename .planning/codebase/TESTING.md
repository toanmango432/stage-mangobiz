# Testing

## Framework Stack

| Tool | Version | Purpose |
|------|---------|---------|
| Vitest | 1.3.1-4.0.16 | Unit & integration tests |
| Testing Library | 14.2-16.3 | Component testing |
| Playwright | 1.56-1.57 | E2E testing |
| jsdom | 24.0-27.4 | DOM simulation |
| c8 / @vitest/coverage-v8 | - | Coverage reporting |

## Test File Structure

```
apps/store-app/
├── src/
│   ├── components/
│   │   ├── Book/
│   │   │   ├── AppointmentCard.tsx
│   │   │   └── __tests__/
│   │   │       └── AppointmentCard.test.tsx
│   │   └── shared/
│   │       ├── Button.tsx
│   │       └── Button.test.tsx  # Colocated also works
│   ├── store/
│   │   └── slices/
│   │       └── __tests__/
│   │           └── appointmentSlice.test.ts
│   ├── services/
│   │   └── __tests__/
│   │       └── dataService.test.ts
│   └── testing/
│       └── setup.ts             # Vitest setup
├── e2e/
│   ├── booking.spec.ts
│   └── checkout.spec.ts
└── playwright.config.ts
```

## Test Statistics

- **828 test files** across the monorepo
- **14,237 lines** in Book module components alone
- Coverage target: 80% lines/functions, 75% branches

## Configuration

### Vitest Setup (`testing/setup.ts`)

```typescript
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Supabase
vi.mock('@mango/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockResolvedValue({ data: null, error: null }),
      delete: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  },
}))

// Mock Dexie
vi.mock('@mango/database', () => ({
  db: {
    appointments: { toArray: vi.fn().mockResolvedValue([]) },
    clients: { toArray: vi.fn().mockResolvedValue([]) },
  },
}))

// Mock MQTT
vi.mock('@mango/mqtt', () => ({
  mqttService: {
    publish: vi.fn(),
    subscribe: vi.fn(),
  },
}))
```

### Vitest Config (`vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/testing/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
})
```

## Test Patterns

### Component Tests

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { AppointmentCard } from '../AppointmentCard'
import appointmentReducer from '@/store/slices/appointmentSlice'

// Test wrapper with Redux
const renderWithProviders = (ui: React.ReactElement, preloadedState = {}) => {
  const store = configureStore({
    reducer: { appointments: appointmentReducer },
    preloadedState,
  })
  return render(<Provider store={store}>{ui}</Provider>)
}

describe('AppointmentCard', () => {
  const mockAppointment = {
    id: '1',
    clientName: 'John Doe',
    serviceName: 'Haircut',
    startTime: new Date('2024-01-15T10:00:00'),
    duration: 30,
  }

  it('renders appointment details', () => {
    renderWithProviders(<AppointmentCard appointment={mockAppointment} />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Haircut')).toBeInTheDocument()
    expect(screen.getByText('10:00 AM')).toBeInTheDocument()
  })

  it('calls onEdit when edit button clicked', () => {
    const onEdit = vi.fn()
    renderWithProviders(
      <AppointmentCard appointment={mockAppointment} onEdit={onEdit} />
    )

    fireEvent.click(screen.getByRole('button', { name: /edit/i }))
    expect(onEdit).toHaveBeenCalledWith(mockAppointment.id)
  })
})
```

### Hook Tests

```typescript
import { renderHook, act } from '@testing-library/react'
import { useAppointments } from '../useAppointments'
import { wrapper } from '@/testing/utils'

describe('useAppointments', () => {
  it('fetches appointments for date', async () => {
    const { result } = renderHook(
      () => useAppointments(new Date('2024-01-15')),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.appointments).toHaveLength(3)
  })
})
```

### Redux Slice Tests

```typescript
import appointmentReducer, {
  fetchAppointments,
  createAppointment,
} from '../appointmentSlice'

describe('appointmentSlice', () => {
  const initialState = {
    items: [],
    loading: false,
    error: null,
  }

  it('handles fetchAppointments.pending', () => {
    const action = { type: fetchAppointments.pending.type }
    const state = appointmentReducer(initialState, action)
    expect(state.loading).toBe(true)
  })

  it('handles fetchAppointments.fulfilled', () => {
    const appointments = [{ id: '1', clientName: 'John' }]
    const action = {
      type: fetchAppointments.fulfilled.type,
      payload: appointments,
    }
    const state = appointmentReducer(initialState, action)
    expect(state.loading).toBe(false)
    expect(state.items).toEqual(appointments)
  })
})
```

### Service Tests

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { dataService } from '../dataService'
import { supabase } from '@mango/supabase'

vi.mock('@mango/supabase')

describe('dataService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAppointments', () => {
    it('fetches and transforms appointments', async () => {
      const mockData = [
        { id: '1', client_id: 'c1', start_time: '2024-01-15T10:00:00Z' },
      ]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockData, error: null }),
        }),
      } as any)

      const result = await dataService.getAppointments(new Date('2024-01-15'))

      expect(result[0].clientId).toBe('c1')  // Transformed to camelCase
      expect(result[0].startTime).toBeInstanceOf(Date)
    })
  })
})
```

## E2E Testing (Playwright)

### Configuration (`playwright.config.ts`)

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
})
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test'

test.describe('Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/book')
  })

  test('creates new appointment', async ({ page }) => {
    // Click time slot
    await page.click('[data-testid="timeslot-10-00"]')

    // Fill appointment form
    await page.fill('[data-testid="client-search"]', 'John')
    await page.click('[data-testid="client-option-john-doe"]')
    await page.click('[data-testid="service-haircut"]')

    // Submit
    await page.click('[data-testid="save-appointment"]')

    // Verify
    await expect(page.locator('[data-testid="appointment-card"]')).toContainText('John Doe')
  })
})
```

## Running Tests

```bash
# Unit tests
pnpm test                    # Run all tests
pnpm test:watch              # Watch mode
pnpm test:coverage           # With coverage

# E2E tests
pnpm test:e2e                # Run Playwright tests
pnpm test:e2e:ui             # Playwright UI mode
pnpm test:e2e:headed         # Visible browser

# Specific app
pnpm --filter @mango/store-app test
```

## Best Practices

1. **Test behavior, not implementation** - Test what users see/do
2. **Use data-testid** for E2E selectors
3. **Mock external services** in unit tests
4. **Use real Redux store** with preloaded state
5. **Avoid testing library internals**
6. **Write descriptive test names**
7. **Keep tests independent** - No shared state
8. **Use `test.skip()`** for pending tests (don't delete)
