# Phase 3: Business Hours Configuration - Implementation Plan

**Date**: November 19, 2025
**Priority**: CRITICAL
**Estimated Time**: 4-5 hours

---

## 🎯 Goal

Enable salons to configure their business hours so:
- Calendar only shows available time slots
- Can't book appointments outside business hours
- Different hours per day of week
- Mark days as closed

---

## 📊 Current vs Target

### Current State (BROKEN)
```typescript
// Hardcoded in DaySchedule component
const startHour = 9;  // Always 9 AM
const endHour = 18;   // Always 6 PM
// Same hours every day, including weekends!
```

**Problems:**
- ❌ All salons forced to 9 AM - 6 PM
- ❌ Can't set custom hours (8 AM - 8 PM, etc.)
- ❌ Can't close on Sundays or holidays
- ❌ Can book appointments at 11 PM!

### Target State (FIXED)
```typescript
// Configurable business hours from database
interface BusinessHours {
  monday: { open: '09:00', close: '18:00', closed: false }
  tuesday: { open: '09:00', close: '18:00', closed: false }
  // ... etc
  sunday: { open: null, close: null, closed: true }
}
```

**Wins:**
- ✅ Each salon sets their own hours
- ✅ Different hours per day
- ✅ Mark days as closed
- ✅ Calendar respects hours
- ✅ Can't book outside hours

---

## 🗂️ Database Schema

### New Table: `business_hours`

```typescript
interface BusinessHoursConfig {
  id: string;
  salonId: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sunday, 6=Saturday
  isOpen: boolean;
  openTime: string; // "09:00" format (HH:mm)
  closeTime: string; // "18:00" format (HH:mm)
  createdAt: Date;
  updatedAt: Date;
}
```

### Default Hours (New Salons)
```typescript
Monday-Friday: 9:00 AM - 6:00 PM (open)
Saturday: 10:00 AM - 4:00 PM (open)
Sunday: Closed
```

---

## 🎨 UI Components to Create

### 1. BusinessHoursSettings Component
**Location**: `src/components/Book/BusinessHoursSettings.tsx`

**Features:**
- Modal/panel for editing hours
- 7 rows (one per day of week)
- Each row has:
  - Day name (Monday, Tuesday, etc.)
  - Open/Closed toggle
  - Open time picker (disabled if closed)
  - Close time picker (disabled if closed)
  - Copy to all button (copy Monday to all days)

**UI Layout:**
```
┌─────────────────────────────────────────────┐
│ Business Hours                          [×] │
├─────────────────────────────────────────────┤
│                                             │
│ Monday    [Open ✓]  9:00 AM  -  6:00 PM    │
│ Tuesday   [Open ✓]  9:00 AM  -  6:00 PM    │
│ Wednesday [Open ✓]  9:00 AM  -  6:00 PM    │
│ Thursday  [Open ✓]  9:00 AM  -  6:00 PM    │
│ Friday    [Open ✓]  9:00 AM  -  6:00 PM    │
│ Saturday  [Open ✓]  10:00 AM -  4:00 PM    │
│ Sunday    [Closed]  ─────────────────────   │
│                                             │
│           [Copy Mon to All]  [Cancel] [Save]│
└─────────────────────────────────────────────┘
```

---

## 🔧 Implementation Steps

### Step 1: Database Layer (30 min)
**File**: `src/db/database.ts`

```typescript
// Add business hours CRUD operations
export const businessHoursDB = {
  // Get hours for specific day
  async getByDay(salonId: string, dayOfWeek: number): Promise<BusinessHoursConfig | null> {
    return await db.businessHours
      .where({ salonId, dayOfWeek })
      .first();
  },

  // Get all hours for salon
  async getAll(salonId: string): Promise<BusinessHoursConfig[]> {
    return await db.businessHours
      .where({ salonId })
      .sortBy('dayOfWeek');
  },

  // Update hours for specific day
  async update(id: string, updates: Partial<BusinessHoursConfig>): Promise<void> {
    await db.businessHours.update(id, {
      ...updates,
      updatedAt: new Date(),
    });
  },

  // Initialize default hours for new salon
  async initializeDefaults(salonId: string): Promise<void> {
    const defaults = [
      { dayOfWeek: 0, isOpen: false, openTime: null, closeTime: null }, // Sunday
      { dayOfWeek: 1, isOpen: true, openTime: '09:00', closeTime: '18:00' }, // Monday
      { dayOfWeek: 2, isOpen: true, openTime: '09:00', closeTime: '18:00' }, // Tuesday
      { dayOfWeek: 3, isOpen: true, openTime: '09:00', closeTime: '18:00' }, // Wednesday
      { dayOfWeek: 4, isOpen: true, openTime: '09:00', closeTime: '18:00' }, // Thursday
      { dayOfWeek: 5, isOpen: true, openTime: '09:00', closeTime: '18:00' }, // Friday
      { dayOfWeek: 6, isOpen: true, openTime: '10:00', closeTime: '16:00' }, // Saturday
    ];

    for (const config of defaults) {
      await db.businessHours.add({
        id: generateId(),
        salonId,
        ...config,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  },
};
```

---

### Step 2: Schema Update (10 min)
**File**: `src/db/schema.ts`

```typescript
export const schema = {
  // ... existing tables
  businessHours: '++id, salonId, dayOfWeek, [salonId+dayOfWeek]',
};
```

---

### Step 3: Settings Modal Component (90 min)
**File**: `src/components/Book/BusinessHoursSettings.tsx`

```typescript
import { useState, useEffect } from 'react';
import { businessHoursDB } from '../../db/database';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function BusinessHoursSettings({
  salonId,
  isOpen,
  onClose
}: BusinessHoursSettingsProps) {
  const [hours, setHours] = useState<BusinessHoursConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHours();
  }, [salonId]);

  const loadHours = async () => {
    const data = await businessHoursDB.getAll(salonId);
    if (data.length === 0) {
      // Initialize defaults if none exist
      await businessHoursDB.initializeDefaults(salonId);
      const newData = await businessHoursDB.getAll(salonId);
      setHours(newData);
    } else {
      setHours(data);
    }
    setLoading(false);
  };

  const handleToggleDay = (dayOfWeek: number, isOpen: boolean) => {
    setHours(prev => prev.map(h =>
      h.dayOfWeek === dayOfWeek
        ? { ...h, isOpen, openTime: isOpen ? '09:00' : null, closeTime: isOpen ? '18:00' : null }
        : h
    ));
  };

  const handleTimeChange = (dayOfWeek: number, field: 'openTime' | 'closeTime', value: string) => {
    setHours(prev => prev.map(h =>
      h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h
    ));
  };

  const handleCopyToAll = () => {
    const mondayHours = hours.find(h => h.dayOfWeek === 1);
    if (!mondayHours) return;

    setHours(prev => prev.map(h => ({
      ...h,
      isOpen: mondayHours.isOpen,
      openTime: mondayHours.openTime,
      closeTime: mondayHours.closeTime,
    })));
  };

  const handleSave = async () => {
    try {
      for (const config of hours) {
        await businessHoursDB.update(config.id, {
          isOpen: config.isOpen,
          openTime: config.openTime,
          closeTime: config.closeTime,
        });
      }
      onClose();
    } catch (error) {
      console.error('Failed to save business hours:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-4">Business Hours</h2>

        <div className="space-y-3">
          {hours.map(day => (
            <div key={day.dayOfWeek} className="flex items-center gap-3">
              <div className="w-24 text-sm font-medium">{DAY_NAMES[day.dayOfWeek]}</div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={day.isOpen}
                  onChange={(e) => handleToggleDay(day.dayOfWeek, e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Open</span>
              </label>

              {day.isOpen ? (
                <>
                  <input
                    type="time"
                    value={day.openTime || '09:00'}
                    onChange={(e) => handleTimeChange(day.dayOfWeek, 'openTime', e.target.value)}
                    className="px-2 py-1 border rounded text-sm"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="time"
                    value={day.closeTime || '18:00'}
                    onChange={(e) => handleTimeChange(day.dayOfWeek, 'closeTime', e.target.value)}
                    className="px-2 py-1 border rounded text-sm"
                  />
                </>
              ) : (
                <span className="text-gray-400 text-sm">Closed</span>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={handleCopyToAll}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Copy Mon to All
          </button>

          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
              Cancel
            </button>
            <button onClick={handleSave} className="px-4 py-2 text-sm bg-gray-900 text-white hover:bg-gray-800 rounded-lg">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### Step 4: Integrate with CalendarHeader (20 min)
**File**: `src/components/Book/CalendarHeader.tsx`

Wire up Settings button to open BusinessHoursSettings modal:

```typescript
// In BookPage.tsx
const [isBusinessHoursOpen, setIsBusinessHoursOpen] = useState(false);

const handleSettingsClick = () => {
  setIsBusinessHoursOpen(true);
};

// In render
{isBusinessHoursOpen && (
  <BusinessHoursSettings
    salonId={salonId}
    isOpen={isBusinessHoursOpen}
    onClose={() => setIsBusinessHoursOpen(false)}
  />
)}
```

---

### Step 5: Update Calendar to Respect Hours (60 min)
**File**: `src/components/Book/DaySchedule.v2.tsx`

Replace hardcoded hours with business hours from database:

```typescript
// Before (Hardcoded)
const startHour = 9;
const endHour = 18;

// After (Dynamic)
const [businessHours, setBusinessHours] = useState({ open: 9, close: 18 });

useEffect(() => {
  async function loadBusinessHours() {
    const dayOfWeek = selectedDate.getDay();
    const config = await businessHoursDB.getByDay(salonId, dayOfWeek);

    if (config && config.isOpen) {
      const open = parseInt(config.openTime.split(':')[0]);
      const close = parseInt(config.closeTime.split(':')[0]);
      setBusinessHours({ open, close });
    } else {
      // Day is closed
      setBusinessHours({ open: 0, close: 0 });
    }
  }

  loadBusinessHours();
}, [selectedDate, salonId]);

// Use businessHours.open and businessHours.close for time slots
```

---

### Step 6: Prevent Booking Outside Hours (30 min)
**File**: `src/components/Book/NewAppointmentModal.v2.tsx`

Add validation when creating appointments:

```typescript
const validateAppointmentTime = async (startTime: Date, salonId: string) => {
  const dayOfWeek = startTime.getDay();
  const config = await businessHoursDB.getByDay(salonId, dayOfWeek);

  if (!config || !config.isOpen) {
    return { valid: false, error: 'Salon is closed on this day' };
  }

  const appointmentHour = startTime.getHours();
  const openHour = parseInt(config.openTime.split(':')[0]);
  const closeHour = parseInt(config.closeTime.split(':')[0]);

  if (appointmentHour < openHour || appointmentHour >= closeHour) {
    return {
      valid: false,
      error: `Appointment must be between ${config.openTime} and ${config.closeTime}`
    };
  }

  return { valid: true };
};
```

---

### Step 7: Show Closed Days in Calendar (20 min)
**File**: `src/components/Book/DaySchedule.v2.tsx`

Display message when viewing closed day:

```typescript
if (businessHours.open === 0 && businessHours.close === 0) {
  return (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-lg font-medium text-gray-900">Closed</p>
        <p className="text-sm text-gray-500 mt-1">
          The salon is closed on {DAY_NAMES[selectedDate.getDay()]}
        </p>
      </div>
    </div>
  );
}
```

---

## 📁 Files to Create/Modify

### New Files:
1. `src/components/Book/BusinessHoursSettings.tsx` (150-200 lines)
2. `src/types/businessHours.ts` (interface definitions)

### Modified Files:
1. `src/db/schema.ts` - Add businessHours table
2. `src/db/database.ts` - Add businessHoursDB operations
3. `src/pages/BookPage.tsx` - Wire up settings modal
4. `src/components/Book/DaySchedule.v2.tsx` - Use dynamic hours
5. `src/components/Book/WeekView.tsx` - Use dynamic hours
6. `src/components/Book/NewAppointmentModal.v2.tsx` - Validate hours
7. `src/components/Book/index.ts` - Export new component

---

## ✅ Success Criteria

After implementation, users should be able to:
- [x] Open Settings button → Business Hours modal
- [x] See current hours for each day
- [x] Toggle days open/closed
- [x] Set custom open/close times per day
- [x] Copy Monday hours to all days
- [x] Save changes to database
- [x] Calendar shows only configured hours
- [x] Closed days show "Closed" message
- [x] Can't create appointments outside hours
- [x] Can't create appointments on closed days

---

## 🧪 Testing Checklist

- [ ] Set custom hours (8 AM - 8 PM) → Calendar updates
- [ ] Mark Sunday as closed → Sunday shows "Closed"
- [ ] Try to book at 7 AM → Error message
- [ ] Try to book at 7 PM → Error message
- [ ] Change Tuesday to 10 AM - 4 PM → Only those hours show
- [ ] Copy Monday to all → All days match Monday
- [ ] Refresh page → Hours persist from database

---

## 🎯 Impact

**Before:**
- ❌ All salons stuck with 9-6
- ❌ Can book at midnight
- ❌ No closed days

**After:**
- ✅ Each salon sets their hours
- ✅ Only valid hours shown
- ✅ Can't book outside hours
- ✅ Can mark days closed

**Result:** Calendar actually matches real business operations!

---

## 🚀 Next Phase (After This)

Once business hours are done, we'll tackle:
- **Phase 4**: Staff Availability/Schedule (individual staff hours)
- **Phase 5**: Time Blocking (mark specific slots unavailable)
- **Phase 6**: Duration Auto-Calculation (auto end times)

---

**Ready to implement Phase 3: Business Hours Configuration?**
