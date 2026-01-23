/**
 * Ticket Type Adapter
 *
 * Converts between Supabase TicketRow and app Ticket types.
 */

import type { TicketRow, TicketInsert, TicketUpdate, Json } from '../types';
import type { Ticket, TicketService, TicketProduct, Payment, TicketStatus, SyncStatus } from '@mango/types';

/**
 * Convert Supabase TicketRow to app Ticket type
 */
export function toTicket(row: TicketRow): Ticket {
  const services = parseServices(row.services);
  const products = parseProducts(row.products);
  const payments = parsePayments(row.payments);

  return {
    id: row.id,
    storeId: row.store_id,
    appointmentId: row.appointment_id || undefined,
    clientId: row.client_id || '',
    clientName: row.client_name,
    clientPhone: '', // Not stored in Supabase row
    services,
    products,
    status: row.status as TicketStatus,
    subtotal: row.subtotal,
    discount: row.discount,
    tax: row.tax,
    tip: row.tip,
    total: row.total,
    payments,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: 'system', // Not stored in row
    lastModifiedBy: 'system', // Not stored in row
    syncStatus: row.sync_status as SyncStatus,
  };
}

/**
 * Convert app Ticket to Supabase TicketInsert
 */
export function toTicketInsert(
  ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>,
  storeId?: string
): Omit<TicketInsert, 'store_id'> & { store_id?: string } {
  return {
    store_id: storeId || ticket.storeId,
    appointment_id: ticket.appointmentId || null,
    client_id: ticket.clientId || null,
    client_name: ticket.clientName,
    services: serializeServices(ticket.services) as Json,
    products: serializeProducts(ticket.products) as Json,
    status: ticket.status,
    subtotal: ticket.subtotal,
    discount: ticket.discount,
    tax: ticket.tax,
    tip: ticket.tip,
    total: ticket.total,
    payments: serializePayments(ticket.payments) as Json,
    sync_status: ticket.syncStatus || 'synced',
    sync_version: 1,
  };
}

/**
 * Convert partial Ticket updates to Supabase TicketUpdate
 */
export function toTicketUpdate(updates: Partial<Ticket>): TicketUpdate {
  const result: TicketUpdate = {};

  if (updates.clientId !== undefined) {
    result.client_id = updates.clientId || null;
  }
  if (updates.clientName !== undefined) {
    result.client_name = updates.clientName;
  }
  if (updates.services !== undefined) {
    result.services = serializeServices(updates.services) as Json;
  }
  if (updates.products !== undefined) {
    result.products = serializeProducts(updates.products) as Json;
  }
  if (updates.status !== undefined) {
    result.status = updates.status;
  }
  if (updates.subtotal !== undefined) {
    result.subtotal = updates.subtotal;
  }
  if (updates.discount !== undefined) {
    result.discount = updates.discount;
  }
  if (updates.tax !== undefined) {
    result.tax = updates.tax;
  }
  if (updates.tip !== undefined) {
    result.tip = updates.tip;
  }
  if (updates.total !== undefined) {
    result.total = updates.total;
  }
  if (updates.payments !== undefined) {
    result.payments = serializePayments(updates.payments) as Json;
  }
  if (updates.syncStatus !== undefined) {
    result.sync_status = updates.syncStatus;
  }

  return result;
}

// ==================== PARSE HELPERS ====================

function parseServices(json: Json): TicketService[] {
  if (!json || !Array.isArray(json)) return [];

  return json.map((item) => {
    const s = item as Record<string, unknown>;
    return {
      serviceId: String(s.serviceId ?? s.service_id ?? ''),
      serviceName: String(s.serviceName ?? s.service_name ?? s.name ?? ''),
      name: String(s.name ?? s.serviceName ?? s.service_name ?? ''),
      staffId: String(s.staffId ?? s.staff_id ?? ''),
      staffName: String(s.staffName ?? s.staff_name ?? ''),
      price: Number(s.price ?? 0),
      duration: Number(s.duration ?? 0),
      commission: Number(s.commission ?? 0),
      startTime: String(s.startTime ?? s.start_time ?? ''),
      endTime: s.endTime as string | undefined ?? s.end_time as string | undefined,
      status: (s.status as TicketService['status']) || 'not_started',
      statusHistory: Array.isArray(s.statusHistory ?? s.status_history)
        ? (s.statusHistory ?? s.status_history) as TicketService['statusHistory']
        : [],
      totalPausedDuration: Number(s.totalPausedDuration ?? s.total_paused_duration ?? 0),
      actualStartTime: s.actualStartTime as string | undefined ?? s.actual_start_time as string | undefined,
      pausedAt: s.pausedAt as string | undefined ?? s.paused_at as string | undefined,
      actualDuration: s.actualDuration as number | undefined ?? s.actual_duration as number | undefined,
      notes: s.notes as string | undefined,
    };
  });
}

function parseProducts(json: Json): TicketProduct[] {
  if (!json || !Array.isArray(json)) return [];

  return json.map((item) => {
    const p = item as Record<string, unknown>;
    return {
      productId: String(p.productId ?? p.product_id ?? ''),
      productName: String(p.productName ?? p.product_name ?? p.name ?? ''),
      name: String(p.name ?? p.productName ?? p.product_name ?? ''),
      quantity: Number(p.quantity ?? 1),
      price: Number(p.price ?? p.unitPrice ?? p.unit_price ?? 0),
      unitPrice: Number(p.unitPrice ?? p.unit_price ?? p.price ?? 0),
      total: Number(p.total ?? 0),
    };
  });
}

function parsePayments(json: Json): Payment[] {
  if (!json || !Array.isArray(json)) return [];

  return json.map((item) => {
    const p = item as Record<string, unknown>;
    return {
      id: String(p.id ?? ''),
      method: String(p.method ?? p.payment_method ?? ''),
      cardType: p.cardType as string | undefined ?? p.card_type as string | undefined,
      cardLast4: p.cardLast4 as string | undefined ?? p.card_last4 as string | undefined,
      amount: Number(p.amount ?? 0),
      tip: Number(p.tip ?? 0),
      total: Number(p.total ?? 0),
      transactionId: p.transactionId as string | undefined ?? p.transaction_id as string | undefined,
      processedAt: String(p.processedAt ?? p.processed_at ?? ''),
      status: p.status as Payment['status'] | undefined,
    };
  });
}

// ==================== SERIALIZE HELPERS ====================

function serializeServices(services: TicketService[]): unknown[] {
  return services.map(s => ({
    serviceId: s.serviceId,
    serviceName: s.serviceName || s.name,
    staffId: s.staffId,
    staffName: s.staffName,
    price: s.price,
    duration: s.duration,
    commission: s.commission,
    startTime: s.startTime,
    endTime: s.endTime,
    status: s.status,
    statusHistory: s.statusHistory,
    totalPausedDuration: s.totalPausedDuration,
    actualStartTime: s.actualStartTime,
    pausedAt: s.pausedAt,
    actualDuration: s.actualDuration,
    notes: s.notes,
  }));
}

function serializeProducts(products: TicketProduct[]): unknown[] {
  return products.map(p => ({
    productId: p.productId,
    productName: p.productName || p.name,
    quantity: p.quantity,
    price: p.price,
    unitPrice: p.unitPrice || p.price,
    total: p.total,
  }));
}

function serializePayments(payments: Payment[]): unknown[] {
  return payments.map(p => ({
    id: p.id,
    method: p.method,
    cardType: p.cardType,
    cardLast4: p.cardLast4,
    amount: p.amount,
    tip: p.tip,
    total: p.total,
    transactionId: p.transactionId,
    processedAt: p.processedAt,
    status: p.status,
  }));
}

/**
 * Convert array of TicketRows to Tickets
 */
export function toTickets(rows: TicketRow[]): Ticket[] {
  return rows.map(toTicket);
}
