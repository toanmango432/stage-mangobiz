/**
 * @mango/ai-tools - Analytics Tool Handlers
 *
 * Handlers for executing analytics-related AI tools.
 * These handlers bridge AI tool calls to business operations via the data provider.
 *
 * Note: Analytics data may require manager or admin permissions depending on the metric.
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
  GetDashboardMetricsInput,
  GetSalesReportInput,
  GetClientRetentionInput,
  GetServicePopularityInput,
  GetPeakHoursInput,
} from '../schemas/analytics';

// ============================================================================
// Data Provider Interface
// ============================================================================

/**
 * Interface for analytics data operations.
 * Implementations can use Supabase, IndexedDB, or any other data source.
 * This interface is injected at runtime to decouple handlers from data layer.
 */
export interface AnalyticsDataProvider {
  /**
   * Get dashboard metrics for a date
   */
  getDashboardMetrics(params: {
    storeId: string;
    date?: string;
    includeComparison: boolean;
    includeStaffBreakdown: boolean;
    includeGoals: boolean;
    userId: string;
  }): Promise<DashboardMetricsResult>;

  /**
   * Get sales report for a time period
   */
  getSalesReport(params: {
    storeId: string;
    timeRange: string;
    startDate?: string;
    endDate?: string;
    comparison: string;
    granularity: string;
    includeServiceBreakdown: boolean;
    includeProductBreakdown: boolean;
    includePaymentMethods: boolean;
    includeStaffBreakdown: boolean;
    includeDiscounts: boolean;
    includeTips: boolean;
    userId: string;
  }): Promise<SalesReportResult>;

  /**
   * Get client retention metrics
   */
  getClientRetention(params: {
    storeId: string;
    timeRange: string;
    startDate?: string;
    endDate?: string;
    comparison: string;
    includeChurnAnalysis: boolean;
    includeNewClientSources: boolean;
    includeTopClients: boolean;
    topClientLimit: number;
    churnThresholdDays: number;
    userId: string;
  }): Promise<ClientRetentionResult>;

  /**
   * Get service popularity metrics
   */
  getServicePopularity(params: {
    storeId: string;
    timeRange: string;
    startDate?: string;
    endDate?: string;
    comparison: string;
    sortBy: string;
    category?: string;
    limit: number;
    includeStaffPerformance: boolean;
    includeTrends: boolean;
    userId: string;
  }): Promise<ServicePopularityResult>;

  /**
   * Get peak hours analysis
   */
  getPeakHours(params: {
    storeId: string;
    timeRange: string;
    startDate?: string;
    endDate?: string;
    metric: string;
    dayOfWeek: string;
    includeHeatmap: boolean;
    includeRecommendations: boolean;
  }): Promise<PeakHoursResult>;
}

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Dashboard metrics result
 */
export interface DashboardMetricsResult {
  date: string;
  metrics: {
    revenue: {
      total: number;
      services: number;
      products: number;
      tips: number;
    };
    appointments: {
      total: number;
      completed: number;
      noShows: number;
      cancelled: number;
      upcoming: number;
    };
    clients: {
      served: number;
      newClients: number;
      returningClients: number;
    };
    tickets: {
      total: number;
      averageValue: number;
    };
  };
  comparison?: {
    vsYesterday: {
      revenueChange: number;
      appointmentChange: number;
    };
    vsLastWeek: {
      revenueChange: number;
      appointmentChange: number;
    };
  };
  goals?: {
    dailyRevenue: {
      target: number;
      current: number;
      progress: number;
    };
    weeklyRevenue: {
      target: number;
      current: number;
      progress: number;
    };
  };
  staffBreakdown?: Array<{
    staffId: string;
    staffName: string;
    revenue: number;
    appointments: number;
  }>;
}

/**
 * Sales report result
 */
export interface SalesReportResult {
  timeRange: string;
  startDate: string;
  endDate: string;
  summary: {
    totalRevenue: number;
    serviceRevenue: number;
    productRevenue: number;
    tipRevenue: number;
    totalTransactions: number;
    averageTicket: number;
  };
  serviceBreakdown?: Array<{
    category: string;
    revenue: number;
    count: number;
    percentage: number;
  }>;
  productBreakdown?: Array<{
    category: string;
    revenue: number;
    count: number;
    percentage: number;
  }>;
  paymentMethods?: Array<{
    method: string;
    revenue: number;
    count: number;
    percentage: number;
  }>;
  discounts?: {
    totalDiscounted: number;
    discountCount: number;
    discountTypes: Array<{
      type: string;
      amount: number;
      count: number;
    }>;
  };
  tips?: {
    total: number;
    average: number;
    tipRate: number;
  };
  trends?: Array<{
    period: string;
    revenue: number;
    transactions: number;
  }>;
  comparison?: {
    previousPeriodRevenue: number;
    revenueChange: number;
    revenueChangePercent: number;
  };
  staffBreakdown?: Array<{
    staffId: string;
    staffName: string;
    revenue: number;
    transactions: number;
    averageTicket: number;
  }>;
}

/**
 * Client retention result
 */
export interface ClientRetentionResult {
  timeRange: string;
  startDate: string;
  endDate: string;
  summary: {
    totalClients: number;
    activeClients: number;
    newClients: number;
    returningClients: number;
    retentionRate: number;
    averageVisitFrequency: number;
  };
  newClientSources?: Array<{
    source: string;
    count: number;
    percentage: number;
  }>;
  churnAnalysis?: {
    churnedClients: number;
    churnRate: number;
    atRiskClients: number;
    averageLifetimeValue: number;
    topChurnReasons: Array<{
      reason: string;
      count: number;
    }>;
  };
  topClients?: Array<{
    clientId: string;
    clientName: string;
    totalSpend: number;
    visitCount: number;
    lastVisit: string;
    memberSince: string;
  }>;
  comparison?: {
    previousPeriodRetention: number;
    retentionChange: number;
    newClientChange: number;
  };
}

/**
 * Service popularity result
 */
export interface ServicePopularityResult {
  timeRange: string;
  startDate: string;
  endDate: string;
  sortedBy: string;
  services: Array<{
    serviceId: string;
    serviceName: string;
    category: string;
    bookings: number;
    revenue: number;
    averageTicket: number;
    growth?: number;
    staffPerformance?: Array<{
      staffId: string;
      staffName: string;
      bookings: number;
      revenue: number;
    }>;
  }>;
  trends?: Array<{
    serviceId: string;
    serviceName: string;
    periods: Array<{
      period: string;
      bookings: number;
      revenue: number;
    }>;
  }>;
  comparison?: {
    previousPeriodTopService: string;
    topServiceChange: boolean;
  };
}

/**
 * Peak hours result
 */
export interface PeakHoursResult {
  timeRange: string;
  startDate: string;
  endDate: string;
  metric: string;
  peakHours: Array<{
    hour: number;
    dayOfWeek?: string;
    value: number;
    percentOfMax: number;
    label: string;
  }>;
  slowHours: Array<{
    hour: number;
    dayOfWeek?: string;
    value: number;
    percentOfMax: number;
    label: string;
  }>;
  heatmap?: Array<{
    day: string;
    hours: Array<{
      hour: number;
      value: number;
      intensity: number;
    }>;
  }>;
  recommendations?: Array<{
    type: 'staffing' | 'promotion' | 'scheduling';
    description: string;
    impact: 'high' | 'medium' | 'low';
    targetHours?: number[];
    targetDays?: string[];
  }>;
  summary: {
    busiestDay: string;
    busiestHour: number;
    slowestDay: string;
    slowestHour: number;
    averageUtilization?: number;
  };
}

// ============================================================================
// Handler State
// ============================================================================

/**
 * Data provider instance (must be set before handlers can be used)
 */
let dataProvider: AnalyticsDataProvider | null = null;

/**
 * Set the data provider for analytics handlers.
 * Must be called during app initialization before any handlers are invoked.
 *
 * @param provider - The data provider implementation
 */
export function setAnalyticsDataProvider(provider: AnalyticsDataProvider): void {
  dataProvider = provider;
}

/**
 * Get the current data provider.
 * Throws if not initialized.
 */
function getDataProvider(): AnalyticsDataProvider {
  if (!dataProvider) {
    throw new Error(
      'Analytics data provider not initialized. Call setAnalyticsDataProvider() during app setup.'
    );
  }
  return dataProvider;
}

// ============================================================================
// Handlers
// ============================================================================

/**
 * Handle getDashboardMetrics tool invocation.
 *
 * Gets key dashboard metrics for a quick business overview.
 */
export const handleGetDashboardMetrics: ToolHandler<
  GetDashboardMetricsInput,
  DashboardMetricsResult
> = async (input, context) => {
  const startTime = Date.now();

  context.logger.info('Executing getDashboardMetrics', {
    date: input.date,
    includeComparison: input.includeComparison,
    includeStaffBreakdown: input.includeStaffBreakdown,
  });

  try {
    const provider = getDataProvider();

    const result = await provider.getDashboardMetrics({
      storeId: context.storeId,
      date: input.date,
      includeComparison: input.includeComparison,
      includeStaffBreakdown: input.includeStaffBreakdown,
      includeGoals: input.includeGoals,
      userId: context.userId,
    });

    context.logger.info('getDashboardMetrics completed', {
      date: result.date,
      totalRevenue: result.metrics.revenue.total,
      executionTimeMs: Date.now() - startTime,
    });

    return successResult(result, {
      executionTimeMs: Date.now() - startTime,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    context.logger.error('getDashboardMetrics failed', { error: errorMessage });

    // Check for permission denied (staff breakdown)
    if (input.includeStaffBreakdown &&
        errorMessage.toLowerCase().includes('permission')) {
      return errorResult(
        `Permission denied: Manager access required for staff breakdown`,
        'PERMISSION_DENIED',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    return errorResult(
      `Failed to get dashboard metrics: ${errorMessage}`,
      'INTERNAL_ERROR',
      { executionTimeMs: Date.now() - startTime }
    );
  }
};

/**
 * Handle getSalesReport tool invocation.
 *
 * Gets a detailed sales report for a time period.
 */
export const handleGetSalesReport: ToolHandler<
  GetSalesReportInput,
  SalesReportResult
> = async (input, context) => {
  const startTime = Date.now();

  context.logger.info('Executing getSalesReport', {
    timeRange: input.timeRange,
    startDate: input.startDate,
    endDate: input.endDate,
    granularity: input.granularity,
  });

  try {
    const provider = getDataProvider();

    const result = await provider.getSalesReport({
      storeId: context.storeId,
      timeRange: input.timeRange,
      startDate: input.startDate,
      endDate: input.endDate,
      comparison: input.comparison,
      granularity: input.granularity,
      includeServiceBreakdown: input.includeServiceBreakdown,
      includeProductBreakdown: input.includeProductBreakdown,
      includePaymentMethods: input.includePaymentMethods,
      includeStaffBreakdown: input.includeStaffBreakdown,
      includeDiscounts: input.includeDiscounts,
      includeTips: input.includeTips,
      userId: context.userId,
    });

    context.logger.info('getSalesReport completed', {
      timeRange: result.timeRange,
      totalRevenue: result.summary.totalRevenue,
      totalTransactions: result.summary.totalTransactions,
      executionTimeMs: Date.now() - startTime,
    });

    return successResult(result, {
      executionTimeMs: Date.now() - startTime,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    context.logger.error('getSalesReport failed', { error: errorMessage });

    // Check for permission denied
    if (errorMessage.toLowerCase().includes('permission') ||
        errorMessage.toLowerCase().includes('manager')) {
      return errorResult(
        `Permission denied: Manager access required for sales reports`,
        'PERMISSION_DENIED',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    // Check for missing custom dates
    if (input.timeRange === 'custom' &&
        (!input.startDate || !input.endDate)) {
      return errorResult(
        `Custom time range requires both startDate and endDate`,
        'INVALID_INPUT',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    return errorResult(
      `Failed to get sales report: ${errorMessage}`,
      'INTERNAL_ERROR',
      { executionTimeMs: Date.now() - startTime }
    );
  }
};

/**
 * Handle getClientRetention tool invocation.
 *
 * Gets client retention and loyalty metrics.
 */
export const handleGetClientRetention: ToolHandler<
  GetClientRetentionInput,
  ClientRetentionResult
> = async (input, context) => {
  const startTime = Date.now();

  context.logger.info('Executing getClientRetention', {
    timeRange: input.timeRange,
    includeChurnAnalysis: input.includeChurnAnalysis,
    includeTopClients: input.includeTopClients,
  });

  try {
    const provider = getDataProvider();

    const result = await provider.getClientRetention({
      storeId: context.storeId,
      timeRange: input.timeRange,
      startDate: input.startDate,
      endDate: input.endDate,
      comparison: input.comparison,
      includeChurnAnalysis: input.includeChurnAnalysis,
      includeNewClientSources: input.includeNewClientSources,
      includeTopClients: input.includeTopClients,
      topClientLimit: input.topClientLimit,
      churnThresholdDays: input.churnThresholdDays,
      userId: context.userId,
    });

    context.logger.info('getClientRetention completed', {
      timeRange: result.timeRange,
      retentionRate: result.summary.retentionRate,
      newClients: result.summary.newClients,
      executionTimeMs: Date.now() - startTime,
    });

    return successResult(result, {
      executionTimeMs: Date.now() - startTime,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    context.logger.error('getClientRetention failed', { error: errorMessage });

    // Check for permission denied
    if (errorMessage.toLowerCase().includes('permission') ||
        errorMessage.toLowerCase().includes('manager')) {
      return errorResult(
        `Permission denied: Manager access required for retention metrics`,
        'PERMISSION_DENIED',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    return errorResult(
      `Failed to get client retention: ${errorMessage}`,
      'INTERNAL_ERROR',
      { executionTimeMs: Date.now() - startTime }
    );
  }
};

/**
 * Handle getServicePopularity tool invocation.
 *
 * Gets service popularity and performance metrics.
 */
export const handleGetServicePopularity: ToolHandler<
  GetServicePopularityInput,
  ServicePopularityResult
> = async (input, context) => {
  const startTime = Date.now();

  context.logger.info('Executing getServicePopularity', {
    timeRange: input.timeRange,
    sortBy: input.sortBy,
    category: input.category,
    limit: input.limit,
  });

  try {
    const provider = getDataProvider();

    const result = await provider.getServicePopularity({
      storeId: context.storeId,
      timeRange: input.timeRange,
      startDate: input.startDate,
      endDate: input.endDate,
      comparison: input.comparison,
      sortBy: input.sortBy,
      category: input.category,
      limit: input.limit,
      includeStaffPerformance: input.includeStaffPerformance,
      includeTrends: input.includeTrends,
      userId: context.userId,
    });

    context.logger.info('getServicePopularity completed', {
      timeRange: result.timeRange,
      serviceCount: result.services.length,
      sortedBy: result.sortedBy,
      executionTimeMs: Date.now() - startTime,
    });

    return successResult(result, {
      executionTimeMs: Date.now() - startTime,
      count: result.services.length,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    context.logger.error('getServicePopularity failed', { error: errorMessage });

    // Check for permission denied (staff performance)
    if (input.includeStaffPerformance &&
        errorMessage.toLowerCase().includes('permission')) {
      return errorResult(
        `Permission denied: Manager access required for staff performance data`,
        'PERMISSION_DENIED',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    return errorResult(
      `Failed to get service popularity: ${errorMessage}`,
      'INTERNAL_ERROR',
      { executionTimeMs: Date.now() - startTime }
    );
  }
};

/**
 * Handle getPeakHours tool invocation.
 *
 * Gets peak hours analysis for scheduling optimization.
 */
export const handleGetPeakHours: ToolHandler<
  GetPeakHoursInput,
  PeakHoursResult
> = async (input, context) => {
  const startTime = Date.now();

  context.logger.info('Executing getPeakHours', {
    timeRange: input.timeRange,
    metric: input.metric,
    dayOfWeek: input.dayOfWeek,
    includeHeatmap: input.includeHeatmap,
  });

  try {
    const provider = getDataProvider();

    const result = await provider.getPeakHours({
      storeId: context.storeId,
      timeRange: input.timeRange,
      startDate: input.startDate,
      endDate: input.endDate,
      metric: input.metric,
      dayOfWeek: input.dayOfWeek,
      includeHeatmap: input.includeHeatmap,
      includeRecommendations: input.includeRecommendations,
    });

    context.logger.info('getPeakHours completed', {
      timeRange: result.timeRange,
      metric: result.metric,
      busiestHour: result.summary.busiestHour,
      busiestDay: result.summary.busiestDay,
      executionTimeMs: Date.now() - startTime,
    });

    return successResult(result, {
      executionTimeMs: Date.now() - startTime,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    context.logger.error('getPeakHours failed', { error: errorMessage });

    return errorResult(
      `Failed to get peak hours: ${errorMessage}`,
      'INTERNAL_ERROR',
      { executionTimeMs: Date.now() - startTime }
    );
  }
};

// ============================================================================
// Handler Registry
// ============================================================================

/**
 * All analytics tool handlers mapped by tool name.
 */
export const analyticsHandlers = {
  getDashboardMetrics: handleGetDashboardMetrics,
  getSalesReport: handleGetSalesReport,
  getClientRetention: handleGetClientRetention,
  getServicePopularity: handleGetServicePopularity,
  getPeakHours: handleGetPeakHours,
};
