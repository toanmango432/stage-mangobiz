/**
 * Resource Quota Manager
 *
 * Manages tenant resource limits based on subscription tier.
 * Prevents exceeding quotas and provides usage visibility.
 *
 * Features:
 * - Per-tenant resource limits
 * - Real-time usage tracking
 * - Quota enforcement
 * - Usage alerts and notifications
 */

import { supabase } from '../supabase/client';
import { addBreadcrumb } from '../monitoring/sentry';

// ============================================================================
// TYPES
// ============================================================================

export type TierName = 'free' | 'starter' | 'pro' | 'enterprise';

export interface ResourceQuota {
  /** Maximum number of staff members */
  maxStaff: number;
  /** Maximum number of clients */
  maxClients: number;
  /** Maximum appointments per day */
  maxAppointmentsPerDay: number;
  /** Maximum services in catalog */
  maxServices: number;
  /** Maximum stores */
  maxStores: number;
  /** Storage quota in GB */
  maxStorageGB: number;
  /** Data retention in days */
  dataRetentionDays: number;
  /** API requests per minute */
  apiRequestsPerMinute: number;
  /** Export enabled */
  exportEnabled: boolean;
  /** Advanced reporting enabled */
  advancedReportingEnabled: boolean;
  /** Custom branding enabled */
  customBrandingEnabled: boolean;
  /** SMS notifications enabled */
  smsNotificationsEnabled: boolean;
  /** Email notifications enabled */
  emailNotificationsEnabled: boolean;
}

export interface ResourceUsage {
  /** Current staff count */
  staffCount: number;
  /** Current client count */
  clientCount: number;
  /** Appointments today */
  appointmentsToday: number;
  /** Service count */
  serviceCount: number;
  /** Store count */
  storeCount: number;
  /** Storage used in GB */
  storageUsedGB: number;
  /** Last updated */
  lastUpdated: string;
}

export interface QuotaCheckResult {
  /** Resource being checked */
  resource: keyof ResourceQuota;
  /** Current usage */
  current: number;
  /** Maximum allowed */
  limit: number;
  /** Percentage used */
  percentUsed: number;
  /** Whether quota is exceeded */
  exceeded: boolean;
  /** Whether nearing limit (>80%) */
  warning: boolean;
  /** Human-readable message */
  message: string;
}

export interface QuotaStatus {
  /** Tenant ID */
  tenantId: string;
  /** Current tier */
  tier: TierName;
  /** Quota limits */
  quota: ResourceQuota;
  /** Current usage */
  usage: ResourceUsage;
  /** Individual resource checks */
  checks: QuotaCheckResult[];
  /** Overall status */
  status: 'ok' | 'warning' | 'exceeded';
}

// ============================================================================
// TIER CONFIGURATIONS
// ============================================================================

const TIER_QUOTAS: Record<TierName, ResourceQuota> = {
  free: {
    maxStaff: 3,
    maxClients: 500,
    maxAppointmentsPerDay: 30,
    maxServices: 20,
    maxStores: 1,
    maxStorageGB: 1,
    dataRetentionDays: 30,
    apiRequestsPerMinute: 30,
    exportEnabled: false,
    advancedReportingEnabled: false,
    customBrandingEnabled: false,
    smsNotificationsEnabled: false,
    emailNotificationsEnabled: true,
  },
  starter: {
    maxStaff: 10,
    maxClients: 2000,
    maxAppointmentsPerDay: 100,
    maxServices: 50,
    maxStores: 1,
    maxStorageGB: 5,
    dataRetentionDays: 90,
    apiRequestsPerMinute: 100,
    exportEnabled: true,
    advancedReportingEnabled: false,
    customBrandingEnabled: false,
    smsNotificationsEnabled: true,
    emailNotificationsEnabled: true,
  },
  pro: {
    maxStaff: 50,
    maxClients: 10000,
    maxAppointmentsPerDay: 500,
    maxServices: 200,
    maxStores: 5,
    maxStorageGB: 25,
    dataRetentionDays: 365,
    apiRequestsPerMinute: 300,
    exportEnabled: true,
    advancedReportingEnabled: true,
    customBrandingEnabled: true,
    smsNotificationsEnabled: true,
    emailNotificationsEnabled: true,
  },
  enterprise: {
    maxStaff: Infinity,
    maxClients: Infinity,
    maxAppointmentsPerDay: Infinity,
    maxServices: Infinity,
    maxStores: Infinity,
    maxStorageGB: 100,
    dataRetentionDays: Infinity,
    apiRequestsPerMinute: 1000,
    exportEnabled: true,
    advancedReportingEnabled: true,
    customBrandingEnabled: true,
    smsNotificationsEnabled: true,
    emailNotificationsEnabled: true,
  },
};

// ============================================================================
// QUOTA MANAGER CLASS
// ============================================================================

class QuotaManager {
  private usageCache: Map<string, { usage: ResourceUsage; timestamp: number }> = new Map();
  private tierCache: Map<string, TierName> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get quota configuration for a tier
   */
  getQuotaForTier(tier: TierName): ResourceQuota {
    return { ...TIER_QUOTAS[tier] };
  }

  /**
   * Get current usage for a tenant
   */
  async getUsage(tenantId: string, forceRefresh = false): Promise<ResourceUsage> {
    // Check cache
    const cached = this.usageCache.get(tenantId);
    if (!forceRefresh && cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.usage;
    }

    // Fetch current usage from database
    const usage = await this.fetchUsage(tenantId);

    // Cache the result
    this.usageCache.set(tenantId, { usage, timestamp: Date.now() });

    return usage;
  }

  /**
   * Fetch usage data from database
   */
  private async fetchUsage(tenantId: string): Promise<ResourceUsage> {
    const today = new Date().toISOString().split('T')[0];

    // Run all counts in parallel
    const [staffResult, clientsResult, appointmentsResult, servicesResult, storesResult] = await Promise.all([
      supabase.from('staff').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      supabase.from('clients').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      supabase.from('appointments').select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .gte('appointment_date', today)
        .lt('appointment_date', today + 'T23:59:59'),
      supabase.from('services').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      supabase.from('stores').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    ]);

    return {
      staffCount: staffResult.count || 0,
      clientCount: clientsResult.count || 0,
      appointmentsToday: appointmentsResult.count || 0,
      serviceCount: servicesResult.count || 0,
      storeCount: storesResult.count || 0,
      storageUsedGB: 0, // Would need to calculate from file storage
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get tenant's subscription tier
   */
  async getTenantTier(tenantId: string): Promise<TierName> {
    // Check cache
    if (this.tierCache.has(tenantId)) {
      return this.tierCache.get(tenantId)!;
    }

    // Fetch from database
    const { data, error } = await supabase
      .from('tenants')
      .select('tier')
      .eq('id', tenantId)
      .single();

    if (error || !data) {
      console.warn('[QuotaManager] Could not fetch tenant tier, defaulting to starter');
      return 'starter';
    }

    const tier = (data.tier as TierName) || 'starter';
    this.tierCache.set(tenantId, tier);

    return tier;
  }

  /**
   * Check a specific resource quota
   */
  async checkQuota(
    tenantId: string,
    resource: keyof ResourceQuota,
    additionalUsage = 0
  ): Promise<QuotaCheckResult> {
    const tier = await this.getTenantTier(tenantId);
    const quota = TIER_QUOTAS[tier];
    const usage = await this.getUsage(tenantId);

    // Map resource to usage field
    const usageMap: Record<string, number> = {
      maxStaff: usage.staffCount,
      maxClients: usage.clientCount,
      maxAppointmentsPerDay: usage.appointmentsToday,
      maxServices: usage.serviceCount,
      maxStores: usage.storeCount,
      maxStorageGB: usage.storageUsedGB,
    };

    const current = (usageMap[resource] || 0) + additionalUsage;
    const limit = quota[resource] as number;
    const percentUsed = limit === Infinity ? 0 : (current / limit) * 100;

    const exceeded = current > limit;
    const warning = !exceeded && percentUsed >= 80;

    let message = '';
    if (exceeded) {
      message = `${resource} quota exceeded: ${current}/${limit}`;
    } else if (warning) {
      message = `${resource} nearing limit: ${current}/${limit} (${percentUsed.toFixed(0)}%)`;
    } else {
      message = `${resource}: ${current}/${limit === Infinity ? '∞' : limit}`;
    }

    // Log quota check
    addBreadcrumb({
      category: 'quota',
      message: `Quota check: ${resource}`,
      level: exceeded ? 'warning' : 'info',
      data: { tenantId, resource, current, limit, exceeded },
    });

    return {
      resource,
      current,
      limit,
      percentUsed,
      exceeded,
      warning,
      message,
    };
  }

  /**
   * Check if an action is allowed based on quotas
   */
  async canPerformAction(
    tenantId: string,
    action: 'add_staff' | 'add_client' | 'add_appointment' | 'add_service' | 'add_store'
  ): Promise<{ allowed: boolean; reason?: string }> {
    const resourceMap: Record<string, keyof ResourceQuota> = {
      add_staff: 'maxStaff',
      add_client: 'maxClients',
      add_appointment: 'maxAppointmentsPerDay',
      add_service: 'maxServices',
      add_store: 'maxStores',
    };

    const resource = resourceMap[action];
    if (!resource) {
      return { allowed: true };
    }

    const check = await this.checkQuota(tenantId, resource, 1);

    if (check.exceeded) {
      return {
        allowed: false,
        reason: `You've reached your ${resource.replace('max', '').toLowerCase()} limit. Please upgrade your plan to add more.`,
      };
    }

    return { allowed: true };
  }

  /**
   * Get full quota status for a tenant
   */
  async getQuotaStatus(tenantId: string): Promise<QuotaStatus> {
    const tier = await this.getTenantTier(tenantId);
    const quota = TIER_QUOTAS[tier];
    const usage = await this.getUsage(tenantId, true); // Force refresh

    const checks: QuotaCheckResult[] = [
      await this.checkQuota(tenantId, 'maxStaff'),
      await this.checkQuota(tenantId, 'maxClients'),
      await this.checkQuota(tenantId, 'maxAppointmentsPerDay'),
      await this.checkQuota(tenantId, 'maxServices'),
      await this.checkQuota(tenantId, 'maxStores'),
      await this.checkQuota(tenantId, 'maxStorageGB'),
    ];

    const hasExceeded = checks.some(c => c.exceeded);
    const hasWarning = checks.some(c => c.warning);

    return {
      tenantId,
      tier,
      quota,
      usage,
      checks,
      status: hasExceeded ? 'exceeded' : hasWarning ? 'warning' : 'ok',
    };
  }

  /**
   * Check if a feature is available for the tenant's tier
   */
  async isFeatureEnabled(
    tenantId: string,
    feature: 'export' | 'advancedReporting' | 'customBranding' | 'sms' | 'email'
  ): Promise<boolean> {
    const tier = await this.getTenantTier(tenantId);
    const quota = TIER_QUOTAS[tier];

    const featureMap: Record<string, keyof ResourceQuota> = {
      export: 'exportEnabled',
      advancedReporting: 'advancedReportingEnabled',
      customBranding: 'customBrandingEnabled',
      sms: 'smsNotificationsEnabled',
      email: 'emailNotificationsEnabled',
    };

    return !!quota[featureMap[feature]];
  }

  /**
   * Set tenant tier (admin use)
   */
  setTenantTier(tenantId: string, tier: TierName): void {
    this.tierCache.set(tenantId, tier);
    // Invalidate usage cache
    this.usageCache.delete(tenantId);
  }

  /**
   * Invalidate cache for a tenant
   */
  invalidateCache(tenantId: string): void {
    this.usageCache.delete(tenantId);
    this.tierCache.delete(tenantId);
  }

  /**
   * Get tier comparison for upgrade prompts
   */
  getTierComparison(): Record<TierName, ResourceQuota> {
    return { ...TIER_QUOTAS };
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const quotaManager = new QuotaManager();

export default quotaManager;
