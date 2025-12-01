# POS Appointment Calendar - Deep Dive Analysis

**Date:** October 28, 2025  
**Purpose:** Complete understanding of jQuery implementation for React rewrite  
**Goal:** Preserve 100% functionality with offline-first React architecture

---

## 🎯 **Mission Confirmed**

**Rewrite the entire POS Appointment Calendar:**
- ✅ From jQuery → React + TypeScript
- ✅ Same UX/UI (preserve all workflows)
- ✅ Same functionality (preserve all features)
- ✅ Offline-first (IndexedDB + sync queue)
- ✅ Use existing APIs (AppointmentController.cs)

---

## 📊 **Critical Code Analysis**

### **1. Time Calculations (EXACT FORMULAS)**

#### **A. 2-Hour Working Window**
```javascript
// Line 32-33: appointmentbook.js
let StartTime = parseInt($('.day-view-appointment-bar-scroll-item-time:not(.block)[data-employee-id="9999"]')
  .first().attr('data-start-second-time')) - 7200;
let EndTime = parseInt($('.day-view-appointment-bar-scroll-item-time:not(.block)[data-employee-id="9999"]')
  .last().attr('data-start-second-time')) + 7200;
```

**Logic:**
- Get first appointment time in seconds
- Subtract 7200 seconds (2 hours)
- Get last appointment time
- Add 7200 seconds (2 hours)
- Hide all time slots outside this range

**React Implementation:**
```typescript
function calculate2HourWindow(appointments: Appointment[]) {
  if (appointments.length === 0) return null;
  
  const firstAptTime = timeToSeconds(appointments[0].scheduledStartTime);
  const lastAptTime = timeToSeconds(appointments[appointments.length - 1].scheduledStartTime);
  
  return {
    startTime: firstAptTime - 7200, // -2 hours
    endTime: lastAptTime + 7200      // +2 hours
  };
}
```

#### **B. Appointment Positioning (22px per 15min)**
```javascript
// Line 44-56: appointmentbook.js
const heightAptDefault = 22; // Global constant

let startTime = $(this).attr('data-start-second-time');
let intStartTime = parseInt(startTime / 900);      // Whole 15-min blocks
let floStartTime = parseFloat(startTime / 900);    // Decimal 15-min blocks

let distanceTime = floStartTime - intStartTime;    // Fractional part
let groudTime = intStartTime * 900;                // Round to 15-min
let distanceMix = ((distanceTime * 900) * heightAptDefault) / 900;

let careThis = $(`.day-view-appointment-bar-scroll-item-time[data-employee-id="9999"][data-start-second-time="${groudTime}"]`);
if (careThis.length > 0) {
    let newTop = newFuncTop(careThis) + distanceMix;
    $(this).css('top', `${newTop}px`);
}
```

**Breakdown:**
1. `startTime` = appointment start in seconds (e.g., 34200 = 9:30 AM)
2. `intStartTime` = 34200 / 900 = 38 (whole 15-min blocks)
3. `floStartTime` = 38.0 (decimal blocks)
4. `distanceTime` = 0.0 (fractional part - how far into the 15-min block)
5. `groudTime` = 38 * 900 = 34200 (rounded to 15-min boundary)
6. `distanceMix` = ((0 * 900) * 22) / 900 = 0px offset
7. `newTop` = base position + offset

**React Implementation:**
```typescript
// Already implemented in timeUtils.ts!
export function calculateAppointmentTop(
  baseTop: number,
  distanceTime: number
): number {
  const distanceMix = ((distanceTime * 900) * HEIGHT_PER_15MIN) / 900;
  return baseTop + distanceMix;
}

// Usage:
const startTimeSeconds = timeToSeconds(appointment.scheduledStartTime);
const intStartTime = Math.floor(startTimeSeconds / 900);
const floStartTime = startTimeSeconds / 900;
const distanceTime = floStartTime - intStartTime;
const groudTime = intStartTime * 900;

const baseSlot = timeSlots.find(slot => slot.timeInSeconds === groudTime);
const top = calculateAppointmentTop(baseSlot.offsetTop, distanceTime);
```

#### **C. Top Position Calculation**
```javascript
// Line 17-27: appointmentbook.js
function newFuncTop($this) {
    let res = $this.offset().top - 
              $('.day-view-appointment-bar-scroll-item-time:not(".dis-none")')
              .first().offset().top;
    return res;
}
```

**Logic:**
- Get element's absolute position
- Subtract first visible time slot's position
- Returns relative position from top

**React Implementation:**
```typescript
function calculateRelativeTop(
  elementTop: number,
  firstVisibleSlotTop: number
): number {
  return elementTop - firstVisibleSlotTop;
}
```

---

### **2. Customer Search with Debounce**

```javascript
// Line 140-147: appointmentbook.js (commented out but shows pattern)
if (timeOutFindCustomer == null) {
    timeOutFindCustomer = setInterval(() => {
        requestFindCustomer += 100;
        
        if (requestFindCustomer >= 300) {  // 300ms debounce
            clearInterval(timeOutFindCustomer);
            timeOutFindCustomer = null;
            requestFindCustomer = 0;
            
            // Perform search...
        }
    }, 100);
}
```

**Pattern:** 300ms debounce (not 500ms as in migration doc!)

**React Implementation:**
```typescript
const [searchQuery, setSearchQuery] = useState('');

useEffect(() => {
  const timeout = setTimeout(() => {
    if (searchQuery) {
      performCustomerSearch(searchQuery);
    }
  }, 300); // Match jQuery timing
  
  return () => clearTimeout(timeout);
}, [searchQuery]);
```

---

### **3. Phone Number Formatting**

```javascript
// Line 122-133: appointmentbook.js
search1 = search1.replace('(', '').replace(')', '').replace('-', '');

if (search1 !== "") {
    if (!isNaN(Number(search1))) {
        const searchFormat = formatPhoneNumber(search1);
        $('.input-search-saloncenter').val(searchFormat);
    }
}
```

**Logic:**
- Strip all formatting characters
- Check if numeric
- Apply phone formatting

**React Implementation:**
```typescript
// Already implemented in timeUtils.ts!
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  return phone;
}
```

---

### **4. Get Appointments by Customer**

```javascript
// Line 65-98: appointmentbook.js
const getAppointmentByCustomerId = customerId => {
    $.ajax({
        async: false,
        type: 'GET',
        url: '/Appointment/getAppoitemntByClient',
        data: { 
            id: customerId, 
            rvcNo: (getCookie('.Core.RVC') || DATA.rvcNo) 
        },
        dataType: 'json',
        success: (response) => {
            // Display appointment list
        }
    });
}
```

**API Endpoint:** `GET /Appointment/getAppoitemntByClient`
**Parameters:**
- `id`: Customer ID
- `rvcNo`: Store/Salon ID

**React Implementation:**
```typescript
// Already in appointmentService.ts!
async getAppointmentList(
  customerId: number,
  rvcNo: number,
  ticketType?: AppointmentTicketType
): Promise<TicketDTO[]> {
  const response = await this.api.get<TicketDTO[]>(
    `${this.BASE_URL}/GetList`,
    { params: { customerId, rvcNo, ticketType } }
  );
  return response.data;
}
```

---

## 🏗️ **Component Structure Analysis**

### **Calendar View Components**

#### **1. Day View Structure**
```html
<div class="day-view-appointment-bar">
  <!-- Time slots (15-min intervals) -->
  <div class="day-view-appointment-bar-scroll-item-time" 
       data-employee-id="9999"
       data-start-second-time="32400"  <!-- 9:00 AM in seconds -->
       data-time-12="9:00 AM">
  </div>
  
  <!-- Appointment bars (positioned absolutely) -->
  <div class="day-view-appointment-bar-scroll-item-bar"
       data-start-second-time="34200"  <!-- 9:30 AM -->
       style="top: 66px">  <!-- Calculated position -->
    <!-- Appointment content -->
  </div>
</div>
```

**React Component:**
```typescript
<DaySchedule>
  <TimeSlotColumn>
    {timeSlots.map(slot => (
      <TimeSlot 
        key={slot.timeInSeconds}
        time={slot.time}
        timeInSeconds={slot.timeInSeconds}
      />
    ))}
  </TimeSlotColumn>
  
  <StaffColumns>
    {staff.map(staffMember => (
      <StaffColumn key={staffMember.id}>
        {appointments
          .filter(apt => apt.staffId === staffMember.id)
          .map(apt => (
            <AppointmentCard
              key={apt.id}
              appointment={apt}
              style={{ 
                top: calculatePosition(apt),
                height: calculateHeight(apt.duration)
              }}
            />
          ))}
      </StaffColumn>
    ))}
  </StaffColumns>
</DaySchedule>
```

---

## 🔑 **Key Features Breakdown**

### **1. Staff Filtering**
```javascript
// Filter by employee ID
$('.day-view-appointment-bar-scroll-item[data-employee-id="9999"]')
```

**React:**
```typescript
const filteredAppointments = appointments.filter(apt =>
  selectedStaffIds.length === 0 || 
  selectedStaffIds.includes(apt.staffId)
);
```

### **2. Time Slot Generation**
```javascript
// 15-minute intervals (900 seconds)
// From business hours start to end
```

**React:**
```typescript
function generateTimeSlots(
  startHour: number = 8,
  endHour: number = 20
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const startTime = new Date();
  startTime.setHours(startHour, 0, 0, 0);
  
  const endTime = new Date();
  endTime.setHours(endHour, 0, 0, 0);
  
  let current = startTime;
  while (current < endTime) {
    slots.push({
      time: formatTimeDisplay(current),
      timeInSeconds: timeToSeconds(current),
      date: current,
    });
    current = addMinutes(current, 15);
  }
  
  return slots;
}
```

### **3. Appointment Height Calculation**
```javascript
// 22px per 15 minutes
const height = (duration / 15) * 22;
```

**React:**
```typescript
// Already implemented!
export function calculateAppointmentHeight(durationMinutes: number): number {
  return (durationMinutes / 15) * HEIGHT_PER_15MIN;
}
```

---

## 📋 **Data Attributes Used**

### **Time Slots:**
- `data-employee-id`: Staff ID (9999 = Next Available)
- `data-start-second-time`: Time in seconds since midnight
- `data-time-12`: 12-hour format display (e.g., "9:00 AM")

### **Appointments:**
- `data-id`: Appointment ID
- `data-tech`: Tech/Staff ID
- `data-date`: Service date
- `data-time`: Full datetime
- `data-isGroup`: Is group booking (1/0)
- `data-appointment-status-id`: Status ID

---

## 🎨 **CSS Classes Used**

### **Layout:**
- `.day-view-appointment-bar`: Main container
- `.day-view-appointment-bar-scroll-item-time`: Time slot
- `.day-view-appointment-bar-scroll-item-bar`: Appointment card
- `.dis-none`: Hidden element
- `.tempDisNone`: Temporarily hidden (for 2-hour window)

### **States:**
- `.active`: Active/selected
- `.filter-staff`: Filtered staff
- `.block`: Blocked time slot

---

## ✅ **Implementation Checklist**

### **Phase 2: Core Components**

**CalendarGrid (Monthly View):**
- [ ] Month navigation (◄ ►)
- [ ] Date cells with appointment count
- [ ] Off-days highlighting
- [ ] Click to select date

**DaySchedule (Time Slots):**
- [ ] Time slot generation (15-min intervals)
- [ ] Staff columns
- [ ] Appointment positioning (22px per 15min)
- [ ] 2-hour window toggle
- [ ] Scroll to current time

**AppointmentCard:**
- [ ] Client name
- [ ] Service name
- [ ] Duration bar
- [ ] Status badge
- [ ] Click to edit
- [ ] Drag to reschedule (future)

**StaffSidebar:**
- [ ] Staff list with photos
- [ ] Multi-select checkboxes
- [ ] Availability indicators
- [ ] Search filter

---

## 🚀 **Next Steps**

1. **Build CalendarGrid component**
   - Month view with date cells
   - Navigation controls
   - Date selection

2. **Build DaySchedule component**
   - Time slot rendering
   - Staff columns
   - Appointment positioning with exact formulas

3. **Build AppointmentCard component**
   - Display appointment details
   - Status indicators
   - Click handlers

4. **Build StaffSidebar component**
   - Staff filtering
   - Multi-select
   - Search

5. **Integrate with Redux**
   - Connect to appointment slice
   - Handle async operations
   - Manage loading states

---

## 📝 **Critical Notes**

1. **Preserve exact formulas:**
   - 22px per 15 minutes
   - ±2 hours window (7200 seconds)
   - Seconds-based calculations

2. **Debounce timing:**
   - Customer search: 300ms (not 500ms!)

3. **Data attributes:**
   - Use seconds since midnight for time
   - Employee ID 9999 = "Next Available"

4. **CSS positioning:**
   - Appointments use absolute positioning
   - Top calculated from first visible time slot

---

**Ready to build Phase 2 components!** 🚀
