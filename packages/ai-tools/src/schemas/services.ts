/**
 * @mango/ai-tools - Service Tool Schemas
 *
 * Zod schemas for AI tools that query and recommend services in Mango Biz.
 * These tools allow AI assistants to search services, check pricing, find staff qualifications,
 * and get popularity data for recommendations.
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
 * Time range for analytics queries
 */
const timeRangeSchema = z
  .enum(['week', 'month', 'quarter'])
  .describe('Time range for analytics: week (7 days), month (30 days), quarter (90 days)');

/**
 * Service category (salon/spa specific)
 */
const serviceCategorySchema = z
  .enum([
    'haircut',
    'color',
    'styling',
    'treatment',
    'nails',
    'manicure',
    'pedicure',
    'facial',
    'massage',
    'waxing',
    'makeup',
    'extensions',
    'bridal',
    'mens',
    'kids',
    'other',
  ])
  .describe(
    'Service category for filtering. Common categories include haircut, color, nails, facial, massage, etc.'
  );

// ============================================================================
// Search Services Schema
// ============================================================================

/**
 * Search for services by name, description, or category.
 * Can filter by price range and duration.
 */
export const searchServicesSchema = z
  .object({
    query: z
      .string()
      .min(1)
      .optional()
      .describe(
        'Search term to match against service name or description. Leave empty to list all services.'
      ),
    category: serviceCategorySchema
      .optional()
      .describe('Filter by service category'),
    minPrice: z
      .number()
      .nonnegative()
      .optional()
      .describe('Minimum price in dollars'),
    maxPrice: z
      .number()
      .positive()
      .optional()
      .describe('Maximum price in dollars'),
    maxDurationMinutes: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Maximum service duration in minutes'),
    includeInactive: z
      .boolean()
      .default(false)
      .describe('Include inactive/discontinued services (default false)'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20)
      .describe('Maximum number of services to return (1-100, default 20)'),
    offset: z
      .number()
      .int()
      .nonnegative()
      .default(0)
      .describe('Number of services to skip for pagination (default 0)'),
  })
  .describe(
    'Search for services by name, category, or price range. Use to find services for booking or answering client questions about offerings.'
  );

export type SearchServicesInput = z.infer<typeof searchServicesSchema>;

// ============================================================================
// Get Service Schema
// ============================================================================

/**
 * Get detailed information about a specific service.
 * Returns pricing, duration, description, and qualified staff.
 */
export const getServiceSchema = z
  .object({
    serviceId: uuidSchema.describe('The unique identifier of the service to retrieve'),
  })
  .describe(
    'Retrieve complete details for a specific service including description, pricing tiers, duration, and list of staff qualified to perform it.'
  );

export type GetServiceInput = z.infer<typeof getServiceSchema>;

// ============================================================================
// Get Services By Staff Schema
// ============================================================================

/**
 * Get all services a staff member can perform.
 * Useful for booking when client requests a specific stylist.
 */
export const getServicesByStaffSchema = z
  .object({
    staffId: uuidSchema.describe('The staff member to get services for'),
    includeInactive: z
      .boolean()
      .default(false)
      .describe('Include inactive services (default false)'),
  })
  .describe(
    'Get all services a specific staff member is qualified to perform. Use when a client requests an appointment with a specific stylist to see what they can book.'
  );

export type GetServicesByStaffInput = z.infer<typeof getServicesByStaffSchema>;

// ============================================================================
// Get Popular Services Schema
// ============================================================================

/**
 * Get the most popular services based on booking frequency.
 * Useful for recommendations and trend analysis.
 */
export const getPopularServicesSchema = z
  .object({
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .default(10)
      .describe('Number of top services to return (1-50, default 10)'),
    timeRange: timeRangeSchema.default('month'),
    category: serviceCategorySchema
      .optional()
      .describe('Filter popularity within a specific category'),
  })
  .describe(
    'Get the most frequently booked services over a time period. Use for recommendations or to understand trends. Can filter by category to find popular services within a type.'
  );

export type GetPopularServicesInput = z.infer<typeof getPopularServicesSchema>;

// ============================================================================
// Get Service Pricing Schema
// ============================================================================

/**
 * Get pricing information for a service, optionally for a specific staff member.
 * Handles price tiers (junior, senior, master) and staff-specific pricing.
 */
export const getServicePricingSchema = z
  .object({
    serviceId: uuidSchema.describe('The service to get pricing for'),
    staffId: z
      .string()
      .uuid()
      .optional()
      .describe(
        'Optional: Get pricing for a specific staff member. Staff may have different rates based on experience level.'
      ),
    includeAddons: z
      .boolean()
      .default(true)
      .describe('Include pricing for add-on services (default true)'),
  })
  .describe(
    'Get detailed pricing for a service. Some services have tiered pricing based on staff experience level (junior/senior/master) or complexity. Use when quoting prices to clients.'
  );

export type GetServicePricingInput = z.infer<typeof getServicePricingSchema>;

// ============================================================================
// Tool Definitions
// ============================================================================

import type { AITool } from '../types';

/**
 * Search services tool definition
 */
export const searchServicesTool: AITool<typeof searchServicesSchema> = {
  name: 'searchServices',
  description:
    'Search for services by name, category, or price range. Returns service summaries with basic info. Use to find services for booking or answering client questions about offerings.',
  category: 'services',
  parameters: searchServicesSchema,
  returns: z.object({
    services: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().optional(),
        category: serviceCategorySchema,
        priceRange: z.object({
          min: z.number(),
          max: z.number(),
        }),
        durationMinutes: z.number(),
        isActive: z.boolean(),
      })
    ),
    total: z.number(),
    hasMore: z.boolean(),
  }),
  tags: ['read', 'search'],
};

/**
 * Get service tool definition
 */
export const getServiceTool: AITool<typeof getServiceSchema> = {
  name: 'getService',
  description:
    'Get complete details for a specific service including full description, all pricing tiers, duration, qualified staff, and any add-on options.',
  category: 'services',
  parameters: getServiceSchema,
  returns: z.object({
    service: z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      category: serviceCategorySchema,
      durationMinutes: z.number(),
      isActive: z.boolean(),
      pricing: z.object({
        base: z.number(),
        tiers: z
          .array(
            z.object({
              name: z.string(),
              price: z.number(),
              description: z.string().optional(),
            })
          )
          .optional(),
      }),
      qualifiedStaff: z.array(
        z.object({
          id: z.string(),
          firstName: z.string(),
          lastName: z.string(),
          tier: z.string().optional(),
          priceForThisService: z.number().optional(),
        })
      ),
      addons: z
        .array(
          z.object({
            id: z.string(),
            name: z.string(),
            price: z.number(),
            durationMinutes: z.number(),
          })
        )
        .optional(),
      notes: z.string().optional(),
    }),
  }),
  tags: ['read'],
};

/**
 * Get services by staff tool definition
 */
export const getServicesByStaffTool: AITool<typeof getServicesByStaffSchema> = {
  name: 'getServicesByStaff',
  description:
    'Get all services a specific staff member can perform. Use when a client requests an appointment with a particular stylist to see available services.',
  category: 'services',
  parameters: getServicesByStaffSchema,
  returns: z.object({
    staffId: z.string(),
    staffName: z.string(),
    services: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        category: serviceCategorySchema,
        price: z.number(),
        durationMinutes: z.number(),
        staffPriceTier: z.string().optional(),
      })
    ),
    totalServices: z.number(),
  }),
  tags: ['read'],
};

/**
 * Get popular services tool definition
 */
export const getPopularServicesTool: AITool<typeof getPopularServicesSchema> = {
  name: 'getPopularServices',
  description:
    'Get the most frequently booked services over a time period. Use for recommendations, trend analysis, or helping undecided clients choose popular options.',
  category: 'services',
  parameters: getPopularServicesSchema,
  returns: z.object({
    timeRange: timeRangeSchema,
    services: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        category: serviceCategorySchema,
        bookingCount: z.number(),
        percentageOfTotal: z.number(),
        averageRating: z.number().optional(),
        priceRange: z.object({
          min: z.number(),
          max: z.number(),
        }),
      })
    ),
    totalBookingsInPeriod: z.number(),
  }),
  tags: ['read', 'analytics'],
};

/**
 * Get service pricing tool definition
 */
export const getServicePricingTool: AITool<typeof getServicePricingSchema> = {
  name: 'getServicePricing',
  description:
    'Get detailed pricing for a service, optionally for a specific staff member. Shows tiered pricing and any add-on costs. Use when quoting prices to clients.',
  category: 'services',
  parameters: getServicePricingSchema,
  returns: z.object({
    serviceId: z.string(),
    serviceName: z.string(),
    baseDurationMinutes: z.number(),
    pricing: z.object({
      basePrice: z.number(),
      staffSpecificPrice: z.number().optional(),
      tier: z.string().optional(),
      allTiers: z
        .array(
          z.object({
            name: z.string(),
            price: z.number(),
          })
        )
        .optional(),
    }),
    addons: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          price: z.number(),
          durationMinutes: z.number(),
        })
      )
      .optional(),
    notes: z.string().optional(),
  }),
  tags: ['read'],
};

// ============================================================================
// Exports
// ============================================================================

/**
 * All service tool schemas
 */
export const serviceSchemas = {
  searchServices: searchServicesSchema,
  getService: getServiceSchema,
  getServicesByStaff: getServicesByStaffSchema,
  getPopularServices: getPopularServicesSchema,
  getServicePricing: getServicePricingSchema,
};

/**
 * All service tool definitions
 */
export const serviceTools = [
  searchServicesTool,
  getServiceTool,
  getServicesByStaffTool,
  getPopularServicesTool,
  getServicePricingTool,
];
