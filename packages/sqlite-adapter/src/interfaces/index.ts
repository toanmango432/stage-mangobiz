/**
 * Database adapter interfaces
 *
 * Platform-agnostic interfaces for abstracting database operations.
 * These interfaces allow the same API to work with both Dexie (IndexedDB)
 * and SQLite backends.
 */

export type {
  DatabaseAdapter,
  QueryOptions,
  QueryResult,
} from './DatabaseAdapter';
