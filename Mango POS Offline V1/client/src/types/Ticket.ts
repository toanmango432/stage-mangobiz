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

export interface Payment {
  id: string;
  method: string;
  amount: number;
  tip: number;
  total: number;
  processedAt: Date;
  cardLast4?: string;
  transactionId?: string;
}

export interface Ticket {
  id: string;
  salonId: string;
  appointmentId?: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  services: TicketService[];
  products: TicketProduct[];
  status: TicketStatus;
  subtotal: number;
  discount: number;
  discountReason?: string;
  tax: number;
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
