/**
 * Rate Limiter Service
 *
 * Client-side rate limiting to prevent API abuse and ensure fair usage.
 * Uses sliding window algorithm for smooth rate limiting.
 *
 * Features:
 * - Per-tenant rate limits based on subscription tier
 * - Sliding window for accurate rate limiting
 * - Automatic backoff on limit exceeded
 * - Request queue for burst handling
 */

// ============================================================================
// TYPES
// ============================================================================

export type TierName = 'free' | 'starter' | 'pro' | 'enterprise';

export interface RateLimitConfig {
  /** Requests allowed per window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
  /** Maximum burst size (requests that can queue) */
  maxBurst: number;
  /** Backoff multiplier when rate limited */
  backoffMultiplier: number;
}

export interface RateLimitStatus {
  /** Remaining requests in current window */
  remaining: number;
  /** Total requests allowed */
  limit: number;
  /** Window reset time (Unix timestamp) */
  resetAt: number;
  /** Whether currently rate limited */
  isLimited: boolean;
  /** Retry after (seconds) if limited */
  retryAfter?: number;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Current rate limit status */
  status: RateLimitStatus;
  /** If not allowed, when to retry */
  retryAfter?: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Rate limit configurations by tier
 */
const TIER_LIMITS: Record<TierName, RateLimitConfig> = {
  free: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 1 minute
    maxBurst: 10,
    backoffMultiplier: 2,
  },
  starter: {
    maxRequests: 100,
    windowMs: 60 * 1000,
    maxBurst: 30,
    backoffMultiplier: 1.5,
  },
  pro: {
    maxRequests: 300,
    windowMs: 60 * 1000,
    maxBurst: 50,
    backoffMultiplier: 1.2,
  },
  enterprise: {
    maxRequests: 1000,
    windowMs: 60 * 1000,
    maxBurst: 100,
    backoffMultiplier: 1.1,
  },
};

/**
 * Operation-specific limits (multipliers of base limit)
 */
const OPERATION_WEIGHTS: Record<string, number> = {
  // Read operations (lighter)
  'read': 1,
  'list': 1,
  'search': 2,

  // Write operations (heavier)
  'create': 3,
  'update': 2,
  'delete': 2,

  // Bulk operations (heaviest)
  'bulk_create': 10,
  'bulk_update': 8,
  'bulk_delete': 8,

  // Special operations
  'sync': 5,
  'export': 20,
  'import': 20,
};

// ============================================================================
// SLIDING WINDOW IMPLEMENTATION
// ============================================================================

interface WindowEntry {
  timestamp: number;
  weight: number;
}

class SlidingWindowRateLimiter {
  private windows: Map<string, WindowEntry[]> = new Map();
  private backoffUntil: Map<string, number> = new Map();

  /**
   * Check if request is allowed and record it
   */
  checkAndRecord(
    key: string,
    config: RateLimitConfig,
    weight = 1
  ): RateLimitResult {
    const now = Date.now();

    // Check if in backoff period
    const backoffEnd = this.backoffUntil.get(key) || 0;
    if (now < backoffEnd) {
      const retryAfter = Math.ceil((backoffEnd - now) / 1000);
      return {
        allowed: false,
        status: this.getStatus(key, config),
        retryAfter,
      };
    }

    // Get or create window
    let entries = this.windows.get(key) || [];

    // Remove expired entries (outside window)
    const windowStart = now - config.windowMs;
    entries = entries.filter(e => e.timestamp > windowStart);

    // Calculate current usage
    const currentUsage = entries.reduce((sum, e) => sum + e.weight, 0);

    // Check if request would exceed limit
    if (currentUsage + weight > config.maxRequests) {
      // Calculate when oldest entry expires
      const oldestEntry = entries[0];
      const retryAfter = oldestEntry
        ? Math.ceil((oldestEntry.timestamp + config.windowMs - now) / 1000)
        : Math.ceil(config.windowMs / 1000);

      // Apply backoff
      this.backoffUntil.set(key, now + retryAfter * 1000 * config.backoffMultiplier);

      return {
        allowed: false,
        status: {
          remaining: 0,
          limit: config.maxRequests,
          resetAt: oldestEntry ? oldestEntry.timestamp + config.windowMs : now + config.windowMs,
          isLimited: true,
          retryAfter,
        },
        retryAfter,
      };
    }

    // Record this request
    entries.push({ timestamp: now, weight });
    this.windows.set(key, entries);

    return {
      allowed: true,
      status: {
        remaining: config.maxRequests - currentUsage - weight,
        limit: config.maxRequests,
        resetAt: now + config.windowMs,
        isLimited: false,
      },
    };
  }

  /**
   * Get current status without recording
   */
  getStatus(key: string, config: RateLimitConfig): RateLimitStatus {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    let entries = this.windows.get(key) || [];
    entries = entries.filter(e => e.timestamp > windowStart);

    const currentUsage = entries.reduce((sum, e) => sum + e.weight, 0);
    const backoffEnd = this.backoffUntil.get(key) || 0;
    const isLimited = now < backoffEnd || currentUsage >= config.maxRequests;

    return {
      remaining: Math.max(0, config.maxRequests - currentUsage),
      limit: config.maxRequests,
      resetAt: entries[0] ? entries[0].timestamp + config.windowMs : now + config.windowMs,
      isLimited,
      retryAfter: isLimited ? Math.ceil((backoffEnd - now) / 1000) : undefined,
    };
  }

  /**
   * Clear rate limit data for a key
   */
  clear(key: string): void {
    this.windows.delete(key);
    this.backoffUntil.delete(key);
  }

  /**
   * Clear all rate limit data
   */
  clearAll(): void {
    this.windows.clear();
    this.backoffUntil.clear();
  }
}

// ============================================================================
// RATE LIMITER SERVICE
// ============================================================================

class RateLimiterService {
  private limiter = new SlidingWindowRateLimiter();
  private tierCache: Map<string, TierName> = new Map();

  /**
   * Check if a request is allowed for a tenant
   */
  async checkRequest(
    tenantId: string,
    operation = 'read'
  ): Promise<RateLimitResult> {
    const tier = await this.getTenantTier(tenantId);
    const config = TIER_LIMITS[tier];
    const weight = OPERATION_WEIGHTS[operation] || 1;
    const key = `tenant:${tenantId}`;

    return this.limiter.checkAndRecord(key, config, weight);
  }

  /**
   * Check rate limit for a specific store within a tenant
   */
  async checkStoreRequest(
    tenantId: string,
    storeId: string,
    operation = 'read'
  ): Promise<RateLimitResult> {
    const tier = await this.getTenantTier(tenantId);
    const config = TIER_LIMITS[tier];
    const weight = OPERATION_WEIGHTS[operation] || 1;

    // Check both tenant-level and store-level limits
    const tenantKey = `tenant:${tenantId}`;
    const storeKey = `store:${storeId}`;

    const tenantResult = this.limiter.checkAndRecord(tenantKey, config, weight);
    if (!tenantResult.allowed) {
      return tenantResult;
    }

    // Store-level limit is 1/10th of tenant limit
    const storeConfig: RateLimitConfig = {
      ...config,
      maxRequests: Math.ceil(config.maxRequests / 10),
      maxBurst: Math.ceil(config.maxBurst / 10),
    };

    return this.limiter.checkAndRecord(storeKey, storeConfig, weight);
  }

  /**
   * Get current rate limit status for a tenant
   */
  async getStatus(tenantId: string): Promise<RateLimitStatus> {
    const tier = await this.getTenantTier(tenantId);
    const config = TIER_LIMITS[tier];
    const key = `tenant:${tenantId}`;

    return this.limiter.getStatus(key, config);
  }

  /**
   * Get tenant's subscription tier
   */
  private async getTenantTier(tenantId: string): Promise<TierName> {
    // Check cache
    if (this.tierCache.has(tenantId)) {
      return this.tierCache.get(tenantId)!;
    }

    // In production, this would fetch from tenant metadata
    // For now, default to 'starter'
    const tier: TierName = 'starter';
    this.tierCache.set(tenantId, tier);

    return tier;
  }

  /**
   * Set tenant tier (for testing/admin)
   */
  setTenantTier(tenantId: string, tier: TierName): void {
    this.tierCache.set(tenantId, tier);
  }

  /**
   * Clear rate limit for a tenant (admin use)
   */
  clearTenantLimit(tenantId: string): void {
    this.limiter.clear(`tenant:${tenantId}`);
  }

  /**
   * Get rate limit configuration for a tier
   */
  getTierConfig(tier: TierName): RateLimitConfig {
    return { ...TIER_LIMITS[tier] };
  }

  /**
   * Get all tier configurations
   */
  getAllTierConfigs(): Record<TierName, RateLimitConfig> {
    return { ...TIER_LIMITS };
  }
}

// ============================================================================
// MIDDLEWARE/WRAPPER
// ============================================================================

/**
 * Wrapper to rate limit async functions
 */
export function withRateLimit<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  getTenantId: (...args: Parameters<T>) => string,
  operation = 'read'
): T {
  return (async (...args: Parameters<T>) => {
    const tenantId = getTenantId(...args);
    const result = await rateLimiter.checkRequest(tenantId, operation);

    if (!result.allowed) {
      const error = new Error(`Rate limit exceeded. Retry after ${result.retryAfter} seconds.`);
      (error as any).retryAfter = result.retryAfter;
      (error as any).status = result.status;
      throw error;
    }

    return fn(...args);
  }) as T;
}

/**
 * React hook for rate limit status
 */
export function useRateLimitStatus(tenantId: string) {
  // This would be implemented with useState/useEffect
  // to periodically check and update status
  return rateLimiter.getStatus(tenantId);
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const rateLimiter = new RateLimiterService();

export default rateLimiter;
