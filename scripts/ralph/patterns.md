# Persistent Codebase Patterns

> Patterns accumulated across all Ralph runs. This file is never deleted - patterns persist across different PRDs/features.

---

## Monorepo Structure

- Main apps: `apps/store-app`, `apps/mango-pad`, `apps/checkin-app`, `apps/online-store`
- Shared packages: `packages/`
- Use `npm run typecheck` from app directories (each app has its own tsconfig)

## MQTT Communication

- Store App runs local Mosquitto broker
- Cloud broker at HiveMQ/EMQX for fallback
- Topic pattern: `salon/{salonId}/station/{stationId}/{resource}`
- Use QoS 1 for important messages, QoS 0 for heartbeats

## Redux & Data Flow

- All state management via Redux Toolkit
- Use `dataService` for data operations (routes to Supabase or IndexedDB)
- Never call Supabase or IndexedDB directly from components

## Styling

- Use design tokens from `src/design-system/`
- Tailwind CSS with Radix UI components
- Module-specific tokens: `src/design-system/modules/`

---

<!-- Ralph appends learnings below -->

## From ralph/frontdesk-fixes (2026-01-14)

### Staff ID Matching Pattern (CRITICAL)
UITicket can match staff via THREE different fields - check all:
```typescript
const staffTicket = serviceTickets.find(t =>
  String(t.techId) === String(staff.id) ||
  String(t.staffId) === String(staff.id) ||
  String(t.assignedTo?.id) === String(staff.id)
);
```

### Module Splitting Strategy
1. **Start with hooks before components** - less risky, easier to verify
2. **Create module infrastructure first** without modifying main file
3. **Phase approach** for large files (1000+ lines):
   - Phase 1: Extract types, constants, barrel exports
   - Phase 2: Extract hooks (useStaffTicketInfo, useStaffAppointments)
   - Phase 3: Extract utility functions (gridHelpers, staffHelpers)
   - Phase 4: Extract sub-components (Header, StatusPills, etc.)
4. **Target: <300 lines** but 40-50% reduction is acceptable for complex components

### Dual Settings Architecture
StaffSidebar has TWO settings sources that must stay in sync:
- `teamSettings` - JSON object in localStorage key `teamSettings`
- Redux `viewState` - Individual localStorage keys (`staffSidebarWidth`, etc.)

Pattern: On page load, sync `teamSettings.viewWidth` → Redux:
```typescript
useEffect(() => {
  if (teamSettings?.viewWidth) {
    dispatch(setStaffSidebarWidthSettings(teamSettings.viewWidth));
  }
}, []);
```

### useModalStack Hook Pattern
For components with multiple modals, consolidate with a custom hook:
```typescript
const {
  showTeamSettings, setShowTeamSettings,
  showStaffNote, openStaffNote, closeStaffNote,
  selectedStaffForNote,
} = useModalStack();
```
Key: Provide BOTH setter-style API (`setShowX`) AND typed methods (`openX/closeX`) for compatibility.

### Type-Safe Custom Events
Extend global WindowEventMap for type-safe custom events:
```typescript
// types.ts
export interface StaffSidebarCustomEvents {
  'open-turn-tracker': Event;
}

declare global {
  interface WindowEventMap extends StaffSidebarCustomEvents {}
}

export function dispatchStaffSidebarEvent<K extends keyof StaffSidebarCustomEvents>(
  eventName: K
): void {
  window.dispatchEvent(new Event(eventName));
}
```

### Mobile Responsiveness Patterns
- MobileTeamSection `busyStatus` mode needs ALL status groups (Ready, Busy, **Off**)
- Staff with "off" status won't show if only Ready/Busy sections rendered
- Use `Sheet side="bottom"` for mobile action sheets (better UX than dropdown)

### Testing Redux Hooks
```typescript
// Use mock reducers returning fixed state
const store = configureStore({
  reducer: {
    uiTickets: () => mockTicketsState,
    appointments: () => mockAppointmentsState,
  },
});
const wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;
const { result } = renderHook(() => useStaffTicketInfo(), { wrapper });
```

### Dead Code Detection Signals
Code silenced with `void` statements is a clear signal for cleanup:
```typescript
// BAD - these are dead code waiting to be deleted
void _saveOriginalWidth;
void [_WaitListItem, _MinimizedWaitListItem];
```
Search for `void _` and `void [` patterns to find cleanup opportunities.

### PRD vs Code Reality
- PRD notes can become outdated when work is done across multiple iterations
- **Always verify current implementation before assuming work is needed**
- Check git history when PRD line numbers don't match current file
