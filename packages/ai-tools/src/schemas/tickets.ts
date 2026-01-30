/**
 * @mango/ai-tools - Ticket Tool Schemas
 *
 * Zod schemas for AI tools that manage tickets (sales transactions) in Mango Biz.
 * These tools allow AI assistants to view, create, modify, and close tickets.
 *
 * IMPORTANT: Ticket operations can be sensitive. Some actions require manager approval.
 */

import { z } from 'zod';
import type { AITool } from '../types';

// ============================================================================
// Common Schema Building Blocks
// ============================================================================

/**
 * UUID string validation pattern
 */
const uuidSchema = z
  .string()
  .uuid()
  .describe('Unique identifier in UUID format');

/**
 * Ticket status enum
 */
const ticketStatusSchema = z
  .enum(['open', 'in_progress', 'pending_payment', 'completed', 'voided', 'refunded'])
  .describe('Current status of the ticket');

/**
 * Payment method enum
 */
const paymentMethodSchema = z
  .enum([
    'cash',
    'credit_card',
    'debit_card',
    'gift_card',
    'loyalty_points',
    'check',
    'house_account',
    'split',
    'other',
  ])
  .describe('Method of payment for closing the ticket');

/**
 * Discount type enum
 */
const discountTypeSchema = z
  .enum(['percentage', 'fixed_amount', 'complimentary', 'price_override'])
  .describe(
    'Type of discount: percentage off total, fixed dollar amount, complimentary (100% off), or price override'
  );

// ============================================================================
// Get Open Tickets Schema
// ============================================================================

/**
 * Get all currently open tickets.
 * Can optionally filter by staff member.
 */
export const getOpenTicketsSchema = z
  .object({
    staffId: uuidSchema
      .optional()
      .describe('Filter to tickets assigned to this staff member'),
    includeDetails: z
      .boolean()
      .default(false)
      .describe('Include item details in response (default false for performance)'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .default(50)
      .describe('Maximum number of tickets to return (1-100, default 50)'),
  })
  .describe(
    'Get all currently open tickets. Use to see what work is in progress. Filter by staff to see a specific person\'s tickets.'
  );

export type GetOpenTicketsInput = z.infer<typeof getOpenTicketsSchema>;

// ============================================================================
// Get Ticket Schema
// ============================================================================

/**
 * Get detailed information about a specific ticket.
 */
export const getTicketSchema = z
  .object({
    ticketId: uuidSchema.describe('The unique identifier of the ticket to retrieve'),
  })
  .describe(
    'Get complete details for a specific ticket including all line items, discounts, payments, and service history.'
  );

export type GetTicketInput = z.infer<typeof getTicketSchema>;

// ============================================================================
// Create Ticket Schema
// ============================================================================

/**
 * Create a new ticket/transaction.
 * Tickets are the core sales record in Mango Biz.
 */
export const createTicketSchema = z
  .object({
    clientId: uuidSchema
      .optional()
      .describe(
        'Client to associate with this ticket. Optional for walk-in clients without profile.'
      ),
    staffId: uuidSchema.describe('Staff member who owns/created this ticket'),
    notes: z
      .string()
      .max(1000)
      .optional()
      .describe('Internal notes about this ticket'),
    source: z
      .enum(['walk_in', 'appointment', 'online', 'phone', 'recurring'])
      .default('walk_in')
      .describe('How this ticket originated (default walk_in)'),
    appointmentId: uuidSchema
      .optional()
      .describe('Link to appointment if ticket originated from one'),
  })
  .describe(
    'Create a new ticket to track a sale. Specify staff owner and optionally link to a client. Items are added separately.'
  );

export type CreateTicketInput = z.infer<typeof createTicketSchema>;

// ============================================================================
// Add Ticket Item Schema
// ============================================================================

/**
 * Add an item (service or product) to a ticket.
 */
export const addTicketItemSchema = z
  .object({
    ticketId: uuidSchema.describe('The ticket to add the item to'),
    serviceId: uuidSchema
      .optional()
      .describe('ID of the service to add (mutually exclusive with productId)'),
    productId: uuidSchema
      .optional()
      .describe('ID of the product to add (mutually exclusive with serviceId)'),
    quantity: z
      .number()
      .int()
      .positive()
      .default(1)
      .describe('Quantity of the item (default 1)'),
    staffId: uuidSchema.describe('Staff member who performed the service or sold the product'),
    price: z
      .number()
      .nonnegative()
      .optional()
      .describe('Override price (uses default price if not specified)'),
    notes: z
      .string()
      .max(500)
      .optional()
      .describe('Notes specific to this line item'),
  })
  .refine((data) => data.serviceId || data.productId, {
    message: 'Either serviceId or productId must be provided',
  })
  .refine((data) => !(data.serviceId && data.productId), {
    message: 'Cannot specify both serviceId and productId',
  })
  .describe(
    'Add a service or product to a ticket. Specify either serviceId OR productId, not both. Staff member earns commission on this item.'
  );

export type AddTicketItemInput = z.infer<typeof addTicketItemSchema>;

// ============================================================================
// Apply Discount Schema
// ============================================================================

/**
 * Apply a discount to a ticket.
 * May require manager approval depending on store settings and discount amount.
 */
export const applyDiscountSchema = z
  .object({
    ticketId: uuidSchema.describe('The ticket to apply the discount to'),
    discountType: discountTypeSchema,
    value: z
      .number()
      .nonnegative()
      .describe(
        'Discount value: percentage (0-100) for percentage type, dollar amount for fixed_amount, or new price for price_override'
      ),
    reason: z
      .string()
      .min(1)
      .max(500)
      .describe('Required: Reason for the discount (logged for audit)'),
    itemId: uuidSchema
      .optional()
      .describe('Apply discount to specific item only (omit for ticket-level discount)'),
    promotionCode: z
      .string()
      .max(50)
      .optional()
      .describe('Promotion code if applicable'),
  })
  .describe(
    'Apply a discount to a ticket or specific item. REQUIRES REASON for audit logging. May require manager approval for large discounts.'
  );

export type ApplyDiscountInput = z.infer<typeof applyDiscountSchema>;

// ============================================================================
// Close Ticket Schema
// ============================================================================

/**
 * Close a ticket by processing payment.
 * This finalizes the transaction and records the sale.
 */
export const closeTicketSchema = z
  .object({
    ticketId: uuidSchema.describe('The ticket to close'),
    paymentMethod: paymentMethodSchema,
    tipAmount: z
      .number()
      .nonnegative()
      .optional()
      .describe('Tip amount in dollars (optional)'),
    tipRecipientId: uuidSchema
      .optional()
      .describe('Staff member to receive the tip (defaults to ticket owner)'),
    splitPayments: z
      .array(
        z.object({
          method: paymentMethodSchema,
          amount: z.number().positive(),
          giftCardNumber: z.string().optional(),
        })
      )
      .optional()
      .describe('For split payments: array of payment methods and amounts'),
    printReceipt: z
      .boolean()
      .default(true)
      .describe('Print receipt after closing (default true)'),
    emailReceipt: z
      .boolean()
      .default(false)
      .describe('Email receipt to client if email on file (default false)'),
    sendSmsReceipt: z
      .boolean()
      .default(false)
      .describe('SMS receipt to client if phone on file (default false)'),
  })
  .describe(
    'Close a ticket by processing payment. Use paymentMethod for single payment or splitPayments for multiple. Includes receipt options.'
  );

export type CloseTicketInput = z.infer<typeof closeTicketSchema>;

// ============================================================================
// Void Ticket Schema
// ============================================================================

/**
 * Void (cancel) an entire ticket.
 * This is a sensitive operation that typically requires manager approval.
 */
export const voidTicketSchema = z
  .object({
    ticketId: uuidSchema.describe('The ticket to void'),
    reason: z
      .string()
      .min(5)
      .max(500)
      .describe('Required: Detailed reason for voiding (logged for audit)'),
    managerApproval: z
      .boolean()
      .describe(
        'Confirm manager approval. Most stores require this for voids.'
      ),
    managerPin: z
      .string()
      .optional()
      .describe('Manager PIN for approval (if required by store settings)'),
    refundPayment: z
      .boolean()
      .default(false)
      .describe('If ticket was paid, process refund to original payment method'),
  })
  .describe(
    'Void (cancel) an entire ticket. SENSITIVE OPERATION - requires manager approval. Provide detailed reason for audit trail.'
  );

export type VoidTicketInput = z.infer<typeof voidTicketSchema>;

// ============================================================================
// Remove Ticket Item Schema
// ============================================================================

/**
 * Remove an item from an open ticket.
 */
export const removeTicketItemSchema = z
  .object({
    ticketId: uuidSchema.describe('The ticket to remove the item from'),
    itemId: uuidSchema.describe('The item ID to remove'),
    reason: z
      .string()
      .min(1)
      .max(500)
      .optional()
      .describe('Reason for removal (recommended for audit)'),
  })
  .describe(
    'Remove a service or product from an open ticket. Cannot remove items from closed tickets - use void or refund instead.'
  );

export type RemoveTicketItemInput = z.infer<typeof removeTicketItemSchema>;

// ============================================================================
// Tool Definitions
// ============================================================================

/**
 * Get open tickets tool definition
 */
export const getOpenTicketsTool: AITool<typeof getOpenTicketsSchema> = {
  name: 'getOpenTickets',
  description:
    'Get all currently open tickets in the store. Filter by staff member to see their specific tickets. Useful for front desk overview.',
  category: 'tickets',
  parameters: getOpenTicketsSchema,
  returns: z.object({
    tickets: z.array(
      z.object({
        id: z.string(),
        clientName: z.string().optional(),
        staffName: z.string(),
        itemCount: z.number(),
        subtotal: z.number(),
        status: ticketStatusSchema,
        createdAt: z.string(),
        items: z
          .array(
            z.object({
              id: z.string(),
              name: z.string(),
              price: z.number(),
              staffName: z.string(),
            })
          )
          .optional(),
      })
    ),
    total: z.number(),
  }),
  tags: ['read', 'list'],
};

/**
 * Get ticket tool definition
 */
export const getTicketTool: AITool<typeof getTicketSchema> = {
  name: 'getTicket',
  description:
    'Get complete details for a specific ticket including all line items with prices, discounts applied, payments, and associated client/staff info.',
  category: 'tickets',
  parameters: getTicketSchema,
  returns: z.object({
    ticket: z.object({
      id: z.string(),
      status: ticketStatusSchema,
      clientId: z.string().optional(),
      clientName: z.string().optional(),
      staffId: z.string(),
      staffName: z.string(),
      source: z.string(),
      items: z.array(
        z.object({
          id: z.string(),
          type: z.enum(['service', 'product']),
          name: z.string(),
          quantity: z.number(),
          unitPrice: z.number(),
          totalPrice: z.number(),
          staffId: z.string(),
          staffName: z.string(),
          discount: z
            .object({
              type: z.string(),
              value: z.number(),
              reason: z.string(),
            })
            .optional(),
        })
      ),
      subtotal: z.number(),
      discountTotal: z.number(),
      taxAmount: z.number(),
      tipAmount: z.number(),
      total: z.number(),
      payments: z.array(
        z.object({
          method: z.string(),
          amount: z.number(),
          processedAt: z.string(),
        })
      ),
      createdAt: z.string(),
      closedAt: z.string().optional(),
      notes: z.string().optional(),
    }),
  }),
  tags: ['read'],
};

/**
 * Create ticket tool definition
 */
export const createTicketTool: AITool<typeof createTicketSchema> = {
  name: 'createTicket',
  description:
    'Create a new ticket to track a sale. Assign to a staff member and optionally link to a client. Add items to the ticket using addTicketItem.',
  category: 'tickets',
  parameters: createTicketSchema,
  returns: z.object({
    ticket: z.object({
      id: z.string(),
      staffId: z.string(),
      staffName: z.string(),
      clientId: z.string().optional(),
      clientName: z.string().optional(),
      status: z.literal('open'),
      createdAt: z.string(),
    }),
  }),
  tags: ['write', 'create'],
};

/**
 * Add ticket item tool definition
 */
export const addTicketItemTool: AITool<typeof addTicketItemSchema> = {
  name: 'addTicketItem',
  description:
    'Add a service or product to an existing ticket. Specify the staff member who performed/sold it for commission tracking.',
  category: 'tickets',
  parameters: addTicketItemSchema,
  returns: z.object({
    item: z.object({
      id: z.string(),
      ticketId: z.string(),
      type: z.enum(['service', 'product']),
      name: z.string(),
      quantity: z.number(),
      unitPrice: z.number(),
      totalPrice: z.number(),
      staffId: z.string(),
    }),
    ticketSubtotal: z.number(),
  }),
  tags: ['write', 'update'],
};

/**
 * Apply discount tool definition
 */
export const applyDiscountTool: AITool<typeof applyDiscountSchema> = {
  name: 'applyDiscount',
  description:
    'Apply a discount to a ticket or specific item. Requires a reason for audit logging. Large discounts may require manager approval.',
  category: 'tickets',
  parameters: applyDiscountSchema,
  returns: z.object({
    discount: z.object({
      id: z.string(),
      ticketId: z.string(),
      itemId: z.string().optional(),
      type: discountTypeSchema,
      value: z.number(),
      amountSaved: z.number(),
      reason: z.string(),
      appliedAt: z.string(),
    }),
    newTicketTotal: z.number(),
  }),
  requiresPermission: true,
  permissionLevel: 'staff',
  tags: ['write', 'update', 'sensitive'],
};

/**
 * Close ticket tool definition
 */
export const closeTicketTool: AITool<typeof closeTicketSchema> = {
  name: 'closeTicket',
  description:
    'Close a ticket by processing payment. Supports single payment, split payments, tips, and receipt options.',
  category: 'tickets',
  parameters: closeTicketSchema,
  returns: z.object({
    ticket: z.object({
      id: z.string(),
      status: z.literal('completed'),
      total: z.number(),
      tipAmount: z.number(),
      paymentMethod: z.string(),
      closedAt: z.string(),
      receiptId: z.string(),
    }),
    receiptPrinted: z.boolean(),
    receiptEmailed: z.boolean(),
    receiptSmsed: z.boolean(),
  }),
  tags: ['write', 'update'],
};

/**
 * Void ticket tool definition
 */
export const voidTicketTool: AITool<typeof voidTicketSchema> = {
  name: 'voidTicket',
  description:
    'Void (cancel) an entire ticket. SENSITIVE: Requires manager approval and detailed reason. Use for mistakes or cancellations.',
  category: 'tickets',
  parameters: voidTicketSchema,
  returns: z.object({
    ticket: z.object({
      id: z.string(),
      status: z.literal('voided'),
      voidedAt: z.string(),
      voidReason: z.string(),
      refundProcessed: z.boolean(),
      refundAmount: z.number().optional(),
    }),
  }),
  requiresPermission: true,
  permissionLevel: 'manager',
  tags: ['write', 'delete', 'sensitive'],
};

/**
 * Remove ticket item tool definition
 */
export const removeTicketItemTool: AITool<typeof removeTicketItemSchema> = {
  name: 'removeTicketItem',
  description:
    'Remove a service or product from an open ticket. Only works on open tickets - use void/refund for closed tickets.',
  category: 'tickets',
  parameters: removeTicketItemSchema,
  returns: z.object({
    removed: z.boolean(),
    ticketId: z.string(),
    itemId: z.string(),
    newSubtotal: z.number(),
  }),
  tags: ['write', 'delete'],
};

// ============================================================================
// Exports
// ============================================================================

/**
 * All ticket tool schemas
 */
export const ticketSchemas = {
  getOpenTickets: getOpenTicketsSchema,
  getTicket: getTicketSchema,
  createTicket: createTicketSchema,
  addTicketItem: addTicketItemSchema,
  applyDiscount: applyDiscountSchema,
  closeTicket: closeTicketSchema,
  voidTicket: voidTicketSchema,
  removeTicketItem: removeTicketItemSchema,
};

/**
 * All ticket tool definitions
 */
export const ticketTools = [
  getOpenTicketsTool,
  getTicketTool,
  createTicketTool,
  addTicketItemTool,
  applyDiscountTool,
  closeTicketTool,
  voidTicketTool,
  removeTicketItemTool,
];
