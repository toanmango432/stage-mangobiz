# Appointment API Reference

**Base URL:** `/api/Appointment`  
**Source:** AppointmentController.cs

---

## 📋 Core Endpoints

### 1. **Get Appointment**
```
GET /api/Appointment/{id}?RVCNo={rvcNo}
```
**Response:** `TicketDTO`

### 2. **Get Appointment Payment**
```
GET /api/Appointment/{id}/payment?rvcno={rvcNo}&id={id}
```
**Response:** `List<AptPayment>`

### 3. **Get Appointment List**
```
GET /api/Appointment/GetList?customerId={customerId}&rvcNo={rvcNo}&ticketType={ticketType}
```
**Params:**
- `ticketType`: `null` | `Upcoming` | `Completed` | `Cancelled`

**Response:** `List<TicketDTO>`

### 4. **Get Appointment Detail**
```
GET /api/Appointment/{id}/detail?partyId={partyId}&rvcNo={rvcNo}
```
**Response:** `EditAppt`

### 5. **Get Upcoming Last Appointment**
```
GET /api/Appointment/GetAptUpcomingLast?rvcNo={rvcNo}&customerId={customerId}
```
**Response:** `TicketDTO`

### 6. **Get Last Appointments List**
```
GET /api/Appointment/GetListAptLast?CustomerID={customerId}&RVCNo={rvcNo}&type={type}
```
**Response:** `Dictionary<string, List<TicketDTO>>`

---

## 📝 Create/Update Endpoints

### 7. **Book Appointment (Single or Group)**
```
POST /api/Appointment
```
**Request Body:** `List<AppointmentRequest>`

**AppointmentRequest Model:**
```typescript
{
  RVCNo: number;
  customer: number;
  cusName: string;
  contactPhone?: string;
  startDate: string;        // "MM/dd/yyyy"
  startTime: string;        // "HH:mm"
  totalDuration: number;    // minutes
  note?: string;
  emp: number;              // 9999 = Next Available
  unAssign?: number;        // 1 = unassigned
  IsRequest?: boolean;
  IsDeposit?: boolean;
  DepositValue?: number;
  lstService: ServiceRequest[];
}

interface ServiceRequest {
  itemID: number;
  itemName?: string;
  empID: number;
  empName?: string;
  duration: number;
  BasePrice: number;
  startDate: string;
  startTime: string;
  totalDuration: number;
  startIndex: number;
  IsRequestTech?: boolean;
}
```

**Response:** `ResultJs<object>`

**Features:**
- Single appointment booking
- Group appointment booking (party)
- Auto-assign technician logic
- Deposit handling
- Online booking confirmation
- SMS/Email notifications

### 8. **Edit Appointment**
```
PUT /api/Appointment?rvcNo={rvcNo}
```
**Request Body:** `AppointmentsXMLRequest` (XML format)

**Response:** `AppointmentCreateResultModel`

### 9. **Cancel Appointment (Online Booking)**
```
POST /api/Appointment/CancelAppointmentOnlineBooking?id={id}&reason={reason}&rvcNo={rvcNo}
```
**Response:** `ResultJs<string>`

---

## 🔧 Business Logic

### Auto-Assign Logic
1. Check max appointments in "Next Available" column
2. Find available technicians in time slot
3. Exclude techs already booked in overlapping times
4. Assign first available tech

### Confirmation Flow
- **Auto-confirm:** Based on `OB.IsConfirm` parameter
- **Delayed confirm:** Based on `OB_AUTO_CONFIRMED_AFTER` parameter
- **Notifications:** SMS/Email sent on confirm/request

### Group Booking (Party)
- Creates `RDParty` record
- Links multiple appointments
- Validates salon schedule
- Handles end time overflow

---

## 📊 Key Parameters (RDPara)

| Key | Description | Default |
|-----|-------------|---------|
| `OB.IsConfirm` | Require manual confirmation | `"1"` |
| `OB_AUTO_CONFIRMED_AFTER` | Auto-confirm delay (enabled;minutes) | `"0;30"` |
| `OB.AutoAssignNoRequestAppointmentToTech` | Auto-assign unassigned apts | `"0"` |
| `OB.AutoAssignToSalonAPT` | Auto-assign to salon column | `"0"` |
| `MaxAptNoRequestOnlinebook` | Max apts in Next Available (enabled;count) | `"0"` |

---

## 🎯 Implementation Notes

### Time Calculations
- All times in seconds-based format
- Working hours window: ±2 hours
- Duration-based positioning: 22px per 15min
- 15-minute interval slots

### Customer Handling
- Search with phone number formatting
- Debounce delay: 500ms
- Create new customer if not found

### Status Flow
```
Request → Confirmed → Completed/Cancelled
```

### Notifications
- `NOTIFY_TECH_ONLINE_BOOKING` - Tech notification
- `APT_ONLINE_REQUEST` - Request notification
- `APT_ONLINE_CONFIRM` - Confirmation notification
- `OB_ACCEPT` - Acceptance message

---

## 🚀 Next Steps for Integration

1. **Create TypeScript types** matching these models
2. **Build API service layer** with axios
3. **Implement time utilities** (preserve exact formulas)
4. **Create React components** for calendar views
5. **Add appointment CRUD operations**
6. **Integrate with existing POS system**

---

**Ready to implement!** 🎉
