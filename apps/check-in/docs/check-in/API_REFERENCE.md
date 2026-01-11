# Check-In App API Reference

> Complete API documentation for the Mango Check-In kiosk application.

## DataService API

The `dataService` is the unified data access layer. All data operations should go through this facade.

### Clients

#### `dataService.clients.getByPhone(phone: string): Promise<Client | null>`

Look up a client by phone number.

**Parameters:**
- `phone` - Phone number (any format, will be normalized to 10 digits)

**Returns:** Client object or null if not found

**Rate Limit:** 10 requests per 5 seconds

**Example:**
```typescript
const client = await dataService.clients.getByPhone('(555) 123-4567');
if (client) {
  console.log(`Welcome back, ${client.firstName}!`);
}
```

---

#### `dataService.clients.create(input: NewClientInput): Promise<Client>`

Create a new client.

**Parameters:**
```typescript
interface NewClientInput {
  firstName: string;    // Required, sanitized
  lastName: string;     // Required, sanitized
  phone: string;        // Required, normalized to 10 digits
  email?: string;       // Optional, validated
  zipCode?: string;     // Optional, 5 digits
  smsOptIn: boolean;    // SMS notification preference
}
```

**Returns:** Created Client object

**Rate Limit:** 5 requests per 5 seconds

**Throws:** Error if validation fails or rate limited

---

#### `dataService.clients.getById(id: string): Promise<Client | null>`

Fetch a client by their ID.

---

### Services

#### `dataService.services.getAll(): Promise<Service[]>`

Get all active services. Results are cached in IndexedDB.

**Returns:** Array of Service objects

---

#### `dataService.services.getByCategory(): Promise<ServiceCategory[]>`

Get services grouped by category.

**Returns:** 
```typescript
interface ServiceCategory {
  id: string;
  name: string;
  displayOrder: number;
  services: Service[];
}
```

---

### Technicians

#### `dataService.technicians.getAll(): Promise<Technician[]>`

Get all technicians. Results are cached in IndexedDB.

**Returns:**
```typescript
interface Technician {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  photoUrl?: string;
  status: 'available' | 'with_client' | 'on_break' | 'unavailable';
  serviceIds: string[];
  estimatedWaitMinutes?: number;
}
```

---

#### `dataService.technicians.getByServiceIds(serviceIds: string[]): Promise<Technician[]>`

Get technicians qualified for specific services.

---

### Check-ins

#### `dataService.checkins.create(params): Promise<CheckIn>`

Create a new check-in entry.

**Parameters:**
```typescript
{
  storeId: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  services: CheckInService[];
  technicianPreference: 'anyone' | string;  // 'anyone' or technician ID
  guests?: CheckInGuest[];
  partyPreference?: 'together' | 'sequence';
  deviceId: string;
}
```

**Returns:** Created CheckIn with generated `checkInNumber` (e.g., "A042")

**Rate Limit:** 3 requests per 5 seconds

---

#### `dataService.checkins.updateStatus(id: string, status: CheckInStatus): Promise<void>`

Update check-in status.

**Status values:** `'waiting'` | `'in_service'` | `'completed'` | `'no_show'`

---

#### `dataService.checkins.updateQueuePosition(id, position, waitMinutes): Promise<void>`

Update queue position and estimated wait time.

---

### Appointments

#### `dataService.appointments.getByQrCode(qrData: string): Promise<Appointment | null>`

Look up an appointment by QR code data.

---

#### `dataService.appointments.confirmArrival(id: string): Promise<void>`

Mark an appointment as arrived.

---

### Upsells

#### `dataService.upsells.getForServices(serviceIds: string[]): Promise<Service[]>`

Get suggested add-on services based on selected services.

**Algorithm:**
- Same category: +3 points
- Duration ≤30 min: +2 points
- Price ≤$30: +2 points
- Price ≤$50: +1 point

**Returns:** Top 4 upsell suggestions

---

### Sync

#### `dataService.sync.processQueue(): Promise<number>`

Process offline sync queue. Called automatically when coming online.

**Returns:** Number of items processed

---

#### `dataService.sync.getPendingCount(): Promise<number>`

Get count of pending sync items.

---

## Redux Thunks

### Client Slice

```typescript
// Look up client by phone
dispatch(fetchClientByPhone(phone));

// Create new client
dispatch(createClient(input));
```

### Services Slice

```typescript
// Fetch service catalog
dispatch(fetchServices());
```

### Technician Slice

```typescript
// Fetch technicians
dispatch(fetchTechnicians());

// Filter by services
dispatch(fetchTechniciansByServices(serviceIds));
```

### Check-in Slice

```typescript
// Create check-in
dispatch(createCheckIn());

// Actions
dispatch(setCurrentClient(client));
dispatch(addSelectedService(service));
dispatch(removeSelectedService(serviceId));
dispatch(setTechnicianPreference(pref));
dispatch(addGuest(guest));
dispatch(removeGuest(guestId));
dispatch(setPartyPreference('together'));
dispatch(setQueuePosition(position));
dispatch(setEstimatedWaitMinutes(minutes));
dispatch(setClientCalled(calledInfo));
dispatch(resetCheckin());
```

### Appointment Slice

```typescript
// Look up by QR
dispatch(fetchAppointmentByQr(qrData));

// Confirm arrival
dispatch(confirmAppointmentArrival(id));
```

---

## MQTT Hooks

### useCalledMqtt

Subscribes to `salon/{storeId}/checkin/called` for client-called notifications.

```typescript
const { isCalled, calledInfo } = useCalledMqtt();

// calledInfo includes:
// - technicianId, technicianName
// - station
// - calledAt
```

**Side effects:**
- Plays notification sound
- Triggers SMS notification if opted in
- Updates Redux state

---

### useQueueMqtt

Subscribes to `salon/{storeId}/queue/status` for queue updates.

```typescript
useQueueMqtt();  // Automatically dispatches to Redux

// Access via selector:
const queuePosition = useSelector((s) => s.checkin.queuePosition);
const waitMinutes = useSelector((s) => s.checkin.estimatedWaitMinutes);
```

---

### useTechnicianMqtt

Subscribes to `salon/{storeId}/staff/status` for staff availability.

```typescript
useTechnicianMqtt();  // Dispatches updateTechnicianStatus to Redux
```

---

## Analytics Service

### Event Tracking

```typescript
import { analyticsService } from '@/services/analyticsService';

analyticsService.track('checkin_started', { source: 'kiosk' });
analyticsService.track('phone_entered', { lookupDuration: 1.2 });
analyticsService.track('services_selected', { count: 3, total: 125 });
analyticsService.track('technician_selected', { type: 'anyone' });
analyticsService.track('guest_added', { guestNumber: 2 });
analyticsService.track('checkin_completed', { flowDuration: 45 });
analyticsService.track('checkin_abandoned', { step: 'services' });
```

### React Hook

```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

const { track } = useAnalytics();
track('event_name', { ...properties });
```

---

## SMS Service

### Send Notification

```typescript
import { smsService } from '@/services/smsService';

await smsService.sendCalledNotification({
  phone: '+15551234567',
  clientName: 'John',
  technicianName: 'Sarah',
  station: 'Station 3',
});
```

### Update Opt-in

```typescript
await smsService.updateOptInStatus(clientId, false);
```

---

## Utility Functions

### Phone Formatting

```typescript
import { formatPhone, normalizePhone } from '@/utils';

formatPhone('5551234567');     // "(555) 123-4567"
normalizePhone('(555) 123-4567'); // "5551234567"
```

### Price/Duration Display

```typescript
import { formatPrice, formatDuration } from '@/utils';

formatPrice(25);      // "$25.00"
formatPrice(125.5);   // "$125.50"

formatDuration(30);   // "30m"
formatDuration(90);   // "1h 30m"
formatDuration(120);  // "2h"
```

### Input Sanitization

```typescript
import { sanitizePhone, sanitizeName, sanitizeEmail } from '@/utils/security';

sanitizePhone('(555) 123-4567');  // "5551234567"
sanitizeName('<script>John');     // "John"
sanitizeEmail('test@example.com'); // "test@example.com"
```

---

## Type Definitions

### Core Types

```typescript
interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  zipCode?: string;
  smsOptIn: boolean;
  preferredTechnicianId?: string;
  loyaltyPoints: number;
  loyaltyPointsToNextReward: number;
  createdAt: string;
  lastVisitAt?: string;
  visitCount: number;
}

interface Service {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  price: number;
  durationMinutes: number;
  isActive: boolean;
  description?: string;
  thumbnailUrl?: string;
}

interface CheckIn {
  id: string;
  checkInNumber: string;
  storeId: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  services: CheckInService[];
  technicianPreference: 'anyone' | string;
  guests: CheckInGuest[];
  partyPreference?: 'together' | 'sequence';
  status: 'waiting' | 'in_service' | 'completed' | 'no_show';
  queuePosition: number;
  estimatedWaitMinutes: number;
  checkedInAt: string;
  calledAt?: string;
  completedAt?: string;
  source: 'kiosk' | 'web' | 'staff';
  deviceId: string;
  syncStatus: 'synced' | 'pending';
}
```

---

*Last updated: January 2026*
