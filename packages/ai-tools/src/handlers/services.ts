/**
 * @mango/ai-tools - Service Tool Handlers
 *
 * Handlers for executing service-related AI tools.
 * These handlers bridge AI tool calls to business operations via the data provider.
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
  SearchServicesInput,
  GetServiceInput,
  GetServicesByStaffInput,
  GetPopularServicesInput,
  GetServicePricingInput,
} from '../schemas/services';

// ============================================================================
// Data Provider Interface
// ============================================================================

/**
 * Interface for service data operations.
 * Implementations can use Supabase, IndexedDB, or any other data source.
 * This interface is injected at runtime to decouple handlers from data layer.
 */
export interface ServiceDataProvider {
  /**
   * Search for services matching criteria
   */
  searchServices(params: {
    storeId: string;
    query?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    maxDurationMinutes?: number;
    includeInactive: boolean;
    limit: number;
    offset: number;
  }): Promise<{
    services: ServiceSummary[];
    total: number;
    hasMore: boolean;
  }>;

  /**
   * Get a single service by ID
   */
  getService(params: {
    storeId: string;
    serviceId: string;
  }): Promise<ServiceDetails | null>;

  /**
   * Get all services a staff member can perform
   */
  getServicesByStaff(params: {
    storeId: string;
    staffId: string;
    includeInactive: boolean;
  }): Promise<StaffServices | null>;

  /**
   * Get the most popular services
   */
  getPopularServices(params: {
    storeId: string;
    limit: number;
    timeRange: 'week' | 'month' | 'quarter';
    category?: string;
  }): Promise<PopularServicesResult>;

  /**
   * Get detailed pricing for a service
   */
  getServicePricing(params: {
    storeId: string;
    serviceId: string;
    staffId?: string;
    includeAddons: boolean;
  }): Promise<ServicePricing | null>;
}

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Summary service info returned by search
 */
export interface ServiceSummary {
  id: string;
  name: string;
  description?: string;
  category: string;
  priceRange: {
    min: number;
    max: number;
  };
  durationMinutes: number;
  isActive: boolean;
}

/**
 * Full service details
 */
export interface ServiceDetails {
  id: string;
  name: string;
  description: string;
  category: string;
  durationMinutes: number;
  isActive: boolean;
  pricing: {
    base: number;
    tiers?: Array<{
      name: string;
      price: number;
      description?: string;
    }>;
  };
  qualifiedStaff: Array<{
    id: string;
    firstName: string;
    lastName: string;
    tier?: string;
    priceForThisService?: number;
  }>;
  addons?: Array<{
    id: string;
    name: string;
    price: number;
    durationMinutes: number;
  }>;
  notes?: string;
}

/**
 * Services that a staff member can perform
 */
export interface StaffServices {
  staffId: string;
  staffName: string;
  services: Array<{
    id: string;
    name: string;
    category: string;
    price: number;
    durationMinutes: number;
    staffPriceTier?: string;
  }>;
  totalServices: number;
}

/**
 * Popular services result
 */
export interface PopularServicesResult {
  timeRange: 'week' | 'month' | 'quarter';
  services: Array<{
    id: string;
    name: string;
    category: string;
    bookingCount: number;
    percentageOfTotal: number;
    averageRating?: number;
    priceRange: {
      min: number;
      max: number;
    };
  }>;
  totalBookingsInPeriod: number;
}

/**
 * Service pricing details
 */
export interface ServicePricing {
  serviceId: string;
  serviceName: string;
  baseDurationMinutes: number;
  pricing: {
    basePrice: number;
    staffSpecificPrice?: number;
    tier?: string;
    allTiers?: Array<{
      name: string;
      price: number;
    }>;
  };
  addons?: Array<{
    id: string;
    name: string;
    price: number;
    durationMinutes: number;
  }>;
  notes?: string;
}

// ============================================================================
// Handler State
// ============================================================================

/**
 * Data provider instance (must be set before handlers can be used)
 */
let dataProvider: ServiceDataProvider | null = null;

/**
 * Set the data provider for service handlers.
 * Must be called during app initialization before any handlers are invoked.
 *
 * @param provider - The data provider implementation
 */
export function setServiceDataProvider(provider: ServiceDataProvider): void {
  dataProvider = provider;
}

/**
 * Get the current data provider.
 * Throws if not initialized.
 */
function getDataProvider(): ServiceDataProvider {
  if (!dataProvider) {
    throw new Error(
      'Service data provider not initialized. Call setServiceDataProvider() during app setup.'
    );
  }
  return dataProvider;
}

// ============================================================================
// Handlers
// ============================================================================

/**
 * Handle searchServices tool invocation.
 *
 * Searches for services by name, category, or price range.
 */
export const handleSearchServices: ToolHandler<
  SearchServicesInput,
  {
    services: ServiceSummary[];
    total: number;
    hasMore: boolean;
  }
> = async (input, context) => {
  const startTime = Date.now();

  context.logger.info('Executing searchServices', {
    query: input.query,
    category: input.category,
    limit: input.limit,
  });

  try {
    const provider = getDataProvider();

    const result = await provider.searchServices({
      storeId: context.storeId,
      query: input.query,
      category: input.category,
      minPrice: input.minPrice,
      maxPrice: input.maxPrice,
      maxDurationMinutes: input.maxDurationMinutes,
      includeInactive: input.includeInactive,
      limit: input.limit,
      offset: input.offset,
    });

    context.logger.info('searchServices completed', {
      resultCount: result.services.length,
      total: result.total,
      executionTimeMs: Date.now() - startTime,
    });

    return successResult(result, {
      executionTimeMs: Date.now() - startTime,
      count: result.services.length,
      total: result.total,
      hasMore: result.hasMore,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    context.logger.error('searchServices failed', { error: errorMessage });

    return errorResult(
      `Failed to search services: ${errorMessage}`,
      'INTERNAL_ERROR',
      { executionTimeMs: Date.now() - startTime }
    );
  }
};

/**
 * Handle getService tool invocation.
 *
 * Retrieves complete details for a specific service.
 */
export const handleGetService: ToolHandler<
  GetServiceInput,
  { service: ServiceDetails }
> = async (input, context) => {
  const startTime = Date.now();

  context.logger.info('Executing getService', {
    serviceId: input.serviceId,
  });

  try {
    const provider = getDataProvider();

    const service = await provider.getService({
      storeId: context.storeId,
      serviceId: input.serviceId,
    });

    if (!service) {
      context.logger.warn('Service not found', { serviceId: input.serviceId });
      return errorResult(
        `Service with ID '${input.serviceId}' not found`,
        'NOT_FOUND',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    context.logger.info('getService completed', {
      serviceId: service.id,
      executionTimeMs: Date.now() - startTime,
    });

    return successResult(
      { service },
      { executionTimeMs: Date.now() - startTime }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    context.logger.error('getService failed', { error: errorMessage });

    return errorResult(
      `Failed to get service: ${errorMessage}`,
      'INTERNAL_ERROR',
      { executionTimeMs: Date.now() - startTime }
    );
  }
};

/**
 * Handle getServicesByStaff tool invocation.
 *
 * Gets all services a staff member is qualified to perform.
 */
export const handleGetServicesByStaff: ToolHandler<
  GetServicesByStaffInput,
  StaffServices
> = async (input, context) => {
  const startTime = Date.now();

  context.logger.info('Executing getServicesByStaff', {
    staffId: input.staffId,
    includeInactive: input.includeInactive,
  });

  try {
    const provider = getDataProvider();

    const result = await provider.getServicesByStaff({
      storeId: context.storeId,
      staffId: input.staffId,
      includeInactive: input.includeInactive,
    });

    if (!result) {
      context.logger.warn('Staff not found', { staffId: input.staffId });
      return errorResult(
        `Staff member with ID '${input.staffId}' not found`,
        'NOT_FOUND',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    context.logger.info('getServicesByStaff completed', {
      staffId: input.staffId,
      serviceCount: result.services.length,
      executionTimeMs: Date.now() - startTime,
    });

    return successResult(result, {
      executionTimeMs: Date.now() - startTime,
      count: result.services.length,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    context.logger.error('getServicesByStaff failed', { error: errorMessage });

    return errorResult(
      `Failed to get services by staff: ${errorMessage}`,
      'INTERNAL_ERROR',
      { executionTimeMs: Date.now() - startTime }
    );
  }
};

/**
 * Handle getPopularServices tool invocation.
 *
 * Gets the most frequently booked services over a time period.
 */
export const handleGetPopularServices: ToolHandler<
  GetPopularServicesInput,
  PopularServicesResult
> = async (input, context) => {
  const startTime = Date.now();

  context.logger.info('Executing getPopularServices', {
    timeRange: input.timeRange,
    limit: input.limit,
    category: input.category,
  });

  try {
    const provider = getDataProvider();

    const result = await provider.getPopularServices({
      storeId: context.storeId,
      limit: input.limit,
      timeRange: input.timeRange,
      category: input.category,
    });

    context.logger.info('getPopularServices completed', {
      timeRange: input.timeRange,
      serviceCount: result.services.length,
      totalBookings: result.totalBookingsInPeriod,
      executionTimeMs: Date.now() - startTime,
    });

    return successResult(result, {
      executionTimeMs: Date.now() - startTime,
      count: result.services.length,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    context.logger.error('getPopularServices failed', { error: errorMessage });

    return errorResult(
      `Failed to get popular services: ${errorMessage}`,
      'INTERNAL_ERROR',
      { executionTimeMs: Date.now() - startTime }
    );
  }
};

/**
 * Handle getServicePricing tool invocation.
 *
 * Gets detailed pricing for a service, optionally for a specific staff member.
 */
export const handleGetServicePricing: ToolHandler<
  GetServicePricingInput,
  ServicePricing
> = async (input, context) => {
  const startTime = Date.now();

  context.logger.info('Executing getServicePricing', {
    serviceId: input.serviceId,
    staffId: input.staffId,
    includeAddons: input.includeAddons,
  });

  try {
    const provider = getDataProvider();

    const pricing = await provider.getServicePricing({
      storeId: context.storeId,
      serviceId: input.serviceId,
      staffId: input.staffId,
      includeAddons: input.includeAddons,
    });

    if (!pricing) {
      context.logger.warn('Service not found for pricing', { serviceId: input.serviceId });
      return errorResult(
        `Service with ID '${input.serviceId}' not found`,
        'NOT_FOUND',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    context.logger.info('getServicePricing completed', {
      serviceId: input.serviceId,
      basePrice: pricing.pricing.basePrice,
      executionTimeMs: Date.now() - startTime,
    });

    return successResult(pricing, {
      executionTimeMs: Date.now() - startTime,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    context.logger.error('getServicePricing failed', { error: errorMessage });

    // Check for staff not found
    if (input.staffId &&
        errorMessage.toLowerCase().includes('staff') &&
        errorMessage.toLowerCase().includes('not found')) {
      return errorResult(
        `Staff member with ID '${input.staffId}' not found`,
        'NOT_FOUND',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    return errorResult(
      `Failed to get service pricing: ${errorMessage}`,
      'INTERNAL_ERROR',
      { executionTimeMs: Date.now() - startTime }
    );
  }
};

// ============================================================================
// Handler Registry
// ============================================================================

/**
 * All service tool handlers mapped by tool name.
 */
export const serviceHandlers = {
  searchServices: handleSearchServices,
  getService: handleGetService,
  getServicesByStaff: handleGetServicesByStaff,
  getPopularServices: handleGetPopularServices,
  getServicePricing: handleGetServicePricing,
};
