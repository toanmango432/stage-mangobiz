import { AppointmentStatus, BookingSource, SyncStatus } from './common';

// ============================================================================
// PRICE TRACKING TYPES
// ============================================================================

/**
 * Indicates the origin/source of a service price.
 *
 * Used to track where a price came from at the time of booking,
 * enabling accurate price change detection at checkout.
 *
 * @example
 * // Standard catalog price
 * priceSource: 'catalog'
 *
 * // Price adjusted for staff experience level
 * priceSource: 'staff_level'
 *
 * @property 'catalog' - Standard price from service catalog
 * @property 'staff_level' - Price adjusted based on staff tier (Junior/Senior/Master)
 * @property 'package' - Discounted price from a service package/bundle
 * @property 'membership' - Special pricing for membership holders
 * @property 'custom' - Manually entered custom price
 * @property 'promotion' - Promotional/discount pricing
 */
export type PriceSource =
  | 'catalog'
  | 'staff_level'
  | 'package'
  | 'membership'
  | 'custom'
  | 'promotion';

// ============================================================================
// API REQUEST/RESPONSE MODELS (Matching AppointmentController.cs)
// ============================================================================

export interface AppointmentService {
  serviceId: string;
  serviceName: string;
  staffId: string;
  staffName: string;
  duration: number; // minutes
  price: number;

  // ============================================================================
  // PRICE SNAPSHOT FIELDS
  // ============================================================================
  // These fields capture the price at booking time, enabling price change
  // detection at checkout. All fields are optional for backwards compatibility.

  /**
   * The price shown to the client at the time of booking.
   * This is the "promised" price that should be honored unless changed.
   * For walk-ins, this equals the current catalog price.
   *
   * @example
   * // Client booked a haircut at $50
   * bookedPrice: 50
   */
  bookedPrice?: number;

  /**
   * ISO 8601 timestamp when the price was locked/captured.
   * Typically set when the appointment is created.
   *
   * @example
   * bookedAt: '2026-01-15T10:30:00Z'
   */
  bookedAt?: string;

  /**
   * Indicates where/how the booked price was determined.
   * Helps staff understand why the price might differ from catalog.
   */
  priceSource?: PriceSource;

  /**
   * The staff experience tier at booking time (e.g., 'Junior', 'Senior', 'Master').
   * Relevant when using tiered pricing where staff level affects price.
   * Captured to explain price variance if staff level changed.
   *
   * @example
   * // Booked with a Senior stylist
   * staffLevelAtBooking: 'Senior'
   */
  staffLevelAtBooking?: string;

  /**
   * The base catalog price before any staff-level adjustments.
   * Useful for calculating variance when staff level changes.
   * If no staff-level pricing, this equals bookedPrice.
   *
   * @example
   * // Base catalog price $50, Senior tier adds $10
   * catalogPriceAtBooking: 50
   * bookedPrice: 60
   */
  catalogPriceAtBooking?: number;
}

export interface Appointment {
  id: string;
  storeId: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  staffId: string; // Primary staff
  staffName: string;
  services: AppointmentService[];
  status: AppointmentStatus;
  scheduledStartTime: string; // ISO string (stored in UTC, display in store timezone)
  scheduledEndTime: string;   // ISO string (stored in UTC, display in store timezone)
  actualStartTime?: string;   // ISO string
  actualEndTime?: string;     // ISO string
  checkInTime?: string;       // ISO string
  notes?: string;
  source: BookingSource;
  createdAt: string; // ISO string (stored in UTC)
  updatedAt: string; // ISO string (stored in UTC)
  createdBy: string;
  lastModifiedBy: string;
  syncStatus: SyncStatus;
}

export interface CreateAppointmentInput {
  clientId: string;
  clientName: string;
  clientPhone: string;
  staffId: string;
  staffName: string;
  services: Omit<AppointmentService, 'staffName' | 'serviceName'>[];
  scheduledStartTime: Date | string; // Accepts Date or ISO string
  notes?: string;
  source: BookingSource;
}

// ============================================================================
// API Models - Matching Backend AppointmentController.cs
// ============================================================================

/**
 * Service request for booking appointment
 * Matches ServiceRequest in AppointmentController.cs
 */
export interface ServiceRequest {
  itemID: number;
  itemName?: string;
  empID: number;              // 9999 = Next Available
  empName?: string;
  duration: number;           // minutes
  BasePrice: number;
  startDate: string;          // "MM/dd/yyyy"
  startTime: string;          // "HH:mm"
  totalDuration: number;      // minutes
  startIndex: number;
  IsRequestTech?: boolean;    // true if specific tech requested
}

/**
 * Appointment booking request
 * Matches AppointmentRequest in AppointmentController.cs
 */
export interface AppointmentRequest {
  RVCNo: number;              // Salon/Store ID
  customer: number;           // Customer ID (0 for walk-in)
  cusName: string;            // Customer name
  contactPhone?: string;      // Customer phone
  startDate: string;          // "MM/dd/yyyy"
  startTime: string;          // "HH:mm"
  totalDuration: number;      // minutes
  note?: string;
  emp: number;                // Primary staff ID (9999 = Next Available)
  unAssign?: number;          // 1 = unassigned
  IsRequest?: boolean;        // Is this a request (needs confirmation)
  IsDeposit?: boolean;        // Requires deposit
  DepositValue?: number;      // Deposit amount
  lstService: ServiceRequest[];
  numIndex?: number;          // Index in group booking
}

/**
 * Appointment payment record
 * Matches AptPayment in AppointmentController.cs
 */
export interface AptPayment {
  id: number;
  appointmentId: number;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
  createdAt: Date;
  createdBy: string;
}

/**
 * Ticket DTO - Appointment display data
 * Matches TicketDTO in AppointmentController.cs
 */
export interface TicketDTO {
  appointmentID: number;
  customerID: number;
  customerName: string;
  customerPhone?: string;
  staffID: number;
  staffName: string;
  serviceName: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  status: string;
  checkNo?: number;
  totalAmount?: number;
  depositAmount?: number;
  note?: string;
  isOnlineBooking: boolean;
  isConfirmed: boolean;
  partyID?: number;           // Group booking ID
  createdAt: Date;
}

/**
 * Edit appointment data
 * Matches EditAppt in AppointmentController.cs
 */
export interface EditAppt {
  appointmentID: number;
  partyID?: number;
  customerID: number;
  customerName: string;
  customerPhone?: string;
  staffID: number;
  staffName: string;
  startDate: string;
  startTime: string;
  totalDuration: number;
  note?: string;
  services: ServiceRequest[];
  isGroup: boolean;
  depositAmount?: number;
}

/**
 * API Result wrapper
 * Matches ResultJs<T> in AppointmentController.cs
 */
export interface ResultJs<T> {
  status: number;             // 200 = success, 404 = not found, 500 = error
  message: string;
  data?: T;
}

/**
 * Count of salon appointments by hour
 * Used for auto-assign logic
 */
export interface CountSalonAppt {
  hour: number;               // Hour of day (0-23)
  count: number;              // Number of appointments
}

/**
 * Employee availability in time slot
 * Used for auto-assign logic
 */
export interface EmpInHour {
  EmployeeID: number;
  startime: Date;
  endtime: Date;
  currentTicketID?: number;
}

/**
 * Party (group booking) record
 * Matches RDParty in AppointmentController.cs
 */
export interface RDParty {
  ID?: number;
  CustomerID: number;
  ClientName?: string;
  PartyName: string;
  NumberGuest: number;
  StartTime: Date;
  EndTime: Date;
  Active: boolean;
  PartyDate: Date;
  Note?: string;
  BookType: number;           // 1 = online booking
  IsGroup: boolean;
  AppointmentStatusID: number;
  RVCNo: number;
}

// ============================================================================
// LOCAL STATE MODELS (For Redux/IndexedDB)
// ============================================================================

/**
 * Local appointment state with sync metadata
 */
export interface LocalAppointment extends Appointment {
  localId?: string;           // Local-only ID before sync
  serverId?: number;          // Server appointment ID after sync
  syncStatus: SyncStatus;
  lastSyncAttempt?: string;   // ISO 8601 string
  syncError?: string;
}

/**
 * Appointment filter options
 */
export interface AppointmentFilters {
  staffIds?: string[];
  status?: AppointmentStatus[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
}

/**
 * Calendar view state
 */
export interface CalendarViewState {
  selectedDate: Date;
  viewMode: 'day' | 'week' | 'month';
  timeWindowMode: '2hour' | 'fullday';
  filters: AppointmentFilters;
  selectedStaffIds: string[];
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type AppointmentTicketType = 'Upcoming' | 'Completed' | 'Cancelled';

export interface AppointmentsByDate {
  [date: string]: Appointment[];  // ISO date string as key
}

export interface AppointmentsByStaff {
  [staffId: string]: Appointment[];
}
