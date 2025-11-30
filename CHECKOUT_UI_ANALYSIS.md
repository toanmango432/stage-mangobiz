# MangoCheckOutmodule - Checkout UI Analysis Report

## Executive Summary

This document provides a comprehensive analysis of the original MangoCheckOutmodule checkout UI implementation. The system uses a sophisticated multi-column layout with intelligent state management via React Reducer pattern, supporting both "dock" and "full" modes with different layouts for each.

---

## 1. OVERALL LAYOUT ARCHITECTURE

### 1.1 Two Primary Modes

**DOCK MODE** (Default: 900px width on desktop, full width on mobile)
```
┌─────────────────────────────────────────────────┐
│  Header (Collapsible on scroll)                │
├─────────────────────────────────────────────────┤
│  Keyboard Hints Banner (Dismissible)           │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────┬──────────────────────────┐│
│  │  LEFT COLUMN    │   RIGHT COLUMN           ││
│  │  (Hidden on     │   (420px)                ││
│  │   Mobile)       │                          ││
│  │                 │   - Client Selector      ││
│  │  - Services     │   - Services List        ││
│  │    Grid         │     (Grouped by Staff)   ││
│  │                 │   - Add Item/Staff Btns  ││
│  │                 │                          ││
│  └─────────────────┴──────────────────────────┘│
│                                                 │
├─────────────────────────────────────────────────┤
│  Footer (Sticky with totals & checkout)        │
└─────────────────────────────────────────────────┘
```

**FULL MODE** (Entire viewport)
```
┌──────────────────────────────────────────────────────────────┐
│  Header (Collapsible on scroll)                             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┬─────────────────────┬──────────────────────┐ │
│  │ CATEGORY │  MAIN CONTENT       │  SUMMARY COLUMN      │ │
│  │ SIDEBAR  │  (Services/Staff)   │  (506px)             │ │
│  │ (180px)  │                     │                      │ │
│  │          │  TABS:              │  - Client Selector   │ │
│  │  - All   │  ┌──────┬──────┐   │  - Services List     │ │
│  │  - Hair  │  │Serv. │Staff │   │    (Grouped/Staff)   │ │
│  │  - Nails │  └──────┴──────┘   │  - Checkout Summary  │ │
│  │  - Spa   │                     │                      │ │
│  │          │  Service Grid OR    │                      │ │
│  │          │  Staff Grid View    │                      │ │
│  │          │                     │                      │ │
│  └──────────┴─────────────────────┴──────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 1.2 Responsive Breakpoints

- **Mobile** (< 640px): Single column, bottom sheets for services/staff
- **Tablet** (640px - 1024px): Simplified 2-column dock mode
- **Desktop** (> 1024px): Full 3-column layout in full mode, 2-column in dock mode

---

## 2. HEADER DESIGN

### 2.1 Structure
```tsx
// Lines 2110-2190 in TicketPanel.tsx
className="flex items-center justify-between px-2 py-1.5 border-b bg-card"
```

### 2.2 Header Components

**Left Section:**
- Close button (X icon) - `h-9 w-9`
- Ticket label: "New Ticket" + Random ticket ID
- Font: `text-sm font-normal text-muted-foreground`

**Right Section:**
- Keyboard shortcuts button (hidden on mobile)
- Clear button (hidden on mobile)
- Dock/Full mode toggle (hidden on mobile)

### 2.3 Auto-Hide Behavior
- Hides on scroll down (after 50px)
- Shows on scroll up or when at top (<10px)
- Controlled by `headerVisible` state
- Transition: `transition-transform duration-200`

### 2.4 Keyboard Hints Banner
```tsx
// Optional dismissible banner below header
bg-muted/50 border-b text-xs px-3 py-2
"Press ? for keyboard shortcuts"
```

---

## 3. STAFF/SERVICES TAB SYSTEM (Full Mode Only)

### 3.1 Tab Switcher Design
```tsx
// Lines 2216-2237
<div className="flex gap-1 mb-2 p-1 bg-muted rounded-lg">
  <Button
    variant={fullPageTab === "services" ? "default" : "ghost"}
    size="sm"
    className="flex-1 h-9"
  >
    <Scissors className="h-4 w-4 mr-2" />
    Services
  </Button>
  <Button
    variant={fullPageTab === "staff" ? "default" : "ghost"}
    size="sm"
    className="flex-1 h-9"
  >
    <User className="h-4 w-4 mr-2" />
    Staff
  </Button>
</div>
```

### 3.2 Tab Behavior

**Services Tab Active:**
- Shows 3-column layout: `grid-cols-[180px_1fr_506px]`
  - Column 1: Category sidebar (180px)
  - Column 2: Service grid with search/filters
  - Column 3: Checkout summary (506px)

**Staff Tab Active:**
- Shows 2-column layout: `grid-cols-[1fr_506px]`
  - Column 1: Staff grid view (horizontal scrollable cards)
  - Column 2: Checkout summary (506px)

### 3.3 Category Sidebar (Services Tab Only)
```tsx
// 180px fixed width sidebar
<CategoryList
  selectedCategory={selectedCategory}
  onSelectCategory={setSelectedCategory}
/>
```

Categories include: All, Popular, Hair, Nails, Spa

---

## 4. SERVICE GRID COMPONENT

### 4.1 Layout Structure
```tsx
// ServiceGrid.tsx - Lines 98-246
<div className="flex flex-col h-full min-h-0">
  {/* Search Bar */}
  <div className="flex-shrink-0 mb-3">
    <Input className="pl-10 pr-10 h-11 bg-muted/50 border-0" />
  </div>

  {/* Category Filter Tabs */}
  <div className="flex-shrink-0 mb-3 -mx-4 px-4">
    <ScrollArea horizontal>
      {/* Horizontal scrolling tabs */}
    </ScrollArea>
  </div>

  {/* Services Grid */}
  <div className="flex-1 overflow-y-auto">
    <div className="grid grid-cols-2 gap-2.5 pb-4">
      {/* Service cards */}
    </div>
  </div>

  {/* Action Bar (Sticky when services selected) */}
  {selectedServices.length > 0 && (
    <div className="fixed bottom-0 lg:relative">
      {/* Summary + Staff assignment + Add button */}
    </div>
  )}
</div>
```

### 4.2 Service Card Design
```tsx
<Card
  className="relative p-3.5 cursor-pointer border-primary bg-primary/5"
  onClick={() => toggleService(service)}
>
  {/* Check icon in top-right when selected */}
  {isSelected && (
    <div className="absolute top-2.5 right-2.5">
      <Check className="h-4 w-4 text-primary" />
    </div>
  )}

  {/* Service name */}
  <h4 className="font-medium text-sm leading-snug mb-2 pr-5">
    {service.name}
  </h4>

  {/* Duration and price */}
  <div className="flex items-center justify-between text-sm">
    <span className="text-muted-foreground">{service.duration}m</span>
    <span className="font-semibold">${service.price}</span>
  </div>
</Card>
```

### 4.3 Search & Filter Design

**Search Bar:**
- Height: `h-11`
- Background: `bg-muted/50`
- Border: `border-0`
- Padding: `pl-10 pr-10` (for icons)
- Search icon left, Clear X button right

**Category Tabs:**
- Horizontal scroll with fade gradients
- Active tab: `border-b-2 border-primary font-medium`
- Inactive: `text-muted-foreground`
- Padding: `px-3 py-1.5 text-sm`

### 4.4 Selection Action Bar

When services are selected:
```tsx
// Fixed on mobile, relative on desktop
className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-50
           lg:relative lg:bottom-auto lg:mt-3 lg:border-t-0 lg:p-0"

// Summary row
<div className="flex items-center justify-between mb-3">
  <div>
    <div className="font-semibold">${totalPrice.toFixed(2)}</div>
    <div className="text-xs text-muted-foreground">{totalDuration} min total</div>
  </div>
  <Button variant="ghost" size="sm">Clear</Button>
</div>

// Staff assignment dropdown (optional)
<Select placeholder="Assign to staff member (optional)" />

// Add button
<Button className="w-full h-12">
  <Plus className="h-4 w-4 mr-2" />
  Add {count} Service{s}
</Button>
```

---

## 5. STAFF GRID VIEW

### 5.1 Layout
```tsx
// StaffGridView.tsx - Lines 76-227
<div className="h-full flex flex-col">
  {/* Reassignment banner (conditional) */}
  {reassigningServices.length > 0 && (
    <Card className="p-3 mb-4 bg-primary/5 border-primary">
      Reassigning {count} service(s)
    </Card>
  )}

  {/* Horizontal scrollable staff cards */}
  <div className="relative">
    {/* Scroll arrows left/right */}
    {/* Gradient fades on edges */}

    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
      {staffMembers.map(staff => (
        <StaffCard />
      ))}
    </div>
  </div>
</div>
```

### 5.2 Staff Card Design
```tsx
<Card
  className="p-4 hover-elevate active-elevate-2 cursor-pointer
             flex-shrink-0 w-40"
  onClick={() => onAddServiceToStaff(staff.id, staff.name)}
>
  <div className="flex flex-col items-center gap-3">
    {/* Avatar */}
    <Avatar className="h-16 w-16 border-2 border-border">
      <AvatarFallback className="text-lg font-semibold
                                 bg-primary/10 text-primary">
        {initials}
      </AvatarFallback>
    </Avatar>

    {/* Name */}
    <h4 className="font-semibold text-sm">{staff.name}</h4>

    {/* Stats */}
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Services:</span>
        <Badge variant="secondary" className="h-5 text-xs">
          {serviceCount}
        </Badge>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Total:</span>
        <span className="font-semibold">${serviceTotal}</span>
      </div>
    </div>

    {/* Add Service Button */}
    <div className="w-full pt-2 border-t">
      <div className="flex items-center justify-center gap-1.5
                      text-xs font-medium text-primary">
        <Plus className="h-3.5 w-3.5" />
        <span>Add Service</span>
      </div>
    </div>
  </div>
</Card>
```

### 5.3 Scroll Controls
- Left/Right chevron buttons
- Appear/disappear based on scroll position
- Gradient fades on edges: `linear-gradient(to right, hsl(var(--background)), transparent)`
- Scroll amount: 200px per click
- Smooth behavior

---

## 6. CHECKOUT SUMMARY COLUMN

### 6.1 InteractiveSummary Component

Located in right column (506px width in full mode, 420px in dock mode)

**Structure:**
```tsx
<div className="flex flex-col h-full">
  {/* Client Section */}
  <div className="mb-4 flex-shrink-0">
    <ClientSelector />
  </div>

  {/* Services List (Grouped by Staff) */}
  <div className="flex-1 overflow-y-auto min-h-0" ref={servicesContainerRef}>
    {sortedGroups.map(([staffId, services]) => (
      <StaffGroup
        key={staffId}
        staffId={staffId}
        services={services}
        isActive={staffId === activeStaffId}
        // ...handlers
      />
    ))}
  </div>

  {/* Totals Section */}
  <div className="flex-shrink-0 border-t pt-4 mt-4">
    {/* Subtotal, Tax, Total */}
  </div>

  {/* Checkout Button */}
  <Button className="w-full h-12 mt-4">
    Continue to Payment - ${total}
  </Button>
</div>
```

### 6.2 Client Selector Card

**Unselected State:**
```tsx
<Card className="p-4 hover-elevate active-elevate-2 cursor-pointer">
  <div className="flex items-center justify-between">
    <div>
      <h3 className="font-medium text-base">Add client</h3>
      <p className="text-sm text-muted-foreground mt-0.5">
        Leave empty for walk-ins
      </p>
    </div>
    <UserPlus className="h-5 w-5 text-muted-foreground" />
  </div>
</Card>
```

**Selected State:**
Expands to show full ClientSelector component with search/create functionality

### 6.3 Service List Grouping

**Key Features:**
- Services grouped by staff member
- Staff groups sorted: inactive staff first (alphabetically), active staff at bottom, unassigned last
- Auto-scroll to active staff when services added (with 75% viewport positioning for 25% bottom buffer)
- Empty staff groups shown for assigned staff without services

**StaffGroup Component:**
- Collapsible header with staff avatar, name, and service count
- Service cards within group
- Add service button for the staff
- Remove staff button (with confirmation if last staff with services)

### 6.4 Totals Section Design

```tsx
<div className="space-y-3">
  <div className="flex justify-between text-sm">
    <span className="text-muted-foreground">Subtotal</span>
    <span className="font-medium">${subtotal.toFixed(2)}</span>
  </div>

  {/* Discount rows if applicable */}

  <div className="flex justify-between text-sm">
    <span className="text-muted-foreground">Tax (8.5%)</span>
    <span className="font-medium">${tax.toFixed(2)}</span>
  </div>

  <Separator />

  <div className="flex justify-between">
    <span className="font-semibold text-lg">Total</span>
    <span className="font-bold text-2xl">${total.toFixed(2)}</span>
  </div>
</div>
```

---

## 7. FOOTER (Dock Mode Only)

### 7.1 CheckoutFooter Component Structure

```tsx
<div className="border-t bg-card flex flex-col">
  {/* Discounts Section (Collapsible) */}
  <div className="px-4 pt-3">
    <Collapsible>
      <CollapsibleTrigger>
        <Button variant="ghost" className="w-full justify-between h-9">
          <span className="flex items-center gap-2 text-sm">
            <Tag className="h-4 w-4" />
            {discountCount > 0
              ? `${discountCount} discount(s) applied (-$${totalDiscount})`
              : "Add discounts"
            }
          </span>
          <ChevronDown /> or <ChevronUp />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3 space-y-3">
        <RewardPointsRedemption />
        <CouponEntry />
        <GiftCardEntry />
      </CollapsibleContent>
    </Collapsible>
  </div>

  {/* Sticky Bottom Section */}
  <div className="sticky bottom-0 z-50 bg-card border-t
                  shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
    <div className="p-4 space-y-3">
      {/* Discount chips (when collapsed and discounts exist) */}
      {discountCount > 0 && !discountsExpanded && (
        <div className="flex flex-wrap gap-2">
          {/* Badge chips for each discount type */}
        </div>
      )}

      {/* Total display */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Total</span>
        <div className="text-right">
          {giftCardTotal > 0 && (
            <div className="text-xs text-muted-foreground line-through">
              ${total.toFixed(2)}
            </div>
          )}
          <span className="font-bold text-2xl">
            ${finalTotal.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Checkout button */}
      <Button className="w-full h-12 text-base font-medium">
        {canCheckout
          ? "Continue To Payment"
          : "Get started above"
        }
      </Button>
    </div>
  </div>
</div>
```

### 7.2 Discount Chips Design

When discounts are applied and section is collapsed:
```tsx
<Badge
  variant="outline"
  className="gap-1 pr-1 text-green-600 border-green-500/20"
>
  <Award className="h-4 w-4" />
  Points: -${amount}
  <Button variant="ghost" size="icon" className="h-4 w-4 ml-1">
    <X className="h-4 w-4" />
  </Button>
</Badge>

// Similar badges for coupons (emerald color) and gift cards (purple color)
```

### 7.3 Footer Shadow
```css
shadow-[0_-2px_10px_rgba(0,0,0,0.05)]
dark:shadow-[0_-2px_10px_rgba(0,0,0,0.2)]
```

---

## 8. COLOR SCHEME & STYLING

### 8.1 Primary Colors
- Primary actions: `bg-primary text-primary-foreground`
- Primary hover: `bg-primary/10` or `bg-primary/5`
- Success/Discount: `text-green-600 dark:text-green-400`
- Warning: `text-amber-600`
- Error/Destructive: `text-destructive`

### 8.2 Card Styling
```css
/* Standard card */
className="border rounded-lg bg-card text-card-foreground shadow-sm"

/* Hover effect */
className="hover-elevate" /* custom class for subtle lift */

/* Active effect */
className="active-elevate-2" /* custom class for pressed state */

/* Selected state */
className="border-primary bg-primary/5"
```

### 8.3 Spacing System
- Extra small: `gap-1` (4px), `p-1` (4px)
- Small: `gap-2` (8px), `p-2` (8px), `mb-2` (8px)
- Medium: `gap-3` (12px), `p-3` (12px), `mb-3` (12px)
- Large: `gap-4` (16px), `p-4` (16px), `mb-4` (16px)
- Extra large: `gap-6` (24px), `p-6` (24px)

### 8.4 Border Radius
- Small: `rounded` (4px)
- Medium: `rounded-md` (6px)
- Large: `rounded-lg` (8px)
- Full: `rounded-full` (9999px)

### 8.5 Shadows
- Card: `shadow-sm` (subtle)
- Elevated: `shadow-md`
- Footer: `shadow-[0_-2px_10px_rgba(0,0,0,0.05)]`

---

## 9. BUTTON STYLES & PLACEMENTS

### 9.1 Button Variants

**Primary (Default):**
```tsx
<Button className="w-full h-12 text-base font-medium">
  Continue To Payment
</Button>
```

**Ghost:**
```tsx
<Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
  Remove
</Button>
```

**Outline:**
```tsx
<Button variant="outline" className="flex-1 h-11 justify-center gap-2">
  <Plus className="h-4 w-4" />
  Add Item
</Button>
```

**Icon Button:**
```tsx
<Button variant="ghost" size="icon" className="h-9 w-9">
  <X className="h-5 w-5" />
</Button>
```

### 9.2 Button Heights
- Extra small: `h-6` (24px)
- Small: `h-7`, `h-8`, `h-9` (28px, 32px, 36px)
- Medium: `h-11` (44px)
- Large: `h-12` (48px)

### 9.3 Icon Sizes
- Tiny: `h-3 w-3`, `h-3.5 w-3.5` (12px, 14px)
- Small: `h-4 w-4` (16px)
- Medium: `h-5 w-5` (20px)
- Large: `h-8 w-8`, `h-10 w-10` (32px, 40px)

### 9.4 Key Button Locations

**Header:**
- Top-left: Close button
- Top-right: Shortcuts, Clear, Mode toggle

**Service Grid:**
- Bottom (fixed on mobile): Add services button with summary

**Staff Grid:**
- Within each card: Add service action

**Checkout Summary:**
- Top: Client add/change
- Within groups: Add service to staff, Remove staff
- Bottom: Checkout button

**Footer (Dock mode):**
- Sticky bottom: Checkout button

---

## 10. ANIMATIONS & TRANSITIONS

### 10.1 Framer Motion Integration

**Service List Animations:**
```tsx
<AnimatePresence mode="sync">
  <motion.div
    key={service.id}
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.2 }}
  >
    {/* Service card */}
  </motion.div>
</AnimatePresence>
```

**Auto-scroll Behavior:**
- Delay: 150ms after service addition
- Scroll behavior: `smooth`
- Target: Active staff positioned at 75% of viewport (25% buffer below)
- Only scrolls down for same staff, repositions for staff changes

### 10.2 CSS Transitions

**Header Hide/Show:**
```css
className="transition-transform duration-200"
/* translate-y-0 or -translate-y-full */
```

**Hover Effects:**
```css
className="transition-all hover-elevate"
/* Custom classes for box-shadow lift */
```

**Scroll Arrow Fade:**
```css
className="transition-opacity duration-200"
/* opacity-100 or opacity-0 */
```

### 10.3 Scroll Gradients

**Edge Fades:**
```css
background: linear-gradient(to right, hsl(var(--background)), transparent)
background: linear-gradient(to left, hsl(var(--background)), transparent)
```

Applied to left/right edges of horizontal scroll containers

---

## 11. MOBILE-SPECIFIC BEHAVIOR

### 11.1 Bottom Sheet Dialogs

**Add Item Dialog:**
```tsx
<Dialog open={showServicesOnMobile}>
  <DialogContent className="max-w-full h-full w-full p-0 gap-0
                           flex flex-col lg:hidden">
    <DialogHeader className="px-4 pt-4 pb-3 border-b">
      <DialogTitle>Add Items</DialogTitle>
      <DialogDescription>Select items to add to the ticket</DialogDescription>
    </DialogHeader>

    <Tabs value={addItemTab} className="flex-1 flex flex-col overflow-hidden">
      <TabsList className="w-full h-10 p-1 grid grid-cols-4">
        <TabsTrigger value="services">Services</TabsTrigger>
        <TabsTrigger value="products">Products</TabsTrigger>
        <TabsTrigger value="packages">Packages</TabsTrigger>
        <TabsTrigger value="giftcards">Gift Cards</TabsTrigger>
      </TabsList>
      <TabsContent value="services" className="flex-1 overflow-hidden">
        <ServiceGrid />
      </TabsContent>
      {/* Other tabs */}
    </Tabs>
  </DialogContent>
</Dialog>
```

**Add Staff Dialog:**
Similar structure with StaffGridView content

### 11.2 Mobile Footer

In dock mode, footer is always visible at bottom with:
- Collapsible discounts section
- Discount chips when collapsed
- Total display
- Checkout button

### 11.3 Responsive Grid Changes

**Service Grid:**
- Mobile: `grid-cols-2` (always 2 columns)
- Desktop: `grid-cols-2` (same)

**Main Layout (Dock):**
- Mobile: Single column, services hidden
- Desktop: `grid-cols-1 lg:grid-cols-[1fr_420px]`

**Main Layout (Full):**
- Mobile: Single column with bottom sheets
- Desktop: `grid-cols-[180px_1fr_506px]` or `grid-cols-[1fr_506px]`

---

## 12. STATE MANAGEMENT ARCHITECTURE

### 12.1 Reducer Pattern

The TicketPanel uses React's useReducer with a comprehensive state structure:

```typescript
interface TicketState {
  services: TicketService[];
  selectedClient: Client | null;
  discounts: DiscountState;
  staff: StaffState;
  dialogs: DialogState;
  ui: UIState;
  undoStack: UndoSnapshot[];
}
```

### 12.2 Key State Slices

**Services:**
- Array of TicketService objects
- Each service has: id, serviceId, serviceName, price, duration, status, staffId, staffName

**Discounts:**
- discount: number (manual discount)
- appliedPointsDiscount: number
- appliedCoupon: CouponData | null
- appliedGiftCards: GiftCardData[]

**Staff:**
- activeStaffId: string | null (currently selected staff)
- assignedStaffIds: string[] (all staff with services or manually added)
- preSelectedStaff: { id, name } | null (auto-assign next service to this staff)

**UI:**
- mode: "dock" | "full"
- fullPageTab: "services" | "staff"
- addItemTab: "services" | "products" | "packages" | "giftcards"
- reassigningServiceIds: string[] (services being reassigned)
- headerVisible: boolean (scroll state)

**Dialogs:**
- Flags for all modal/dialog states (payment, confirmations, etc.)

### 12.3 Action Creators

All state mutations go through typed actions:
```typescript
ticketActions.addService(services)
ticketActions.removeService(serviceId)
ticketActions.updateService(serviceId, updates)
ticketActions.setClient(client)
ticketActions.applyCoupon(coupon, discountValue)
ticketActions.setActiveStaff(staffId)
// ... many more
```

### 12.4 Undo System

- Maximum 10 undo snapshots
- Captures: services, client, discounts, staff state
- Used for: package additions, coupon applications
- Toast notifications with undo action buttons

---

## 13. KEYBOARD SHORTCUTS

### 13.1 Implemented Shortcuts

**Global:**
- `?` - Show keyboard shortcuts dialog
- `Escape` - Close dialogs/panel
- `Cmd/Ctrl + K` - Focus service search
- `Cmd/Ctrl + F` - Focus client search
- `Cmd/Ctrl + Enter` - Checkout (if valid)

### 13.2 Shortcut Dialog

Shows comprehensive list of available shortcuts with visual key indicators

---

## 14. ADVANCED FEATURES

### 14.1 Service Packages

- Add multiple services with discounted total
- Package services shown with special pricing
- Undo support for package additions

### 14.2 Product Sales

- Products have 0 duration
- No staff assignment
- Status automatically set to "completed"
- Prefix: "[Product]" in service name

### 14.3 Split Ticket

- Select services to split into new ticket
- Proportional discount allocation
- Option to keep or remove client

### 14.4 Merge Tickets

- Combine multiple open tickets
- Merge all services and discounts
- Staff IDs consolidated

### 14.5 Bulk Actions

When multiple services selected:
- Reassign staff
- Change service type
- Edit price
- Apply discount
- Duplicate
- Change status
- Delete (with confirmation)

### 14.6 Smart Auto-Scroll

- Auto-scrolls to active staff when services added
- Positions active staff at 75% of viewport (25% buffer below)
- Only scrolls down for same staff
- Repositions (can scroll up) when staff changes
- 150ms delay for animation completion

---

## 15. SUMMARY OF KEY MEASUREMENTS

### 15.1 Column Widths

**Full Mode:**
- Category sidebar: 180px
- Summary column: 506px
- Main content: Remaining space (flex-1)

**Dock Mode:**
- Summary column: 420px
- Service grid: Remaining space (flex-1)
- Panel width: 900px on desktop, 100vw on mobile

### 15.2 Heights

- Header: Auto (px-2 py-1.5)
- Buttons: h-6 to h-12 depending on importance
- Service cards: Auto (p-3.5)
- Staff cards: Auto (p-4)
- Footer checkout button: h-12

### 15.3 Gaps

- Service grid: gap-2.5 (10px)
- Staff grid: gap-3 (12px)
- Main layout: gap-6 (24px)
- Card internal: gap-2, gap-3 (8px, 12px)

### 15.4 Padding

- Header: px-2 py-1.5
- Cards: p-3, p-3.5, p-4
- Footer: p-4
- Sections: p-3 sm:p-4 lg:p-6

---

## 16. DESIGN TOKENS & THEME

### 16.1 Color Variables

Using CSS variables:
```css
--background
--foreground
--card
--card-foreground
--primary
--primary-foreground
--muted
--muted-foreground
--border
--destructive
```

### 16.2 Font Sizes

- xs: text-xs (0.75rem / 12px)
- sm: text-sm (0.875rem / 14px)
- base: text-base (1rem / 16px)
- lg: text-lg (1.125rem / 18px)
- xl: text-xl (1.25rem / 20px)
- 2xl: text-2xl (1.5rem / 24px)

### 16.3 Font Weights

- normal: font-normal (400)
- medium: font-medium (500)
- semibold: font-semibold (600)
- bold: font-bold (700)

---

## 17. ACCESSIBILITY CONSIDERATIONS

### 17.1 ARIA Labels

- Close button: `aria-label="Close checkout panel"`
- Mode toggle: `aria-label="Expand to full screen"`
- Scroll buttons: `aria-label="Scroll left/right"`
- Main content: `role="main" aria-label="Checkout panel content"`

### 17.2 Focus Management

- Auto-focus on search inputs after keyboard shortcuts
- Focus-visible rings: `focus-visible:ring-2 focus-visible:ring-primary`
- Tab navigation preserved throughout

### 17.3 Test IDs

Comprehensive data-testid attributes for:
- All buttons
- All inputs
- All cards
- All sections
- All interactive elements

---

## 18. PERFORMANCE OPTIMIZATIONS

### 18.1 Memoization

- `useMemo` for grouped services
- `useMemo` for sorted groups
- `useCallback` for scroll handlers

### 18.2 Virtualization Considerations

- Uses native overflow scrolling (not virtualized)
- Suitable for typical ticket sizes (<100 services)

### 18.3 Layout Shifts Prevention

- Fixed widths for columns
- flex-shrink-0 for headers/footers
- min-h-0 on scroll containers

---

## CONCLUSION

The MangoCheckOutmodule implements a sophisticated, production-ready checkout system with:

1. **Dual-mode layout** (dock/full) for different workflows
2. **Staff-centric organization** with intelligent grouping
3. **Comprehensive discount system** (points, coupons, gift cards)
4. **Advanced features** (split, merge, bulk actions, packages)
5. **Responsive design** with mobile-first bottom sheets
6. **Rich interactions** with animations and auto-scroll
7. **Robust state management** via reducer pattern with undo
8. **Professional UI** with consistent design tokens
9. **Accessibility** with ARIA labels and keyboard shortcuts
10. **Performance** with memoization and smart rendering

This design prioritizes **rapid workflow**, **visual clarity**, and **professional aesthetics** while maintaining **implementation feasibility** within tight development timelines.
