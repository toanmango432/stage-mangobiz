/**
 * Tenant Router Service
 *
 * Routes tenants to appropriate regional shards for optimal latency
 * and load distribution. Supports multi-region deployment at scale.
 *
 * Architecture:
 * - Tenants are assigned to shards based on region preference
 * - Each shard has its own Supabase instance
 * - Consistent hashing ensures stable shard assignment
 * - Failover support for high availability
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

export type Region = 'us-west' | 'us-east' | 'eu-west' | 'eu-central' | 'apac';

export interface ShardConfig {
  /** Region identifier */
  region: Region;
  /** Supabase project URL */
  supabaseUrl: string;
  /** Supabase anon key */
  supabaseKey: string;
  /** Whether this shard is healthy */
  isHealthy: boolean;
  /** Last health check timestamp */
  lastHealthCheck: number;
  /** Failover shard region (if this one fails) */
  failoverRegion?: Region;
}

export interface TenantMetadata {
  tenantId: string;
  primaryRegion: Region;
  createdAt: string;
  tier: 'free' | 'pro' | 'enterprise';
}

export interface RoutingResult {
  shard: ShardConfig;
  client: SupabaseClient;
  fromCache: boolean;
  latencyMs?: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Shard configuration from environment variables
 * In production, these would be loaded from a config service
 */
const SHARD_CONFIGS: Record<Region, ShardConfig> = {
  'us-west': {
    region: 'us-west',
    supabaseUrl: import.meta.env.VITE_SUPABASE_US_WEST_URL || import.meta.env.VITE_SUPABASE_URL || '',
    supabaseKey: import.meta.env.VITE_SUPABASE_US_WEST_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    isHealthy: true,
    lastHealthCheck: Date.now(),
    failoverRegion: 'us-east',
  },
  'us-east': {
    region: 'us-east',
    supabaseUrl: import.meta.env.VITE_SUPABASE_US_EAST_URL || import.meta.env.VITE_SUPABASE_URL || '',
    supabaseKey: import.meta.env.VITE_SUPABASE_US_EAST_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    isHealthy: true,
    lastHealthCheck: Date.now(),
    failoverRegion: 'us-west',
  },
  'eu-west': {
    region: 'eu-west',
    supabaseUrl: import.meta.env.VITE_SUPABASE_EU_WEST_URL || import.meta.env.VITE_SUPABASE_URL || '',
    supabaseKey: import.meta.env.VITE_SUPABASE_EU_WEST_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    isHealthy: true,
    lastHealthCheck: Date.now(),
    failoverRegion: 'eu-central',
  },
  'eu-central': {
    region: 'eu-central',
    supabaseUrl: import.meta.env.VITE_SUPABASE_EU_CENTRAL_URL || import.meta.env.VITE_SUPABASE_URL || '',
    supabaseKey: import.meta.env.VITE_SUPABASE_EU_CENTRAL_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    isHealthy: true,
    lastHealthCheck: Date.now(),
    failoverRegion: 'eu-west',
  },
  'apac': {
    region: 'apac',
    supabaseUrl: import.meta.env.VITE_SUPABASE_APAC_URL || import.meta.env.VITE_SUPABASE_URL || '',
    supabaseKey: import.meta.env.VITE_SUPABASE_APAC_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    isHealthy: true,
    lastHealthCheck: Date.now(),
    failoverRegion: 'us-west',
  },
};

// Health check interval (5 minutes)
const HEALTH_CHECK_INTERVAL = 5 * 60 * 1000;

// Client cache TTL (30 minutes)
const CLIENT_CACHE_TTL = 30 * 60 * 1000;

// ============================================================================
// TENANT ROUTER CLASS
// ============================================================================

class TenantRouter {
  private clientCache: Map<string, { client: SupabaseClient; timestamp: number }> = new Map();
  private tenantRegionCache: Map<string, Region> = new Map();
  private healthCheckTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Start health checks in background
    this.startHealthChecks();
  }

  /**
   * Get the Supabase client for a specific tenant
   */
  async getClientForTenant(tenantId: string): Promise<RoutingResult> {
    const startTime = Date.now();

    // Check client cache first
    const cached = this.clientCache.get(tenantId);
    if (cached && Date.now() - cached.timestamp < CLIENT_CACHE_TTL) {
      const shard = this.getShardForRegion(this.tenantRegionCache.get(tenantId) || 'us-west');
      return {
        shard,
        client: cached.client,
        fromCache: true,
        latencyMs: Date.now() - startTime,
      };
    }

    // Get tenant's assigned region
    const region = await this.getTenantRegion(tenantId);
    let shard = this.getShardForRegion(region);

    // Check if primary shard is healthy, failover if needed
    if (!shard.isHealthy && shard.failoverRegion) {
      console.warn(`[TenantRouter] Shard ${region} unhealthy, failing over to ${shard.failoverRegion}`);
      shard = this.getShardForRegion(shard.failoverRegion);
    }

    // Create or get client
    const client = this.createClient(shard);

    // Cache the client
    this.clientCache.set(tenantId, { client, timestamp: Date.now() });
    this.tenantRegionCache.set(tenantId, region);

    return {
      shard,
      client,
      fromCache: false,
      latencyMs: Date.now() - startTime,
    };
  }

  /**
   * Get tenant's assigned region
   * In production, this would query a central metadata store
   */
  private async getTenantRegion(tenantId: string): Promise<Region> {
    // Check cache
    if (this.tenantRegionCache.has(tenantId)) {
      return this.tenantRegionCache.get(tenantId)!;
    }

    // For now, use consistent hashing based on tenant ID
    // In production, this would be stored in tenant metadata
    const region = this.hashToRegion(tenantId);

    this.tenantRegionCache.set(tenantId, region);
    return region;
  }

  /**
   * Consistent hash tenant ID to a region
   * Ensures same tenant always routes to same region
   */
  private hashToRegion(tenantId: string): Region {
    // Simple hash function for consistent routing
    let hash = 0;
    for (let i = 0; i < tenantId.length; i++) {
      const char = tenantId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    const regions: Region[] = ['us-west', 'us-east', 'eu-west', 'eu-central', 'apac'];
    const index = Math.abs(hash) % regions.length;
    return regions[index];
  }

  /**
   * Get shard configuration for a region
   */
  private getShardForRegion(region: Region): ShardConfig {
    return SHARD_CONFIGS[region] || SHARD_CONFIGS['us-west'];
  }

  /**
   * Create a Supabase client for a shard
   */
  private createClient(shard: ShardConfig): SupabaseClient {
    return createClient(shard.supabaseUrl, shard.supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        headers: {
          'x-region': shard.region,
        },
      },
    });
  }

  /**
   * Start periodic health checks for all shards
   */
  private startHealthChecks(): void {
    if (this.healthCheckTimer) return;

    this.healthCheckTimer = setInterval(() => {
      this.checkAllShardsHealth();
    }, HEALTH_CHECK_INTERVAL);

    // Run initial health check
    this.checkAllShardsHealth();
  }

  /**
   * Check health of all shards
   */
  private async checkAllShardsHealth(): Promise<void> {
    const regions = Object.keys(SHARD_CONFIGS) as Region[];

    for (const region of regions) {
      const shard = SHARD_CONFIGS[region];

      // Skip if no URL configured (not deployed yet)
      if (!shard.supabaseUrl || shard.supabaseUrl === import.meta.env.VITE_SUPABASE_URL) {
        continue;
      }

      try {
        const client = this.createClient(shard);
        const startTime = Date.now();

        // Simple health check - try to access the database
        const { error } = await client.from('health_check').select('count').single();

        const latency = Date.now() - startTime;

        // Consider unhealthy if error or latency > 5 seconds
        shard.isHealthy = !error && latency < 5000;
        shard.lastHealthCheck = Date.now();

        if (!shard.isHealthy) {
          console.warn(`[TenantRouter] Shard ${region} unhealthy: ${error?.message || `latency ${latency}ms`}`);
        }
      } catch (error) {
        shard.isHealthy = false;
        shard.lastHealthCheck = Date.now();
        console.error(`[TenantRouter] Health check failed for ${region}:`, error);
      }
    }
  }

  /**
   * Stop health checks (cleanup)
   */
  stop(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  /**
   * Get current shard status for monitoring
   */
  getShardStatus(): Record<Region, { isHealthy: boolean; lastCheck: string }> {
    const status: Record<string, { isHealthy: boolean; lastCheck: string }> = {};

    for (const [region, shard] of Object.entries(SHARD_CONFIGS)) {
      status[region] = {
        isHealthy: shard.isHealthy,
        lastCheck: new Date(shard.lastHealthCheck).toISOString(),
      };
    }

    return status as Record<Region, { isHealthy: boolean; lastCheck: string }>;
  }

  /**
   * Manually set tenant region (for admin use)
   */
  setTenantRegion(tenantId: string, region: Region): void {
    this.tenantRegionCache.set(tenantId, region);
    // Invalidate client cache
    this.clientCache.delete(tenantId);
  }

  /**
   * Get the nearest region based on user's timezone
   */
  getNearestRegion(): Region {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Map timezones to regions
    if (timezone.includes('America/Los_Angeles') || timezone.includes('America/Denver')) {
      return 'us-west';
    }
    if (timezone.includes('America/New_York') || timezone.includes('America/Chicago')) {
      return 'us-east';
    }
    if (timezone.includes('Europe/London') || timezone.includes('Europe/Dublin')) {
      return 'eu-west';
    }
    if (timezone.includes('Europe/Berlin') || timezone.includes('Europe/Paris')) {
      return 'eu-central';
    }
    if (timezone.includes('Asia') || timezone.includes('Australia') || timezone.includes('Pacific')) {
      return 'apac';
    }

    // Default to US West
    return 'us-west';
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const tenantRouter = new TenantRouter();

export default tenantRouter;
