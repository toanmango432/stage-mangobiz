/**
 * SQLite Migration Runner
 *
 * Manages database schema versions by tracking applied migrations
 * in a _migrations table and running pending migrations in order.
 */

import type { SQLiteAdapter } from '../types';
import type { Migration, MigrationRecord } from './types';

// Re-export types for convenience
export type { Migration, MigrationRecord } from './types';

// Export data migration types and function
export type { MigrationResult, TableMigrationResult } from './dataMigration';
export { migrateFromDexie } from './dataMigration';

// Export individual migrations
export { migration_001 } from './v001_initial_schema';
export { migration_002 } from './v002_staff_services';
export { migration_003 } from './v003_full_schema';
export { migration_004 } from './v004_infrastructure';

/**
 * Create the _migrations tracking table if it doesn't exist
 */
async function ensureMigrationsTable(db: SQLiteAdapter): Promise<void> {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    )
  `);
}

/**
 * Get the current migration version (highest applied version)
 *
 * @returns Current version number, or 0 if no migrations have been applied
 */
async function getCurrentVersion(db: SQLiteAdapter): Promise<number> {
  const result = await db.get<{ max_version: number | null }>(
    'SELECT MAX(version) as max_version FROM _migrations'
  );
  return result?.max_version ?? 0;
}

/**
 * Record a migration as applied
 */
async function recordMigration(db: SQLiteAdapter, migration: Migration): Promise<void> {
  const appliedAt = new Date().toISOString();
  await db.run(
    'INSERT INTO _migrations (version, name, applied_at) VALUES (?, ?, ?)',
    [migration.version, migration.name, appliedAt]
  );
}

/**
 * Run pending migrations in order
 *
 * Migrations are run within individual transactions for safety.
 * If a migration fails, the transaction is rolled back and an error is thrown.
 *
 * @param db - SQLite adapter instance
 * @param migrations - Array of migration definitions (must be sorted by version)
 * @throws Error if any migration fails
 *
 * @example
 * ```typescript
 * import { runMigrations, type Migration } from './migrations';
 * import { migration_001 } from './migrations/v001_initial_schema';
 * import { migration_002 } from './migrations/v002_staff_services';
 *
 * const migrations: Migration[] = [migration_001, migration_002];
 * await runMigrations(db, migrations);
 * ```
 */
export async function runMigrations(
  db: SQLiteAdapter,
  migrations: Migration[]
): Promise<void> {
  // Ensure migrations table exists
  await ensureMigrationsTable(db);

  // Get current version
  const currentVersion = await getCurrentVersion(db);
  console.log(`[SQLite] Current migration version: ${currentVersion}`);

  // Sort migrations by version to ensure correct order
  const sortedMigrations = [...migrations].sort((a, b) => a.version - b.version);

  // Filter to pending migrations only
  const pendingMigrations = sortedMigrations.filter(m => m.version > currentVersion);

  if (pendingMigrations.length === 0) {
    console.log('[SQLite] No pending migrations');
    return;
  }

  console.log(`[SQLite] Running ${pendingMigrations.length} pending migration(s)...`);

  // Run each pending migration in order
  for (const migration of pendingMigrations) {
    console.log(`[SQLite] Running migration ${migration.version}: ${migration.name}`);

    // Run migration within a transaction for safety
    await db.transaction(async () => {
      // Apply the migration
      await migration.up(db);

      // Record the migration
      await recordMigration(db, migration);
    });

    console.log(`[SQLite] Completed migration ${migration.version}: ${migration.name}`);
  }

  console.log(`[SQLite] All migrations complete. New version: ${pendingMigrations[pendingMigrations.length - 1].version}`);
}

/**
 * Get list of applied migrations
 */
export async function getAppliedMigrations(db: SQLiteAdapter): Promise<MigrationRecord[]> {
  await ensureMigrationsTable(db);
  return db.all<MigrationRecord>('SELECT version, name, applied_at FROM _migrations ORDER BY version');
}

/**
 * Rollback the last applied migration
 *
 * @param db - SQLite adapter instance
 * @param migrations - Array of all migration definitions
 * @throws Error if no migrations to rollback or migration fails
 */
export async function rollbackLastMigration(
  db: SQLiteAdapter,
  migrations: Migration[]
): Promise<void> {
  await ensureMigrationsTable(db);

  const currentVersion = await getCurrentVersion(db);
  if (currentVersion === 0) {
    console.log('[SQLite] No migrations to rollback');
    return;
  }

  // Find the migration to rollback
  const migrationToRollback = migrations.find(m => m.version === currentVersion);
  if (!migrationToRollback) {
    throw new Error(`Migration version ${currentVersion} not found in migrations array`);
  }

  console.log(`[SQLite] Rolling back migration ${currentVersion}: ${migrationToRollback.name}`);

  await db.transaction(async () => {
    // Apply the down migration
    await migrationToRollback.down(db);

    // Remove the migration record
    await db.run('DELETE FROM _migrations WHERE version = ?', [currentVersion]);
  });

  console.log(`[SQLite] Rollback complete for migration ${currentVersion}`);
}
