/**
 * Audit Logs Repository
 * Handles CRUD operations for audit log management
 * Note: Audit logs are append-only, no update/delete operations
 */

import { BaseRepository, QueryOptions, APIError } from './base.repository';
import { supabase, withCircuitBreaker } from '../client';
import { AuditLog, AuditAction, CreateAuditLogInput } from '@/types/auditLog';

// Database row type (snake_case)
interface AuditLogRow {
  id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  admin_user_id?: string;
  admin_user_email?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// Convert DB row to app type
function toAuditLog(row: AuditLogRow): AuditLog {
  return {
    id: row.id,
    action: row.action as AuditAction,
    entityType: row.entity_type as AuditLog['entityType'],
    entityId: row.entity_id,
    adminUserId: row.admin_user_id,
    adminUserEmail: row.admin_user_email,
    details: row.details,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    createdAt: new Date(row.created_at),
  };
}

// Convert input to DB row
function toRow(input: CreateAuditLogInput): Partial<AuditLogRow> {
  return {
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId,
    admin_user_id: input.adminUserId,
    admin_user_email: input.adminUserEmail,
    details: input.details,
    ip_address: input.ipAddress,
    user_agent: input.userAgent,
  };
}

class AuditLogsRepository extends BaseRepository<AuditLogRow> {
  constructor() {
    super('audit_logs');
  }

  /**
   * Get all audit logs (with default ordering by most recent)
   */
  async getAll(options?: QueryOptions): Promise<AuditLog[]> {
    const result = await this.findAll({
      orderBy: 'created_at',
      orderDirection: 'desc',
      ...options,
    });
    return result.data.map(toAuditLog);
  }

  /**
   * Get audit log by ID
   */
  async getById(id: string): Promise<AuditLog | null> {
    const result = await this.findById(id);
    return result.data ? toAuditLog(result.data) : null;
  }

  /**
   * Get audit logs by admin user
   */
  async getByUser(adminUserId: string, options?: QueryOptions): Promise<AuditLog[]> {
    const result = await this.findByField('admin_user_id', adminUserId, {
      orderBy: 'created_at',
      orderDirection: 'desc',
      ...options,
    });
    return result.data.map(toAuditLog);
  }

  /**
   * Get audit logs by entity
   */
  async getByEntity(entityType: AuditLog['entityType'], entityId?: string, options?: QueryOptions): Promise<AuditLog[]> {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*')
        .eq('entity_type', entityType)
        .order('created_at', { ascending: false });

      if (entityId) {
        query = query.eq('entity_id', entityId);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await withCircuitBreaker(() => query);

      if (error) throw APIError.fromSupabaseError(error);
      return (data || []).map(toAuditLog);
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }

  /**
   * Get audit logs by action type
   */
  async getByAction(action: AuditAction, options?: QueryOptions): Promise<AuditLog[]> {
    const result = await this.findByField('action', action, {
      orderBy: 'created_at',
      orderDirection: 'desc',
      ...options,
    });
    return result.data.map(toAuditLog);
  }

  /**
   * Get audit logs by date range
   */
  async getByDateRange(startDate: Date, endDate: Date, options?: QueryOptions): Promise<AuditLog[]> {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await withCircuitBreaker(() => query);

      if (error) throw APIError.fromSupabaseError(error);
      return (data || []).map(toAuditLog);
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }

  /**
   * Create a new audit log entry
   */
  async createLog(input: CreateAuditLogInput): Promise<AuditLog> {
    const result = await this.create(toRow(input) as any);
    return toAuditLog(result.data);
  }

  /**
   * Get recent activity summary
   */
  async getRecentActivity(hours: number = 24): Promise<AuditLog[]> {
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - hours);
    return this.getByDateRange(startDate, new Date(), { limit: 100 });
  }

  /**
   * Get count by action type
   */
  async getCountByAction(): Promise<Record<string, number>> {
    try {
      const { data, error } = await withCircuitBreaker(() =>
        supabase.from(this.tableName).select('action')
      );

      if (error) throw APIError.fromSupabaseError(error);

      const counts: Record<string, number> = {};
      data?.forEach((row: any) => {
        counts[row.action] = (counts[row.action] || 0) + 1;
      });

      return counts;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }

  /**
   * Search audit logs
   */
  async search(searchTerm: string, options?: QueryOptions): Promise<AuditLog[]> {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*')
        .or(`admin_user_email.ilike.%${searchTerm}%,action.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await withCircuitBreaker(() => query);

      if (error) throw APIError.fromSupabaseError(error);
      return (data || []).map(toAuditLog);
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }
}

export const auditLogsRepository = new AuditLogsRepository();
export { AuditLogsRepository };
