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

---

## Anti-Patterns to AVOID

> These patterns caused issues in previous Ralph runs. DO NOT repeat them.

### 1. Mock Data in Production Code
**BAD:**
```typescript
// DON'T DO THIS - hardcoded test data in render loop
if (staffMember.status === 'busy') {
  modifiedStaffMember.currentTicketInfo = {
    clientName: 'Test Client',  // WRONG - hardcoded
    serviceName: 'Test Service',
  };
}
modifiedStaffMember.lastServiceTime = '10:30 AM';  // WRONG - hardcoded
```

**GOOD:**
```typescript
// Use real data from Redux selectors
const serviceTickets = useAppSelector(selectServiceTickets);
const staffTicket = serviceTickets.find(t => t.techId === staffMember.id);
if (staffTicket) {
  modifiedStaffMember.currentTicketInfo = {
    clientName: staffTicket.clientName,  // Real data
    serviceName: staffTicket.service,
  };
}
```

### 2. Importing Selectors Without Using Them
**BAD:**
```typescript
// DON'T DO THIS - import but never use
const allAppointments = useAppSelector(selectAllAppointments);
const completedTickets = useAppSelector(selectCompletedTickets);
// ... these are never used in rendering
```

**GOOD:**
```typescript
// Import AND use in rendering
const allAppointments = useAppSelector(selectAllAppointments);
const nextAppointment = allAppointments.find(
  apt => apt.staffId === staff.id && new Date(apt.scheduledStartTime) > new Date()
);
// Use nextAppointment in JSX
```

### 3. Suppressing Unused Variables with `void`
**BAD:**
```typescript
// DON'T DO THIS - hiding unused code
void _saveOriginalWidth;
void _handleResetClick;
void _getDisplayPriorityTiers;
```

**GOOD:**
```typescript
// Either DELETE the unused code or IMPLEMENT the feature
// If not needed, remove completely
// If needed later, implement it now or create a story for it
```

### 4. Modal Callbacks Without Implementation
**BAD:**
```typescript
// DON'T DO THIS - callback prop declared but undefined
<StaffDetailsPanel
  onAddNote={onAddNote}  // undefined - will crash
  onEditTeam={onEditTeam}  // undefined - will crash
/>
```

**GOOD:**
```typescript
// Implement the callback that dispatches Redux action
const handleAddNote = (staffId: string, note: string) => {
  dispatch(addStaffNote({ staffId, note }));
  setShowNoteModal(false);
};
<StaffDetailsPanel onAddNote={handleAddNote} />
```

### 5. Type Casts with `as any`
**BAD:**
```typescript
// DON'T DO THIS - masks type errors
(modifiedStaffMember as any).activeTickets = [{...}];
staff.find((s: any) => s.id === staffId);
```

**GOOD:**
```typescript
// Use proper type guards
interface StaffWithTickets extends Staff {
  activeTickets?: UITicket[];
}
const modifiedStaff: StaffWithTickets = { ...staffMember };
modifiedStaff.activeTickets = tickets;

// Or use type assertion only when necessary with explanation
const staffId = typeof id === 'string' ? parseInt(id, 10) : id;
```

### 6. Large Files Without Splitting
**BAD:**
```typescript
// 900+ lines in a single component file
// StaffSidebar.tsx - 902 lines (TOO BIG)
```

**GOOD:**
```
// Split into module structure
StaffSidebar/
├── index.ts
├── StaffSidebar.tsx        # ~250 lines - main component
├── StaffCardGrid.tsx       # ~150 lines - card rendering
├── StaffSidebarHeader.tsx  # ~100 lines - header/controls
├── hooks/
│   ├── useStaffFiltering.ts
│   └── useStaffCardDisplay.ts
└── types.ts
```

---

## Real Data Integration Pattern

When connecting components to real Redux data:

```typescript
// 1. Import the selector
import { selectServiceTickets, selectAllAppointments } from '@/store/slices';

// 2. Use in component
const serviceTickets = useAppSelector(selectServiceTickets);
const appointments = useAppSelector(selectAllAppointments);

// 3. Filter/transform for specific staff
const staffData = useMemo(() => {
  return staffList.map(staff => {
    const activeTicket = serviceTickets.find(t =>
      String(t.techId) === String(staff.id) ||
      String(t.staffId) === String(staff.id)
    );
    const nextApt = appointments.find(a =>
      String(a.staffId) === String(staff.id) &&
      new Date(a.scheduledStartTime) > new Date()
    );
    return {
      ...staff,
      currentTicket: activeTicket,
      nextAppointment: nextApt,
    };
  });
}, [staffList, serviceTickets, appointments]);

// 4. Use transformed data in render
{staffData.map(staff => (
  <StaffCard
    currentTicket={staff.currentTicket}  // Real data!
    nextAppointment={staff.nextAppointment}
  />
))}
```

---

## Modal State Management Pattern

Complete pattern for modal with selected item:

```typescript
// 1. State for modal visibility and selected item
const [showModal, setShowModal] = useState(false);
const [selectedItem, setSelectedItem] = useState<Item | null>(null);

// 2. Handler to open modal with item
const handleOpenModal = (item: Item) => {
  setSelectedItem(item);
  setShowModal(true);
};

// 3. Handler for modal confirm (MUST dispatch Redux action)
const handleConfirm = (data: ConfirmData) => {
  if (!selectedItem) return;
  dispatch(someAction({ itemId: selectedItem.id, ...data }));
  setShowModal(false);
  setSelectedItem(null);
};

// 4. Handler for modal close
const handleClose = () => {
  setShowModal(false);
  setSelectedItem(null);
};

// 5. Render modal with all handlers
{showModal && selectedItem && (
  <MyModal
    item={selectedItem}
    onConfirm={handleConfirm}
    onClose={handleClose}
  />
)}
```

---

## Ralph Workflow Preferences

### Branch Management
- **Do NOT automatically create new branches** - always ask the user first
- If PRD has a different branchName than current branch, ask: "Create new branch or stay on current?"
- Run directories can have any name, they don't need to match the branch name

### Setting Up New Ralph Runs
1. Create run directory: `scripts/ralph/runs/<run-name>/`
2. Ask user about branch preference before creating/switching branches
3. Update prd.json `branchName` to match chosen branch
4. Copy prompt.md from existing run
5. Create progress.txt
6. Run: `./scripts/ralph/ralph.sh 50 <run-name>`
