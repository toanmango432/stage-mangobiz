/**
 * Electron SQLite adapter using better-sqlite3
 *
 * better-sqlite3 is synchronous and runs in the main process.
 * This adapter wraps it in async functions for consistency with the SQLiteAdapter interface.
 *
 * @see https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md
 */

import type Database from 'better-sqlite3';
import type { SQLiteAdapter, SQLiteConfig, SQLiteValue } from '../types';

/** Extended config with optional dbPath for Electron */
interface ElectronSQLiteConfig extends SQLiteConfig {
  /** Full path to database file (alternative to dbName) */
  dbPath?: string;
}

/**
 * Create an Electron SQLite adapter using better-sqlite3
 *
 * @param config - SQLite configuration
 * @returns Promise resolving to SQLiteAdapter implementation
 */
export async function createElectronAdapter(config: ElectronSQLiteConfig): Promise<SQLiteAdapter> {
  // Dynamic import better-sqlite3 (Electron main process only)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const BetterSqlite3 = require('better-sqlite3') as typeof Database;

  // Determine database path: use dbPath if provided, otherwise construct from dbName
  // Default to 'mango.db' if neither dbPath nor dbName is provided
  let dbPath: string;
  if (config.dbPath) {
    dbPath = config.dbPath;
  } else if (config.dbName) {
    dbPath = config.location ? `${config.location}/${config.dbName}.db` : `${config.dbName}.db`;
  } else {
    dbPath = 'mango.db';
  }

  // Open database connection
  const db = new BetterSqlite3(dbPath);

  // Enable WAL mode for better concurrency if requested
  if (config.enableWAL !== false) {
    db.pragma('journal_mode = WAL');
  }

  // Enable foreign keys if requested
  if (config.enableForeignKeys !== false) {
    db.pragma('foreign_keys = ON');
  }

  const adapter: SQLiteAdapter = {
    /**
     * Execute SQL that doesn't return results (DDL statements)
     */
    exec(sql: string): Promise<void> {
      return Promise.resolve().then(() => {
        db.exec(sql);
      });
    },

    /**
     * Execute SQL with parameters, returning changes and last insert rowid
     */
    run(sql: string, params?: SQLiteValue[]): Promise<{ changes: number; lastInsertRowid: number }> {
      return Promise.resolve().then(() => {
        const stmt = db.prepare(sql);
        const result = params ? stmt.run(...params) : stmt.run();
        return {
          changes: result.changes,
          lastInsertRowid: Number(result.lastInsertRowid),
        };
      });
    },

    /**
     * Get a single row from query
     */
    get<T>(sql: string, params?: SQLiteValue[]): Promise<T | undefined> {
      return Promise.resolve().then(() => {
        const stmt = db.prepare(sql);
        return (params ? stmt.get(...params) : stmt.get()) as T | undefined;
      });
    },

    /**
     * Get all rows from query
     */
    all<T>(sql: string, params?: SQLiteValue[]): Promise<T[]> {
      return Promise.resolve().then(() => {
        const stmt = db.prepare(sql);
        return (params ? stmt.all(...params) : stmt.all()) as T[];
      });
    },

    /**
     * Run multiple statements in a transaction
     *
     * better-sqlite3 transactions are synchronous, but we wrap in Promise for interface compatibility.
     * Uses manual BEGIN/COMMIT/ROLLBACK to support async operations within the transaction.
     * If fn() rejects, the transaction is rolled back.
     */
    async transaction<T>(fn: () => Promise<T>): Promise<T> {
      db.exec('BEGIN TRANSACTION');

      try {
        const result = await fn();
        db.exec('COMMIT');
        return result;
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },

    /**
     * Close database connection
     */
    close(): Promise<void> {
      return Promise.resolve().then(() => {
        db.close();
      });
    },
  };

  return adapter;
}
