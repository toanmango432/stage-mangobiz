# POS Online Booking Module - Complete Analysis

**Date:** October 28, 2025  
**Module:** Customer-Facing Online Booking (React + Redux Toolkit)  
**Status:** ✅ Modern React - Ready to Adapt for Mango

---

## 🎯 Executive Summary

The POS Online Booking module is a **complete, production-ready React booking system** that customers use to book appointments online. Unlike the legacy jQuery calendar, this is:

✅ **Modern React 18** with TypeScript  
✅ **Redux Toolkit** for state management  
✅ **Shadcn/UI** components (same as Mango!)  
✅ **Tailwind CSS** styling  
✅ **Full booking flow** from service selection to confirmation  

**This is PERFECT for Mango to adapt!**

---

## 📊 Booking Flow

### Complete User Journey

```
1. Choose Salon
   ↓
2. Choose Flow (Service-first OR Tech-first)
   ↓
3. Choose Services (with add-ons)
   ↓
4. Choose Staff/Tech
   ↓
5. Choose Date & Time
   ↓
6. Login/Verify
   ↓
7. Review & Confirm
   ↓
8. Confirmation Screen
```

---

## 🏗️ Architecture

### State Management (Redux Toolkit)

**Main Slice:** `bookingSlice.tsx`

```typescript
interface BookingState {
  // Core booking data
  RVCNo: number;
  selectedDate: string | null;
  dataBooking: BookingDataType;
  
  // Service data
  dataServices: any[];
  
  // Staff data
  listUserStaffByUser: any[];
  listStaffUser: any[];
  
  // Time slots
  timeKeySlot: any;
  timeBeginCurDate: any;
  slotTimeForSelect: any[];
  
  // Settings
  isDualPrice: boolean;
  isHidePrice: boolean;
  priceDisplay: string;
  isDeposit: boolean;
  paymentDeposit: number;
  currencyDeposit: string;
  
  // Add-ons panel
  addonPanelOpen: boolean;
  addonPanelServiceItem: any | null;
  addonPanelEmployeeID?: string | null;
  
  // Flow control
  flow: FlowType | null; // "SER" or "TECH"
  currentPage: PageType | null;
  
  // Off-days
  daysOffNail: Record<number, number[]>;
}
```

### Booking Data Structure

```typescript
interface BookingDataType {
  type: "ME" | "GUESTS";
  users: User[];
  cardNumber: any[];
  totalAmount: number;
  totalCashAmount: number;
  isConfirmBook: boolean;
  paymentDeposit: number;
  currencyDeposit: string;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  services: any[]; // Selected services with add-ons
  selectedDate: string | null;
  selectedTimeSlot: string | null;
  isSelecting: boolean;
  isChoosing: boolean;
  isSameTime?: boolean;
  isVerify?: boolean;
  rcpCustomer?: string;
}
```

---

## 📁 File Structure

```
src/pages/new-online/
├── NewOnline.tsx                    # Main router outlet
├── ChooseNailSalon/                 # Step 1: Salon selection
├── ServiceOrTech/                   # Step 2: Choose flow
├── ScreenChooseService/             # Step 3: Service selection
│   ├── ScreenChooseServices.tsx     # Main component
│   └── RenderServices.tsx           # Service cards
├── ChooseTechForEachServices/       # Step 4a: Tech per service
├── ChooseOnlyTechForServices/       # Step 4b: One tech for all
├── ChooseTime/                      # Step 5: Date & time
│   ├── ChooseTime.tsx              # Main component
│   ├── Calendar.tsx                # 7-day strip calendar
│   └── TimeSlots.tsx               # Time slot grid
├── Login/                           # Step 6: Authentication
├── VerifyUser/                      # Step 6b: Phone/email verify
├── Summary/                         # Step 7: Review booking
└── ConfirmedBookingScreen/          # Step 8: Confirmation

src/redux/slices/new-online/
├── bookingSlice.tsx                 # Main state
├── bookingTypes.ts                  # TypeScript types
├── bookingInitialState.ts           # Default state
├── selectors/
│   └── bookingSelectors.ts          # Memoized selectors
└── thunks/
    ├── salonThunk.ts                # Salon API calls
    ├── serviceThunk.ts              # Service API calls
    ├── staffThunk.ts                # Staff API calls
    ├── scheduleThunk.ts             # Time slot API calls
    ├── settingThunk.ts              # Settings API calls
    └── bookingThunks.ts             # Booking submission

src/components/Layout/new-online/
├── HeaderSalon/                     # Top header
├── BottomBtn/                       # Navigation footer
├── Cart/                            # Shopping cart
├── AddonPannel/                     # Add-ons selector
└── Summary/                         # Booking summary card
```

---

## 🎨 Key Components

### 1. Service Selection Screen

**File:** `ScreenChooseServices.tsx`

**Features:**
- Category filtering
- Search functionality
- Service cards with images
- Add-ons support
- Cart management
- Dual pricing (card/cash)
- Price hiding option

**Code Structure:**
```typescript
const ScreenChooseService: React.FC = () => {
  const dispatch = useAppDispatch();
  const { dataBooking, dataServices, isDualPrice, isHidePrice } = 
    useAppSelector((s) => s.booking);
  
  const [filterCateId, setFilterCateId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  
  // Filter services by category and search
  const filteredServices = useMemo(() => {
    let services = dataServices;
    
    if (filterCateId) {
      services = services.filter(cat => cat.item.id === filterCateId);
    }
    
    if (search) {
      services = services.map(cat => ({
        ...cat,
        item: {
          ...cat.item,
          listItem: cat.item.listItem.filter(svc =>
            svc.title.toLowerCase().includes(search.toLowerCase())
          )
        }
      }));
    }
    
    return services;
  }, [dataServices, filterCateId, search]);
  
  const handleAddService = (service: ItemService) => {
    // Add to cart logic
    const updatedUsers = dataBooking.users.map(user =>
      user.isChoosing
        ? { ...user, services: [...user.services, service] }
        : user
    );
    
    dispatch(setDataBooking({
      ...dataBooking,
      users: updatedUsers
    }));
  };
  
  return (
    <div>
      <HeaderSalon />
      
      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto">
        <Button onClick={() => setFilterCateId(null)}>All</Button>
        {categories.map(cat => (
          <Button key={cat.id} onClick={() => setFilterCateId(cat.id)}>
            {cat.name}
          </Button>
        ))}
      </div>
      
      {/* Search */}
      <Input
        placeholder="Search services..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      
      {/* Service Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map(category =>
          category.item.listItem.map(service => (
            <ServiceCard
              key={service.id}
              service={service}
              onAdd={handleAddService}
              showPrice={!isHidePrice}
              dualPrice={isDualPrice}
            />
          ))
        )}
      </div>
      
      {/* Cart */}
      <Cart open={cartOpen} onClose={() => setCartOpen(false)} />
      
      {/* Add-ons Panel */}
      <AddOnPanel />
      
      <DirectionalFooter onNext={handleNext} />
    </div>
  );
};
```

---

### 2. Calendar Component (7-Day Strip)

**File:** `Calendar.tsx`

**Features:**
- 7-day horizontal strip
- Popover full calendar
- Off-days integration (store + staff)
- "Today" indicator
- "Unavailable" badges
- Smooth navigation

**Already analyzed in detail earlier!**

---

### 3. Time Slots Component

**File:** `TimeSlots.tsx`

**Features:**
- Grouped by time of day (Morning/Afternoon/Evening)
- "Best" time recommendations
- Availability count per group
- Responsive grid layout
- Dynamic slot generation

**Already analyzed in detail earlier!**

---

### 4. Cart Component

**File:** `Cart.tsx`

**Features:**
- Service list with add-ons
- Price calculation
- Remove items
- Edit add-ons
- Dual pricing support
- Deposit calculation

---

### 5. Add-ons Panel

**File:** `AddOnPanel.tsx`

**Features:**
- Modal/drawer interface
- Add-on selection
- Price display
- Duration impact
- Quantity selection

---

## 🔑 Key Features

### 1. **Dual Pricing System**

Supports both **card price** and **cash price**:

```typescript
interface Service {
  basePrice: number;      // Card price
  baseCashPrice: number;  // Cash price
}

// Display logic
const displayPrice = isDualPrice && priceDisplay === "2"
  ? service.baseCashPrice
  : service.basePrice;
```

### 2. **Add-ons System**

Services can have optional add-ons:

```typescript
interface AddOn {
  id: string;
  title: string;
  price: number;
  priceCash: number;
  priceDiscount?: number;
  duration: number;
  description: string;
}

// Add-ons are stored per service in cart
user.services = [
  {
    serviceId: "123",
    addOns: [
      { id: "addon-1", quantity: 1 },
      { id: "addon-2", quantity: 2 }
    ]
  }
];
```

### 3. **Multi-User Booking**

Support booking for multiple people:

```typescript
dataBooking.type = "GUESTS"; // vs "ME"

dataBooking.users = [
  { id: 1, firstName: "John", services: [...] },
  { id: 2, firstName: "Jane", services: [...] },
  { id: 3, firstName: "Bob", services: [...] }
];

// Each user can have different services and times
// Or book at same time with isSameTime flag
```

### 4. **Flow Selection**

Two booking flows:

```typescript
flow: "SER" | "TECH"

// Service-first: Choose services → Choose tech → Choose time
// Tech-first: Choose tech → Choose services → Choose time
```

### 5. **Off-Days Management**

Prevents booking on closed days:

```typescript
// Store off-days
daysOffNail: {
  10: [15, 25],  // October 15th and 25th
  11: [10]       // November 10th
}

// Staff off-days (fetched per month)
fetchTechOffDaysThunk({ month, year, employeeIDs })
```

### 6. **Deposit System**

Optional deposit requirement:

```typescript
isDeposit: true,
paymentDeposit: 50,  // $50 or 50%
currencyDeposit: "$" // or "%"

// Calculate deposit
const deposit = currencyDeposit === "$"
  ? paymentDeposit
  : (totalAmount * paymentDeposit) / 100;
```

---

## 📱 UI/UX Patterns

### 1. **Category Filtering**

Horizontal scrollable category chips:

```tsx
<div className="flex gap-2 overflow-x-auto no-scrollbar">
  <Badge variant={!filterCateId ? "default" : "outline"}>
    All Services
  </Badge>
  {categories.map(cat => (
    <Badge
      key={cat.id}
      variant={filterCateId === cat.id ? "default" : "outline"}
      onClick={() => setFilterCateId(cat.id)}
    >
      {cat.name}
    </Badge>
  ))}
</div>
```

### 2. **Service Cards**

Image + title + price + add button:

```tsx
<Card>
  <img src={service.image} alt={service.title} />
  <CardContent>
    <h3>{service.title}</h3>
    <p className="text-sm text-muted-foreground">
      {service.duration} min
    </p>
    <div className="flex justify-between items-center">
      <span className="font-bold">
        ${showCashPrice ? service.baseCashPrice : service.basePrice}
      </span>
      <Button size="sm" onClick={() => onAdd(service)}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  </CardContent>
</Card>
```

### 3. **Cart Badge**

Shows item count:

```tsx
<Button onClick={() => setCartOpen(true)}>
  <ShoppingBag className="h-5 w-5" />
  {cartCount > 0 && (
    <Badge className="absolute -top-2 -right-2">
      {cartCount}
    </Badge>
  )}
</Button>
```

### 4. **Directional Footer**

Sticky bottom navigation:

```tsx
<div className="sticky bottom-0 bg-white border-t p-4">
  <div className="flex justify-between">
    <Button variant="outline" onClick={onBack}>
      Back
    </Button>
    <Button onClick={onNext} disabled={!canProceed}>
      Next
    </Button>
  </div>
</div>
```

---

## 🚀 What to Adapt for Mango

### ✅ Directly Reusable

1. **Calendar Component** - 7-day strip with off-days
2. **Time Slots Component** - Grouped time selection
3. **Service Card Layout** - Image + details + price
4. **Cart System** - Shopping cart with add-ons
5. **Add-ons Panel** - Modal for selecting add-ons
6. **Dual Pricing Logic** - Card vs cash pricing
7. **Redux Structure** - State management pattern
8. **API Service Layer** - Thunks for async calls

### 🔧 Needs Adaptation

1. **Multi-salon selection** - Mango likely has one location
2. **Flow selection** - Simplify to service-first only
3. **Multi-user booking** - May not be needed
4. **Deposit system** - Configure for Mango's needs

### ❌ Not Needed

1. **Chain/store RVC numbers** - Mango is single location
2. **Tech-first flow** - Keep service-first only
3. **Guest booking** - If not needed

---

## 📋 Migration Checklist for Mango

### Phase 1: Setup
- [ ] Copy Redux slice structure
- [ ] Copy type definitions
- [ ] Set up API service layer
- [ ] Configure for single location

### Phase 2: Core Components
- [ ] Adapt Calendar component
- [ ] Adapt TimeSlots component
- [ ] Adapt Service selection
- [ ] Adapt Cart system

### Phase 3: Integration
- [ ] Connect to Mango APIs
- [ ] Update styling to match Mango theme
- [ ] Test booking flow end-to-end
- [ ] Add Mango-specific features

---

## 💡 Recommendations

1. **Start with Calendar + Time Slots** - These are the most valuable
2. **Keep Redux structure** - It's well-organized
3. **Simplify for single location** - Remove multi-salon logic
4. **Add service questions** - Mango already has this
5. **Keep add-ons system** - It's well-implemented

---

**This module is production-ready and perfect for Mango! Ready to start adapting?** 🎯
