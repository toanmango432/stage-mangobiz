/**
 * Platform detection and SQLite adapter factory
 */

import type { SQLiteAdapter, SQLiteConfig } from './types';

/** Detect the current platform */
function detectPlatform(): 'electron' | 'capacitor' | 'web' {
  // Check for Electron
  if (typeof window !== 'undefined' && (window as any).electron) {
    return 'electron';
  }

  // Check for Capacitor
  if (typeof window !== 'undefined' && (window as any).Capacitor) {
    return 'capacitor';
  }

  // Default to web
  return 'web';
}

/**
 * Create a platform-appropriate SQLite adapter
 */
export async function createSQLiteAdapter(config?: Partial<SQLiteConfig>): Promise<SQLiteAdapter> {
  const platform = detectPlatform();
  const dbName = config?.dbName ?? 'mango_pos';

  console.log(`[SQLite] Creating adapter for platform: ${platform}, database: ${dbName}`);

  switch (platform) {
    case 'electron': {
      const { createElectronAdapter } = await import('./adapters/electron');
      return createElectronAdapter({ dbName, ...config });
    }
    case 'capacitor': {
      const { createCapacitorAdapter } = await import('./adapters/capacitor');
      return createCapacitorAdapter({ dbName, ...config });
    }
    case 'web':
    default: {
      const { createWebAdapter } = await import('./adapters/web');
      return createWebAdapter({ dbName, ...config });
    }
  }
}
