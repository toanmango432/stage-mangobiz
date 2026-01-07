# POS Appointment Calendar - React Migration Plan

**Date:** October 28, 2025  
**Goal:** Modernize jQuery calendar to React while preserving ALL functionality  
**Timeline:** 8 weeks

---

## 🎯 Strategy

**Preserve, Don't Rebuild:**
- ✅ Keep all business logic
- ✅ Keep all features
- ✅ Keep API contracts
- ✅ Modernize presentation only

---

## 📊 Current Features (Must Preserve)

### Core Features
1. Monthly calendar grid view
2. Day view with time slots (15-min intervals)
3. Staff filtering sidebar
4. Appointment CRUD operations
5. Customer search (debounced, phone formatting)
6. Time calculations (start/end/duration)
7. Appointment positioning (visual layout)
8. Group appointments
9. Status color coding
10. Auto-scroll to appointments

### Business Logic
- Time slot calculations (seconds-based)
- Working hours window (±2 hours)
- Duration-based positioning (22px per 15min)
- Phone number formatting
- Customer search with debounce (500ms)

---

## 🏗️ Migration Phases

### Phase 1: Foundation (Week 1-2)
**Deliverables:**
- TypeScript type definitions
- API service layer
- Time utility functions
- Test existing API endpoints

**Key Files:**
```
src/types/appointment.ts
src/services/appointmentService.ts
src/lib/timeUtils.ts
```

### Phase 2: Core Components (Week 3-4)
**Deliverables:**
- CalendarGrid component (monthly view)
- DayView component (time slots)
- AppointmentCard component
- StaffSidebar component

### Phase 3: Business Logic (Week 5-6)
**Deliverables:**
- Customer search with debounce
- Time calculations (preserve exact logic)
- Appointment positioning
- Drag & drop (if exists)

### Phase 4: Integration (Week 7-8)
**Deliverables:**
- Main calendar page
- Modals (create/edit/delete)
- Loading states
- Error handling
- Testing & polish

---

## 💻 Key Code Conversions

### 1. Time Calculations (PRESERVE EXACTLY)

**jQuery (Current):**
```javascript
let StartTime = parseInt($('.item[data-employee-id="9999"]').first()
  .attr('data-start-second-time')) - 7200;
```

**React (Convert to):**
```typescript
const startTime = parseInt(
  items.find(item => item.employeeID === 9999)?.startSecondTime || 0
) - 7200;
```

### 2. Customer Search (PRESERVE LOGIC)

**jQuery (Current):**
```javascript
searchTimeout = setTimeout(() => {
  performCustomerSearch(cleanedInput);
}, 500);
```

**React (Convert to):**
```typescript
useEffect(() => {
  const timeout = setTimeout(() => {
    performSearch(query);
  }, 500);
  return () => clearTimeout(timeout);
}, [query]);
```

### 3. Appointment Positioning (PRESERVE FORMULA)

**jQuery (Current):**
```javascript
let distanceMix = ((distanceTime * 900) * heightAptDefault) / 900;
let newTop = newFuncTop(careThis) + distanceMix;
$(this).css('top', `${newTop}px`);
```

**React (Convert to):**
```typescript
const distanceMix = ((distanceTime * 900) * HEIGHT_DEFAULT) / 900;
const top = calculateTop(baseElement) + distanceMix;
return <div style={{ top: `${top}px` }} />;
```

---

## 📋 Migration Checklist

- [ ] **Week 1-2:** Types + API + Utils
- [ ] **Week 3-4:** Calendar + Day View
- [ ] **Week 5-6:** Search + Logic
- [ ] **Week 7-8:** Integration + Testing

---

## ⚠️ Critical Preservation Points

1. **Time Calculations** - Use EXACT same formulas
2. **API Endpoints** - Keep same URLs/params
3. **Data Structures** - Match existing models
4. **Business Rules** - Preserve all logic
5. **User Workflows** - Keep same UX flow

---

## 🚀 Next Steps

1. Review this plan with team
2. Set up React project structure
3. Start Phase 1 (Types + API)
4. Weekly progress reviews

**Ready to start? Let me know and I'll begin with Phase 1!**
