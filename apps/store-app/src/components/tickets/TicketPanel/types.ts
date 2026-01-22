/**
 * TicketPanel Module Types
 *
 * Shared type definitions for all TicketPanel components.
 */

import type { ServiceStatus } from '@/store/slices/uiTicketsSlice';

// Panel display modes
export type PanelMode = 'collapsed' | 'normal' | 'expanded';

// Staff member interface
export interface StaffMember {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role?: string;
  isAvailable?: boolean;
}

/**
 * Selected add-on on a ticket service
 * Same structure as SelectedAddOn from AddOnSelector
 */
export interface TicketServiceAddOn {
  optionId: string;
  groupId: string;
  name: string;
  price: number;
  duration: number;
}

// Service on a ticket
export interface TicketService {
  id: string;
  serviceId: string;
  serviceName: string;
  name?: string;
  price: number;
  duration?: number;
  staffId?: string;
  staffName?: string;
  status: ServiceStatus;
  statusHistory?: {
    status: ServiceStatus;
    timestamp: string;
    userId?: string;
  }[];
  actualStartTime?: string;
  pausedAt?: string;
  totalPausedDuration?: number;
  notes?: string;
  /** Indicates if this service is from an archived catalog item */
  isArchived?: boolean;
  /** Selected add-ons for this service */
  addOns?: TicketServiceAddOn[];
  /** Variant ID if a variant was selected */
  variantId?: string;
  /** Variant name for display */
  variantName?: string;
}

// Product on a ticket
export interface TicketProduct {
  id: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  staffId?: string;
  staffName?: string;
}

// Client info
export interface TicketClient {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  avatar?: string;
  allergies?: string[];
  notes?: string;
  outstandingBalance?: number;
}

// Discount info
export interface TicketDiscount {
  type: 'percentage' | 'fixed';
  amount: number;
  reason?: string;
  code?: string;
}

// Payment info
export interface TicketPayment {
  method: 'cash' | 'card' | 'gift_card' | 'store_credit' | 'split';
  amount: number;
  tip?: number;
  splitPayments?: {
    method: string;
    amount: number;
  }[];
}

// Full ticket state
export interface TicketState {
  id?: string;
  ticketNumber?: number;
  client: TicketClient | null;
  services: TicketService[];
  products: TicketProduct[];
  subtotal: number;
  tax: number;
  discount: number;
  discountInfo?: TicketDiscount;
  total: number;
  tip: number;
  isPaid: boolean;
  isDraft?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// TicketPanel props
export interface TicketPanelProps {
  mode?: PanelMode;
  onModeChange?: (mode: PanelMode) => void;
  onClose?: () => void;
  initialClient?: TicketClient | null;
  initialServices?: TicketService[];
  ticketId?: string;
  appointmentId?: string;
  readOnly?: boolean;
}

// Staff section props
export interface StaffSectionProps {
  selectedStaff: StaffMember | null;
  onStaffSelect: (staff: StaffMember) => void;
  availableStaff: StaffMember[];
  isLoading?: boolean;
}

// Service section props
export interface ServiceSectionProps {
  services: TicketService[];
  onAddService: (service: Omit<TicketService, 'id'>) => void;
  onRemoveService: (serviceId: string) => void;
  onUpdateService: (serviceId: string, updates: Partial<TicketService>) => void;
  onStatusChange: (serviceId: string, status: ServiceStatus) => void;
  selectedStaff: StaffMember | null;
}

// Summary section props
export interface SummarySectionProps {
  subtotal: number;
  tax: number;
  discount: number;
  tip: number;
  total: number;
  onApplyDiscount: (discount: TicketDiscount) => void;
  onRemoveDiscount: () => void;
  onAddTip: (amount: number) => void;
}

// Action bar props
export interface ActionBarProps {
  canCheckout: boolean;
  canSaveDraft: boolean;
  onCheckout: () => void;
  onSaveDraft: () => void;
  onClearTicket: () => void;
  onSplitTicket: () => void;
  onMergeTickets: () => void;
  isProcessing?: boolean;
}

export default {
  // Placeholder for re-exports
};
