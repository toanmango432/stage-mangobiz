/**
 * @mango/ai-tools - Ticket Tool Handlers
 *
 * Handlers for executing ticket-related AI tools.
 * These handlers bridge AI tool calls to business operations via the data provider.
 *
 * IMPORTANT: Ticket operations can be sensitive. Some actions require manager approval.
 *
 * Usage:
 * - Import handlers for specific tool operations
 * - Pass validated input and ExecutionContext
 * - Returns ToolResult<T> with success/error
 */

import type {
  ExecutionContext,
  ToolResult,
  ToolHandler,
} from '../types';
import {
  successResult,
  errorResult,
} from '../types';
import type {
  GetOpenTicketsInput,
  GetTicketInput,
  CreateTicketInput,
  AddTicketItemInput,
  ApplyDiscountInput,
  CloseTicketInput,
  VoidTicketInput,
  RemoveTicketItemInput,
} from '../schemas/tickets';

// ============================================================================
// Data Provider Interface
// ============================================================================

/**
 * Interface for ticket data operations.
 * Implementations can use Supabase, IndexedDB, or any other data source.
 * This interface is injected at runtime to decouple handlers from data layer.
 */
export interface TicketDataProvider {
  /**
   * Get all open tickets
   */
  getOpenTickets(params: {
    storeId: string;
    staffId?: string;
    includeDetails: boolean;
    limit: number;
  }): Promise<{
    tickets: TicketSummary[];
    total: number;
  }>;

  /**
   * Get a single ticket by ID
   */
  getTicket(params: {
    storeId: string;
    ticketId: string;
  }): Promise<TicketDetails | null>;

  /**
   * Create a new ticket
   */
  createTicket(params: {
    storeId: string;
    data: CreateTicketData;
    userId: string;
  }): Promise<CreatedTicket>;

  /**
   * Add an item to a ticket
   */
  addTicketItem(params: {
    storeId: string;
    ticketId: string;
    item: TicketItemData;
    userId: string;
  }): Promise<AddedTicketItem>;

  /**
   * Apply a discount to a ticket
   */
  applyDiscount(params: {
    storeId: string;
    ticketId: string;
    discount: DiscountData;
    userId: string;
  }): Promise<AppliedDiscount>;

  /**
   * Close a ticket by processing payment
   */
  closeTicket(params: {
    storeId: string;
    ticketId: string;
    payment: PaymentData;
    userId: string;
  }): Promise<ClosedTicket>;

  /**
   * Void a ticket
   */
  voidTicket(params: {
    storeId: string;
    ticketId: string;
    reason: string;
    managerApproval: boolean;
    managerPin?: string;
    refundPayment: boolean;
    userId: string;
  }): Promise<VoidedTicket>;

  /**
   * Remove an item from a ticket
   */
  removeTicketItem(params: {
    storeId: string;
    ticketId: string;
    itemId: string;
    reason?: string;
    userId: string;
  }): Promise<RemovedTicketItem>;
}

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Ticket status enum
 */
export type TicketStatus =
  | 'open'
  | 'in_progress'
  | 'pending_payment'
  | 'completed'
  | 'voided'
  | 'refunded';

/**
 * Summary ticket info returned by getOpenTickets
 */
export interface TicketSummary {
  id: string;
  clientName?: string;
  staffName: string;
  itemCount: number;
  subtotal: number;
  status: TicketStatus;
  createdAt: string;
  items?: Array<{
    id: string;
    name: string;
    price: number;
    staffName: string;
  }>;
}

/**
 * Full ticket details
 */
export interface TicketDetails {
  id: string;
  status: TicketStatus;
  clientId?: string;
  clientName?: string;
  staffId: string;
  staffName: string;
  source: string;
  items: Array<{
    id: string;
    type: 'service' | 'product';
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    staffId: string;
    staffName: string;
    discount?: {
      type: string;
      value: number;
      reason: string;
    };
  }>;
  subtotal: number;
  discountTotal: number;
  taxAmount: number;
  tipAmount: number;
  total: number;
  payments: Array<{
    method: string;
    amount: number;
    processedAt: string;
  }>;
  createdAt: string;
  closedAt?: string;
  notes?: string;
}

/**
 * Data for creating a new ticket
 */
export interface CreateTicketData {
  clientId?: string;
  staffId: string;
  notes?: string;
  source: string;
  appointmentId?: string;
}

/**
 * Created ticket response
 */
export interface CreatedTicket {
  id: string;
  staffId: string;
  staffName: string;
  clientId?: string;
  clientName?: string;
  status: 'open';
  createdAt: string;
}

/**
 * Data for adding a ticket item
 */
export interface TicketItemData {
  serviceId?: string;
  productId?: string;
  quantity: number;
  staffId: string;
  price?: number;
  notes?: string;
}

/**
 * Added ticket item response
 */
export interface AddedTicketItem {
  item: {
    id: string;
    ticketId: string;
    type: 'service' | 'product';
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    staffId: string;
  };
  ticketSubtotal: number;
}

/**
 * Data for applying a discount
 */
export interface DiscountData {
  discountType: 'percentage' | 'fixed_amount' | 'complimentary' | 'price_override';
  value: number;
  reason: string;
  itemId?: string;
  promotionCode?: string;
}

/**
 * Applied discount response
 */
export interface AppliedDiscount {
  discount: {
    id: string;
    ticketId: string;
    itemId?: string;
    type: string;
    value: number;
    amountSaved: number;
    reason: string;
    appliedAt: string;
  };
  newTicketTotal: number;
}

/**
 * Data for closing a ticket
 */
export interface PaymentData {
  paymentMethod: string;
  tipAmount?: number;
  tipRecipientId?: string;
  splitPayments?: Array<{
    method: string;
    amount: number;
    giftCardNumber?: string;
  }>;
  printReceipt: boolean;
  emailReceipt: boolean;
  sendSmsReceipt: boolean;
}

/**
 * Closed ticket response
 */
export interface ClosedTicket {
  ticket: {
    id: string;
    status: 'completed';
    total: number;
    tipAmount: number;
    paymentMethod: string;
    closedAt: string;
    receiptId: string;
  };
  receiptPrinted: boolean;
  receiptEmailed: boolean;
  receiptSmsed: boolean;
}

/**
 * Voided ticket response
 */
export interface VoidedTicket {
  ticket: {
    id: string;
    status: 'voided';
    voidedAt: string;
    voidReason: string;
    refundProcessed: boolean;
    refundAmount?: number;
  };
}

/**
 * Removed ticket item response
 */
export interface RemovedTicketItem {
  removed: boolean;
  ticketId: string;
  itemId: string;
  newSubtotal: number;
}

// ============================================================================
// Handler State
// ============================================================================

/**
 * Data provider instance (must be set before handlers can be used)
 */
let dataProvider: TicketDataProvider | null = null;

/**
 * Set the data provider for ticket handlers.
 * Must be called during app initialization before any handlers are invoked.
 *
 * @param provider - The data provider implementation
 */
export function setTicketDataProvider(provider: TicketDataProvider): void {
  dataProvider = provider;
}

/**
 * Get the current data provider.
 * Throws if not initialized.
 */
function getDataProvider(): TicketDataProvider {
  if (!dataProvider) {
    throw new Error(
      'Ticket data provider not initialized. Call setTicketDataProvider() during app setup.'
    );
  }
  return dataProvider;
}

// ============================================================================
// Handlers
// ============================================================================

/**
 * Handle getOpenTickets tool invocation.
 *
 * Gets all currently open tickets, optionally filtered by staff.
 */
export const handleGetOpenTickets: ToolHandler<
  GetOpenTicketsInput,
  {
    tickets: TicketSummary[];
    total: number;
  }
> = async (input, context) => {
  const startTime = Date.now();

  context.logger.info('Executing getOpenTickets', {
    staffId: input.staffId,
    includeDetails: input.includeDetails,
    limit: input.limit,
  });

  try {
    const provider = getDataProvider();

    const result = await provider.getOpenTickets({
      storeId: context.storeId,
      staffId: input.staffId,
      includeDetails: input.includeDetails,
      limit: input.limit,
    });

    context.logger.info('getOpenTickets completed', {
      ticketCount: result.tickets.length,
      total: result.total,
      executionTimeMs: Date.now() - startTime,
    });

    return successResult(result, {
      executionTimeMs: Date.now() - startTime,
      count: result.tickets.length,
      total: result.total,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    context.logger.error('getOpenTickets failed', { error: errorMessage });

    return errorResult(
      `Failed to get open tickets: ${errorMessage}`,
      'INTERNAL_ERROR',
      { executionTimeMs: Date.now() - startTime }
    );
  }
};

/**
 * Handle getTicket tool invocation.
 *
 * Retrieves complete details for a specific ticket.
 */
export const handleGetTicket: ToolHandler<
  GetTicketInput,
  { ticket: TicketDetails }
> = async (input, context) => {
  const startTime = Date.now();

  context.logger.info('Executing getTicket', {
    ticketId: input.ticketId,
  });

  try {
    const provider = getDataProvider();

    const ticket = await provider.getTicket({
      storeId: context.storeId,
      ticketId: input.ticketId,
    });

    if (!ticket) {
      context.logger.warn('Ticket not found', { ticketId: input.ticketId });
      return errorResult(
        `Ticket with ID '${input.ticketId}' not found`,
        'NOT_FOUND',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    context.logger.info('getTicket completed', {
      ticketId: ticket.id,
      status: ticket.status,
      executionTimeMs: Date.now() - startTime,
    });

    return successResult(
      { ticket },
      { executionTimeMs: Date.now() - startTime }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    context.logger.error('getTicket failed', { error: errorMessage });

    return errorResult(
      `Failed to get ticket: ${errorMessage}`,
      'INTERNAL_ERROR',
      { executionTimeMs: Date.now() - startTime }
    );
  }
};

/**
 * Handle createTicket tool invocation.
 *
 * Creates a new ticket for tracking a sale.
 */
export const handleCreateTicket: ToolHandler<
  CreateTicketInput,
  { ticket: CreatedTicket }
> = async (input, context) => {
  const startTime = Date.now();

  context.logger.info('Executing createTicket', {
    clientId: input.clientId,
    staffId: input.staffId,
    source: input.source,
  });

  try {
    const provider = getDataProvider();

    const ticket = await provider.createTicket({
      storeId: context.storeId,
      data: {
        clientId: input.clientId,
        staffId: input.staffId,
        notes: input.notes,
        source: input.source,
        appointmentId: input.appointmentId,
      },
      userId: context.userId,
    });

    context.logger.info('createTicket completed', {
      ticketId: ticket.id,
      staffId: ticket.staffId,
      executionTimeMs: Date.now() - startTime,
    });

    return successResult(
      { ticket },
      { executionTimeMs: Date.now() - startTime }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    context.logger.error('createTicket failed', { error: errorMessage });

    // Check for staff not found
    if (errorMessage.toLowerCase().includes('staff') &&
        errorMessage.toLowerCase().includes('not found')) {
      return errorResult(
        `Staff member with ID '${input.staffId}' not found`,
        'NOT_FOUND',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    // Check for client not found
    if (input.clientId &&
        errorMessage.toLowerCase().includes('client') &&
        errorMessage.toLowerCase().includes('not found')) {
      return errorResult(
        `Client with ID '${input.clientId}' not found`,
        'NOT_FOUND',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    return errorResult(
      `Failed to create ticket: ${errorMessage}`,
      'INTERNAL_ERROR',
      { executionTimeMs: Date.now() - startTime }
    );
  }
};

/**
 * Handle addTicketItem tool invocation.
 *
 * Adds a service or product to an existing ticket.
 */
export const handleAddTicketItem: ToolHandler<
  AddTicketItemInput,
  AddedTicketItem
> = async (input, context) => {
  const startTime = Date.now();

  context.logger.info('Executing addTicketItem', {
    ticketId: input.ticketId,
    serviceId: input.serviceId,
    productId: input.productId,
    staffId: input.staffId,
  });

  try {
    const provider = getDataProvider();

    const result = await provider.addTicketItem({
      storeId: context.storeId,
      ticketId: input.ticketId,
      item: {
        serviceId: input.serviceId,
        productId: input.productId,
        quantity: input.quantity,
        staffId: input.staffId,
        price: input.price,
        notes: input.notes,
      },
      userId: context.userId,
    });

    context.logger.info('addTicketItem completed', {
      ticketId: input.ticketId,
      itemId: result.item.id,
      newSubtotal: result.ticketSubtotal,
      executionTimeMs: Date.now() - startTime,
    });

    return successResult(result, {
      executionTimeMs: Date.now() - startTime,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    context.logger.error('addTicketItem failed', { error: errorMessage });

    // Check for ticket not found
    if (errorMessage.toLowerCase().includes('ticket') &&
        errorMessage.toLowerCase().includes('not found')) {
      return errorResult(
        `Ticket with ID '${input.ticketId}' not found`,
        'NOT_FOUND',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    // Check for ticket not open
    if (errorMessage.toLowerCase().includes('not open') ||
        errorMessage.toLowerCase().includes('closed')) {
      return errorResult(
        `Cannot add items to a closed ticket`,
        'CONFLICT',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    // Check for service/product not found
    if (errorMessage.toLowerCase().includes('service') &&
        errorMessage.toLowerCase().includes('not found')) {
      return errorResult(
        `Service with ID '${input.serviceId}' not found`,
        'NOT_FOUND',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    if (errorMessage.toLowerCase().includes('product') &&
        errorMessage.toLowerCase().includes('not found')) {
      return errorResult(
        `Product with ID '${input.productId}' not found`,
        'NOT_FOUND',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    return errorResult(
      `Failed to add ticket item: ${errorMessage}`,
      'INTERNAL_ERROR',
      { executionTimeMs: Date.now() - startTime }
    );
  }
};

/**
 * Handle applyDiscount tool invocation.
 *
 * Applies a discount to a ticket or specific item.
 */
export const handleApplyDiscount: ToolHandler<
  ApplyDiscountInput,
  AppliedDiscount
> = async (input, context) => {
  const startTime = Date.now();

  context.logger.info('Executing applyDiscount', {
    ticketId: input.ticketId,
    discountType: input.discountType,
    value: input.value,
    itemId: input.itemId,
  });

  try {
    const provider = getDataProvider();

    const result = await provider.applyDiscount({
      storeId: context.storeId,
      ticketId: input.ticketId,
      discount: {
        discountType: input.discountType,
        value: input.value,
        reason: input.reason,
        itemId: input.itemId,
        promotionCode: input.promotionCode,
      },
      userId: context.userId,
    });

    context.logger.info('applyDiscount completed', {
      ticketId: input.ticketId,
      discountId: result.discount.id,
      amountSaved: result.discount.amountSaved,
      newTotal: result.newTicketTotal,
      executionTimeMs: Date.now() - startTime,
    });

    return successResult(result, {
      executionTimeMs: Date.now() - startTime,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    context.logger.error('applyDiscount failed', { error: errorMessage });

    // Check for ticket not found
    if (errorMessage.toLowerCase().includes('ticket') &&
        errorMessage.toLowerCase().includes('not found')) {
      return errorResult(
        `Ticket with ID '${input.ticketId}' not found`,
        'NOT_FOUND',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    // Check for item not found
    if (input.itemId &&
        errorMessage.toLowerCase().includes('item') &&
        errorMessage.toLowerCase().includes('not found')) {
      return errorResult(
        `Item with ID '${input.itemId}' not found on this ticket`,
        'NOT_FOUND',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    // Check for manager approval required
    if (errorMessage.toLowerCase().includes('manager') ||
        errorMessage.toLowerCase().includes('approval')) {
      return errorResult(
        `Manager approval required for this discount`,
        'PERMISSION_DENIED',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    // Check for invalid promotion code
    if (errorMessage.toLowerCase().includes('promotion') ||
        errorMessage.toLowerCase().includes('invalid code')) {
      return errorResult(
        `Invalid or expired promotion code`,
        'CONFLICT',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    return errorResult(
      `Failed to apply discount: ${errorMessage}`,
      'INTERNAL_ERROR',
      { executionTimeMs: Date.now() - startTime }
    );
  }
};

/**
 * Handle closeTicket tool invocation.
 *
 * Closes a ticket by processing payment.
 */
export const handleCloseTicket: ToolHandler<
  CloseTicketInput,
  ClosedTicket
> = async (input, context) => {
  const startTime = Date.now();

  context.logger.info('Executing closeTicket', {
    ticketId: input.ticketId,
    paymentMethod: input.paymentMethod,
    tipAmount: input.tipAmount,
    hasSplitPayments: !!input.splitPayments?.length,
  });

  try {
    const provider = getDataProvider();

    const result = await provider.closeTicket({
      storeId: context.storeId,
      ticketId: input.ticketId,
      payment: {
        paymentMethod: input.paymentMethod,
        tipAmount: input.tipAmount,
        tipRecipientId: input.tipRecipientId,
        splitPayments: input.splitPayments,
        printReceipt: input.printReceipt,
        emailReceipt: input.emailReceipt,
        sendSmsReceipt: input.sendSmsReceipt,
      },
      userId: context.userId,
    });

    context.logger.info('closeTicket completed', {
      ticketId: input.ticketId,
      total: result.ticket.total,
      tipAmount: result.ticket.tipAmount,
      receiptPrinted: result.receiptPrinted,
      executionTimeMs: Date.now() - startTime,
    });

    return successResult(result, {
      executionTimeMs: Date.now() - startTime,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    context.logger.error('closeTicket failed', { error: errorMessage });

    // Check for ticket not found
    if (errorMessage.toLowerCase().includes('ticket') &&
        errorMessage.toLowerCase().includes('not found')) {
      return errorResult(
        `Ticket with ID '${input.ticketId}' not found`,
        'NOT_FOUND',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    // Check for already closed
    if (errorMessage.toLowerCase().includes('already closed') ||
        errorMessage.toLowerCase().includes('already completed')) {
      return errorResult(
        `Ticket is already closed`,
        'CONFLICT',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    // Check for payment failure
    if (errorMessage.toLowerCase().includes('payment') &&
        (errorMessage.toLowerCase().includes('declined') ||
         errorMessage.toLowerCase().includes('failed'))) {
      return errorResult(
        `Payment was declined or failed to process`,
        'CONFLICT',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    // Check for insufficient funds (split payments)
    if (errorMessage.toLowerCase().includes('insufficient') ||
        errorMessage.toLowerCase().includes('split total')) {
      return errorResult(
        `Split payment amounts do not equal ticket total`,
        'CONFLICT',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    return errorResult(
      `Failed to close ticket: ${errorMessage}`,
      'INTERNAL_ERROR',
      { executionTimeMs: Date.now() - startTime }
    );
  }
};

/**
 * Handle voidTicket tool invocation.
 *
 * Voids (cancels) an entire ticket. This is a sensitive operation.
 */
export const handleVoidTicket: ToolHandler<
  VoidTicketInput,
  VoidedTicket
> = async (input, context) => {
  const startTime = Date.now();

  context.logger.info('Executing voidTicket', {
    ticketId: input.ticketId,
    managerApproval: input.managerApproval,
    refundPayment: input.refundPayment,
  });

  // Log this as a sensitive operation
  context.logger.warn('Sensitive operation: void ticket', {
    ticketId: input.ticketId,
    userId: context.userId,
    reason: input.reason,
  });

  try {
    const provider = getDataProvider();

    const result = await provider.voidTicket({
      storeId: context.storeId,
      ticketId: input.ticketId,
      reason: input.reason,
      managerApproval: input.managerApproval,
      managerPin: input.managerPin,
      refundPayment: input.refundPayment,
      userId: context.userId,
    });

    context.logger.info('voidTicket completed', {
      ticketId: input.ticketId,
      voidedAt: result.ticket.voidedAt,
      refundProcessed: result.ticket.refundProcessed,
      executionTimeMs: Date.now() - startTime,
    });

    return successResult(result, {
      executionTimeMs: Date.now() - startTime,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    context.logger.error('voidTicket failed', { error: errorMessage });

    // Check for ticket not found
    if (errorMessage.toLowerCase().includes('ticket') &&
        errorMessage.toLowerCase().includes('not found')) {
      return errorResult(
        `Ticket with ID '${input.ticketId}' not found`,
        'NOT_FOUND',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    // Check for manager approval required
    if (errorMessage.toLowerCase().includes('manager') ||
        errorMessage.toLowerCase().includes('approval') ||
        errorMessage.toLowerCase().includes('pin')) {
      return errorResult(
        `Manager approval required for void operation. Provide valid manager PIN.`,
        'PERMISSION_DENIED',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    // Check for already voided
    if (errorMessage.toLowerCase().includes('already voided')) {
      return errorResult(
        `Ticket is already voided`,
        'CONFLICT',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    // Check for refund failure
    if (errorMessage.toLowerCase().includes('refund') &&
        errorMessage.toLowerCase().includes('failed')) {
      return errorResult(
        `Refund failed to process. Ticket not voided.`,
        'CONFLICT',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    return errorResult(
      `Failed to void ticket: ${errorMessage}`,
      'INTERNAL_ERROR',
      { executionTimeMs: Date.now() - startTime }
    );
  }
};

/**
 * Handle removeTicketItem tool invocation.
 *
 * Removes an item from an open ticket.
 */
export const handleRemoveTicketItem: ToolHandler<
  RemoveTicketItemInput,
  RemovedTicketItem
> = async (input, context) => {
  const startTime = Date.now();

  context.logger.info('Executing removeTicketItem', {
    ticketId: input.ticketId,
    itemId: input.itemId,
    reason: input.reason,
  });

  try {
    const provider = getDataProvider();

    const result = await provider.removeTicketItem({
      storeId: context.storeId,
      ticketId: input.ticketId,
      itemId: input.itemId,
      reason: input.reason,
      userId: context.userId,
    });

    context.logger.info('removeTicketItem completed', {
      ticketId: input.ticketId,
      itemId: input.itemId,
      removed: result.removed,
      newSubtotal: result.newSubtotal,
      executionTimeMs: Date.now() - startTime,
    });

    return successResult(result, {
      executionTimeMs: Date.now() - startTime,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    context.logger.error('removeTicketItem failed', { error: errorMessage });

    // Check for ticket not found
    if (errorMessage.toLowerCase().includes('ticket') &&
        errorMessage.toLowerCase().includes('not found')) {
      return errorResult(
        `Ticket with ID '${input.ticketId}' not found`,
        'NOT_FOUND',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    // Check for item not found
    if (errorMessage.toLowerCase().includes('item') &&
        errorMessage.toLowerCase().includes('not found')) {
      return errorResult(
        `Item with ID '${input.itemId}' not found on this ticket`,
        'NOT_FOUND',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    // Check for ticket not open
    if (errorMessage.toLowerCase().includes('not open') ||
        errorMessage.toLowerCase().includes('closed')) {
      return errorResult(
        `Cannot remove items from a closed ticket. Use void or refund instead.`,
        'CONFLICT',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    return errorResult(
      `Failed to remove ticket item: ${errorMessage}`,
      'INTERNAL_ERROR',
      { executionTimeMs: Date.now() - startTime }
    );
  }
};

// ============================================================================
// Handler Registry
// ============================================================================

/**
 * All ticket tool handlers mapped by tool name.
 */
export const ticketHandlers = {
  getOpenTickets: handleGetOpenTickets,
  getTicket: handleGetTicket,
  createTicket: handleCreateTicket,
  addTicketItem: handleAddTicketItem,
  applyDiscount: handleApplyDiscount,
  closeTicket: handleCloseTicket,
  voidTicket: handleVoidTicket,
  removeTicketItem: handleRemoveTicketItem,
};
