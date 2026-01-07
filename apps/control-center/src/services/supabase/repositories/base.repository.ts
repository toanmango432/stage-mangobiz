/**
 * Base Repository - Foundation for all data access repositories
 *
 * Features:
 * - Generic CRUD operations with TypeScript generics
 * - Standardized error handling
 * - Circuit breaker integration
 */

import { supabase, withCircuitBreaker } from '../client';

// API Error class for standardized error handling
export class APIError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'APIError';
  }

  static fromSupabaseError(error: any): APIError {
    const message = error?.message || 'Database operation failed';
    const code = error?.code || 'UNKNOWN_ERROR';
    const statusCode = error?.code === 'PGRST116' ? 404 : 500;

    return new APIError(message, code, statusCode, {
      hint: error?.hint,
      details: error?.details,
    });
  }

  static notFound(resource: string, id?: string): APIError {
    return new APIError(
      `${resource}${id ? ` with ID ${id}` : ''} not found`,
      'NOT_FOUND',
      404
    );
  }

  static badRequest(message: string): APIError {
    return new APIError(message, 'BAD_REQUEST', 400);
  }

  static unauthorized(message = 'Unauthorized'): APIError {
    return new APIError(message, 'UNAUTHORIZED', 401);
  }
}

// Query options for filtering and pagination
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

// Result wrapper for consistent return types
export interface QueryResult<T> {
  data: T;
  count?: number;
  error?: APIError;
}

/**
 * Base Repository class with generic CRUD operations
 * All repositories should extend this class
 */
export abstract class BaseRepository<T extends { id: string }> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Find all records with optional filtering
   */
  async findAll(options: QueryOptions = {}): Promise<QueryResult<T[]>> {
    try {
      let query = supabase.from(this.tableName).select('*', { count: 'exact' });

      // Apply additional filters
      if (options.filters) {
        for (const [key, value] of Object.entries(options.filters)) {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        }
      }

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy, {
          ascending: options.orderDirection !== 'desc',
        });
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error, count } = await withCircuitBreaker(() => query);

      if (error) {
        throw APIError.fromSupabaseError(error);
      }

      return {
        data: (data || []) as T[],
        count: count ?? undefined,
      };
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }

  /**
   * Find a single record by ID
   */
  async findById(id: string): Promise<QueryResult<T | null>> {
    try {
      const query = supabase.from(this.tableName).select('*').eq('id', id);

      const { data, error } = await withCircuitBreaker(() => query.single());

      if (error) {
        if (error.code === 'PGRST116') {
          return { data: null };
        }
        throw APIError.fromSupabaseError(error);
      }

      return { data: data as T };
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }

  /**
   * Find records by a specific field
   */
  async findByField(field: string, value: any, options: QueryOptions = {}): Promise<QueryResult<T[]>> {
    return this.findAll({
      ...options,
      filters: { ...options.filters, [field]: value },
    });
  }

  /**
   * Create a new record
   */
  async create(data: Partial<T>): Promise<QueryResult<T>> {
    try {
      const { data: result, error } = await withCircuitBreaker(() =>
        supabase.from(this.tableName).insert(data).select().single()
      );

      if (error) {
        throw APIError.fromSupabaseError(error);
      }

      return { data: result as T };
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }

  /**
   * Update an existing record
   */
  async update(id: string, data: Partial<T>): Promise<QueryResult<T>> {
    try {
      const query = supabase.from(this.tableName).update(data).eq('id', id);

      const { data: result, error } = await withCircuitBreaker(() =>
        query.select().single()
      );

      if (error) {
        if (error.code === 'PGRST116') {
          throw APIError.notFound(this.tableName, id);
        }
        throw APIError.fromSupabaseError(error);
      }

      return { data: result as T };
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }

  /**
   * Delete a record
   */
  async delete(id: string): Promise<{ success: boolean }> {
    try {
      const query = supabase.from(this.tableName).delete().eq('id', id);

      const { error } = await withCircuitBreaker(() => query);

      if (error) {
        throw APIError.fromSupabaseError(error);
      }

      return { success: true };
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }

  /**
   * Upsert a record (insert or update)
   */
  async upsert(data: Partial<T>): Promise<QueryResult<T>> {
    try {
      const { data: result, error } = await withCircuitBreaker(() =>
        supabase.from(this.tableName).upsert(data).select().single()
      );

      if (error) {
        throw APIError.fromSupabaseError(error);
      }

      return { data: result as T };
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }

  /**
   * Count records matching criteria
   */
  async count(filters?: Record<string, any>): Promise<number> {
    try {
      let query = supabase.from(this.tableName).select('*', { count: 'exact', head: true });

      // Apply additional filters
      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        }
      }

      const { count, error } = await withCircuitBreaker(() => query);

      if (error) {
        throw APIError.fromSupabaseError(error);
      }

      return count ?? 0;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }
}

export type { QueryResult, QueryOptions };
