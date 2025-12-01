# Mango 2.0 Calendar - Implementation Plan

**Goal:** Combine Fresha's professional polish with Mango's powerful features

---

## 🎯 **Design Philosophy**

### **From Fresha (9/10 Design):**
- ✅ Clean, minimal layout
- ✅ Subtle color palette
- ✅ Consistent 8px spacing grid
- ✅ Professional typography
- ✅ Excellent white space usage
- ✅ Smooth animations
- ✅ Clear visual hierarchy

### **From Mango (9/10 Features):**
- ✅ Multi-tech support
- ✅ Service categories
- ✅ Side items
- ✅ Walked-in list
- ✅ Group booking
- ✅ Repeat booking
- ✅ Tech orders
- ✅ Rich customization

### **Mango 2.0 = 9.5/10** 🚀

---

## 🎨 **Refined Color Palette**

### **Before (Mango 1.0):**
- ❌ Harsh lime green (#B8E986)
- ❌ Too bright teal (#00BCD4)
- ❌ Clashing orange badges
- ❌ Too many competing colors

### **After (Mango 2.0):**
- ✅ Soft mint green (#A5D6A7) - appointments
- ✅ Refined teal (#26C6DA) - primary actions
- ✅ Coral pink (#FF6B9D) - CTAs only
- ✅ Neutral grays - backgrounds
- ✅ Orange (#FFA726) - prices only

---

## 📋 **Phase 4: Calendar Grid (IN PROGRESS)**

### **4.1 Time Column Component**
```typescript
- Fixed left column (60px width)
- Hour labels (7:00 AM, 8:00 AM...)
- Small, gray text (12px)
- Pink markers on left edge (optional)
- Sticky positioning
```

### **4.2 Staff Column Headers**
```typescript
- Circular photo avatars (48px)
- Staff name below (14px, semibold)
- Green status dot (8px, top-right)
- Teal gradient on hover
- Consistent with Team sidebar
```

### **4.3 Time Grid**
```typescript
- 60px per hour (15px per 15min)
- Horizontal lines (light gray #EEEEEE)
- Alternating row backgrounds (#FFFFFF / #FAFAFA)
- Hover effect on empty slots
- Click handler for new appointment
```

### **4.4 Current Time Indicator**
```typescript
- Teal horizontal line (#26C6DA, 2px)
- Animated dot (12px, pulsing)
- Spans all staff columns
- Updates every minute
- Z-index above grid
```

---

## 📋 **Phase 5: Appointment Blocks**

### **5.1 Block Styling**
```typescript
- Soft mint background (#A5D6A7)
- White border (1px)
- Rounded corners (8px)
- Subtle shadow
- Positioned by start time
- Height = duration (60px per hour)
```

### **5.2 Block Content**
```typescript
- Client name (bold, 14px)
- Service name (regular, 13px)
- Time range (12px, gray)
- Status icon (checkmark, heart, etc.)
- Phone number (optional)
- Staff assignment (if multi-tech)
```

### **5.3 Status Colors**
```typescript
- Scheduled: #A5D6A7 (soft mint)
- Checked-in: #81C784 (medium green)
- In-service: #66BB6A (darker green)
- Completed: #E0E0E0 (light gray)
- Cancelled: #EF9A9A (soft red)
- No-show: #FFAB91 (soft orange)
```

### **5.4 Interactions**
```typescript
- Hover: Lift shadow, scale 1.02
- Click: Open edit modal
- Drag: Reschedule (Phase 7)
- Right-click: Context menu
```

---

## 📋 **Phase 6: New Appointment Modal**

### **6.1 Modal Structure**
```typescript
- White card (max-width: 1200px)
- Rounded corners (12px)
- Large shadow
- Backdrop overlay (rgba(0,0,0,0.5))
- Slide-in animation (300ms)
- Close button (X, top-right)
```

### **6.2 Step 1: Date & Time**
```typescript
- Date display (Wednesday, Oct 29, 2025)
- Time picker (12:45 PM)
- Editable time range
- "Start All Same Time" toggle
- Staff assignment dropdown
```

### **6.3 Step 2: Client Selection**
```typescript
- Two tabs: "CLIENT LIST" / "WALKED-IN LIST"
- Search bar (debounced 300ms)
- Client cards with:
  - Name (bold)
  - Phone number
  - Green status dot (if active)
- "+ ADD NEW CLIENT" button
- Quick add for walk-ins
```

### **6.4 Step 3: Service Selection**
```typescript
- Category tabs (FOOT CARE, MORE, etc.)
- Service grid (3 columns)
- Service cards:
  - Name (bold)
  - Duration (13px, gray)
  - Price (orange badge)
  - Color-coded by category
- Search services
- "+ ADD SERVICE" link
```

### **6.5 Step 4: Service Details**
```typescript
- Selected services list
- Each service shows:
  - Service name
  - Start time (auto-calculated)
  - Duration
  - Price
  - Staff assignment
  - "2nd TECH" badge (if multi-staff)
- Side items selection
- Add-ons (French, Gel, etc.)
```

### **6.6 Bottom Actions**
```typescript
- Left side:
  - REPEAT button (gray)
  - GROUP button (gray)
- Right side:
  - CANCEL button (gray)
  - BOOK button (teal, primary)
- Total price display
- Validation errors
```

---

## 📋 **Phase 7: Polish & Refinements**

### **7.1 Animations**
```typescript
- Appointment blocks: Fade in (200ms)
- Modal: Slide in from right (300ms)
- Hover effects: Scale + shadow (150ms)
- Loading states: Skeleton screens
- Success: Checkmark animation
```

### **7.2 Responsive Design**
```typescript
- Desktop: Full grid view
- Tablet: 2-3 staff columns
- Mobile: Single staff, swipe to change
- Touch-friendly targets (44px min)
```

### **7.3 Accessibility**
```typescript
- Keyboard navigation
- ARIA labels
- Focus indicators
- Screen reader support
- High contrast mode
```

### **7.4 Performance**
```typescript
- Virtual scrolling for large calendars
- Memoized components
- Debounced search
- Optimistic updates
- Lazy load modals
```

---

## 🎯 **Success Metrics**

### **Design Quality:**
- [ ] Passes Fresha's visual standards (9/10)
- [ ] Consistent spacing (8px grid)
- [ ] Professional color palette
- [ ] Clear typography hierarchy
- [ ] Smooth animations

### **Feature Completeness:**
- [ ] All Mango features preserved
- [ ] Multi-tech support
- [ ] Service categories
- [ ] Side items
- [ ] Group booking
- [ ] Walked-in list

### **User Experience:**
- [ ] Intuitive flow
- [ ] < 3 clicks to book
- [ ] Clear feedback
- [ ] Fast performance
- [ ] Mobile-friendly

---

## 📊 **Timeline**

- **Phase 4:** Calendar Grid - 2-3 hours
- **Phase 5:** Appointment Blocks - 2 hours
- **Phase 6:** New Appointment Modal - 3-4 hours
- **Phase 7:** Polish & Refinements - 2 hours

**Total:** ~10-12 hours of focused development

---

## 🚀 **Let's Build!**

Starting with Phase 4: Calendar Grid
- Time column
- Staff headers
- Time grid
- Current time indicator
