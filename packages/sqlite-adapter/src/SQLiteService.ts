/**
 * SQLite Service Manager
 *
 * Singleton that manages the SQLite adapter and provides access to entity services.
 */

import type { SQLiteAdapter, SQLiteConfig } from './types';
import { createSQLiteAdapter } from './factory';
// import { runMigrations } from './migrations';
// import { ClientSQLiteService } from './services/clientService';

export class SQLiteService {
  private adapter: SQLiteAdapter | null = null;
  // private _clients: ClientSQLiteService | null = null;

  /**
   * Initialize the SQLite service
   */
  async initialize(config?: Partial<SQLiteConfig>): Promise<void> {
    if (this.adapter) {
      console.warn('[SQLiteService] Already initialized');
      return;
    }

    // Create platform-appropriate adapter
    this.adapter = await createSQLiteAdapter(config);

    // Run migrations
    // await runMigrations(this.adapter, ALL_MIGRATIONS);

    // Initialize entity services
    // this._clients = new ClientSQLiteService(this.adapter);

    console.log('[SQLiteService] Initialized successfully');
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    if (this.adapter) {
      await this.adapter.close();
      this.adapter = null;
      // this._clients = null;
    }
  }

  /**
   * Check if the service is initialized
   */
  get isInitialized(): boolean {
    return this.adapter !== null;
  }

  /**
   * Get the raw adapter for advanced operations
   */
  getAdapter(): SQLiteAdapter {
    if (!this.adapter) {
      throw new Error('SQLiteService not initialized. Call initialize() first.');
    }
    return this.adapter;
  }

  // Entity service getters will be added as services are implemented
  // get clients(): ClientSQLiteService { ... }
  // get tickets(): TicketSQLiteService { ... }
  // get staff(): StaffSQLiteService { ... }
}

// Singleton instance
let instance: SQLiteService | null = null;

/**
 * Get the singleton SQLiteService instance
 */
export function getSQLiteService(): SQLiteService {
  if (!instance) {
    instance = new SQLiteService();
  }
  return instance;
}

/**
 * Initialize SQLite and return the service instance
 */
export async function initializeSQLite(config?: Partial<SQLiteConfig>): Promise<SQLiteService> {
  const service = getSQLiteService();
  await service.initialize(config);
  return service;
}
