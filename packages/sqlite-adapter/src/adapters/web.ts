/**
 * Web SQLite adapter using wa-sqlite with OPFS
 *
 * wa-sqlite compiles SQLite to WebAssembly and can use
 * Origin Private File System (OPFS) for persistent storage.
 */

import type { SQLiteAdapter, SQLiteConfig } from '../types';

/**
 * Create a Web SQLite adapter
 */
export async function createWebAdapter(_config: SQLiteConfig): Promise<SQLiteAdapter> {
  // TODO: Implement using wa-sqlite
  // Requires COOP/COEP headers for SharedArrayBuffer support

  throw new Error('Web adapter not yet implemented. Install wa-sqlite and implement.');
}
