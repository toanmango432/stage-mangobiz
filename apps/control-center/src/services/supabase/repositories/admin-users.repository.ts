/**
 * Admin Users Repository
 * Handles CRUD operations for Control Center admin users
 */

import { BaseRepository, QueryOptions, APIError } from './base.repository';
import { supabase, withCircuitBreaker } from '../client';
import { AdminUser } from '@/types/entities';

// Database row type (snake_case)
interface AdminUserRow {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  role: string;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

// Convert DB row to app type
function toAdminUser(row: AdminUserRow): AdminUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.password_hash,
    role: row.role as AdminUser['role'],
    isActive: row.is_active,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Convert app type to DB row
function toRow(user: Partial<AdminUser>): Partial<AdminUserRow> {
  const row: Partial<AdminUserRow> = {};
  if (user.email !== undefined) row.email = user.email;
  if (user.name !== undefined) row.name = user.name;
  if (user.passwordHash !== undefined) row.password_hash = user.passwordHash;
  if (user.role !== undefined) row.role = user.role;
  if (user.isActive !== undefined) row.is_active = user.isActive;
  if (user.lastLoginAt !== undefined) row.last_login_at = user.lastLoginAt;
  return row;
}

class AdminUsersRepository extends BaseRepository<AdminUserRow> {
  constructor() {
    super('admin_users');
  }

  /**
   * Get all admin users
   */
  async getAll(options?: QueryOptions): Promise<AdminUser[]> {
    const result = await this.findAll(options);
    return result.data.map(toAdminUser);
  }

  /**
   * Get admin user by ID
   */
  async getById(id: string): Promise<AdminUser | null> {
    const result = await this.findById(id);
    return result.data ? toAdminUser(result.data) : null;
  }

  /**
   * Get admin user by email
   */
  async getByEmail(email: string): Promise<AdminUser | null> {
    try {
      const { data, error } = await withCircuitBreaker(() =>
        supabase.from(this.tableName).select('*').eq('email', email).single()
      );

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw APIError.fromSupabaseError(error);
      }

      return data ? toAdminUser(data as AdminUserRow) : null;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }

  /**
   * Create a new admin user
   */
  async createAdminUser(data: Omit<AdminUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<AdminUser> {
    const result = await this.create(toRow(data) as any);
    return toAdminUser(result.data);
  }

  /**
   * Update an admin user
   */
  async updateAdminUser(id: string, data: Partial<AdminUser>): Promise<AdminUser> {
    const result = await this.update(id, toRow(data) as any);
    return toAdminUser(result.data);
  }

  /**
   * Deactivate an admin user
   */
  async deactivate(id: string): Promise<AdminUser> {
    return this.updateAdminUser(id, { isActive: false });
  }

  /**
   * Activate an admin user
   */
  async activate(id: string): Promise<AdminUser> {
    return this.updateAdminUser(id, { isActive: true });
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id: string): Promise<void> {
    await this.update(id, { last_login_at: new Date().toISOString() } as any);
  }
}

export const adminUsersRepository = new AdminUsersRepository();
export { AdminUsersRepository };
