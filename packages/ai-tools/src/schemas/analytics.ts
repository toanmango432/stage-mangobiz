/**
 * @mango/ai-tools - Analytics Tool Schemas
 *
 * Zod schemas for AI tools that query business analytics, reports, and metrics.
 * These tools allow AI assistants to provide insights on sales, clients, and operations.
 *
 * Note: Analytics data may require manager or admin permissions depending on the metric.
 */

import { z } from 'zod';

// ============================================================================
// Common Schema Building Blocks
// ============================================================================

/**
 * Date string validation pattern (YYYY-MM-DD)
 */
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .describe('Date in YYYY-MM-DD format');

/**
 * Time range for analytics queries
 */
const timeRangeSchema = z
  .enum(['today', 'week', 'month', 'quarter', 'year', 'custom'])
  .describe(
    'Time range for the report: today (24 hours), week (7 days), month (30 days), quarter (90 days), year (365 days), or custom (requires startDate/endDate)'
  );

/**
 * Comparison period for trend analysis
 */
const comparisonPeriodSchema = z
  .enum(['previous_period', 'same_period_last_year', 'none'])
  .default('previous_period')
  .describe('What to compare metrics against: previous period, same period last year, or no comparison');

/**
 * Metric granularity for charts/trends
 */
const granularitySchema = z
  .enum(['hour', 'day', 'week', 'month'])
  .default('day')
  .describe('Time granularity for trend data: hourly, daily, weekly, or monthly');

// ============================================================================
// Get Dashboard Metrics Schema
// ============================================================================

/**
 * Get key dashboard metrics for a quick business overview.
 * Returns today's numbers and comparisons to previous periods.
 */
export const getDashboardMetricsSchema = z
  .object({
    date: dateSchema
      .optional()
      .describe('Date to get metrics for (YYYY-MM-DD). Defaults to today if not specified.'),
    includeComparison: z
      .boolean()
      .default(true)
      .describe('Include comparison to yesterday and same day last week'),
    includeStaffBreakdown: z
      .boolean()
      .default(false)
      .describe('Include breakdown of metrics by staff member (requires manager permission)'),
    includeGoals: z
      .boolean()
      .default(true)
      .describe('Include progress toward daily/weekly goals if configured'),
  })
  .describe(
    "Get key dashboard metrics for a quick business overview. Returns today's revenue, appointments, clients, and comparisons to previous periods. Use for quick status checks."
  );

export type GetDashboardMetricsInput = z.infer<typeof getDashboardMetricsSchema>;

// ============================================================================
// Get Sales Report Schema
// ============================================================================

/**
 * Get detailed sales report for a time period.
 * Includes revenue breakdown by category, payment methods, and trends.
 */
export const getSalesReportSchema = z
  .object({
    timeRange: timeRangeSchema.default('month'),
    startDate: dateSchema
      .optional()
      .describe("Start date (required if timeRange is 'custom')"),
    endDate: dateSchema
      .optional()
      .describe("End date (required if timeRange is 'custom')"),
    comparison: comparisonPeriodSchema,
    granularity: granularitySchema,
    includeServiceBreakdown: z
      .boolean()
      .default(true)
      .describe('Include revenue breakdown by service category'),
    includeProductBreakdown: z
      .boolean()
      .default(true)
      .describe('Include revenue breakdown by product category'),
    includePaymentMethods: z
      .boolean()
      .default(true)
      .describe('Include breakdown by payment method (cash, card, etc.)'),
    includeStaffBreakdown: z
      .boolean()
      .default(false)
      .describe('Include breakdown by staff member (requires manager permission)'),
    includeDiscounts: z
      .boolean()
      .default(true)
      .describe('Include discount analysis (total discounts, types, impact)'),
    includeTips: z
      .boolean()
      .default(true)
      .describe('Include tip totals and distribution'),
  })
  .describe(
    'Get detailed sales report for a time period. Includes revenue breakdown by category, payment methods, discounts, and trends. Use for financial analysis and reporting.'
  );

export type GetSalesReportInput = z.infer<typeof getSalesReportSchema>;

// ============================================================================
// Get Client Retention Schema
// ============================================================================

/**
 * Get client retention and loyalty metrics.
 * Shows new vs returning clients, retention rates, and churn.
 */
export const getClientRetentionSchema = z
  .object({
    timeRange: timeRangeSchema.default('quarter'),
    startDate: dateSchema
      .optional()
      .describe("Start date (required if timeRange is 'custom')"),
    endDate: dateSchema
      .optional()
      .describe("End date (required if timeRange is 'custom')"),
    comparison: comparisonPeriodSchema,
    includeChurnAnalysis: z
      .boolean()
      .default(true)
      .describe('Include clients who stopped visiting (churn analysis)'),
    includeNewClientSources: z
      .boolean()
      .default(true)
      .describe('Include breakdown of how new clients found the business'),
    includeTopClients: z
      .boolean()
      .default(false)
      .describe('Include list of top clients by spend/visits (requires manager permission)'),
    topClientLimit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .default(10)
      .describe('Number of top clients to include (1-50, default 10)'),
    churnThresholdDays: z
      .number()
      .int()
      .positive()
      .default(90)
      .describe('Days without visit to consider a client churned (default 90)'),
  })
  .describe(
    'Get client retention and loyalty metrics. Shows new vs returning clients, retention rates, and churn analysis. Use to understand client health and identify at-risk clients.'
  );

export type GetClientRetentionInput = z.infer<typeof getClientRetentionSchema>;

// ============================================================================
// Get Service Popularity Schema
// ============================================================================

/**
 * Get service popularity and performance metrics.
 * Shows top services by bookings, revenue, and growth.
 */
export const getServicePopularitySchema = z
  .object({
    timeRange: timeRangeSchema.default('month'),
    startDate: dateSchema
      .optional()
      .describe("Start date (required if timeRange is 'custom')"),
    endDate: dateSchema
      .optional()
      .describe("End date (required if timeRange is 'custom')"),
    comparison: comparisonPeriodSchema,
    sortBy: z
      .enum(['bookings', 'revenue', 'growth', 'average_ticket'])
      .default('bookings')
      .describe('How to rank services: by number of bookings, revenue, growth rate, or average ticket'),
    category: z
      .string()
      .optional()
      .describe('Filter to a specific service category'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .default(10)
      .describe('Number of top services to return (1-50, default 10)'),
    includeStaffPerformance: z
      .boolean()
      .default(false)
      .describe('Include performance by staff for each service (requires manager permission)'),
    includeTrends: z
      .boolean()
      .default(true)
      .describe('Include trend data showing popularity changes over time'),
  })
  .describe(
    'Get service popularity and performance metrics. Shows top services by bookings, revenue, or growth. Use to understand which services are performing well and identify opportunities.'
  );

export type GetServicePopularityInput = z.infer<typeof getServicePopularitySchema>;

// ============================================================================
// Get Peak Hours Schema
// ============================================================================

/**
 * Get peak hours analysis for scheduling optimization.
 * Shows busiest times by bookings, revenue, and staff utilization.
 */
export const getPeakHoursSchema = z
  .object({
    timeRange: timeRangeSchema.default('month'),
    startDate: dateSchema
      .optional()
      .describe("Start date (required if timeRange is 'custom')"),
    endDate: dateSchema
      .optional()
      .describe("End date (required if timeRange is 'custom')"),
    metric: z
      .enum(['bookings', 'revenue', 'staff_utilization', 'walk_ins'])
      .default('bookings')
      .describe('What metric to analyze: number of bookings, revenue generated, staff utilization, or walk-in count'),
    dayOfWeek: z
      .enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'all', 'weekdays', 'weekends'])
      .default('all')
      .describe('Filter to specific days: individual day, all days, weekdays only, or weekends only'),
    includeHeatmap: z
      .boolean()
      .default(true)
      .describe('Include day-hour heatmap data for visualization'),
    includeRecommendations: z
      .boolean()
      .default(true)
      .describe('Include AI recommendations for staffing and scheduling based on patterns'),
  })
  .describe(
    'Get peak hours analysis showing busiest times by bookings, revenue, or utilization. Use for staff scheduling optimization and identifying when to run promotions for slow periods.'
  );

export type GetPeakHoursInput = z.infer<typeof getPeakHoursSchema>;

// ============================================================================
// Tool Definitions
// ============================================================================

import type { AITool } from '../types';

/**
 * Get dashboard metrics tool definition
 */
export const getDashboardMetricsTool: AITool<typeof getDashboardMetricsSchema> = {
  name: 'getDashboardMetrics',
  description:
    "Get key dashboard metrics for a quick business overview. Returns today's revenue, appointments, clients served, and comparisons to previous periods. Use for daily status checks.",
  category: 'analytics',
  parameters: getDashboardMetricsSchema,
  returns: z.object({
    date: z.string(),
    metrics: z.object({
      revenue: z.object({
        total: z.number(),
        services: z.number(),
        products: z.number(),
        tips: z.number(),
      }),
      appointments: z.object({
        total: z.number(),
        completed: z.number(),
        noShows: z.number(),
        cancelled: z.number(),
        upcoming: z.number(),
      }),
      clients: z.object({
        served: z.number(),
        newClients: z.number(),
        returningClients: z.number(),
      }),
      tickets: z.object({
        total: z.number(),
        averageValue: z.number(),
      }),
    }),
    comparison: z
      .object({
        vsYesterday: z.object({
          revenueChange: z.number(),
          appointmentChange: z.number(),
        }),
        vsLastWeek: z.object({
          revenueChange: z.number(),
          appointmentChange: z.number(),
        }),
      })
      .optional(),
    goals: z
      .object({
        dailyRevenue: z.object({
          target: z.number(),
          current: z.number(),
          progress: z.number(),
        }),
        weeklyRevenue: z.object({
          target: z.number(),
          current: z.number(),
          progress: z.number(),
        }),
      })
      .optional(),
    staffBreakdown: z
      .array(
        z.object({
          staffId: z.string(),
          staffName: z.string(),
          revenue: z.number(),
          appointments: z.number(),
        })
      )
      .optional(),
  }),
  tags: ['read', 'analytics', 'dashboard'],
};

/**
 * Get sales report tool definition
 */
export const getSalesReportTool: AITool<typeof getSalesReportSchema> = {
  name: 'getSalesReport',
  description:
    'Get detailed sales report for a time period. Includes revenue breakdown by service/product category, payment methods, discounts, and trend data. Use for financial analysis.',
  category: 'analytics',
  parameters: getSalesReportSchema,
  returns: z.object({
    timeRange: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    summary: z.object({
      totalRevenue: z.number(),
      serviceRevenue: z.number(),
      productRevenue: z.number(),
      tipRevenue: z.number(),
      totalTransactions: z.number(),
      averageTicket: z.number(),
    }),
    serviceBreakdown: z
      .array(
        z.object({
          category: z.string(),
          revenue: z.number(),
          count: z.number(),
          percentage: z.number(),
        })
      )
      .optional(),
    productBreakdown: z
      .array(
        z.object({
          category: z.string(),
          revenue: z.number(),
          count: z.number(),
          percentage: z.number(),
        })
      )
      .optional(),
    paymentMethods: z
      .array(
        z.object({
          method: z.string(),
          revenue: z.number(),
          count: z.number(),
          percentage: z.number(),
        })
      )
      .optional(),
    discounts: z
      .object({
        totalDiscounted: z.number(),
        discountCount: z.number(),
        discountTypes: z.array(
          z.object({
            type: z.string(),
            amount: z.number(),
            count: z.number(),
          })
        ),
      })
      .optional(),
    tips: z
      .object({
        total: z.number(),
        average: z.number(),
        tipRate: z.number(),
      })
      .optional(),
    trends: z
      .array(
        z.object({
          period: z.string(),
          revenue: z.number(),
          transactions: z.number(),
        })
      )
      .optional(),
    comparison: z
      .object({
        previousPeriodRevenue: z.number(),
        revenueChange: z.number(),
        revenueChangePercent: z.number(),
      })
      .optional(),
    staffBreakdown: z
      .array(
        z.object({
          staffId: z.string(),
          staffName: z.string(),
          revenue: z.number(),
          transactions: z.number(),
          averageTicket: z.number(),
        })
      )
      .optional(),
  }),
  requiresPermission: true,
  permissionLevel: 'manager',
  tags: ['read', 'analytics', 'financial', 'report'],
};

/**
 * Get client retention tool definition
 */
export const getClientRetentionTool: AITool<typeof getClientRetentionSchema> = {
  name: 'getClientRetention',
  description:
    'Get client retention and loyalty metrics. Shows new vs returning clients, retention rates, churn analysis, and client acquisition sources. Use to understand client health.',
  category: 'analytics',
  parameters: getClientRetentionSchema,
  returns: z.object({
    timeRange: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    summary: z.object({
      totalClients: z.number(),
      activeClients: z.number(),
      newClients: z.number(),
      returningClients: z.number(),
      retentionRate: z.number(),
      averageVisitFrequency: z.number(),
    }),
    newClientSources: z
      .array(
        z.object({
          source: z.string(),
          count: z.number(),
          percentage: z.number(),
        })
      )
      .optional(),
    churnAnalysis: z
      .object({
        churnedClients: z.number(),
        churnRate: z.number(),
        atRiskClients: z.number(),
        averageLifetimeValue: z.number(),
        topChurnReasons: z.array(
          z.object({
            reason: z.string(),
            count: z.number(),
          })
        ),
      })
      .optional(),
    topClients: z
      .array(
        z.object({
          clientId: z.string(),
          clientName: z.string(),
          totalSpend: z.number(),
          visitCount: z.number(),
          lastVisit: z.string(),
          memberSince: z.string(),
        })
      )
      .optional(),
    comparison: z
      .object({
        previousPeriodRetention: z.number(),
        retentionChange: z.number(),
        newClientChange: z.number(),
      })
      .optional(),
  }),
  requiresPermission: true,
  permissionLevel: 'manager',
  tags: ['read', 'analytics', 'clients', 'retention'],
};

/**
 * Get service popularity tool definition
 */
export const getServicePopularityTool: AITool<typeof getServicePopularitySchema> = {
  name: 'getServicePopularity',
  description:
    'Get service popularity and performance metrics. Shows top services ranked by bookings, revenue, or growth. Use to identify best performers and opportunities for promotions.',
  category: 'analytics',
  parameters: getServicePopularitySchema,
  returns: z.object({
    timeRange: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    sortedBy: z.string(),
    services: z.array(
      z.object({
        serviceId: z.string(),
        serviceName: z.string(),
        category: z.string(),
        bookings: z.number(),
        revenue: z.number(),
        averageTicket: z.number(),
        growth: z.number().optional(),
        staffPerformance: z
          .array(
            z.object({
              staffId: z.string(),
              staffName: z.string(),
              bookings: z.number(),
              revenue: z.number(),
            })
          )
          .optional(),
      })
    ),
    trends: z
      .array(
        z.object({
          serviceId: z.string(),
          serviceName: z.string(),
          periods: z.array(
            z.object({
              period: z.string(),
              bookings: z.number(),
              revenue: z.number(),
            })
          ),
        })
      )
      .optional(),
    comparison: z
      .object({
        previousPeriodTopService: z.string(),
        topServiceChange: z.boolean(),
      })
      .optional(),
  }),
  tags: ['read', 'analytics', 'services'],
};

/**
 * Get peak hours tool definition
 */
export const getPeakHoursTool: AITool<typeof getPeakHoursSchema> = {
  name: 'getPeakHours',
  description:
    'Get peak hours analysis showing busiest times by bookings, revenue, or staff utilization. Use for scheduling optimization, staffing decisions, and identifying slow periods for promotions.',
  category: 'analytics',
  parameters: getPeakHoursSchema,
  returns: z.object({
    timeRange: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    metric: z.string(),
    peakHours: z.array(
      z.object({
        hour: z.number(),
        dayOfWeek: z.string().optional(),
        value: z.number(),
        percentOfMax: z.number(),
        label: z.string(),
      })
    ),
    slowHours: z.array(
      z.object({
        hour: z.number(),
        dayOfWeek: z.string().optional(),
        value: z.number(),
        percentOfMax: z.number(),
        label: z.string(),
      })
    ),
    heatmap: z
      .array(
        z.object({
          day: z.string(),
          hours: z.array(
            z.object({
              hour: z.number(),
              value: z.number(),
              intensity: z.number(),
            })
          ),
        })
      )
      .optional(),
    recommendations: z
      .array(
        z.object({
          type: z.enum(['staffing', 'promotion', 'scheduling']),
          description: z.string(),
          impact: z.enum(['high', 'medium', 'low']),
          targetHours: z.array(z.number()).optional(),
          targetDays: z.array(z.string()).optional(),
        })
      )
      .optional(),
    summary: z.object({
      busiestDay: z.string(),
      busiestHour: z.number(),
      slowestDay: z.string(),
      slowestHour: z.number(),
      averageUtilization: z.number().optional(),
    }),
  }),
  tags: ['read', 'analytics', 'scheduling', 'optimization'],
};

// ============================================================================
// Exports
// ============================================================================

/**
 * All analytics tool schemas
 */
export const analyticsSchemas = {
  getDashboardMetrics: getDashboardMetricsSchema,
  getSalesReport: getSalesReportSchema,
  getClientRetention: getClientRetentionSchema,
  getServicePopularity: getServicePopularitySchema,
  getPeakHours: getPeakHoursSchema,
};

/**
 * All analytics tool definitions
 */
export const analyticsTools = [
  getDashboardMetricsTool,
  getSalesReportTool,
  getClientRetentionTool,
  getServicePopularityTool,
  getPeakHoursTool,
];
