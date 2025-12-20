# Book Module Touchup - Usage Examples

**Date:** November 18, 2025
**Status:** Ready to Use

This document shows how to use the new utility classes and components we've created for the Book module touchups.

---

## CSS UTILITY CLASSES

### Buttons

#### Primary Button
```tsx
// Before
<button className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700">
  Book Appointment
</button>

// After - Much simpler!
<button className="btn-primary">
  Book Appointment
</button>
```

#### Secondary Button
```tsx
<button className="btn-secondary">
  Cancel
</button>
```

#### Ghost Button
```tsx
<button className="btn-ghost">
  Skip
</button>
```

#### Danger Button
```tsx
<button className="btn-danger">
  Delete
</button>
```

#### Button Sizes
```tsx
<button className="btn-primary btn-sm">Small</button>
<button className="btn-primary">Default</button>
<button className="btn-primary btn-lg">Large</button>
```

#### Icon Only Button
```tsx
<button className="btn-icon" aria-label="Close">
  <X className="w-5 h-5" />
</button>
```

#### Loading Button
```tsx
<button className={cn('btn-primary', isLoading && 'btn-loading')} disabled={isLoading}>
  {isLoading ? 'Booking...' : 'Book Appointment'}
</button>
```

---

### Cards

#### Standard Card
```tsx
// Before
<div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
  {/* content */}
</div>

// After
<div className="book-card">
  {/* content */}
</div>
```

#### Compact Card
```tsx
<div className="book-card-compact">
  {/* content with less padding */}
</div>
```

#### Clickable Card
```tsx
<div className="book-card-clickable" onClick={() => handleClick()}>
  {/* content - has hover effects */}
</div>
```

---

### Inputs

#### Standard Input
```tsx
<input
  type="text"
  className="book-input"
  placeholder="Client name"
/>
```

#### Input with Error
```tsx
<input
  type="email"
  className={cn('book-input', error && 'book-input-error')}
  placeholder="Email"
/>
{error && <p className="text-sm text-red-600 mt-1">{error}</p>}
```

#### Input with Success
```tsx
<input
  type="text"
  className="book-input book-input-success"
  placeholder="Phone number"
/>
```

---

### Badges

```tsx
<span className="badge badge-primary">New</span>
<span className="badge badge-success">Confirmed</span>
<span className="badge badge-warning">Pending</span>
<span className="badge badge-danger">Cancelled</span>
<span className="badge badge-info">Info</span>
```

---

### Status Dots

```tsx
<div className="flex items-center gap-2">
  <span className="status-dot status-dot-online" />
  <span className="text-sm">Online</span>
</div>

<div className="flex items-center gap-2">
  <span className="status-dot status-dot-busy" />
  <span className="text-sm">Busy</span>
</div>
```

---

### Transitions

#### Smooth Transition
```tsx
<div className="book-card transition-smooth">
  {/* Smoothly transitions all properties */}
</div>
```

#### Fast Transition
```tsx
<button className="btn-primary transition-fast">
  {/* Faster transitions for buttons */}
</button>
```

#### Hover Lift
```tsx
<div className="book-card hover-lift">
  {/* Lifts up on hover */}
</div>
```

---

### Text Truncation

#### Single Line
```tsx
<p className="truncate">
  This very long text will be truncated with ellipsis...
</p>
```

#### Two Lines
```tsx
<p className="truncate-2-lines">
  This longer text will be truncated at two lines with an ellipsis at the end...
</p>
```

#### Three Lines
```tsx
<p className="truncate-3-lines">
  This even longer text will be truncated at three lines...
</p>
```

---

### Dividers

```tsx
{/* Horizontal divider */}
<div className="divider" />

{/* Vertical divider */}
<div className="flex items-center">
  <span>Item 1</span>
  <div className="divider-vertical" />
  <span>Item 2</span>
</div>
```

---

### Empty States

```tsx
<div className="empty-state">
  <Calendar className="empty-state-icon" />
  <h3 className="text-lg font-semibold mb-2">No appointments</h3>
  <p className="text-gray-500 mb-4">There are no appointments scheduled for today.</p>
  <button className="btn-primary">Create Appointment</button>
</div>
```

---

## REACT COMPONENTS

### Skeleton Loading

#### Basic Skeleton
```tsx
import { Skeleton } from '@/components/common/Skeleton';

<Skeleton className="h-4 w-full" />
<Skeleton className="h-8 w-48" />
```

#### Skeleton Text
```tsx
import { SkeletonText } from '@/components/common/Skeleton';

<SkeletonText lines={3} />
```

#### Skeleton Card
```tsx
import { SkeletonCard } from '@/components/common/Skeleton';

<SkeletonCard />
```

#### Skeleton Circle (Avatar)
```tsx
import { SkeletonCircle } from '@/components/common/Skeleton';

<SkeletonCircle size="md" />
```

#### Appointment Card Skeleton
```tsx
import { AppointmentCardSkeleton } from '@/components/common/Skeleton';

function AppointmentList() {
  if (loading) {
    return (
      <div className="space-y-2">
        <AppointmentCardSkeleton />
        <AppointmentCardSkeleton />
        <AppointmentCardSkeleton />
      </div>
    );
  }

  return <div>{/* Real appointments */}</div>;
}
```

#### Calendar Skeleton
```tsx
import { CalendarSkeleton } from '@/components/common/Skeleton';

function DayView() {
  if (loading) {
    return <CalendarSkeleton />;
  }

  return <div>{/* Calendar */}</div>;
}
```

---

### Confirm Dialog

#### Basic Usage
```tsx
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useState } from 'react';
import toast from 'react-hot-toast';

function AppointmentDetails() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteAppointment(appointmentId);
      toast.success('Appointment deleted successfully');
      setShowDeleteConfirm(false);
      // Navigate away or refresh
    } catch (error) {
      toast.error('Failed to delete appointment');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        className="btn-danger"
        onClick={() => setShowDeleteConfirm(true)}
      >
        Delete
      </button>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Appointment"
        message="Are you sure you want to delete this appointment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={isDeleting}
      />
    </>
  );
}
```

#### Warning Variant
```tsx
<ConfirmDialog
  isOpen={showWarning}
  onClose={() => setShowWarning(false)}
  onConfirm={handleProceed}
  title="Unsaved Changes"
  message="You have unsaved changes. Do you want to proceed?"
  confirmText="Proceed"
  variant="warning"
/>
```

#### Success Variant
```tsx
<ConfirmDialog
  isOpen={showSuccess}
  onClose={() => setShowSuccess(false)}
  onConfirm={handleComplete}
  title="Complete Appointment"
  message="Mark this appointment as completed?"
  confirmText="Complete"
  variant="success"
/>
```

#### Info Variant
```tsx
<ConfirmDialog
  isOpen={showInfo}
  onClose={() => setShowInfo(false)}
  onConfirm={handleAcknowledge}
  title="Information"
  message="This appointment has special instructions from the client."
  confirmText="Acknowledge"
  variant="info"
/>
```

---

## TOAST NOTIFICATIONS

### Success Toast
```tsx
import toast from 'react-hot-toast';

toast.success('Appointment booked successfully!');
```

### Error Toast
```tsx
toast.error('Failed to book appointment. Please try again.');
```

### Loading Toast
```tsx
const toastId = toast.loading('Booking appointment...');

// Later, when complete:
toast.success('Appointment booked!', { id: toastId });

// Or on error:
toast.error('Booking failed', { id: toastId });
```

### Custom Duration
```tsx
toast.success('Quick message!', { duration: 2000 }); // 2 seconds

toast.error('Important error!', { duration: 5000 }); // 5 seconds
```

---

## PRACTICAL EXAMPLES

### Enhanced Button with Loading State

```tsx
function BookButton({ onBook }: { onBook: () => Promise<void> }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    const toastId = toast.loading('Booking appointment...');

    try {
      await onBook();
      toast.success('Appointment booked!', { id: toastId });
    } catch (error) {
      toast.error('Failed to book appointment', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      className={cn('btn-primary', isLoading && 'btn-loading')}
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? 'Booking...' : 'Book Appointment'}
    </button>
  );
}
```

### Modal with Backdrop

```tsx
function MyModal({ isOpen, onClose }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
    >
      <div
        className="modal-content max-w-2xl m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Modal Title</h2>
          {/* Content */}
        </div>
        <div className="flex justify-end gap-3 p-6 bg-gray-50 border-t">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Card with Status Badge

```tsx
function AppointmentCard({ appointment }: Props) {
  return (
    <div className="book-card hover-lift">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{appointment.clientName}</h3>
          <p className="text-sm text-gray-600">{appointment.service}</p>
        </div>
        <span className={cn(
          'badge',
          appointment.status === 'confirmed' && 'badge-success',
          appointment.status === 'pending' && 'badge-warning',
          appointment.status === 'cancelled' && 'badge-danger'
        )}>
          {appointment.status}
        </span>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Clock className="w-4 h-4" />
        <span>{appointment.time}</span>
      </div>
    </div>
  );
}
```

### Loading State with Skeleton

```tsx
function ClientList() {
  const { clients, loading } = useClients();

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 book-card">
            <SkeletonCircle size="md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {clients.map(client => (
        <ClientCard key={client.id} client={client} />
      ))}
    </div>
  );
}
```

---

## MIGRATION GUIDE

### Replacing Old Button Styles

**Find and Replace:**

1. Find: `className=".*bg-teal-600.*text-white.*"`
   Replace with: `className="btn-primary"`

2. Find: `className=".*bg-white.*border.*text-gray-700.*"`
   Replace with: `className="btn-secondary"`

3. Find: `className=".*bg-red-600.*text-white.*"`
   Replace with: `className="btn-danger"`

### Replacing Alert() with Toast

**Find:**
```tsx
alert('Success!');
```

**Replace with:**
```tsx
toast.success('Success!');
```

**Find:**
```tsx
if (confirm('Are you sure?')) {
  deleteItem();
}
```

**Replace with:**
```tsx
<ConfirmDialog
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={deleteItem}
  title="Confirm Delete"
  message="Are you sure you want to delete this item?"
  variant="danger"
/>
```

---

## QUICK REFERENCE

### Most Common Utilities

```css
/* Buttons */
.btn-primary
.btn-secondary
.btn-ghost
.btn-danger
.btn-icon

/* Cards */
.book-card
.book-card-compact
.book-card-clickable

/* Inputs */
.book-input
.book-input-error
.book-input-success

/* Badges */
.badge .badge-{primary|success|warning|danger|info}

/* Transitions */
.transition-smooth
.transition-fast
.hover-lift

/* Loading */
.btn-loading
.skeleton
```

### Most Common Components

```tsx
// Skeleton
<Skeleton className="h-4 w-full" />
<SkeletonText lines={3} />
<SkeletonCard />
<AppointmentCardSkeleton />

// Confirm Dialog
<ConfirmDialog
  isOpen={show}
  onClose={close}
  onConfirm={confirm}
  title="Title"
  message="Message"
  variant="danger"
/>
```

---

## BEFORE & AFTER COMPARISON

### Before
```tsx
<button
  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
  disabled={loading}
  onClick={handleClick}
>
  {loading && <span className="spinner" />}
  Book
</button>
```

### After
```tsx
<button
  className={cn('btn-primary', loading && 'btn-loading')}
  disabled={loading}
  onClick={handleClick}
>
  Book
</button>
```

**Result:** 50% less code, more consistent, easier to maintain!

---

## NEXT STEPS

1. **Start using these in new code** - Use the new utilities for any new components
2. **Gradually migrate old code** - Replace old styles during feature work
3. **No rush to refactor** - Only change when you touch a file
4. **Add more utilities** - Create new ones as patterns emerge

Happy coding! 🚀
