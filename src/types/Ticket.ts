import { TicketStatus, SyncStatus } from './common';

export interface TicketService {
  serviceId: string;
  serviceName: string;
  staffId: string;
  staffName: string;
  price: number;
  duration: number; // minutes
  commission: number;
  startTime: Date;
  endTime?: Date;
}

export interface TicketProduct {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface TicketClient {
  clientId: string;
  clientName: string;
  clientPhone: string;
  services?: string[];    // Optional: service IDs assigned to this client
}

export interface Payment {
  id: string;
  method: string;              // 'cash', 'credit-card', 'debit-card', etc.
  cardType?: string;            // 'visa', 'mastercard', 'amex', 'discover'
  cardLast4?: string;           // Last 4 digits of card (e.g., '1234')
  amount: number;               // Payment amount (excluding tip)
  tip: number;                  // Tip/gratuity amount
  total: number;                // Total (amount + tip)
  transactionId?: string;       // Authorization/transaction ID
  processedAt: Date;            // When payment was processed
  status?: 'approved' | 'declined' | 'pending' | 'failed'; // Payment status
}

export interface Ticket {
  id: string;
  salonId: string;
  appointmentId?: string;

  // Primary client (for backward compatibility and display)
  clientId: string;
  clientName: string;
  clientPhone: string;

  // Group Ticket Support
  isGroupTicket?: boolean;      // True if multiple clients on one ticket
  clients?: TicketClient[];     // All clients in the group (includes primary)

  // Ticket Merging Support
  isMergedTicket?: boolean;     // True if this ticket was created by merging others
  mergedFromTickets?: string[]; // Array of ticket IDs that were merged into this one
  originalTicketId?: string;    // If merged into another ticket, the target ticket ID
  mergedAt?: Date;              // When the merge happened
  mergedBy?: string;            // User ID who performed the merge

  services: TicketService[];
  products: TicketProduct[];
  status: TicketStatus;
  subtotal: number;
  discount: number;
  discountReason?: string;
  discountPercent?: number;     // Discount percentage (e.g., 10 for 10%)
  tax: number;
  taxRate?: number;             // Tax rate percentage (e.g., 9 for 9%)
  tip: number;
  total: number;
  payments: Payment[];
  createdAt: Date;
  completedAt?: Date;
  createdBy: string;
  lastModifiedBy: string;
  syncStatus: SyncStatus;
}

export interface CreateTicketInput {
  clientId: string;
  clientName: string;
  clientPhone: string;
  appointmentId?: string;
  services: Omit<TicketService, 'endTime'>[];
  products?: TicketProduct[];
}
