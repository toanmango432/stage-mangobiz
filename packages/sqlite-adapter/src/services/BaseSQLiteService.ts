/**
 * BaseSQLiteService - Generic base class for SQLite table services
 *
 * Provides common CRUD operations with automatic type conversion between
 * JavaScript (camelCase) and SQLite (snake_case) formats.
 *
 * @module sqlite-adapter/services/BaseSQLiteService
 */

import type { SQLiteAdapter, SQLiteValue } from '../types';
import { toISOString, boolToSQLite, sqliteToBool, safeParseJSON, toJSONString } from '../utils';

// ==================== SCHEMA TYPES ====================

/**
 * Column type for automatic conversion
 */
export type ColumnType = 'string' | 'number' | 'boolean' | 'json' | 'date';

/**
 * Column definition with type information
 */
export interface ColumnDefinition {
  /** SQLite column name (snake_case) */
  column: string;
  /** Column type for automatic conversion */
  type: ColumnType;
  /** Default value when reading null from database */
  defaultValue?: unknown;
}

/**
 * Schema configuration for a table
 *
 * Maps JavaScript property names (camelCase) to SQLite column definitions.
 * Simple string values indicate a direct 1:1 mapping with string type.
 * Object values provide full column definition with type information.
 *
 * @example
 * const clientSchema: TableSchema = {
 *   tableName: 'clients',
 *   primaryKey: 'id',
 *   columns: {
 *     id: 'id',
 *     storeId: 'store_id',
 *     firstName: 'first_name',
 *     isBlocked: { column: 'is_blocked', type: 'boolean' },
 *     preferences: { column: 'preferences', type: 'json', defaultValue: {} },
 *     createdAt: { column: 'created_at', type: 'date' },
 *   },
 * };
 */
export interface TableSchema {
  /** Table name in database */
  tableName: string;
  /** Primary key column name (app property name, not DB column) */
  primaryKey: string;
  /** Column mappings: appPropertyName -> columnName or ColumnDefinition */
  columns: Record<string, string | ColumnDefinition>;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Generate UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Convert camelCase to snake_case
 */
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Get column info from schema mapping
 */
function getColumnInfo(mapping: string | ColumnDefinition): {
  column: string;
  type: ColumnType;
  defaultValue: unknown;
} {
  if (typeof mapping === 'string') {
    return { column: mapping, type: 'string', defaultValue: undefined };
  }
  return {
    column: mapping.column,
    type: mapping.type,
    defaultValue: mapping.defaultValue,
  };
}

/**
 * Convert JavaScript value to SQLite value based on column type
 */
function toSQLiteValue(value: unknown, type: ColumnType): SQLiteValue {
  if (value === null || value === undefined) {
    return null;
  }

  switch (type) {
    case 'boolean':
      return boolToSQLite(value);
    case 'date':
      return toISOString(value);
    case 'json':
      return toJSONString(value);
    case 'number':
      return typeof value === 'number' ? value : null;
    case 'string':
    default:
      return String(value);
  }
}

/**
 * Convert SQLite value to JavaScript value based on column type
 */
function fromSQLiteValue(value: SQLiteValue, type: ColumnType, defaultValue: unknown): unknown {
  if (value === null || value === undefined) {
    return defaultValue ?? (type === 'boolean' ? undefined : defaultValue);
  }

  switch (type) {
    case 'boolean':
      return sqliteToBool(value as number | null);
    case 'date':
      // Dates are stored as ISO strings, return as-is
      return value;
    case 'json':
      return safeParseJSON(value as string, defaultValue ?? null);
    case 'number':
      return value;
    case 'string':
    default:
      return value;
  }
}

// ==================== BASE SERVICE CLASS ====================

/**
 * Generic base class for SQLite table services
 *
 * Provides standard CRUD operations with automatic type conversion.
 * Extend this class and add domain-specific query methods.
 *
 * @typeParam T - Application entity type (camelCase properties)
 * @typeParam TRow - SQLite row type (snake_case columns) - optional, defaults to Record
 *
 * @example
 * class AppointmentSQLiteService extends BaseSQLiteService<Appointment> {
 *   constructor(db: SQLiteAdapter) {
 *     super(db, appointmentSchema);
 *   }
 *
 *   async getByDateRange(storeId: string, start: string, end: string): Promise<Appointment[]> {
 *     return this.findWhere(
 *       'store_id = ? AND start_time >= ? AND start_time <= ?',
 *       [storeId, start, end]
 *     );
 *   }
 * }
 */
export class BaseSQLiteService<T extends Record<string, unknown>, TRow = Record<string, SQLiteValue>> {
  protected db: SQLiteAdapter;
  protected schema: TableSchema;

  constructor(db: SQLiteAdapter, schema: TableSchema) {
    this.db = db;
    this.schema = schema;
  }

  // ==================== CONVERSION METHODS ====================

  /**
   * Convert SQLite row to application entity
   */
  protected rowToEntity(row: TRow): T {
    const entity: Record<string, unknown> = {};

    for (const [propName, mapping] of Object.entries(this.schema.columns)) {
      const { column, type, defaultValue } = getColumnInfo(mapping);
      const rowValue = (row as Record<string, SQLiteValue>)[column];
      entity[propName] = fromSQLiteValue(rowValue, type, defaultValue);
    }

    return entity as T;
  }

  /**
   * Convert application entity to SQLite values
   */
  protected entityToRow(entity: Partial<T>): Record<string, SQLiteValue> {
    const row: Record<string, SQLiteValue> = {};

    for (const [propName, mapping] of Object.entries(this.schema.columns)) {
      if (propName in entity) {
        const { column, type } = getColumnInfo(mapping);
        row[column] = toSQLiteValue(entity[propName], type);
      }
    }

    return row;
  }

  /**
   * Get the SQLite column name for an app property
   */
  protected getColumn(propName: string): string {
    const mapping = this.schema.columns[propName];
    if (!mapping) {
      // Fall back to snake_case conversion
      return camelToSnake(propName);
    }
    return getColumnInfo(mapping).column;
  }

  /**
   * Get the primary key column name
   */
  protected getPrimaryKeyColumn(): string {
    return this.getColumn(this.schema.primaryKey);
  }

  // ==================== CRUD OPERATIONS ====================

  /**
   * Get all entities from the table
   *
   * @param limit - Maximum number of records (default 1000)
   * @param offset - Number of records to skip (default 0)
   * @returns Array of entities
   */
  async getAll(limit: number = 1000, offset: number = 0): Promise<T[]> {
    const sql = `SELECT * FROM ${this.schema.tableName} LIMIT ? OFFSET ?`;
    const rows = await this.db.all<TRow>(sql, [limit, offset]);
    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * Get entity by primary key
   *
   * @param id - Primary key value
   * @returns Entity or undefined if not found
   */
  async getById(id: string | number): Promise<T | undefined> {
    const pkColumn = this.getPrimaryKeyColumn();
    const sql = `SELECT * FROM ${this.schema.tableName} WHERE ${pkColumn} = ?`;
    const row = await this.db.get<TRow>(sql, [id as SQLiteValue]);
    return row ? this.rowToEntity(row) : undefined;
  }

  /**
   * Get entities by multiple primary keys
   *
   * @param ids - Array of primary key values
   * @returns Array of entities (order may not match input order)
   */
  async getByIds(ids: (string | number)[]): Promise<T[]> {
    if (ids.length === 0) {
      return [];
    }

    const pkColumn = this.getPrimaryKeyColumn();
    const placeholders = ids.map(() => '?').join(', ');
    const sql = `SELECT * FROM ${this.schema.tableName} WHERE ${pkColumn} IN (${placeholders})`;
    const rows = await this.db.all<TRow>(sql, ids as SQLiteValue[]);
    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * Create a new entity
   *
   * If the entity doesn't have an id, a UUID will be generated.
   * createdAt and updatedAt will be set to current time if not provided.
   *
   * @param entity - Entity to create (id, createdAt, updatedAt optional)
   * @returns Created entity with id and timestamps
   */
  async create(entity: Partial<T>): Promise<T> {
    const now = new Date().toISOString();
    const id = (entity as Record<string, unknown>)[this.schema.primaryKey] ?? generateUUID();

    // Build the entity with defaults
    const fullEntity: Record<string, unknown> = {
      ...entity,
      [this.schema.primaryKey]: id,
    };

    // Add timestamps if columns exist in schema
    if ('createdAt' in this.schema.columns && !('createdAt' in entity)) {
      fullEntity.createdAt = now;
    }
    if ('updatedAt' in this.schema.columns && !('updatedAt' in entity)) {
      fullEntity.updatedAt = now;
    }

    // Convert to row format
    const row = this.entityToRow(fullEntity as Partial<T>);
    const columns = Object.keys(row);
    const values = Object.values(row);
    const placeholders = columns.map(() => '?').join(', ');

    const sql = `INSERT INTO ${this.schema.tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
    await this.db.run(sql, values);

    // Return the full entity
    return fullEntity as T;
  }

  /**
   * Update an existing entity
   *
   * @param id - Primary key of entity to update
   * @param updates - Partial entity with fields to update
   * @returns Updated entity or undefined if not found
   */
  async update(id: string | number, updates: Partial<T>): Promise<T | undefined> {
    // First check if entity exists
    const existing = await this.getById(id);
    if (!existing) {
      return undefined;
    }

    // Build updates with timestamp
    const fullUpdates: Record<string, unknown> = { ...updates };
    if ('updatedAt' in this.schema.columns) {
      fullUpdates.updatedAt = new Date().toISOString();
    }

    // Convert to row format
    const row = this.entityToRow(fullUpdates as Partial<T>);
    const setClauses = Object.keys(row).map((col) => `${col} = ?`);
    const values = [...Object.values(row), id as SQLiteValue];

    const pkColumn = this.getPrimaryKeyColumn();
    const sql = `UPDATE ${this.schema.tableName} SET ${setClauses.join(', ')} WHERE ${pkColumn} = ?`;
    await this.db.run(sql, values);

    // Return updated entity
    return this.getById(id);
  }

  /**
   * Delete an entity by primary key
   *
   * @param id - Primary key of entity to delete
   * @returns true if entity was deleted, false if not found
   */
  async delete(id: string | number): Promise<boolean> {
    const pkColumn = this.getPrimaryKeyColumn();
    const sql = `DELETE FROM ${this.schema.tableName} WHERE ${pkColumn} = ?`;
    const result = await this.db.run(sql, [id as SQLiteValue]);
    return result.changes > 0;
  }

  /**
   * Count all entities in the table
   *
   * @returns Total count
   */
  async count(): Promise<number> {
    const sql = `SELECT COUNT(*) as count FROM ${this.schema.tableName}`;
    const result = await this.db.get<{ count: number }>(sql, []);
    return result?.count ?? 0;
  }

  // ==================== QUERY HELPERS ====================

  /**
   * Find entities matching a WHERE clause
   *
   * This is a protected helper for subclasses to implement custom queries.
   *
   * @param where - WHERE clause (without 'WHERE' keyword)
   * @param params - Query parameters
   * @param orderBy - Optional ORDER BY clause (without 'ORDER BY' keyword)
   * @param limit - Maximum number of records
   * @param offset - Number of records to skip
   * @returns Array of matching entities
   *
   * @example
   * // In a subclass:
   * async getByStoreId(storeId: string): Promise<T[]> {
   *   return this.findWhere('store_id = ?', [storeId], 'created_at DESC');
   * }
   */
  protected async findWhere(
    where: string,
    params: SQLiteValue[],
    orderBy?: string,
    limit: number = 1000,
    offset: number = 0
  ): Promise<T[]> {
    let sql = `SELECT * FROM ${this.schema.tableName} WHERE ${where}`;
    if (orderBy) {
      sql += ` ORDER BY ${orderBy}`;
    }
    sql += ` LIMIT ? OFFSET ?`;

    const rows = await this.db.all<TRow>(sql, [...params, limit, offset]);
    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * Count entities matching a WHERE clause
   *
   * @param where - WHERE clause (without 'WHERE' keyword)
   * @param params - Query parameters
   * @returns Count of matching entities
   */
  protected async countWhere(where: string, params: SQLiteValue[]): Promise<number> {
    const sql = `SELECT COUNT(*) as count FROM ${this.schema.tableName} WHERE ${where}`;
    const result = await this.db.get<{ count: number }>(sql, params);
    return result?.count ?? 0;
  }

  /**
   * Find a single entity matching a WHERE clause
   *
   * @param where - WHERE clause (without 'WHERE' keyword)
   * @param params - Query parameters
   * @returns First matching entity or undefined
   */
  protected async findOneWhere(where: string, params: SQLiteValue[]): Promise<T | undefined> {
    const sql = `SELECT * FROM ${this.schema.tableName} WHERE ${where} LIMIT 1`;
    const row = await this.db.get<TRow>(sql, params);
    return row ? this.rowToEntity(row) : undefined;
  }

  /**
   * Execute a raw query and return entities
   *
   * Use this for complex queries that can't be expressed with findWhere.
   * The query must return rows matching the table schema.
   *
   * @param sql - Full SQL query
   * @param params - Query parameters
   * @returns Array of entities
   */
  protected async rawQuery(sql: string, params: SQLiteValue[]): Promise<T[]> {
    const rows = await this.db.all<TRow>(sql, params);
    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * Execute a raw query and return a single entity
   *
   * @param sql - Full SQL query
   * @param params - Query parameters
   * @returns First matching entity or undefined
   */
  protected async rawQueryOne(sql: string, params: SQLiteValue[]): Promise<T | undefined> {
    const row = await this.db.get<TRow>(sql, params);
    return row ? this.rowToEntity(row) : undefined;
  }
}
