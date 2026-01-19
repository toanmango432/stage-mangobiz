/**
 * Capacitor SQLite adapter for iOS/Android
 *
 * Uses @capacitor-community/sqlite plugin for native SQLite access.
 */

import type { SQLiteAdapter, SQLiteConfig } from '../types';

/**
 * Create a Capacitor SQLite adapter
 */
export async function createCapacitorAdapter(_config: SQLiteConfig): Promise<SQLiteAdapter> {
  // TODO: Implement using @capacitor-community/sqlite
  // import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';

  throw new Error('Capacitor adapter not yet implemented. Install @capacitor-community/sqlite and implement.');
}
