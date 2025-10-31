import { AppointmentStatus, BookingSource, SyncStatus } from './common';

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
}

export interface Appointment {
  id: string;
  salonId: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  staffId: string; // Primary staff
  staffName: string;
  services: AppointmentService[];
  status: AppointmentStatus;
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  checkInTime?: Date;
  notes?: string;
  source: BookingSource;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastModifiedBy: string;
  syncStatus: SyncStatus;
}

export interface CreateAppointmentInput {
  clientId: string;
  clientName: string;
  clientPhone: string;
  staffId: string;
  services: Omit<AppointmentService, 'staffName' | 'serviceName'>[];
  scheduledStartTime: Date;
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
  lastSyncAttempt?: Date;
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
