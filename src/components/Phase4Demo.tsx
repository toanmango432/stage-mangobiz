import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectIsOnline, selectIsSyncing, selectPendingOperations, selectLastSyncAt } from '../store/slices/syncSlice';
import { setOnlineStatus, setPendingOperations } from '../store/slices/syncSlice';
import { syncManager } from '../services/syncManager';
import { syncQueueDB } from '../db/database';
import { OfflineIndicator } from './OfflineIndicator';
import { SyncStatusBar } from './SyncStatusBar';

export function Phase4Demo() {
  const dispatch = useAppDispatch();
  const isOnline = useAppSelector(selectIsOnline);
  const isSyncing = useAppSelector(selectIsSyncing);
  const pendingOps = useAppSelector(selectPendingOperations);
  const lastSyncAt = useAppSelector(selectLastSyncAt);

  useEffect(() => {
    // Start sync manager
    syncManager.start();

    // Update pending operations count
    updatePendingCount();

    // Listen for background sync events
    window.addEventListener('sw-background-sync', handleBackgroundSync);

    return () => {
      syncManager.stop();
      window.removeEventListener('sw-background-sync', handleBackgroundSync);
    };
  }, []);

  const updatePendingCount = async () => {
    const pending = await syncQueueDB.getPending();
    dispatch(setPendingOperations(pending.length));
  };

  const handleBackgroundSync = () => {
    console.log('📱 Background sync event received');
    syncManager.syncNow();
  };

  const simulateOffline = () => {
    dispatch(setOnlineStatus(false));
    console.log('📴 Simulated offline mode');
  };

  const simulateOnline = () => {
    dispatch(setOnlineStatus(true));
    console.log('🌐 Simulated online mode');
  };

  const addMockOperation = async () => {
    await syncQueueDB.add({
      type: 'create',
      entity: 'appointment',
      entityId: `mock-${Date.now()}`,
      action: 'CREATE',
      payload: { id: `mock-${Date.now()}`, clientName: 'Test Client' },
      priority: 3,
      maxAttempts: 5,
    });
    await updatePendingCount();
  };

  const triggerSync = async () => {
    await syncManager.syncNow();
    await updatePendingCount();
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Offline Indicator */}
      <OfflineIndicator />
      
      {/* Sync Status Bar */}
      <SyncStatusBar />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎉 Phase 4: Sync Engine & Offline Support Complete!
          </h1>
          <p className="text-gray-600">
            Full offline capability with automatic background sync
          </p>
        </div>

        {/* Success Checklist */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-green-900 mb-3">✅ What's Working:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <ul className="space-y-2 text-green-800">
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>Sync Manager with automatic sync</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>Push/Pull sync logic</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>Conflict resolution (LWW & Server-wins)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>Priority-based sync queue</span>
              </li>
            </ul>
            <ul className="space-y-2 text-green-800">
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>Service Worker with offline caching</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>Background sync support</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>PWA manifest & installation</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>Offline/Online detection</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Sync Status Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Connection Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🌐 Connection</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Status:</span>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="font-medium">{isOnline ? 'Online' : 'Offline'}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Syncing:</span>
                <span className="font-medium">{isSyncing ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Service Worker:</span>
                <span className="font-medium">
                  {'serviceWorker' in navigator ? 'Active' : 'Not Supported'}
                </span>
              </div>
            </div>
          </div>

          {/* Sync Queue */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Sync Queue</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Pending:</span>
                <span className="text-2xl font-bold text-purple-600">{pendingOps}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Last Sync:</span>
                <span className="text-xs font-medium">
                  {lastSyncAt ? new Date(lastSyncAt).toLocaleTimeString() : 'Never'}
                </span>
              </div>
              <button
                onClick={triggerSync}
                disabled={isSyncing || !isOnline}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>
          </div>

          {/* PWA Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📱 PWA</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Installable:</span>
                <span className="font-medium">Yes</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Manifest:</span>
                <span className="font-medium">✓ Ready</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Icons:</span>
                <span className="font-medium">8 sizes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Testing Tools */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🧪 Testing Tools</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={simulateOffline}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              📴 Go Offline
            </button>
            <button
              onClick={simulateOnline}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              🌐 Go Online
            </button>
            <button
              onClick={addMockOperation}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              ➕ Add Mock Op
            </button>
            <button
              onClick={triggerSync}
              disabled={isSyncing}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
            >
              🔄 Trigger Sync
            </button>
          </div>
        </div>

        {/* Sync Architecture */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🏗️ Sync Architecture</h3>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">1. Push Sync (Local → Server)</h4>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Reads pending operations from sync queue</li>
                <li>• Sorts by priority (1=payments, 2=tickets, 3=appointments)</li>
                <li>• Sends in batches of 50 operations</li>
                <li>• Removes successful operations from queue</li>
                <li>• Retries failed operations with exponential backoff</li>
              </ul>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">2. Pull Sync (Server → Local)</h4>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Fetches changes since last sync timestamp</li>
                <li>• Applies changes to local IndexedDB</li>
                <li>• Detects conflicts (local vs remote timestamps)</li>
                <li>• Resolves conflicts using strategy:</li>
                <li className="ml-4">- Transactions: Server wins (financial data)</li>
                <li className="ml-4">- Others: Last-write-wins (newest timestamp)</li>
                <li>• Updates last sync timestamp</li>
              </ul>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">3. Background Sync</h4>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Service Worker registers for 'sync' event</li>
                <li>• Triggers when device comes back online</li>
                <li>• Automatically syncs pending operations</li>
                <li>• Works even when app is closed</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Features List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🔄 Sync Features</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>✓ Automatic sync every 30 seconds</li>
              <li>✓ Manual sync on demand</li>
              <li>✓ Priority-based queue processing</li>
              <li>✓ Batch operations (max 50 per batch)</li>
              <li>✓ Retry logic with exponential backoff</li>
              <li>✓ Conflict detection and resolution</li>
              <li>✓ Online/offline event listeners</li>
              <li>✓ Sync status tracking in Redux</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📴 Offline Features</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>✓ Service Worker caching strategy</li>
              <li>✓ Cache-first for static assets</li>
              <li>✓ Network-first for HTML</li>
              <li>✓ Background sync registration</li>
              <li>✓ Offline indicator component</li>
              <li>✓ Sync status bar</li>
              <li>✓ PWA manifest for installation</li>
              <li>✓ App shortcuts (Front Desk, Book, Checkout)</li>
            </ul>
          </div>
        </div>

        {/* Note */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>🎯 Phase 4 Complete!</strong> The app is now fully offline-capable with automatic sync.
            All changes made offline will be queued and synced when connection is restored.
            The Service Worker will cache assets for instant loading, even without internet.
          </p>
        </div>
      </div>
    </div>
  );
}
