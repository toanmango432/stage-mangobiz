/**
 * @mango/ai-tools - Client Tool Schemas
 *
 * Zod schemas for AI tools that manage clients in Mango Biz.
 * These tools allow AI assistants to search, view, create, and update client records.
 */

import { z } from 'zod';

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
 * Client search filters
 */
const clientFiltersSchema = z
  .object({
    loyaltyTier: z
      .enum(['bronze', 'silver', 'gold', 'platinum', 'vip'])
      .optional()
      .describe('Filter by loyalty program tier'),
    isVip: z.boolean().optional().describe('Filter by VIP status'),
    isBlocked: z.boolean().optional().describe('Filter by blocked status'),
    hasUpcomingAppointment: z
      .boolean()
      .optional()
      .describe('Filter to clients with upcoming appointments'),
    lastVisitWithinDays: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Filter to clients who visited within this many days'),
    minTotalSpent: z
      .number()
      .nonnegative()
      .optional()
      .describe('Minimum lifetime spend in dollars'),
    preferredStaffId: z
      .string()
      .uuid()
      .optional()
      .describe('Filter to clients who prefer this staff member'),
    source: z
      .enum([
        'walk_in',
        'online_booking',
        'referral',
        'social_media',
        'google',
        'yelp',
        'instagram',
        'facebook',
        'tiktok',
        'advertisement',
        'event',
        'gift_card',
        'other',
      ])
      .optional()
      .describe('Filter by how the client was acquired'),
    tags: z
      .array(z.string())
      .optional()
      .describe('Filter to clients with any of these tags'),
  })
  .describe('Filters to narrow down client search results');

/**
 * Note category for client notes
 */
const noteCategorySchema = z
  .enum(['general', 'service', 'preference', 'medical', 'important'])
  .describe(
    'Category of the note: general (default), service (about services), preference (client preferences), medical (health-related, staff-only), important (high priority)'
  );

// ============================================================================
// Search Clients Schema
// ============================================================================

/**
 * Search for clients by name, phone, email, or visit history.
 * Returns a list of matching clients with basic information.
 */
export const searchClientsSchema = z
  .object({
    query: z
      .string()
      .min(1)
      .describe(
        'Search term to match against client name, phone number, or email address. Partial matches are supported.'
      ),
    filters: clientFiltersSchema.optional(),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .default(10)
      .describe('Maximum number of clients to return (1-100, default 10)'),
    offset: z
      .number()
      .int()
      .nonnegative()
      .default(0)
      .describe('Number of clients to skip for pagination (default 0)'),
  })
  .describe(
    'Search for clients by name, phone, or email. Use filters to narrow results by loyalty tier, visit history, or status.'
  );

export type SearchClientsInput = z.infer<typeof searchClientsSchema>;

// ============================================================================
// Get Client Schema
// ============================================================================

/**
 * Get detailed information about a specific client.
 * Returns the full client profile including preferences, history summary, and notes.
 */
export const getClientSchema = z
  .object({
    clientId: uuidSchema.describe('The unique identifier of the client to retrieve'),
  })
  .describe(
    'Retrieve complete details for a specific client including profile, preferences, loyalty info, and visit summary.'
  );

export type GetClientInput = z.infer<typeof getClientSchema>;

// ============================================================================
// Get Client History Schema
// ============================================================================

/**
 * Get the visit history for a client.
 * Can include appointments, tickets/transactions, or both.
 */
export const getClientHistorySchema = z
  .object({
    clientId: uuidSchema.describe('The unique identifier of the client'),
    includeAppointments: z
      .boolean()
      .default(true)
      .describe('Include appointment history (default true)'),
    includeTickets: z
      .boolean()
      .default(true)
      .describe('Include ticket/transaction history (default true)'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20)
      .describe('Maximum number of history items to return per type (1-100, default 20)'),
    startDate: z
      .string()
      .datetime()
      .optional()
      .describe('Filter to history after this date (ISO 8601 format)'),
    endDate: z
      .string()
      .datetime()
      .optional()
      .describe('Filter to history before this date (ISO 8601 format)'),
  })
  .describe(
    "Retrieve a client's visit history including past appointments and transactions. Useful for understanding client preferences and spending patterns."
  );

export type GetClientHistoryInput = z.infer<typeof getClientHistorySchema>;

// ============================================================================
// Create Client Schema
// ============================================================================

/**
 * Create a new client record.
 * Requires basic contact information, optional profile details.
 */
export const createClientSchema = z
  .object({
    // Required fields
    firstName: z.string().min(1).max(100).describe("Client's first name"),
    lastName: z.string().min(1).max(100).describe("Client's last name"),
    phone: z
      .string()
      .min(10)
      .max(20)
      .describe('Phone number (10+ digits, formatting optional)'),

    // Optional contact info
    email: z
      .string()
      .email()
      .optional()
      .describe('Email address for appointment confirmations and marketing'),
    birthday: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .describe('Birthday in YYYY-MM-DD format for birthday promotions'),
    gender: z
      .enum(['female', 'male', 'non_binary', 'prefer_not_to_say'])
      .optional()
      .describe('Gender for personalized service recommendations'),

    // Address
    address: z
      .object({
        street: z.string().optional(),
        apt: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        country: z.string().optional(),
      })
      .optional()
      .describe('Mailing address for correspondence'),

    // Source tracking
    source: z
      .enum([
        'walk_in',
        'online_booking',
        'referral',
        'social_media',
        'google',
        'yelp',
        'instagram',
        'facebook',
        'tiktok',
        'advertisement',
        'event',
        'gift_card',
        'other',
      ])
      .optional()
      .describe('How the client found the business'),
    sourceDetails: z
      .string()
      .max(500)
      .optional()
      .describe('Additional details about the source (e.g., specific campaign)'),
    referredByClientId: z
      .string()
      .uuid()
      .optional()
      .describe('ID of the client who referred this person'),

    // Communication preferences
    allowEmail: z
      .boolean()
      .default(true)
      .describe('Allow email communications (default true)'),
    allowSms: z
      .boolean()
      .default(true)
      .describe('Allow SMS notifications (default true)'),
    allowMarketing: z
      .boolean()
      .default(false)
      .describe('Allow marketing messages (default false)'),

    // Notes
    notes: z
      .string()
      .max(2000)
      .optional()
      .describe('Initial notes about the client'),
  })
  .describe(
    'Create a new client record. Phone number is required for appointment reminders. Email enables confirmations and receipts.'
  );

export type CreateClientInput = z.infer<typeof createClientSchema>;

// ============================================================================
// Update Client Schema
// ============================================================================

/**
 * Update an existing client's information.
 * All fields are optional - only specified fields will be updated.
 */
export const updateClientSchema = z
  .object({
    clientId: uuidSchema.describe('The unique identifier of the client to update'),

    // Basic info updates
    firstName: z.string().min(1).max(100).optional().describe('Updated first name'),
    lastName: z.string().min(1).max(100).optional().describe('Updated last name'),
    phone: z.string().min(10).max(20).optional().describe('Updated phone number'),
    email: z.string().email().nullable().optional().describe('Updated email (null to remove)'),
    birthday: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable()
      .optional()
      .describe('Updated birthday in YYYY-MM-DD format'),
    gender: z
      .enum(['female', 'male', 'non_binary', 'prefer_not_to_say'])
      .nullable()
      .optional()
      .describe('Updated gender'),

    // Address update
    address: z
      .object({
        street: z.string().optional(),
        apt: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        country: z.string().optional(),
      })
      .nullable()
      .optional()
      .describe('Updated address (null to remove)'),

    // Status updates
    isVip: z.boolean().optional().describe('Set VIP status'),

    // Preferences updates
    preferredStaffIds: z
      .array(z.string().uuid())
      .optional()
      .describe('List of preferred staff member IDs'),
    preferredLanguage: z.string().optional().describe('Preferred language for communications'),

    // Communication preferences
    allowEmail: z.boolean().optional().describe('Update email permission'),
    allowSms: z.boolean().optional().describe('Update SMS permission'),
    allowMarketing: z.boolean().optional().describe('Update marketing permission'),

    // Tags
    tags: z.array(z.string()).optional().describe('Replace all tags with this list'),
  })
  .describe(
    'Update a client\'s profile information. Only include fields that need to change. Use null to clear optional fields.'
  );

export type UpdateClientInput = z.infer<typeof updateClientSchema>;

// ============================================================================
// Add Client Note Schema
// ============================================================================

/**
 * Add a note to a client's profile.
 * Notes can be categorized and marked as private (staff-only).
 */
export const addClientNoteSchema = z
  .object({
    clientId: uuidSchema.describe('The unique identifier of the client'),
    note: z.string().min(1).max(5000).describe('The note content to add'),
    category: noteCategorySchema.default('general'),
    isPrivate: z
      .boolean()
      .default(false)
      .describe('If true, note is only visible to staff (not shared with client)'),
  })
  .describe(
    "Add a note to a client's profile. Use categories to organize: general for misc, service for service-related, preference for likes/dislikes, medical for health info (auto-private), important for urgent items."
  );

export type AddClientNoteInput = z.infer<typeof addClientNoteSchema>;

// ============================================================================
// Tool Definitions
// ============================================================================

import type { AITool } from '../types';

/**
 * Search clients tool definition
 */
export const searchClientsTool: AITool<typeof searchClientsSchema> = {
  name: 'searchClients',
  description:
    'Search for clients by name, phone number, or email address. Can filter by loyalty tier, VIP status, visit history, and more. Returns basic client info for each match.',
  category: 'clients',
  parameters: searchClientsSchema,
  returns: z.object({
    clients: z.array(
      z.object({
        id: z.string(),
        firstName: z.string(),
        lastName: z.string(),
        phone: z.string(),
        email: z.string().optional(),
        isVip: z.boolean(),
        loyaltyTier: z.string().optional(),
        lastVisitDate: z.string().optional(),
        totalVisits: z.number(),
      })
    ),
    total: z.number(),
    hasMore: z.boolean(),
  }),
  tags: ['read', 'search'],
};

/**
 * Get client tool definition
 */
export const getClientTool: AITool<typeof getClientSchema> = {
  name: 'getClient',
  description:
    'Get complete details for a specific client including their profile, contact info, preferences, loyalty status, visit summary, and notes. Use clientId from search results.',
  category: 'clients',
  parameters: getClientSchema,
  returns: z.object({
    client: z.object({
      id: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      phone: z.string(),
      email: z.string().optional(),
      birthday: z.string().optional(),
      gender: z.string().optional(),
      isVip: z.boolean(),
      isBlocked: z.boolean(),
      loyaltyTier: z.string().optional(),
      pointsBalance: z.number().optional(),
      membershipStatus: z.string().optional(),
      totalVisits: z.number(),
      totalSpent: z.number(),
      lastVisitDate: z.string().optional(),
      preferredStaff: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
      notes: z
        .array(
          z.object({
            id: z.string(),
            content: z.string(),
            category: z.string(),
            createdAt: z.string(),
          })
        )
        .optional(),
    }),
  }),
  tags: ['read'],
};

/**
 * Get client history tool definition
 */
export const getClientHistoryTool: AITool<typeof getClientHistorySchema> = {
  name: 'getClientHistory',
  description:
    "Retrieve a client's visit history including past appointments and purchase transactions. Use to understand service patterns, spending, and preferences.",
  category: 'clients',
  parameters: getClientHistorySchema,
  returns: z.object({
    clientId: z.string(),
    appointments: z
      .array(
        z.object({
          id: z.string(),
          date: z.string(),
          services: z.array(z.string()),
          staffName: z.string(),
          status: z.string(),
        })
      )
      .optional(),
    tickets: z
      .array(
        z.object({
          id: z.string(),
          date: z.string(),
          total: z.number(),
          itemCount: z.number(),
          staffName: z.string(),
        })
      )
      .optional(),
    summary: z.object({
      totalAppointments: z.number(),
      totalTransactions: z.number(),
      totalSpent: z.number(),
      averageTicket: z.number(),
    }),
  }),
  tags: ['read', 'history'],
};

/**
 * Create client tool definition
 */
export const createClientTool: AITool<typeof createClientSchema> = {
  name: 'createClient',
  description:
    'Create a new client record. Requires first name, last name, and phone number. Optionally include email, birthday, address, and communication preferences.',
  category: 'clients',
  parameters: createClientSchema,
  returns: z.object({
    client: z.object({
      id: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      phone: z.string(),
      email: z.string().optional(),
      createdAt: z.string(),
    }),
  }),
  tags: ['write', 'create'],
};

/**
 * Update client tool definition
 */
export const updateClientTool: AITool<typeof updateClientSchema> = {
  name: 'updateClient',
  description:
    "Update a client's profile information. Only include fields that need to change. Can update contact info, preferences, VIP status, and tags.",
  category: 'clients',
  parameters: updateClientSchema,
  returns: z.object({
    client: z.object({
      id: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      updatedAt: z.string(),
    }),
    updatedFields: z.array(z.string()),
  }),
  tags: ['write', 'update'],
};

/**
 * Add client note tool definition
 */
export const addClientNoteTool: AITool<typeof addClientNoteSchema> = {
  name: 'addClientNote',
  description:
    "Add a note to a client's profile. Categorize as general, service-related, preference, medical (auto-private), or important. Private notes are staff-only.",
  category: 'clients',
  parameters: addClientNoteSchema,
  returns: z.object({
    note: z.object({
      id: z.string(),
      clientId: z.string(),
      content: z.string(),
      category: z.string(),
      isPrivate: z.boolean(),
      createdAt: z.string(),
    }),
  }),
  tags: ['write', 'create'],
};

// ============================================================================
// Exports
// ============================================================================

/**
 * All client tool schemas
 */
export const clientSchemas = {
  searchClients: searchClientsSchema,
  getClient: getClientSchema,
  getClientHistory: getClientHistorySchema,
  createClient: createClientSchema,
  updateClient: updateClientSchema,
  addClientNote: addClientNoteSchema,
};

/**
 * All client tool definitions
 */
export const clientTools = [
  searchClientsTool,
  getClientTool,
  getClientHistoryTool,
  createClientTool,
  updateClientTool,
  addClientNoteTool,
];
