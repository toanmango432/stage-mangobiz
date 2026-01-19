/**
 * Schema Module for SQLite Services
 *
 * Exports types and schema registry for table definitions.
 *
 * @module sqlite-adapter/schema
 */

// Type exports
export type {
  ColumnType,
  ColumnSchema,
  ColumnDefinition,
  ColumnMapping,
  TableSchema,
  ExtendedTableSchema,
  ForeignKeySchema,
  SchemaRegistry,
  CoreTableName,
  InfrastructureTableName,
  AllTableName,
} from './types';

// Schema registry exports
export {
  // Individual table schemas
  appointmentsSchema,
  ticketsSchema,
  clientsSchema,
  staffSchema,
  servicesSchema,
  transactionsSchema,
  // Registry and helpers
  schemaRegistry,
  getSchema,
  hasSchema,
  getTableNames,
} from './registry';
