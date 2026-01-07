/**
 * Members Repository
 * Handles CRUD operations for member (staff/manager/admin) management
 */

import { BaseRepository, QueryOptions, APIError } from './base.repository';
import { supabase, withCircuitBreaker } from '../client';
import { Member, MemberRole, MemberStatus } from '@/types/member';

// Database row type (snake_case)
interface MemberRow {
  id: string;
  tenant_id: string;
  store_ids: string[];
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  password_hash: string;
  pin?: string;
  role: string;
  permissions: string[];
  status: string;
  last_login_at?: string;
  last_active_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// Convert DB row to app type
function toMember(row: MemberRow): Member {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    storeIds: row.store_ids || [],
    name: row.name,
    email: row.email,
    phone: row.phone,
    avatar: row.avatar,
    passwordHash: row.password_hash,
    pin: row.pin,
    role: row.role as MemberRole,
    permissions: row.permissions || [],
    status: row.status as MemberStatus,
    lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : undefined,
    lastActiveAt: row.last_active_at ? new Date(row.last_active_at) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    createdBy: row.created_by,
  };
}

// Convert app type to DB row
function toRow(member: Partial<Member>): Partial<MemberRow> {
  const row: Partial<MemberRow> = {};
  if (member.tenantId !== undefined) row.tenant_id = member.tenantId;
  if (member.storeIds !== undefined) row.store_ids = member.storeIds;
  if (member.name !== undefined) row.name = member.name;
  if (member.email !== undefined) row.email = member.email;
  if (member.phone !== undefined) row.phone = member.phone;
  if (member.avatar !== undefined) row.avatar = member.avatar;
  if (member.passwordHash !== undefined) row.password_hash = member.passwordHash;
  if (member.pin !== undefined) row.pin = member.pin;
  if (member.role !== undefined) row.role = member.role;
  if (member.permissions !== undefined) row.permissions = member.permissions;
  if (member.status !== undefined) row.status = member.status;
  if (member.createdBy !== undefined) row.created_by = member.createdBy;
  return row;
}

class MembersRepository extends BaseRepository<MemberRow> {
  constructor() {
    super('members');
  }

  /**
   * Get all members
   */
  async getAll(options?: QueryOptions): Promise<Member[]> {
    const result = await this.findAll(options);
    return result.data.map(toMember);
  }

  /**
   * Get member by ID
   */
  async getById(id: string): Promise<Member | null> {
    const result = await this.findById(id);
    return result.data ? toMember(result.data) : null;
  }

  /**
   * Get members by tenant ID
   */
  async getByTenant(tenantId: string, options?: QueryOptions): Promise<Member[]> {
    const result = await this.findByField('tenant_id', tenantId, options);
    return result.data.map(toMember);
  }

  /**
   * Get members by store ID
   */
  async getByStore(storeId: string): Promise<Member[]> {
    try {
      const { data, error } = await withCircuitBreaker(() =>
        supabase.from(this.tableName).select('*').contains('store_ids', [storeId])
      );

      if (error) throw APIError.fromSupabaseError(error);
      return (data || []).map(toMember);
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }

  /**
   * Get member by email
   */
  async getByEmail(email: string): Promise<Member | null> {
    try {
      const { data, error } = await withCircuitBreaker(() =>
        supabase.from(this.tableName).select('*').eq('email', email).single()
      );

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw APIError.fromSupabaseError(error);
      }

      return data ? toMember(data as MemberRow) : null;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }

  /**
   * Create a new member
   */
  async createMember(data: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>): Promise<Member> {
    const result = await this.create(toRow(data) as any);
    return toMember(result.data);
  }

  /**
   * Update a member
   */
  async updateMember(id: string, data: Partial<Member>): Promise<Member> {
    const result = await this.update(id, toRow(data) as any);
    return toMember(result.data);
  }

  /**
   * Activate a member
   */
  async activate(id: string): Promise<Member> {
    return this.updateMember(id, { status: 'active' });
  }

  /**
   * Deactivate a member
   */
  async deactivate(id: string): Promise<Member> {
    return this.updateMember(id, { status: 'inactive' });
  }

  /**
   * Suspend a member
   */
  async suspend(id: string): Promise<Member> {
    return this.updateMember(id, { status: 'suspended' });
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id: string): Promise<void> {
    try {
      const { error } = await withCircuitBreaker(() =>
        supabase.from(this.tableName)
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', id)
      );

      if (error) throw APIError.fromSupabaseError(error);
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }

  /**
   * Get member count by role
   */
  async getCountByRole(): Promise<Record<string, number>> {
    try {
      const { data, error } = await withCircuitBreaker(() =>
        supabase.from(this.tableName).select('role')
      );

      if (error) throw APIError.fromSupabaseError(error);

      const counts: Record<string, number> = { admin: 0, manager: 0, staff: 0 };
      data?.forEach((row: any) => {
        counts[row.role] = (counts[row.role] || 0) + 1;
      });

      return counts;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }
}

export const membersRepository = new MembersRepository();
export { MembersRepository };
