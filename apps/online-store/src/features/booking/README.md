# Booking Module - Implementation Guide

**Status:** ✅ Core Implementation Complete  
**Source:** Adapted from POS Online Booking Module  
**Tech Stack:** React 18 + Redux Toolkit + TypeScript + Shadcn/UI

---

## 📋 What's Been Implemented

### ✅ Complete

1. **Type Definitions** (`types/booking.types.ts`)
   - All booking-related TypeScript interfaces
   - Service, Staff, Customer, TimeSlot types
   - API request/response types

2. **Redux State Management** (`redux/`)
   - `bookingSlice.ts` - Complete state management
   - `bookingSelectors.ts` - Memoized selectors
   - Full booking flow state

3. **Utility Functions** (`utils/`)
   - `timeUtils.ts` - Time calculations, formatting, slot generation

4. **API Service Layer** (`services/`)
   - `bookingService.ts` - All API calls
   - Thunks for async operations

5. **UI Components** (`components/`)
   - `Calendar.tsx` - 7-day strip calendar with off-days
   - `TimeSlots.tsx` - Grouped time slot selection
   - `ServiceCard.tsx` - Service display card
   - `StaffCard.tsx` - Staff member card
   - `Cart.tsx` - Shopping cart drawer
   - `BookingSummary.tsx` - Booking review summary

6. **Pages** (`pages/`)
   - `ServiceSelection.tsx` - Service selection with filters
   - `StaffSelection.tsx` - Staff member selection
   - `TimeSelection.tsx` - Date & time picker
   - `CustomerInfo.tsx` - Contact information form
   - `BookingReview.tsx` - Review before confirmation
   - `BookingConfirmation.tsx` - Success page
   - `BookingPage.tsx` - Main orchestrator

7. **Redux Store Setup**
   - `src/store/index.ts` - Redux store configuration
   - `src/hooks/redux.ts` - Typed hooks

---

## 🚀 Integration Steps

### Step 1: Install Dependencies

```bash
npm install @reduxjs/toolkit react-redux date-fns
```

### Step 2: Wrap App with Redux Provider

Update `src/main.tsx` or `src/App.tsx`:

```tsx
import { Provider } from 'react-redux';
import { store } from './store';

function App() {
  return (
    <Provider store={store}>
      {/* Your app content */}
    </Provider>
  );
}
```

### Step 3: Add Booking Routes

Update your router configuration:

```tsx
import { BookingPage } from '@/features/booking/pages/BookingPage';

// In your router:
{
  path: '/booking',
  element: <BookingPage />,
}
```

### Step 4: Connect to Backend APIs

Update `src/features/booking/services/bookingService.ts`:

Replace `/api` with your actual API base URL:

```typescript
const API_BASE = process.env.VITE_API_URL || '/api';
```

### Step 5: Implement API Endpoints

Your backend needs these endpoints:

```
GET  /api/booking/categories
GET  /api/booking/services
GET  /api/booking/services/:id
GET  /api/booking/staff
GET  /api/booking/staff/by-services?serviceIds[]=1&serviceIds[]=2
POST /api/booking/time-slots
GET  /api/booking/store-off-days
GET  /api/booking/staff/:id/off-days
POST /api/booking/appointments
POST /api/booking/check-availability
GET  /api/booking/settings
```

---

## 📊 Data Flow

```
User Action
    ↓
Component dispatches Redux action
    ↓
Redux slice updates state
    ↓
Selectors compute derived data
    ↓
Components re-render with new data
    ↓
API calls via thunks (if needed)
```

---

## 🎨 UI Components Usage

### Calendar Component

```tsx
import { Calendar } from '@/features/booking/components/Calendar';

<Calendar
  selectedDate={selectedDate}
  onDateSelect={(date) => console.log(date)}
  offDays={[{ date: '2025-12-25', reason: 'Christmas' }]}
  minDate={new Date()}
/>
```

### TimeSlots Component

```tsx
import { TimeSlots } from '@/features/booking/components/TimeSlots';

<TimeSlots
  timeSlots={[
    {
      label: 'Morning',
      slots: [
        { time: '9:00 AM', available: true, staffIds: ['1', '2'] },
        { time: '9:30 AM', available: false, staffIds: [] },
      ],
      availableCount: 1,
    },
  ]}
  selectedTime="9:00 AM"
  onTimeSelect={(time) => console.log(time)}
/>
```

### ServiceCard Component

```tsx
import { ServiceCard } from '@/features/booking/components/ServiceCard';

<ServiceCard
  service={{
    id: '1',
    title: 'Haircut',
    price: 50,
    duration: 60,
    categoryName: 'Hair Services',
  }}
  isSelected={false}
  onAdd={(service) => console.log('Added:', service)}
/>
```

---

## 🔧 Customization

### Change Business Hours

Update in `bookingSlice.ts`:

```typescript
settings: {
  businessHours: {
    start: '8:00 AM',  // Change this
    end: '9:00 PM',    // Change this
  },
  slotInterval: 30,    // Minutes between slots
}
```

### Customize Colors

The components use Tailwind CSS and Shadcn/UI theme variables. Update your `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: 'hsl(var(--primary))',
        foreground: 'hsl(var(--primary-foreground))',
      },
    },
  },
}
```

### Add Service Questions

Services can have custom questions:

```typescript
{
  id: '1',
  title: 'Haircut',
  questions: [
    {
      id: 'q1',
      question: 'Hair length preference?',
      type: 'select',
      options: ['Short', 'Medium', 'Long'],
      required: true,
    },
  ],
}
```

---

## 🧪 Testing

### Unit Tests Example

```typescript
import { TimeUtils } from '@/features/booking/utils/timeUtils';

describe('TimeUtils', () => {
  it('should calculate end time correctly', () => {
    const endTime = TimeUtils.calculateEndTime('9:00 AM', 60);
    expect(endTime).toBe('10:00 AM');
  });

  it('should format duration correctly', () => {
    expect(TimeUtils.formatDuration(90)).toBe('1 hr 30 min');
  });
});
```

### Integration Tests

```typescript
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { BookingPage } from '@/features/booking/pages/BookingPage';

test('renders booking page', () => {
  render(
    <Provider store={store}>
      <BookingPage />
    </Provider>
  );
  expect(screen.getByText('Select Services')).toBeInTheDocument();
});
```

---

## 📝 TODO / Next Steps

### Required for Production

- [ ] Connect to real API endpoints
- [ ] Implement authentication (if needed)
- [ ] Add payment integration (if deposits required)
- [ ] Email confirmation system
- [ ] SMS notifications (optional)
- [ ] Calendar sync (Google Calendar, etc.)

### Nice to Have

- [ ] Service add-ons panel
- [ ] Service questions modal
- [ ] Staff ratings and reviews
- [ ] Booking history for customers
- [ ] Admin dashboard for managing bookings
- [ ] Drag-and-drop rescheduling
- [ ] Recurring appointments

### Performance Optimizations

- [ ] Lazy load components
- [ ] Virtualize long lists
- [ ] Cache API responses
- [ ] Optimize images
- [ ] Add loading skeletons

---

## 🐛 Troubleshooting

### Redux Store Not Found

Make sure you've wrapped your app with the Redux Provider:

```tsx
import { Provider } from 'react-redux';
import { store } from './store';

<Provider store={store}>
  <App />
</Provider>
```

### API Calls Failing

Check the API base URL in `bookingService.ts` and ensure CORS is configured on your backend.

### Time Slots Not Loading

Verify that:
1. A date is selected
2. Services are selected
3. The API endpoint returns data in the correct format

### Styles Not Applied

Ensure Tailwind CSS and Shadcn/UI are properly configured in your project.

---

## 📚 Resources

- [Redux Toolkit Docs](https://redux-toolkit.js.org/)
- [Shadcn/UI Components](https://ui.shadcn.com/)
- [date-fns Documentation](https://date-fns.org/)
- [React Hook Form](https://react-hook-form.com/)

---

## 🎯 Key Features

✅ **7-Day Calendar Strip** - Intuitive date selection  
✅ **Grouped Time Slots** - Morning/Afternoon/Evening  
✅ **Service Cart** - Add multiple services  
✅ **Staff Selection** - Choose preferred staff  
✅ **Off-Days Support** - Store and staff holidays  
✅ **Mobile Responsive** - Works on all devices  
✅ **Type Safe** - Full TypeScript support  
✅ **Accessible** - WCAG compliant components  

---

**Ready to go! Start by connecting your API endpoints and testing the flow.** 🚀
