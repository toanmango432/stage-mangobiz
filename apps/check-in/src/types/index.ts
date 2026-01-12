/**
 * Check-In App Core Types
 *
 * Based on PRD Section 6.3 Data Models
 */

// ============================================================================
// SERVICE TYPES
// ============================================================================

export interface Service {
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

export interface ServiceCategory {
  id: string;
  name: string;
  displayOrder: number;
  services: Service[];
}

export interface CheckInService {
  serviceId: string;
  serviceName: string;
  price: number;
  durationMinutes: number;
}

// ============================================================================
// CLIENT TYPES
// ============================================================================

export interface Client {
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

export interface NewClientInput {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  zipCode?: string;
  smsOptIn: boolean;
}

// ============================================================================
// STAFF/TECHNICIAN TYPES
// ============================================================================

export type TechnicianStatus = 'available' | 'with_client' | 'on_break' | 'unavailable';

export interface Technician {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  photoUrl?: string;
  status: TechnicianStatus;
  serviceIds: string[]; // Services this technician is qualified for
  estimatedWaitMinutes?: number;
}

// ============================================================================
// CHECK-IN TYPES
// ============================================================================

export type CheckInStatus = 'waiting' | 'in_service' | 'completed' | 'no_show';
export type CheckInSource = 'kiosk' | 'web' | 'staff';
export type SyncStatus = 'synced' | 'pending';
export type PartyPreference = 'together' | 'sequence';
export type TechnicianPreference = 'anyone' | string; // 'anyone' or technician ID

export interface CheckInGuest {
  id: string;
  name: string;
  clientId?: string; // If existing client
  services: CheckInService[];
  technicianPreference: TechnicianPreference;
}

export interface CheckIn {
  id: string;
  checkInNumber: string; // "A042" format
  storeId: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  services: CheckInService[];
  technicianPreference: TechnicianPreference;
  guests: CheckInGuest[];
  partyPreference?: PartyPreference;
  status: CheckInStatus;
  queuePosition: number;
  estimatedWaitMinutes: number;
  checkedInAt: string; // ISO timestamp
  calledAt?: string;
  completedAt?: string;
  source: CheckInSource;
  deviceId: string;
  syncStatus: SyncStatus;
}

// ============================================================================
// APPOINTMENT TYPES (for QR code check-in)
// ============================================================================

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  services: CheckInService[];
  technicianId?: string;
  technicianName?: string;
  scheduledAt: string; // ISO timestamp
  status: 'scheduled' | 'confirmed' | 'arrived' | 'in_service' | 'completed' | 'no_show' | 'cancelled';
}

// ============================================================================
// QUEUE TYPES
// ============================================================================

export interface QueueStatus {
  totalInQueue: number;
  averageWaitMinutes: number;
  positions: QueuePosition[];
  lastUpdated: string;
}

export interface QueuePosition {
  checkInId: string;
  position: number;
  estimatedWaitMinutes: number;
}

// ============================================================================
// STORE TYPES
// ============================================================================

export interface Store {
  id: string;
  name: string;
  logo?: string;
  timezone: string;
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export type CheckInStep =
  | 'welcome'
  | 'phone_input'
  | 'client_lookup'
  | 'registration'
  | 'service_selection'
  | 'technician_selection'
  | 'guest_addition'
  | 'review'
  | 'confirmation'
  | 'success';

export interface UIState {
  currentStep: CheckInStep;
  isLoading: boolean;
  error: string | null;
  isOffline: boolean;
}

// ============================================================================
// AUTH STATE TYPES
// ============================================================================

export interface AuthState {
  storeId: string | null;
  deviceId: string | null;
  isAuthenticated: boolean;
  store: Store | null;
}

// ============================================================================
// RE-EXPORT CONFIG TYPES
// ============================================================================

export * from './checkin-config';
