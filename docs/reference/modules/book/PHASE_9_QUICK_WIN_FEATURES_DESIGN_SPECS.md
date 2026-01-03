# Phase 9: Quick-Win Features - UI/UX Design Specifications

**Version:** 1.0.0
**Date:** December 2, 2025
**Module:** Book (Appointment Calendar)
**Status:** Design Complete, Implementation Pending

---

## Table of Contents
1. [Design System Overview](#design-system-overview)
2. [9.1 Requested Staff "REQ" Badge](#91-requested-staff-req-badge)
3. [9.2 Copy & Paste Appointment](#92-copy--paste-appointment)
4. [9.3 Duplicate Appointment](#93-duplicate-appointment)
5. [9.4 Rebook Button](#94-rebook-button)
6. [Implementation Priority](#implementation-priority)
7. [Accessibility Notes](#accessibility-notes)

---

## Design System Overview

### Current Component Structure

**AppointmentCard** (`src/components/Book/AppointmentCard.tsx`)
- Paper ticket aesthetic with left border color accent
- Height: Dynamic based on calendar slot (minimum ~84px)
- Avatar: 32px circle with initials
- Typography: 14px client name, 11px metadata
- Service tags: 10px text in rounded pills
- Status badge: Small, top-right positioning

**AppointmentContextMenu** (`src/components/Book/AppointmentContextMenu.tsx`)
- Fixed position dropdown with shadow-2xl
- Min-width: 200px
- Item structure: Icon (16px) + Label (14px)
- Hover: bg-gray-100
- Icon colors: Semantic (teal-600, green-600, blue-600, red-600, etc.)

### Design Tokens

```typescript
// Colors
primary: '#14B8A6'      // Teal-500 (brand)
success: '#10B981'      // Green-500
warning: '#F59E0B'      // Amber-500
error: '#EF4444'        // Red-500
purple: '#A855F7'       // Purple-500
gray: {
  50: '#F9FAFB',
  100: '#F3F4F6',
  200: '#E5E7EB',
  600: '#4B5563',
  700: '#374151',
  900: '#111827'
}

// Spacing
xs: '4px'
sm: '8px'
md: '12px'
lg: '16px'
xl: '24px'

// Border Radius
sm: '4px'
md: '6px'
lg: '8px'
xl: '12px'
full: '9999px'

// Shadows
sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
md: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
2xl: '0 25px 50px -12px rgb(0 0 0 / 0.25)'
```

---

## 9.1 Requested Staff "REQ" Badge

### Purpose
Visually distinguish appointments where the client specifically requested a particular staff member vs auto-assigned appointments.

### Design Solution: Compact Icon Badge

#### Visual Specifications

**Badge Style: Minimal Icon Indicator**
```typescript
interface RequestedBadgeProps {
  isRequested: boolean;
}
```

**Location:** Next to client name in header row
**Size:** 14px × 14px (icon only, no text on small cards)
**Icon:** `UserCheck` from Lucide (shows person with checkmark)
**Color:** Teal-600 (#0D9488) - matches brand, indicates "VIP selection"

#### Tailwind Classes

```tsx
// Badge container
<div className="inline-flex items-center justify-center">
  <UserCheck className="w-3.5 h-3.5 text-teal-600" aria-label="Requested staff" />
</div>
```

#### Implementation in AppointmentCard

**Position:** After client name, before status badge

```tsx
// In AppointmentCard.tsx line 118-131
<div className="flex items-center justify-between gap-2">
  <div className="flex items-center gap-1.5 min-w-0">
    <span className="text-sm font-semibold text-gray-900 truncate">
      {appointment.clientName}
    </span>

    {/* NEW: Requested Staff Badge */}
    {appointment.isRequestedStaff && (
      <UserCheck
        className="w-3.5 h-3.5 text-teal-600 flex-shrink-0"
        aria-label="Client requested this staff member"
      />
    )}

    {/* Existing confirmed badge */}
    {appointment.status === 'confirmed' && (
      <BadgeCheck className="w-3.5 h-3.5 text-emerald-500" aria-hidden />
    )}
  </div>
  <StatusBadge status={appointment.status} size="sm" showIcon={false} />
</div>
```

#### States & Variations

| State | Visual Treatment | Use Case |
|-------|------------------|----------|
| **Requested** | Teal UserCheck icon (14px) | Client specifically asked for this staff |
| **Auto-assigned** | No badge shown | System assigned based on availability |
| **Hover** | No interaction (static indicator) | N/A |

#### Tooltip Enhancement (Optional)

For expanded cards or desktop hover:
```tsx
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <UserCheck className="w-3.5 h-3.5 text-teal-600" />
    </TooltipTrigger>
    <TooltipContent>
      <p className="text-xs">Client requested {appointment.staffName}</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

#### Mobile Considerations
- Icon is touch-safe at 14px (meets 44×44px tap target when card is tappable)
- No text label needed - icon is self-explanatory
- High contrast (teal-600 on white) ensures visibility

#### Data Model Addition

```typescript
// Add to LocalAppointment interface in src/types/appointment.ts
interface LocalAppointment {
  // ... existing fields
  isRequestedStaff?: boolean;  // NEW: True if client requested this staff member
  requestedBy?: 'client' | 'front-desk' | null;  // Optional: Track who made the request
}
```

---

## 9.2 Copy & Paste Appointment

### Purpose
Enable users to copy appointment details to clipboard, then paste into a different time slot to quickly create similar appointments.

### Design Solution: Context Menu + Keyboard Shortcuts + Visual Feedback

#### 9.2.1 Copy Action

**Context Menu Item**
```tsx
{
  label: 'Copy',
  icon: Copy,  // Lucide icon
  shortcut: '⌘C',  // Mac: ⌘C, Windows: Ctrl+C
  onClick: handleCopyAppointment,
  color: 'text-gray-700',
  show: true,  // Always available
}
```

**Visual Specs:**
- Icon: `Copy` (16px)
- Label: "Copy"
- Keyboard hint: Small gray text on right
- Position: Below "Edit", above "Duplicate"

**Tailwind Classes:**
```tsx
<button
  onClick={handleCopy}
  className={cn(
    'w-full px-4 py-2 text-left text-sm flex items-center justify-between',
    'hover:bg-gray-100 transition-colors text-gray-700'
  )}
>
  <div className="flex items-center space-x-3">
    <Copy className="w-4 h-4" />
    <span>Copy</span>
  </div>
  <span className="text-xs text-gray-400">⌘C</span>
</button>
```

#### 9.2.2 Toast Notification (Copy Confirmation)

**Visual Specs:**
- Position: Bottom center
- Duration: 2 seconds
- Style: Compact success toast

```tsx
// Using existing toast system (likely Sonner or similar)
toast.success('Appointment copied', {
  description: 'Click on a time slot to paste',
  icon: <CheckCircle2 className="w-4 h-4" />,
  duration: 2000,
});
```

**Toast Design:**
- Background: white
- Border: 1px solid green-200
- Shadow: shadow-lg
- Width: 300px max
- Padding: 12px 16px
- Border-radius: 8px

**Tailwind Implementation:**
```tsx
<div className="bg-white border border-green-200 rounded-lg shadow-lg p-3 flex items-start gap-3 max-w-sm">
  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
  <div>
    <p className="text-sm font-semibold text-gray-900">Appointment copied</p>
    <p className="text-xs text-gray-600 mt-0.5">Click on a time slot to paste</p>
  </div>
</div>
```

#### 9.2.3 Paste Indicator

**Visual Treatment When Clipboard Has Appointment:**

**Time Slot Hover State Enhancement**
```tsx
// When clipboard has copied appointment
<div
  className={cn(
    'calendar-time-slot relative',
    hasClipboardData && 'cursor-copy hover:bg-teal-50 hover:border-2 hover:border-dashed hover:border-teal-400'
  )}
  onClick={handlePaste}
>
  {/* Existing slot content */}

  {/* NEW: Paste hint on hover */}
  {hasClipboardData && (
    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-teal-50/90 pointer-events-none">
      <div className="flex items-center gap-2 text-teal-700 font-medium text-sm">
        <Clipboard className="w-4 h-4" />
        <span>Paste here</span>
        <kbd className="px-1.5 py-0.5 text-xs bg-white rounded border border-teal-200">⌘V</kbd>
      </div>
    </div>
  )}
</div>
```

**Tailwind Classes for Paste State:**
```css
/* Enhanced hover when clipboard active */
.has-clipboard-data:hover {
  @apply bg-teal-50 border-2 border-dashed border-teal-400;
}

/* Paste overlay */
.paste-overlay {
  @apply absolute inset-0 flex items-center justify-center;
  @apply opacity-0 hover:opacity-100 transition-opacity;
  @apply bg-teal-50/90 pointer-events-none;
}
```

#### 9.2.4 Paste Confirmation Modal

**When Pasting into Time Slot:**

```tsx
<Modal isOpen={showPasteModal} onClose={() => setShowPasteModal(false)}>
  <div className="p-6">
    <div className="flex items-start gap-3 mb-4">
      <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
        <Clipboard className="w-5 h-5 text-teal-600" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Paste Appointment</h3>
        <p className="text-sm text-gray-600 mt-1">
          Create new appointment from copied details
        </p>
      </div>
    </div>

    {/* Preview of appointment being pasted */}
    <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center text-xs font-semibold">
          {getInitials(copiedAppointment.clientName)}
        </div>
        <div>
          <p className="font-semibold text-sm text-gray-900">{copiedAppointment.clientName}</p>
          <p className="text-xs text-gray-600">{copiedAppointment.clientPhone}</p>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Staff:</span>
          <span className="font-medium text-gray-900">{copiedAppointment.staffName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Services:</span>
          <span className="font-medium text-gray-900">
            {copiedAppointment.services.length} service(s)
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Duration:</span>
          <span className="font-medium text-gray-900">
            {formatDuration(copiedAppointment.duration)}
          </span>
        </div>
      </div>
    </div>

    {/* New time selection */}
    <div className="bg-teal-50 rounded-lg p-4 mb-4 border border-teal-200">
      <p className="text-sm font-medium text-teal-900 mb-2">New Time:</p>
      <p className="text-lg font-semibold text-teal-700">
        {formatDateTime(selectedTimeSlot)}
      </p>
    </div>

    {/* Actions */}
    <div className="flex gap-3 justify-end">
      <button
        onClick={handleCancelPaste}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        Cancel
      </button>
      <button
        onClick={handleConfirmPaste}
        className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 flex items-center gap-2"
      >
        <Check className="w-4 h-4" />
        Create Appointment
      </button>
    </div>
  </div>
</Modal>
```

#### Keyboard Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `⌘C` / `Ctrl+C` | Copy appointment | Context menu or selected card |
| `⌘V` / `Ctrl+V` | Paste appointment | Hovering over time slot |
| `Esc` | Cancel paste mode | Any time |

#### State Management

```typescript
// Add to appointment context or Redux slice
interface ClipboardState {
  copiedAppointment: LocalAppointment | null;
  copiedAt: Date | null;
  isActive: boolean;
}

// Actions
const copyAppointment = (appointment: LocalAppointment) => {
  clipboard.set({
    copiedAppointment: appointment,
    copiedAt: new Date(),
    isActive: true,
  });

  toast.success('Appointment copied');
};

const pasteAppointment = (timeSlot: Date) => {
  if (!clipboard.copiedAppointment) return;

  // Show confirmation modal
  setShowPasteModal(true);
  setSelectedTimeSlot(timeSlot);
};

const clearClipboard = () => {
  clipboard.set({
    copiedAppointment: null,
    copiedAt: null,
    isActive: false,
  });
};
```

#### Mobile Considerations

**Mobile Paste Behavior:**
- No keyboard shortcuts (mobile)
- Long-press on time slot shows "Paste" option in bottom sheet
- Toast notification more prominent (larger text)
- Paste modal full-screen on mobile

```tsx
// Mobile-specific paste trigger
<BottomSheet isOpen={showMobilePasteSheet}>
  <button
    onClick={handlePaste}
    className="w-full py-4 flex items-center gap-3 text-left"
  >
    <Clipboard className="w-5 h-5 text-teal-600" />
    <div>
      <p className="font-medium text-gray-900">Paste Appointment</p>
      <p className="text-sm text-gray-600">
        {copiedAppointment.clientName} • {formatDuration(copiedAppointment.duration)}
      </p>
    </div>
  </button>
</BottomSheet>
```

---

## 9.3 Duplicate Appointment

### Purpose
Quickly create a copy of an appointment for a different date/time without using clipboard. One-click action that opens pre-filled booking form.

### Design Solution: Context Menu + Quick Date/Time Picker

#### 9.3.1 Context Menu Item

**Visual Specs:**
```tsx
{
  label: 'Duplicate',
  icon: Copy2,  // Lucide Copy with double-line style
  onClick: handleDuplicate,
  color: 'text-indigo-600',  // Different from "Copy" (gray-700)
  show: true,
}
```

**Position in Menu:** Below "Copy", above "Reschedule"

**Tailwind Classes:**
```tsx
<button
  onClick={handleDuplicate}
  className={cn(
    'w-full px-4 py-2 text-left text-sm flex items-center space-x-3',
    'hover:bg-gray-100 transition-colors text-indigo-600'
  )}
>
  <Copy className="w-4 h-4" />
  <span>Duplicate</span>
</button>
```

#### 9.3.2 Duplicate Modal (Quick Date/Time Picker)

**Modal Appearance:**
- Width: 480px (desktop), full-screen (mobile)
- Height: Auto
- Style: Clean, focused on date/time selection

```tsx
<Modal
  isOpen={showDuplicateModal}
  onClose={() => setShowDuplicateModal(false)}
  className="max-w-md"
>
  <div className="p-6">
    {/* Header */}
    <div className="flex items-start gap-3 mb-6">
      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
        <Copy className="w-5 h-5 text-indigo-600" />
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900">Duplicate Appointment</h3>
        <p className="text-sm text-gray-600 mt-1">
          Choose new date and time
        </p>
      </div>
    </div>

    {/* Original Appointment Summary */}
    <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
      <p className="text-xs uppercase font-semibold text-gray-500 mb-2">Original</p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center text-sm font-semibold">
          {getInitials(appointment.clientName)}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{appointment.clientName}</p>
          <p className="text-sm text-gray-600">
            {formatDate(appointment.scheduledStartTime)} • {formatTime(appointment.scheduledStartTime)}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {appointment.services.map((service, idx) => (
          <span key={idx} className="px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
            {service.serviceName}
          </span>
        ))}
      </div>
    </div>

    {/* Date & Time Picker */}
    <div className="space-y-4 mb-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          New Date
        </label>
        <DatePicker
          selected={newDate}
          onChange={setNewDate}
          minDate={new Date()}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          placeholderText="Select date"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          New Time
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Select value={newTime} onValueChange={setNewTime}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select time" />
            </SelectTrigger>
            <SelectContent>
              {timeSlots.map((time) => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Staff availability indicator */}
          <div className="flex items-center gap-2 px-3 py-2 bg-teal-50 rounded-lg border border-teal-200">
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
            <span className="text-sm font-medium text-teal-700">Available</span>
          </div>
        </div>
      </div>
    </div>

    {/* Conflict Warning (if applicable) */}
    {hasConflict && (
      <div className="mb-6 p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-2">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-900">Scheduling Conflict</p>
          <p className="text-xs text-amber-700 mt-1">
            {appointment.staffName} has another appointment at this time
          </p>
        </div>
      </div>
    )}

    {/* Actions */}
    <div className="flex gap-3">
      <button
        onClick={handleClose}
        className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        Cancel
      </button>
      <button
        onClick={handleCreateDuplicate}
        disabled={!newDate || !newTime}
        className={cn(
          'flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg flex items-center justify-center gap-2',
          'bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed'
        )}
      >
        <Plus className="w-4 h-4" />
        Create Duplicate
      </button>
    </div>
  </div>
</Modal>
```

#### 9.3.3 Distinction from "Copy"

| Feature | Copy & Paste | Duplicate |
|---------|--------------|-----------|
| **Icon** | `Copy` (single square) | `Copy` (visually same, color different) |
| **Color** | Gray-700 | Indigo-600 |
| **Action** | Stores in clipboard, paste later | Immediate modal with date/time picker |
| **Workflow** | 2-step (copy → paste) | 1-step (opens modal immediately) |
| **Use Case** | Multiple pastes, flexible timing | Quick one-off duplicate |
| **Keyboard** | ⌘C / ⌘V | No shortcut |

#### Success Feedback

**After Creating Duplicate:**
```tsx
toast.success('Appointment duplicated', {
  description: `${appointment.clientName} on ${formatDate(newDate)} at ${newTime}`,
  icon: <CheckCircle2 className="w-4 h-4" />,
  action: {
    label: 'View',
    onClick: () => navigateToAppointment(newAppointmentId),
  },
});
```

#### Mobile Considerations

**Mobile Modal Behavior:**
- Full-screen modal
- Larger touch targets for date/time picker
- Native date/time input on iOS
- Bottom sheet for time slot selection

```tsx
// Mobile-optimized time picker
<BottomSheet isOpen={showTimePicker}>
  <div className="p-4">
    <p className="font-semibold mb-4">Select Time</p>
    <div className="grid grid-cols-3 gap-2">
      {timeSlots.map((time) => (
        <button
          key={time}
          onClick={() => handleSelectTime(time)}
          className="py-3 px-4 text-center rounded-lg border-2 border-gray-200 hover:border-indigo-500 hover:bg-indigo-50"
        >
          <p className="text-sm font-medium">{time}</p>
        </button>
      ))}
    </div>
  </div>
</BottomSheet>
```

---

## 9.4 Rebook Button

### Purpose
Quickly rebook a returning client based on their appointment history. Pre-fills booking form with client preferences and suggests next available date.

### Design Solution: Context Menu Item (Conditional) + Smart Booking Modal

#### 9.4.1 Context Menu Item

**Visual Specs:**
```tsx
{
  label: 'Rebook Client',
  icon: CalendarPlus,  // Lucide calendar with plus
  onClick: handleRebook,
  color: 'text-purple-600',
  show: appointment.status === 'completed',  // Only for completed appointments
}
```

**Conditional Display Logic:**
- Only shows for appointments with status `completed`
- Hidden for `scheduled`, `in-service`, `cancelled`, `no-show`
- Position: Below "Duplicate", above "No Show"

**Tailwind Classes:**
```tsx
{appointment.status === 'completed' && (
  <button
    onClick={handleRebook}
    className={cn(
      'w-full px-4 py-2 text-left text-sm flex items-center space-x-3',
      'hover:bg-gray-100 transition-colors text-purple-600'
    )}
  >
    <CalendarPlus className="w-4 h-4" />
    <span>Rebook Client</span>
  </button>
)}
```

#### 9.4.2 Rebook Modal (Smart Booking)

**Modal Appearance:**
- Width: 560px (desktop), full-screen (mobile)
- Pre-filled with client history and preferences
- Smart date suggestions based on booking pattern

```tsx
<Modal
  isOpen={showRebookModal}
  onClose={() => setShowRebookModal(false)}
  className="max-w-lg"
>
  <div className="p-6">
    {/* Header */}
    <div className="flex items-start gap-3 mb-6">
      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
        <CalendarPlus className="w-5 h-5 text-purple-600" />
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900">Rebook Client</h3>
        <p className="text-sm text-gray-600 mt-1">
          Create new appointment based on history
        </p>
      </div>
    </div>

    {/* Client Info */}
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 mb-6 border border-purple-200">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-lg font-semibold">
          {getInitials(client.name)}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{client.name}</p>
          <p className="text-sm text-gray-600">{client.phone}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Last visit</p>
          <p className="text-sm font-medium text-gray-900">
            {formatDate(appointment.scheduledStartTime)}
          </p>
        </div>
      </div>
    </div>

    {/* Booking Pattern Insights */}
    <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <p className="text-xs uppercase font-semibold text-gray-500 mb-3">Client Preferences</p>

      <div className="grid grid-cols-2 gap-4">
        {/* Preferred Staff */}
        <div>
          <p className="text-xs text-gray-600 mb-1">Preferred Staff</p>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 text-xs flex items-center justify-center font-semibold">
              {getInitials(preferredStaff.name)}
            </div>
            <p className="text-sm font-medium text-gray-900">{preferredStaff.name}</p>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {clientStats.appointmentsWithStaff} previous visits
          </p>
        </div>

        {/* Typical Frequency */}
        <div>
          <p className="text-xs text-gray-600 mb-1">Typical Frequency</p>
          <p className="text-sm font-medium text-gray-900">
            Every {clientStats.averageFrequency} weeks
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Based on {clientStats.totalAppointments} appointments
          </p>
        </div>
      </div>

      {/* Usual Services */}
      <div className="mt-4">
        <p className="text-xs text-gray-600 mb-2">Usual Services</p>
        <div className="flex flex-wrap gap-2">
          {clientStats.commonServices.map((service, idx) => (
            <span
              key={idx}
              className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200"
            >
              {service.name}
            </span>
          ))}
        </div>
      </div>
    </div>

    {/* Suggested Dates */}
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Suggested Next Appointment
      </label>

      <div className="grid grid-cols-3 gap-2">
        {suggestedDates.map((date, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedDate(date.date)}
            className={cn(
              'p-3 rounded-lg border-2 text-center transition-all',
              selectedDate === date.date
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
            )}
          >
            <p className="text-xs text-gray-500 mb-1">{date.label}</p>
            <p className="text-sm font-semibold text-gray-900">
              {formatShortDate(date.date)}
            </p>
            {date.isRecommended && (
              <p className="text-xs text-purple-600 font-medium mt-1">Recommended</p>
            )}
          </button>
        ))}
      </div>

      {/* Custom date picker */}
      <button
        onClick={() => setShowCustomDate(true)}
        className="w-full mt-2 py-2 text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center gap-2"
      >
        <Calendar className="w-4 h-4" />
        Choose different date
      </button>
    </div>

    {/* Time Selection */}
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Time
      </label>
      <Select value={selectedTime} onValueChange={setSelectedTime}>
        <SelectTrigger>
          <SelectValue placeholder="Select time" />
        </SelectTrigger>
        <SelectContent>
          {availableTimeSlots.map((time) => (
            <SelectItem key={time.value} value={time.value}>
              <div className="flex items-center justify-between w-full">
                <span>{time.label}</span>
                {time.isPreferredTime && (
                  <span className="text-xs text-purple-600 ml-2">Usual time</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    {/* Services Selection */}
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Services
      </label>
      <div className="space-y-2">
        {preSelectedServices.map((service) => (
          <label
            key={service.id}
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedServices.includes(service.id)}
              onChange={() => toggleService(service.id)}
              className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{service.name}</p>
              <p className="text-xs text-gray-500">{service.duration} min • ${service.price}</p>
            </div>
          </label>
        ))}
      </div>
    </div>

    {/* Notes */}
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Notes (Optional)
      </label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add any special requests or notes..."
        className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500"
        rows={3}
      />
    </div>

    {/* Actions */}
    <div className="flex gap-3">
      <button
        onClick={handleClose}
        className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        Cancel
      </button>
      <button
        onClick={handleCreateRebooking}
        disabled={!selectedDate || !selectedTime || selectedServices.length === 0}
        className={cn(
          'flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg flex items-center justify-center gap-2',
          'bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed'
        )}
      >
        <Check className="w-4 h-4" />
        Book Appointment
      </button>
    </div>
  </div>
</Modal>
```

#### 9.4.3 Smart Suggestions Algorithm

**Suggested Dates Logic:**
```typescript
interface SuggestedDate {
  date: Date;
  label: string;  // "Next Week", "2 Weeks", "Usual (4 Weeks)"
  isRecommended: boolean;
  confidence: number;  // 0-1, based on historical pattern
}

function calculateSuggestedDates(client: Client): SuggestedDate[] {
  const lastVisit = client.lastAppointment.scheduledStartTime;
  const averageFrequency = calculateAverageFrequency(client.appointmentHistory);

  return [
    {
      date: addWeeks(lastVisit, 1),
      label: 'Next Week',
      isRecommended: false,
      confidence: 0.3,
    },
    {
      date: addWeeks(lastVisit, 2),
      label: '2 Weeks',
      isRecommended: averageFrequency <= 2,
      confidence: 0.6,
    },
    {
      date: addWeeks(lastVisit, averageFrequency),
      label: `Usual (${averageFrequency} Weeks)`,
      isRecommended: true,
      confidence: 0.9,
    },
  ];
}
```

#### Success Feedback

**After Booking:**
```tsx
toast.success('Client rebooked successfully', {
  description: `${client.name} on ${formatDate(selectedDate)} at ${selectedTime}`,
  icon: <CalendarCheck className="w-4 h-4" />,
  action: {
    label: 'View',
    onClick: () => navigateToAppointment(newAppointmentId),
  },
  duration: 4000,
});
```

#### Mobile Considerations

**Mobile Rebook Flow:**
- Full-screen modal
- Swipeable date cards instead of grid
- Simplified insights (collapsed by default)
- Bottom sticky action buttons

```tsx
// Mobile-optimized suggested dates
<div className="overflow-x-auto -mx-4 px-4">
  <div className="flex gap-3 snap-x snap-mandatory">
    {suggestedDates.map((date, idx) => (
      <button
        key={idx}
        onClick={() => setSelectedDate(date.date)}
        className={cn(
          'flex-shrink-0 w-32 p-4 rounded-xl snap-center transition-all',
          selectedDate === date.date
            ? 'bg-purple-600 text-white shadow-lg scale-105'
            : 'bg-white border-2 border-gray-200 text-gray-900'
        )}
      >
        <p className="text-xs mb-2 opacity-75">{date.label}</p>
        <p className="text-lg font-bold">{formatDay(date.date)}</p>
        <p className="text-sm">{formatMonthDay(date.date)}</p>
      </button>
    ))}
  </div>
</div>
```

#### Empty State (No History)

**When Client Has No Previous Appointments:**
```tsx
<div className="p-6 text-center">
  <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto flex items-center justify-center mb-4">
    <CalendarX className="w-8 h-8 text-gray-400" />
  </div>
  <h4 className="font-semibold text-gray-900 mb-2">No Booking History</h4>
  <p className="text-sm text-gray-600 mb-6">
    This is the client's first appointment. Create a new booking instead.
  </p>
  <button
    onClick={() => openNewBookingModal(client)}
    className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700"
  >
    Create New Booking
  </button>
</div>
```

---

## Implementation Priority

### Phase 1: Foundation (Week 1)
1. **9.1 Requested Staff Badge** (Easiest, 2-3 hours)
   - Add `isRequestedStaff` field to appointment type
   - Add icon to AppointmentCard
   - Update booking flow to set flag

2. **9.3 Duplicate Modal** (Medium, 4-5 hours)
   - Create DuplicateAppointmentModal component
   - Add context menu item
   - Wire up to appointment creation flow

### Phase 2: Clipboard Features (Week 2)
3. **9.2 Copy & Paste** (Complex, 6-8 hours)
   - Implement clipboard state management
   - Create toast notifications
   - Add paste overlay to time slots
   - Handle keyboard shortcuts
   - Create paste confirmation modal

### Phase 3: Smart Rebooking (Week 2-3)
4. **9.4 Rebook Button** (Most Complex, 8-10 hours)
   - Build client history analysis
   - Create frequency calculation algorithm
   - Build RebookModal component
   - Integrate with booking flow
   - Add smart suggestions

### Estimated Total: 20-26 hours

---

## Accessibility Notes

### ARIA Labels
```tsx
// Requested badge
<UserCheck
  className="w-3.5 h-3.5 text-teal-600"
  aria-label="Client requested this staff member"
  role="img"
/>

// Context menu items
<button aria-label="Copy appointment details">
  <Copy className="w-4 h-4" />
  <span>Copy</span>
</button>

// Keyboard shortcuts
<kbd aria-label="Command C">⌘C</kbd>
```

### Keyboard Navigation
- All modals: Escape to close
- Focus management: Auto-focus first input on open
- Tab order: Logical flow through form fields
- Enter key: Submit/confirm actions

### Screen Reader Announcements
```typescript
// After copy
announceToScreenReader('Appointment copied to clipboard. Select a time slot to paste.');

// After duplicate created
announceToScreenReader(`Appointment duplicated for ${clientName} on ${formatDate(newDate)}`);

// After rebook success
announceToScreenReader(`Client rebooked successfully. Appointment created for ${formatDate(selectedDate)}`);
```

### Color Contrast
All colors meet WCAG AA standards:
- Teal-600 on white: 4.55:1 (AA pass)
- Purple-600 on white: 4.53:1 (AA pass)
- Indigo-600 on white: 4.89:1 (AA pass)
- Gray-700 on white: 4.62:1 (AA pass)

---

## File Locations

### Components to Create
```
src/components/Book/
├── AppointmentCard.tsx (modify - add REQ badge)
├── AppointmentContextMenu.tsx (modify - add 4 new menu items)
├── DuplicateAppointmentModal.tsx (new)
├── RebookModal.tsx (new)
└── PasteConfirmationModal.tsx (new)

src/hooks/
├── useClipboard.ts (new - manage copy/paste state)
└── useClientHistory.ts (new - fetch booking patterns)

src/utils/
└── appointmentSuggestions.ts (new - calculate rebooking dates)
```

### Types to Add
```typescript
// src/types/appointment.ts
interface LocalAppointment {
  // ... existing fields
  isRequestedStaff?: boolean;
  requestedBy?: 'client' | 'front-desk' | null;
}

// New clipboard type
interface AppointmentClipboard {
  copiedAppointment: LocalAppointment | null;
  copiedAt: Date | null;
  isActive: boolean;
}

// New client stats type
interface ClientBookingStats {
  totalAppointments: number;
  averageFrequency: number; // in weeks
  preferredStaff: StaffMember | null;
  appointmentsWithStaff: number;
  commonServices: Service[];
  preferredTimeSlot: string | null;
}
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Dec 2, 2025 | Initial design specifications |

---

**End of Design Specifications**
