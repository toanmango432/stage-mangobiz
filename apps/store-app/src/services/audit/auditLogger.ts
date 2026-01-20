/**
 * Audit Logger Service
 *
 * Comprehensive audit logging for compliance and security.
 * Tracks all significant actions with full context.
 *
 * Features:
 * - Automatic action tracking
 * - User and session context
 * - Data change tracking (before/after)
 * - Searchable audit trail
 * - Export for compliance
 */

import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { supabase } from '../supabase/client';
import { captureException, addBreadcrumb } from '../monitoring/sentry';

// ============================================================================
// TYPES
// ============================================================================

export type AuditAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'export'
  | 'import'
  | 'permission_change'
  | 'settings_change'
  | 'payment_process'
  | 'refund'
  | 'void'
  | 'staff_assign'   // FIX 4.3: Added for staff assignment audit logging
  | 'price_override' // Price override decision during checkout
  | 'communication_blocked'; // Communication blocked due to client preferences

export type AuditEntityType =
  | 'client'
  | 'appointment'
  | 'ticket'
  | 'transaction'
  | 'staff'
  | 'service'
  | 'user'
  | 'store'
  | 'member'
  | 'settings';

export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AuditContext {
  /** User who performed the action */
  userId?: string;
  userName?: string;
  userRole?: string;
  /** Store context */
  storeId?: string;
  storeName?: string;
  /** Tenant context */
  tenantId?: string;
  /** Session info */
  sessionId?: string;
  /** Request info */
  ipAddress?: string;
  userAgent?: string;
  /** Device info */
  deviceId?: string;
  platform?: 'web' | 'ios' | 'android' | 'desktop';
}

export interface AuditEntry {
  id?: string;
  /** Timestamp */
  timestamp: string;
  /** Action performed */
  action: AuditAction;
  /** Entity type affected */
  entityType: AuditEntityType;
  /** Entity ID */
  entityId?: string;
  /** Severity level */
  severity: AuditSeverity;
  /** Human-readable description */
  description: string;
  /** Context information */
  context: AuditContext;
  /** Data before change */
  oldData?: Record<string, any>;
  /** Data after change */
  newData?: Record<string, any>;
  /** Changed fields */
  changedFields?: string[];
  /** Additional metadata */
  metadata?: Record<string, any>;
  /** Success status */
  success: boolean;
  /** Error message if failed */
  errorMessage?: string;
}

export interface AuditQueryParams {
  /** Filter by tenant */
  tenantId?: string;
  /** Filter by store */
  storeId?: string;
  /** Filter by user */
  userId?: string;
  /** Filter by entity type */
  entityType?: AuditEntityType;
  /** Filter by entity ID */
  entityId?: string;
  /** Filter by action */
  action?: AuditAction;
  /** Filter by severity */
  severity?: AuditSeverity;
  /** Date range start */
  startDate?: string;
  /** Date range end */
  endDate?: string;
  /** Search text */
  searchText?: string;
  /** Pagination */
  limit?: number;
  offset?: number;
}

// ============================================================================
// SEVERITY MAPPINGS
// ============================================================================

const ACTION_SEVERITY: Record<AuditAction, AuditSeverity> = {
  create: 'low',
  read: 'low',
  update: 'low',
  delete: 'medium',
  login: 'medium',
  logout: 'low',
  export: 'medium',
  import: 'high',
  permission_change: 'high',
  settings_change: 'medium',
  payment_process: 'high',
  refund: 'high',
  void: 'critical',
  staff_assign: 'low',
  price_override: 'medium',
  communication_blocked: 'low',
};

// ============================================================================
// AUDIT LOGGER CLASS
// ============================================================================

class AuditLogger {
  private context: AuditContext = {};
  private buffer: AuditEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private readonly BUFFER_SIZE = 10;
  private readonly FLUSH_INTERVAL = 5000; // 5 seconds

  /**
   * Set the current context for all subsequent logs
   */
  setContext(context: Partial<AuditContext>): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Clear the current context
   */
  clearContext(): void {
    this.context = {};
  }

  /**
   * Log an audit entry
   */
  async log(entry: {
    action: AuditAction;
    entityType: AuditEntityType;
    entityId?: string;
    description: string;
    severity?: AuditSeverity;
    oldData?: Record<string, any>;
    newData?: Record<string, any>;
    changedFields?: string[];
    metadata?: Record<string, any>;
    success: boolean;
    errorMessage?: string;
  }): Promise<void> {
    const fullEntry: AuditEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
      context: { ...this.context },
      severity: entry.severity || ACTION_SEVERITY[entry.action] || 'low',
    };

    // Add to buffer
    this.buffer.push(fullEntry);

    // Also add as Sentry breadcrumb for correlation
    addBreadcrumb({
      category: 'audit',
      message: fullEntry.description,
      level: this.severityToSentryLevel(fullEntry.severity),
      data: {
        action: fullEntry.action,
        entityType: fullEntry.entityType,
        entityId: fullEntry.entityId,
        userId: fullEntry.context.userId,
      },
    });

    // Flush if buffer is full
    if (this.buffer.length >= this.BUFFER_SIZE) {
      await this.flush();
    } else if (!this.flushTimer) {
      // Schedule flush
      this.flushTimer = setTimeout(() => this.flush(), this.FLUSH_INTERVAL);
    }
  }

  /**
   * Log a create action
   */
  async logCreate(
    entityType: AuditEntityType,
    entityId: string,
    newData: Record<string, any>,
    description?: string
  ): Promise<void> {
    await this.log({
      action: 'create',
      entityType,
      entityId,
      description: description || `Created ${entityType} ${entityId}`,
      newData: this.sanitizeData(newData),
      success: true,
    });
  }

  /**
   * Log an update action
   */
  async logUpdate(
    entityType: AuditEntityType,
    entityId: string,
    oldData: Record<string, any>,
    newData: Record<string, any>,
    description?: string
  ): Promise<void> {
    const changedFields = this.getChangedFields(oldData, newData);

    await this.log({
      action: 'update',
      entityType,
      entityId,
      description: description || `Updated ${entityType} ${entityId}: ${changedFields.join(', ')}`,
      oldData: this.sanitizeData(oldData),
      newData: this.sanitizeData(newData),
      changedFields,
      success: true,
    });
  }

  /**
   * Log a delete action
   */
  async logDelete(
    entityType: AuditEntityType,
    entityId: string,
    oldData?: Record<string, any>,
    description?: string
  ): Promise<void> {
    await this.log({
      action: 'delete',
      entityType,
      entityId,
      description: description || `Deleted ${entityType} ${entityId}`,
      oldData: oldData ? this.sanitizeData(oldData) : undefined,
      success: true,
    });
  }

  /**
   * Log a login action
   */
  async logLogin(
    userId: string,
    userName: string,
    success: boolean,
    errorMessage?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const loginMethod = metadata?.loginMethod || 'password';
    const loginType = metadata?.loginType || 'user';

    await this.log({
      action: 'login',
      entityType: loginType === 'store' ? 'store' : loginType === 'member' ? 'member' : 'user',
      entityId: userId,
      description: success
        ? `${loginType === 'store' ? 'Store' : 'User'} ${userName} logged in via ${loginMethod}`
        : `Login failed for ${userName} via ${loginMethod}`,
      success,
      errorMessage,
      metadata: {
        loginMethod,
        loginType,
        ...metadata,
      },
    });
  }

  /**
   * Log a payment action
   */
  async logPayment(
    transactionId: string,
    amount: number,
    method: string,
    success: boolean,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      action: 'payment_process',
      entityType: 'transaction',
      entityId: transactionId,
      description: success
        ? `Payment processed: $${amount.toFixed(2)} via ${method}`
        : `Payment failed: $${amount.toFixed(2)} via ${method}`,
      success,
      metadata: {
        amount,
        method,
        ...metadata,
      },
    });
  }

  /**
   * Log a refund action
   */
  async logRefund(
    transactionId: string,
    originalTransactionId: string,
    amount: number,
    reason: string
  ): Promise<void> {
    await this.log({
      action: 'refund',
      entityType: 'transaction',
      entityId: transactionId,
      description: `Refund processed: $${amount.toFixed(2)} for transaction ${originalTransactionId}`,
      success: true,
      metadata: {
        amount,
        originalTransactionId,
        reason,
      },
    });
  }

  /**
   * Log a settings change
   */
  async logSettingsChange(
    settingType: string,
    oldValue: any,
    newValue: any
  ): Promise<void> {
    await this.log({
      action: 'settings_change',
      entityType: 'settings',
      entityId: settingType,
      description: `Settings changed: ${settingType}`,
      oldData: { value: oldValue },
      newData: { value: newValue },
      changedFields: [settingType],
      success: true,
    });
  }

  /**
   * Log a permission change
   */
  async logPermissionChange(
    userId: string,
    userName: string,
    oldPermissions: string[],
    newPermissions: string[]
  ): Promise<void> {
    const added = newPermissions.filter(p => !oldPermissions.includes(p));
    const removed = oldPermissions.filter(p => !newPermissions.includes(p));

    await this.log({
      action: 'permission_change',
      entityType: 'user',
      entityId: userId,
      description: `Permissions changed for ${userName}. Added: ${added.join(', ') || 'none'}. Removed: ${removed.join(', ') || 'none'}`,
      oldData: { permissions: oldPermissions },
      newData: { permissions: newPermissions },
      success: true,
    });
  }

  /**
   * Query audit logs
   */
  async query(params: AuditQueryParams): Promise<AuditEntry[]> {
    // First flush any pending entries
    await this.flush();

    let query = supabase
      .from('store_audit_logs')
      .select('*')
      .order('timestamp', { ascending: false });

    if (params.tenantId) {
      query = query.eq('context->>tenantId', params.tenantId);
    }
    if (params.storeId) {
      query = query.eq('context->>storeId', params.storeId);
    }
    if (params.userId) {
      query = query.eq('context->>userId', params.userId);
    }
    if (params.entityType) {
      query = query.eq('entity_type', params.entityType);
    }
    if (params.entityId) {
      query = query.eq('entity_id', params.entityId);
    }
    if (params.action) {
      query = query.eq('action', params.action);
    }
    if (params.severity) {
      query = query.eq('severity', params.severity);
    }
    if (params.startDate) {
      query = query.gte('timestamp', params.startDate);
    }
    if (params.endDate) {
      query = query.lte('timestamp', params.endDate);
    }
    if (params.searchText) {
      query = query.ilike('description', `%${params.searchText}%`);
    }
    if (params.limit) {
      query = query.limit(params.limit);
    }
    if (params.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[AuditLogger] Query failed:', error);
      return [];
    }

    return (data || []).map(this.rowToEntry);
  }

  /**
   * Flush buffered entries to database
   */
  async flush(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.buffer.length === 0) return;

    const entries = [...this.buffer];
    this.buffer = [];

    try {
      const rows = entries.map(this.entryToRow);

      const { error } = await supabase.from('store_audit_logs').insert(rows);

      if (error) {
        console.error('[AuditLogger] Flush failed:', error);
        captureException(error, {
          tags: { module: 'audit' },
          extra: { entryCount: entries.length },
        });

        // Put entries back in buffer for retry
        this.buffer = [...entries, ...this.buffer];
      }
    } catch (error) {
      console.error('[AuditLogger] Flush error:', error);

      // Put entries back in buffer for retry
      this.buffer = [...entries, ...this.buffer];
    }
  }

  /**
   * Convert audit entry to database row
   */
  private entryToRow(entry: AuditEntry): Record<string, any> {
    // Explicitly set store_id from context for filtering
    // user_name is stored in context JSONB (no dedicated column)
    return {
      timestamp: entry.timestamp,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId,
      severity: entry.severity,
      description: entry.description,
      context: entry.context,
      old_data: entry.oldData,
      new_data: entry.newData,
      changed_fields: entry.changedFields,
      metadata: entry.metadata,
      success: entry.success,
      error_message: entry.errorMessage,
      // Explicitly set store_id for query filtering (not a GENERATED column)
      store_id: entry.context?.storeId || null,
    };
  }

  /**
   * Convert database row to audit entry
   */
  private rowToEntry(row: Record<string, any>): AuditEntry {
    return {
      id: row.id,
      timestamp: row.timestamp,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      severity: row.severity,
      description: row.description,
      context: row.context,
      oldData: row.old_data,
      newData: row.new_data,
      changedFields: row.changed_fields,
      metadata: row.metadata,
      success: row.success,
      errorMessage: row.error_message,
    };
  }

  /**
   * Remove sensitive fields from data
   */
  private sanitizeData(data: Record<string, any>): Record<string, any> {
    const sensitiveFields = ['password', 'pin', 'ssn', 'creditCard', 'cvv', 'token', 'secret'];
    const sanitized = { ...data };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Get list of fields that changed between old and new data
   */
  private getChangedFields(oldData: Record<string, any>, newData: Record<string, any>): string[] {
    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
    const changed: string[] = [];

    for (const key of allKeys) {
      if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
        changed.push(key);
      }
    }

    return changed;
  }

  /**
   * Map severity to Sentry level
   */
  private severityToSentryLevel(severity: AuditSeverity): 'info' | 'warning' | 'error' {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      default:
        return 'info';
    }
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const auditLogger = new AuditLogger();

// ============================================================================
// REACT HOOK FOR CONTEXT MANAGEMENT
// ============================================================================

/**
 * React hook to automatically set audit context based on auth state
 *
 * Usage:
 * ```tsx
 * // In App.tsx or AuthProvider
 * import { useAuditContext } from '@/services/audit/auditLogger';
 *
 * function App() {
 *   useAuditContext(); // Sets context from Redux auth state
 *   return <AppContent />;
 * }
 * ```
 */
export function useAuditContext(): void {

  // Get auth state from Redux
  const store = useSelector((state: any) => state.auth?.store);
  const member = useSelector((state: any) => state.auth?.member);
  const storeId = useSelector((state: any) => state.auth?.storeId);

  useEffect(() => {
    // Set audit context when auth state changes
    if (store || member || storeId) {
      auditLogger.setContext({
        // Store context
        storeId: store?.storeId || storeId || undefined,
        storeName: store?.storeName,
        tenantId: store?.tenantId,
        // User context
        userId: member?.memberId || store?.storeId,
        userName: member?.memberName || store?.storeName,
        userRole: member?.role,
        // Platform detection
        platform: detectPlatform(),
      });
    }

    // Cleanup on unmount or when logging out
    return () => {
      // Only clear if we're unmounting due to logout (no auth data)
      // Don't clear on every re-render
    };
  }, [store, member, storeId]);
}

/**
 * Detect current platform for audit context
 */
function detectPlatform(): 'web' | 'ios' | 'android' | 'desktop' {
  if (typeof window === 'undefined') return 'web';

  // Check for Capacitor (iOS/Android)
  if ((window as any).Capacitor) {
    const platform = (window as any).Capacitor.getPlatform();
    if (platform === 'ios') return 'ios';
    if (platform === 'android') return 'android';
  }

  // Check for Electron (Desktop)
  if ((window as any).electron) {
    return 'desktop';
  }

  return 'web';
}

export default auditLogger;
