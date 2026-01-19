/**
 * Platform-agnostic database adapter interface
 *
 * This interface abstracts the underlying database implementation (Dexie for web/IndexedDB,
 * SQLite for Electron/Capacitor) to provide a unified API for data operations.
 *
 * Design principles:
 * - All methods return Promises for consistency (even if underlying impl is sync)
 * - Generic type parameter T represents the entity type
 * - QueryOptions supports common filtering, sorting, and pagination
 */

/**
 * Query options for database operations
 */
export interface QueryOptions {
  /** Filter conditions as key-value pairs */
  where?: Record<string, unknown>;
  /** Field name to order by (prefix with '-' for descending, e.g., '-createdAt') */
  orderBy?: string;
  /** Maximum number of records to return */
  limit?: number;
  /** Number of records to skip (for pagination) */
  offset?: number;
}

/**
 * Result wrapper for paginated queries
 */
export interface QueryResult<T> {
  /** Array of matching records */
  data: T[];
  /** Total count of matching records (before pagination) */
  total: number;
}

/**
 * Platform-agnostic database adapter interface
 *
 * Implementations:
 * - DexieAdapter: Uses Dexie.js for IndexedDB (web/PWA)
 * - SQLiteAdapter: Uses better-sqlite3 (Electron) or Capacitor SQLite (mobile)
 *
 * @template T - The entity type this adapter manages
 */
export interface DatabaseAdapter<T> {
  /**
   * Find a single record by its ID
   *
   * @param id - The unique identifier
   * @returns The matching record or undefined if not found
   */
  findById(id: string): Promise<T | undefined>;

  /**
   * Find multiple records matching the query options
   *
   * @param options - Query options for filtering, sorting, and pagination
   * @returns Query result with data array and total count
   */
  findMany(options?: QueryOptions): Promise<QueryResult<T>>;

  /**
   * Create a new record
   *
   * @param data - The record data (excluding auto-generated fields like id)
   * @returns The created record with all fields populated
   */
  create(data: Omit<T, 'id'> & Partial<Pick<T, 'id' & keyof T>>): Promise<T>;

  /**
   * Update an existing record
   *
   * @param id - The unique identifier of the record to update
   * @param data - Partial data to merge with existing record
   * @returns The updated record
   */
  update(id: string, data: Partial<T>): Promise<T>;

  /**
   * Delete a record by its ID
   *
   * @param id - The unique identifier of the record to delete
   * @returns True if the record was deleted, false if it didn't exist
   */
  delete(id: string): Promise<boolean>;
}
