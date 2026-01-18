/**
 * Schema Types for SQLite Services
 *
 * Defines the type system for table schemas used by BaseSQLiteService.
 * Provides type-safe column definitions with automatic type conversion.
 *
 * @module sqlite-adapter/schema/types
 */

/**
 * Column type for automatic conversion between JavaScript and SQLite
 *
 * - 'string': Direct string mapping (TEXT in SQLite)
 * - 'number': Numeric values (INTEGER or REAL in SQLite)
 * - 'boolean': Boolean to 0/1 conversion (INTEGER in SQLite)
 * - 'json': Object/array to JSON string conversion (TEXT in SQLite)
 * - 'date': Date/string to ISO string conversion (TEXT in SQLite)
 */
export type ColumnType = 'string' | 'number' | 'boolean' | 'json' | 'date';

/**
 * Column definition with type information for automatic conversion
 *
 * @example
 * const isBlockedColumn: ColumnSchema = {
 *   name: 'isBlocked',
 *   dbColumn: 'is_blocked',
 *   type: 'boolean',
 *   defaultValue: false,
 * };
 */
export interface ColumnSchema {
  /** JavaScript property name (camelCase) */
  name: string;
  /** SQLite column name (snake_case) */
  dbColumn: string;
  /** Column type for automatic conversion */
  type: ColumnType;
  /** Default value when reading null/undefined from database */
  defaultValue?: unknown;
  /** Whether this column is nullable (affects conversion) */
  nullable?: boolean;
}

/**
 * Simplified column mapping for BaseSQLiteService compatibility
 *
 * Can be either:
 * - A string: direct column name mapping with 'string' type
 * - A ColumnDefinition object: full column definition with type
 *
 * @example
 * columns: {
 *   id: 'id',                                    // String shorthand
 *   storeId: 'store_id',                         // String shorthand
 *   isBlocked: { column: 'is_blocked', type: 'boolean' }, // Full definition
 *   preferences: { column: 'preferences', type: 'json', defaultValue: {} },
 * }
 */
export interface ColumnDefinition {
  /** SQLite column name (snake_case) */
  column: string;
  /** Column type for automatic conversion */
  type: ColumnType;
  /** Default value when reading null/undefined from database */
  defaultValue?: unknown;
}

/**
 * Column mapping type used in TableSchema
 * Can be a simple string or full ColumnDefinition
 */
export type ColumnMapping = string | ColumnDefinition;

/**
 * Table schema configuration for SQLite services
 *
 * Defines the structure of a table including:
 * - Table name in the database
 * - Primary key column
 * - Column mappings from JavaScript properties to SQLite columns
 *
 * @example
 * const clientSchema: TableSchema = {
 *   tableName: 'clients',
 *   primaryKey: 'id',
 *   columns: {
 *     id: 'id',
 *     storeId: 'store_id',
 *     firstName: 'first_name',
 *     lastName: 'last_name',
 *     isBlocked: { column: 'is_blocked', type: 'boolean' },
 *     preferences: { column: 'preferences', type: 'json', defaultValue: {} },
 *     createdAt: { column: 'created_at', type: 'date' },
 *   },
 * };
 */
export interface TableSchema {
  /** Table name in the database (snake_case) */
  tableName: string;
  /** Primary key property name (JavaScript camelCase, not DB column) */
  primaryKey: string;
  /** Column mappings: jsPropertyName -> columnName or ColumnDefinition */
  columns: Record<string, ColumnMapping>;
}

/**
 * Extended table schema with additional metadata
 *
 * Provides additional information about the table for
 * documentation, validation, and migration purposes.
 */
export interface ExtendedTableSchema extends TableSchema {
  /** Human-readable description of the table's purpose */
  description?: string;
  /** List of index names defined on this table */
  indexes?: string[];
  /** Foreign key relationships */
  foreignKeys?: ForeignKeySchema[];
  /** Dexie schema version this matches (for migration reference) */
  dexieVersion?: number;
}

/**
 * Foreign key relationship definition
 */
export interface ForeignKeySchema {
  /** Column in this table */
  column: string;
  /** Referenced table */
  referencesTable: string;
  /** Referenced column */
  referencesColumn: string;
  /** Action on delete (CASCADE, SET NULL, etc.) */
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  /** Action on update */
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
}

/**
 * Schema registry type for type-safe table lookup
 */
export type SchemaRegistry<T extends string = string> = Record<T, TableSchema>;

/**
 * Core table names used in Mango POS
 */
export type CoreTableName =
  | 'appointments'
  | 'tickets'
  | 'clients'
  | 'staff'
  | 'services'
  | 'transactions';

/**
 * Infrastructure table names
 */
export type InfrastructureTableName = 'settings' | 'syncQueue' | 'deviceSettings';

/**
 * All table names supported by the SQLite adapter
 */
export type AllTableName = CoreTableName | InfrastructureTableName;
