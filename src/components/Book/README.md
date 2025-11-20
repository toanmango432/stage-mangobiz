# Book Module

Comprehensive appointment booking and calendar management system for the Mango POS application.

## Overview

The Book module provides a complete solution for managing salon appointments, including calendar views, appointment creation, client management, and scheduling workflows.

## Architecture

### Core Components

#### Appointment Modals
- **NewAppointmentModal** - Legacy appointment creation modal
- **NewAppointmentModalV2** - Enhanced appointment modal with improved UX
  - Client-first workflow
  - Full-height dropdown for client selection
  - Conditional rendering for step-by-step guidance
  - Support for walk-in clients
  - Inline client creation
- **GroupBookingModal** - Dedicated group booking modal for parties and events
  - Unified single-view interface (no steps)
  - Expandable member cards with inline service assignment
  - Real-time group summary and cost calculations
  - Support for named clients and walk-ins
  - Individual service customization per member
- **AppointmentDetailsModal** - View appointment information
- **EditAppointmentModal** - Edit existing appointments

#### Calendar Views
- **DaySchedule** - Daily calendar view (using v2)
- **WeekView** - Weekly calendar overview
- **MonthView** - Monthly calendar display
- **AgendaView** - List-based agenda view

#### Supporting Components
- **AppointmentCard** - Individual appointment display card
- **CalendarHeader** - Calendar navigation and controls
- **StaffColumn** - Staff member column in calendar
- **StaffSidebar** - Staff filtering and management sidebar
- **TimeSlot** - Time slot component for scheduling
- **SmartBookingPanel** - Intelligent booking suggestions

#### Client Management
- **CustomerSearchModal** - Search and select existing clients
- **QuickClientModal** - Quick client creation (legacy)
- Inline client form - Integrated in NewAppointmentModalV2

## Component Details

### NewAppointmentModalV2

**Location:** `src/components/Book/NewAppointmentModal.v2.tsx`

**Features:**
- **Client-First Architecture**: Focus on selecting client before other details
- **Full-Height Dropdown**: Expands to cover entire left section when active
- **Conditional Right Panel**: Shows guidance message until client is selected
- **Search & Recent Clients**: Quick access to recent and searched clients
- **Walk-in Support**: Skip client selection for walk-in customers
- **Inline Client Creation**: Add new clients without leaving the modal
- **Service Selection**: Browse and add multiple services
- **Staff Assignment**: Assign services to specific staff members
- **Sequential/Parallel Timing**: Choose how services are scheduled
- **Real-time Validation**: Validates appointment before booking

**Props:**
```typescript
interface NewAppointmentModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
  selectedTime?: Date;
  selectedStaffId?: string;
  selectedStaffName?: string;
  onSave?: (appointment: any) => void;
  viewMode?: 'slide' | 'fullpage';
}
```

**State Management:**
- Client selection state
- Search and filtering
- Service staging
- Staff assignments
- Time configuration
- Validation states

**Key UI Patterns:**
1. **Search Input** (z-30): Always visible at top
2. **Dropdown Overlay** (z-40): Covers tabs when searching
3. **Tabs & Content** (z-10): Service and staff selection
4. **Right Panel**: Conditional rendering based on client selection

### GroupBookingModal

**Location:** `src/components/Book/GroupBookingModal.tsx`

**Purpose:** Optimized modal for booking multiple people simultaneously for group appointments, parties, or events. Unlike the individual booking flow, this modal focuses on managing multiple members and their individual service selections in a unified interface.

**Features:**
- **Unified Single View**: No step-by-step process - all controls visible at once
- **Expandable Member Cards**: Accordion-style cards that expand to show/edit member details and services
- **Inline Service Assignment**: Add services directly within each member card without context switching
- **Real-time Group Summary**: Always-visible summary panel showing total members, services, duration, and cost
- **Flexible Member Types**: Support for both existing clients and walk-in guests
- **Individual Service Customization**: Each member can have different services and staff assignments
- **Smart Layout**: 60/40 split (member cards left, summary right) for optimal workflow

**Props:**
```typescript
interface GroupBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
  selectedTime?: Date;
  onSave?: (booking: any) => void;
}
```

**Data Structure:**
```typescript
interface GroupMember {
  id: string;
  clientId?: string;          // Links to actual client if not walk-in
  name: string;
  phone: string;
  email?: string;
  isExpanded: boolean;         // Accordion state
  services: Array<{
    serviceId: string;
    serviceName: string;
    category: string;
    duration: number;
    price: number;
    staffId: string;
    staffName: string;
  }>;
}
```

**State Management:**
- Member list with accordion states
- Date/time selection
- Add member modal state
- Service picker modal state
- Real-time calculations (useMemo)

**Key UI Patterns:**
1. **Left Column (60%)**: Date/time picker + expandable member cards
2. **Right Column (40%)**: Real-time group summary with totals
3. **Add Member Modal**: Search existing clients or add walk-in with phone/name
4. **Service Picker Modal**: Category-grouped services with inline staff selection
5. **Accordion Behavior**: Only one member card expanded at a time for clarity

**Performance:**
- **Memoized Summary**: useMemo for total calculations to prevent unnecessary re-renders
- **Debounced Search**: 300ms delay for client search in Add Member modal
- **Optimized Rendering**: Accordion pattern reduces DOM complexity

### Calendar Views

#### DaySchedule (v2)
- Staff-based columns
- Time slot grid
- Drag-and-drop support (planned)
- Appointment cards with quick actions

#### WeekView
- 7-day overview
- Compact appointment display
- Quick navigation between weeks

#### MonthView
- Full month calendar
- Appointment count indicators
- Quick day selection

#### AgendaView
- List-based view
- Grouped by date
- Detailed appointment information

## Usage Examples

### Basic Appointment Creation

```tsx
import { NewAppointmentModalV2 } from '@/components/Book';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <NewAppointmentModalV2
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      selectedDate={new Date()}
      selectedTime={new Date()}
      onSave={(appointment) => {
        console.log('Appointment created:', appointment);
        setIsOpen(false);
      }}
    />
  );
}
```

### With Pre-selected Staff

```tsx
<NewAppointmentModalV2
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  selectedStaffId="staff-123"
  selectedStaffName="Jane Doe"
  viewMode="fullpage"
/>
```

### Group Booking

```tsx
import { GroupBookingModal } from '@/components/Book';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <GroupBookingModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      selectedDate={new Date()}
      selectedTime={new Date('2024-01-15T10:00:00')}
      onSave={(booking) => {
        console.log('Group booking created:', booking);
        // booking contains: { members, date, time, totalCost, totalDuration }
        setIsOpen(false);
      }}
    />
  );
}
```

## Data Flow

### Client Selection Flow
1. User opens modal
2. Search input is focused automatically
3. Recent clients are displayed
4. User can:
   - Search for existing client
   - Select from recent clients
   - Add new client inline
   - Skip and add as walk-in
5. Once selected, right panel shows booking form

### Appointment Creation Flow
1. Select client (or walk-in)
2. Choose date and time
3. Switch to Staff tab
4. Select staff member
5. Switch to Services tab
6. Add services for selected staff
7. Repeat steps 4-6 for additional staff
8. Choose sequential or parallel timing
9. Review in Appointment Summary
10. Click "Book Appointment"

### Group Booking Flow
1. User opens GroupBookingModal
2. Set group date and time (top of modal)
3. Click "Add Member" button
4. In Add Member modal:
   - Search for existing client, OR
   - Enter walk-in details (name + phone)
5. Member card appears in collapsed state
6. Click member card to expand it
7. Click "Add Service" within expanded card
8. In Service Picker modal:
   - Browse services by category
   - Select service
   - Choose staff for that service
   - Click "Add Service"
9. Service appears in member's service list
10. Repeat steps 7-9 to add more services to same member
11. Repeat steps 3-9 to add more members
12. Review real-time summary in right panel:
    - Total members
    - Total services
    - Total duration
    - Total cost
13. Click "Book Group Appointment"

**Key Differences from Individual Flow:**
- No step-by-step process (everything visible at once)
- Members managed independently with their own services
- Inline service assignment (no tab switching)
- Real-time summary always visible
- Support for mixing existing clients and walk-ins in same booking

## Styling & Theming

### Color Scheme
- **Primary (Teal)**: `teal-500`, `teal-600` for main actions
- **Neutral**: `gray-*` for backgrounds and borders
- **Accent**: `amber-*` for warnings and highlights

### Z-Index Layers
- **z-10**: Tabs and tab content (base layer)
- **z-30**: Search input (always visible)
- **z-40**: Dropdowns and overlays (highest)

### Responsive Design
- Modal adapts to different screen sizes
- Touch-friendly on mobile devices
- Optimized for tablet use

## Database Integration

### Collections Used
- **clients**: Client information and history
- **appointments**: Appointment records
- **staff**: Staff availability and assignments
- **services**: Service catalog with pricing

### Queries
```typescript
// Recent clients
clientsDB.getAll(salonId)
  .then(clients => clients.sort(by lastVisit))

// Client search
clientsDB.search(salonId, searchQuery)

// Services
servicesDB.getAll(salonId)
  .filter(service => service.isActive)

// Staff
staffDB.getAvailable(salonId)
```

## Performance Optimizations

- **Debounced Search**: 300ms delay for client search
- **Memoized Calculations**: Service pricing and duration
- **Lazy Loading**: Calendar views load on-demand
- **Virtual Scrolling**: For long service/client lists (planned)

## State Management

### Local State (useState)
- UI state (modals, dropdowns, tabs)
- Form inputs
- Search queries

### Redux Store
- Staff list
- Services catalog
- Global appointment data

### IndexedDB (Dexie)
- Offline client data
- Cached appointments
- Sync queue

## Accessibility

- **Keyboard Navigation**: Full keyboard support
- **ARIA Labels**: Proper labeling for screen readers
- **Focus Management**: Auto-focus on important fields
- **Color Contrast**: WCAG AA compliant

## Future Enhancements

### Planned Features
- [ ] Drag-and-drop rescheduling
- [ ] Recurring appointments
- [ ] Appointment conflicts detection
- [ ] Smart time suggestions
- [ ] Client preferences and notes
- [ ] SMS/Email notifications
- [ ] Multi-location support
- [ ] Resource booking (rooms, equipment)

### Technical Improvements
- [ ] Virtual scrolling for large lists
- [ ] Offline-first appointment creation
- [ ] Optimistic UI updates
- [ ] Real-time availability sync
- [ ] Advanced search filters
- [ ] Export to calendar formats (iCal)

## Troubleshooting

### Common Issues

**Dropdown not showing:**
- Check z-index layering
- Verify `!selectedClient && !showAddNewForm` conditions

**Search not working:**
- Check IndexedDB connection
- Verify salonId is set correctly
- Check debounce timing

**Appointments not saving:**
- Verify all required fields
- Check database permissions
- Review validation logic

## Choosing the Right Modal

### Individual vs Group Bookings

**Use NewAppointmentModalV2 when:**
- Booking for a single client
- Client needs multiple services from different staff
- Need sequential or parallel service timing
- Want client-first workflow with recent client suggestions

**Use GroupBookingModal when:**
- Booking for multiple people (parties, events, groups)
- Each person needs independent service customization
- Need to mix existing clients and walk-ins
- Want to see group totals in real-time
- Managing bridal parties, family bookings, or group events

**Key Architectural Differences:**
| Feature | NewAppointmentModalV2 | GroupBookingModal |
|---------|----------------------|-------------------|
| UI Pattern | Tab-based with steps | Single unified view |
| Focus | Single client + services | Multiple members |
| Service Assignment | Per staff, then add clients | Per member, inline |
| Summary | Bottom panel, on-demand | Always visible sidebar |
| Best For | Individual appointments | Group events |

## Performance Best Practices

### Component Optimization

The Book module components are optimized for performance using React's built-in optimization tools:

**1. Memoization**
- Critical components like `DaySchedule` are wrapped with `React.memo` to prevent unnecessary re-renders
- Use `useMemo` for expensive computations (date grouping, filtering, sorting)
- Example from DaySchedule.v2:
```tsx
const timeLabels = useMemo(() => generateTimeLabels(), []);
const appointmentsByStaff = useMemo(() => groupAppointmentsByStaff(appointments), [appointments]);
```

**2. useCallback for Event Handlers**
When using Book components, wrap event handlers with `useCallback` to prevent child re-renders:

```tsx
import { useCallback } from 'react';

function MyCalendar() {
  const handleAppointmentClick = useCallback((appointment: LocalAppointment) => {
    console.log('Clicked:', appointment.id);
  }, []); // Empty deps if handler doesn't use external state

  const handleTimeSlotClick = useCallback((staffId: string, time: Date) => {
    openBookingModal(staffId, time);
  }, [openBookingModal]); // Include dependencies

  return (
    <DaySchedule
      appointments={appointments}
      staff={staff}
      onAppointmentClick={handleAppointmentClick}
      onTimeSlotClick={handleTimeSlotClick}
    />
  );
}
```

**3. Key Props**
All list renders use proper `key` props for optimal reconciliation:
- Appointment lists use `appointment.id`
- Date groups use `dateString`
- Staff columns use `staff.id`

**4. Avoid Inline Functions**
❌ **Bad** (creates new function on every render):
```tsx
<DaySchedule onAppointmentClick={(apt) => handleClick(apt)} />
```

✅ **Good** (stable reference):
```tsx
const handleClick = useCallback((apt) => {
  // handle click
}, []);
<DaySchedule onAppointmentClick={handleClick} />
```

**5. Lazy Loading**
- Use `selectedDate` and `selectedStaffIds` filters to limit rendered data
- Don't load all appointments at once - fetch by date range
- Example:
```tsx
const visibleAppointments = useMemo(() =>
  appointments.filter(apt =>
    isSameDay(apt.scheduledStartTime, selectedDate)
  ),
  [appointments, selectedDate]
);
```

## Error Handling

### BookErrorBoundary

The Book module includes an error boundary component to gracefully handle runtime errors and prevent the entire application from crashing.

**Usage:**

```tsx
import { BookErrorBoundary } from './components/Book';

function App() {
  return (
    <BookErrorBoundary>
      <DaySchedule {...props} />
      {/* Other calendar components */}
    </BookErrorBoundary>
  );
}
```

**Features:**
- Catches errors in any child component within the Book module
- Displays user-friendly error message with recovery options
- Shows error details in development mode for debugging
- Provides "Try Again" and "Reload Page" recovery options
- Logs errors to console (can be extended to send to error tracking service)

**Custom Fallback UI:**

```tsx
<BookErrorBoundary
  fallback={
    <div>Custom error message</div>
  }
>
  {/* Components */}
</BookErrorBoundary>
```

## Contributing

When adding new features to the Book module:

1. Follow the established architecture patterns
2. Maintain z-index hierarchy (10, 30, 40)
3. Use conditional rendering over overlays
4. Add TypeScript types for all props
5. Include error handling and wrap critical components in error boundaries
6. Update this documentation

## Related Modules

- **FrontDesk**: Walk-in ticket management
- **Clients**: Client database and profiles
- **Staff**: Staff management and scheduling
- **Services**: Service catalog and pricing

---

**Last Updated:** 2025-11-06
**Version:** 3.1 (Added GroupBookingModal)
**Maintainer:** Development Team
