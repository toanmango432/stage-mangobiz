---
paths: **/*
---
# Codebase Patterns

> Auto-updated patterns discovered during development. Read by all Claude sessions.
> Last updated: 2026-01-14 (ralph/frontdesk-update run)

---

## Front Desk Module

### Settings Architecture
- `frontDeskSettingsSlice` (Redux) is the single source of truth for card display options
- TeamSettingsPanel (localStorage) is legacy - prefer Redux settings
- FrontDeskSettings accessed via More > Front Desk Layout
- Access settings: `useAppSelector(selectFrontDeskSettings)`

### Staff Card System
- `StaffCardVertical` - shared component for mobile/desktop staff display
- `DisplayConfig` interface in `useStaffCardDisplay.ts` controls all card options
- Action callbacks: `onAddTicket`, `onAddNote`, `onEditTeam`, `onQuickCheckout`
- Action settings from FrontDeskSettingsData map to DisplayConfig

### Ticket Data Patterns
- `UITicket.number` (not ticketNumber) for ticket number
- `UITicket.service` (singular string) vs `checkoutServices` (detailed array)
- Duration stored as string "30min" - parse: `parseInt(duration.replace(/\D/g, ''))`
- `completedTickets` = status 'paid' (not 'completed' which means pending checkout)
- `selectServiceTickets` from uiTicketsSlice returns UITicket[] for in-service
- Staff can be matched by `techId`, `staffId`, or `assignedTo.id` fields on ticket

### Urgency System
- `urgencyUtils.ts` - thresholds (5/10/20 min) and color mappings
- `getUrgencyLevel(waitMinutes)` returns 'normal' | 'attention' | 'urgent' | 'critical'
- `URGENCY_COLORS` provides border, bg, dot, text, glow Tailwind classes for each level
- `calculateWaitingMinutes(completedAt)` for pending ticket wait time
- `formatWaitingTime(minutes)` formats as '5m', '15m', '1h 5m'

### Navigation Pattern
- AppShell listens for 'navigate-to-module' custom events
- Pattern: dispatch Redux action first, then trigger module navigation event
```typescript
dispatch(setSelectedMember(staffId));
window.dispatchEvent(new CustomEvent('navigate-to-module', {
  detail: { module: 'team-settings' }
}));
```

### Timesheet/Clock
- `timesheetSlice` exports `clockIn`/`clockOut` async thunks (not staffSlice)
- `isClockedIn = staff.status !== 'off'` (off = clocked out)
- ClockInParams: `{ staffId: number | string }`
- ClockOutParams: `{ staffId: number | string, clockOutTime: Date }`

---

## UI Components

### Dropdowns & Menus
- Use `DropdownMenu` from `@/components/ui/dropdown-menu` (shadcn/radix wrapper)
- Use `Sheet` with `side="bottom"` for mobile action sheets (better UX than dropdown)

### Drag and Drop
- Use `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- `useSortable` hook for each draggable item
- `DragOverlay` renders dragged item outside normal flow for smooth animation
- `CSS.Transform.toString(transform)` for proper transform handling
- `arrayMove` from @dnd-kit/sortable handles array reordering

### Animations
- Use Tailwind keyframes in `tailwind.config.js` for CSS animations
- `animate-pulse` for subtle pulsing effects
- Custom keyframes for status change flash animations

### View Mode Persistence
- `useViewModePreference` hook handles localStorage persistence
- Storage keys: `{sectionKey}ViewMode`, `{sectionKey}CardViewMode`, `{sectionKey}MinimizedLineView`

---

## Client Data

- `selectClients` from clientsSlice for client data
- `totalVisits` in `client.visitSummary.totalVisits` or `client.totalVisits`
- First visit = `totalVisits === 0`
- Client photo in `client.avatar` field

---

## Appointment Data

- `LocalAppointment.scheduledStartTime` is always a string (ISO format)
- Appointment status values: 'scheduled', 'confirmed', 'pending', 'cancelled', 'completed', 'no-show'
- `selectAllAppointments` from appointmentsSlice for all appointments
- Late appointments have `minutesUntil < 0` (negative = minutes past due)
- No-show threshold: 15+ minutes late (`minutesUntil <= -15`)

---

## Testing Patterns

- Redux-connected components need Provider wrapper in tests
- Use function reducers returning fixed state to avoid TypeScript inference issues with `configureStore`
- Mock context providers (TicketPanelContext, etc.) when testing components that use them
- Pre-existing test failures in Book module are infrastructure issues (not blockers for other work)
- Radix UI components render to portal - use simpler assertions to avoid portal complexity

---

## Ticket Panel Integration

- `useTicketPanel` provides `openTicketWithData(ticket)` to open ticket panel with pre-filled data
- `TicketData` interface includes `techId` and `technician` fields for staff pre-selection
- `openTicketWithData()` stores data in localStorage for TicketPanel to load
- Staff IDs may be strings or numbers - handle both when finding staff member

---

## Modal Patterns

- `EditTicketModal` requires ticketId as number - use `parseInt` when passing string IDs
- `TicketDetailsModal` has `onEdit` callback that can transition to EditTicketModal
- Confirmation dialogs should use `z-[60]` to appear above action menus (`z-50`)
- Use red color scheme for destructive actions (bg-red-50, text-red-600)

---

## Type Adapters

- Supabase uses snake_case, app uses camelCase
- Check `src/services/supabase/adapters/` for type converters
- Always convert between SupabaseRow and AppType when crossing boundaries

---

## Documentation Standards

### JSDoc for Utility Functions
- All public utility functions should have JSDoc comments
- Include `@param` with type and description for each parameter
- Include `@returns` describing the output format and possible values
- Include `@example` blocks showing typical usage patterns
- See `urgencyUtils.ts` for reference implementation
