/**
 * Migration Progress Modal
 *
 * Displays progress during Dexie to SQLite data migration on first SQLite-enabled run.
 * Shows per-table progress and overall completion percentage.
 *
 * Features:
 * - Progress bar with percentage
 * - Current table being migrated
 * - Record count (current / total)
 * - Error handling with retry option
 * - Skip option to continue with Dexie
 *
 * @module store-app/components/MigrationProgress
 */

import { useState, useCallback } from 'react';
import { AlertTriangle, Database, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import type { MigrationProgressInfo } from '@/services/migrationService';

interface MigrationProgressProps {
  /** Called when migration starts */
  onStart: () => Promise<{ success: boolean; error?: string }>;
  /** Called when user skips migration */
  onSkip: () => void;
  /** Called when migration completes (success or after user acknowledges failure) */
  onComplete: (success: boolean) => void;
}

type MigrationPhase = 'initial' | 'migrating' | 'success' | 'error';

export function MigrationProgress({ onStart, onSkip, onComplete }: MigrationProgressProps) {
  const [phase, setPhase] = useState<MigrationPhase>('initial');
  const [progress, setProgress] = useState<MigrationProgressInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStartMigration = useCallback(async () => {
    setPhase('migrating');
    setError(null);

    // The onStart callback should set progress via the callback in migrationService
    const result = await onStart();

    if (result.success) {
      setPhase('success');
    } else {
      setPhase('error');
      setError(result.error || 'Migration failed. You can retry or continue with IndexedDB.');
    }
  }, [onStart]);

  const handleRetry = useCallback(() => {
    handleStartMigration();
  }, [handleStartMigration]);

  const handleSkip = useCallback(() => {
    onSkip();
    onComplete(false);
  }, [onSkip, onComplete]);

  const handleContinue = useCallback(() => {
    onComplete(phase === 'success');
  }, [onComplete, phase]);

  // Expose progress setter for parent component
  // This is called via the migrationService progress callback
  const updateProgress = useCallback((info: MigrationProgressInfo) => {
    setProgress(info);
  }, []);

  // Expose this method to parent via ref or callback pattern
  (MigrationProgress as typeof MigrationProgress & { updateProgress?: typeof updateProgress }).updateProgress = updateProgress;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-pink-500">
            <Database className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Database Migration</h2>
            <p className="text-sm text-gray-500">
              {phase === 'initial' && 'Upgrade to SQLite for better performance'}
              {phase === 'migrating' && 'Migration in progress...'}
              {phase === 'success' && 'Migration complete!'}
              {phase === 'error' && 'Migration encountered an issue'}
            </p>
          </div>
        </div>

        {/* Content based on phase */}
        {phase === 'initial' && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Your database needs to be migrated to SQLite for improved performance.
              This is a one-time operation that may take a few minutes depending on
              your data size.
            </p>
            <div className="rounded-lg bg-amber-50 p-4">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-500" />
                <div className="text-sm text-amber-700">
                  <p className="font-medium">Do not close the application</p>
                  <p>Closing during migration may cause data inconsistency.</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleStartMigration}
                className="flex-1 rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-2.5 font-medium text-white transition-opacity hover:opacity-90"
              >
                Start Migration
              </button>
              <button
                onClick={handleSkip}
                className="rounded-lg border border-gray-200 px-4 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Skip for Now
              </button>
            </div>
          </div>
        )}

        {phase === 'migrating' && (
          <div className="space-y-4">
            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">
                  {progress?.currentTable || 'Preparing...'}
                </span>
                <span className="text-gray-500">
                  {progress?.overallPercent || 0}%
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 to-pink-500 transition-all duration-300"
                  style={{ width: `${progress?.overallPercent || 0}%` }}
                />
              </div>
              {progress && (
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    Table {progress.tablesCompleted + 1} of {progress.totalTables}
                  </span>
                  <span>
                    {progress.currentTableProgress.toLocaleString()} / {progress.currentTableTotal.toLocaleString()} records
                  </span>
                </div>
              )}
            </div>

            {/* Spinner */}
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>

            <p className="text-center text-sm text-gray-500">
              Please wait while your data is being migrated...
            </p>
          </div>
        )}

        {phase === 'success' && (
          <div className="space-y-4">
            <div className="flex flex-col items-center py-4">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-center text-gray-600">
                Your data has been successfully migrated to SQLite.
                You will now enjoy improved performance and reliability.
              </p>
            </div>
            <button
              onClick={handleContinue}
              className="w-full rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-2.5 font-medium text-white transition-opacity hover:opacity-90"
            >
              Continue to App
            </button>
          </div>
        )}

        {phase === 'error' && (
          <div className="space-y-4">
            <div className="flex flex-col items-center py-4">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <p className="text-center text-gray-600">
                {error}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-600">
                You can retry the migration or continue using IndexedDB.
                Your data is safe in either case.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRetry}
                className="flex-1 rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-2.5 font-medium text-white transition-opacity hover:opacity-90"
              >
                Retry Migration
              </button>
              <button
                onClick={handleSkip}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Continue with IndexedDB
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Export progress update type for use in App.tsx
export type { MigrationProgressInfo };
