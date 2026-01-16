/**
 * Electron SQLite adapter using better-sqlite3
 *
 * better-sqlite3 is synchronous and runs in the main process.
 * This adapter wraps it in async functions for consistency.
 */

import type { SQLiteAdapter, SQLiteConfig, SQLiteValue } from '../types';

/**
 * Create an Electron SQLite adapter
 */
export async function createElectronAdapter(config: SQLiteConfig): Promise<SQLiteAdapter> {
  // TODO: Implement using better-sqlite3
  // const Database = require('better-sqlite3');
  // const db = new Database(`${config.dbName}.db`);

  throw new Error('Electron adapter not yet implemented. Install better-sqlite3 and implement.');
}
