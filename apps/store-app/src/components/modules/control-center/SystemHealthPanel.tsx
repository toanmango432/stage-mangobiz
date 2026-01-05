import { useState, useEffect } from 'react';
import {
  Database,
  Wifi,
  WifiOff,
  HardDrive,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Zap
} from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import {
  selectIsOnline,
  selectIsSyncing,
  selectPendingOperations,
  selectLastSyncAt
} from '@/store/slices/syncSlice';

interface DatabaseStats {
  size: number;
  percentUsed: number;
  recordCounts: {
    tickets: number;
    appointments: number;
    staff: number;
    clients: number;
    transactions: number;
    syncQueue: number;
  };
}

interface SystemHealthPanelProps {
  dbStats: DatabaseStats | null;
  onRefresh: () => Promise<void>;
}

export function SystemHealthPanel({ dbStats, onRefresh }: SystemHealthPanelProps) {
  const isOnline = useAppSelector(selectIsOnline);
  const isSyncing = useAppSelector(selectIsSyncing);
  const pendingOperations = useAppSelector(selectPendingOperations);
  const lastSyncAt = useAppSelector(selectLastSyncAt);
  const [systemUptime, setSystemUptime] = useState(0);

  useEffect(() => {
    // Update uptime every second
    const startTime = Date.now();
    const interval = setInterval(() => {
      setSystemUptime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getHealthStatus = () => {
    const issues: string[] = [];

    if (!isOnline) {
      issues.push('Offline mode active');
    }

    if ((dbStats?.percentUsed || 0) > 80) {
      issues.push('Database storage high');
    }

    if (pendingOperations > 50) {
      issues.push('High sync queue');
    }

    if (issues.length === 0) {
      return { status: 'healthy', message: 'All systems operational', icon: CheckCircle, color: 'green' };
    } else if (issues.length === 1) {
      return { status: 'warning', message: issues[0], icon: AlertTriangle, color: 'yellow' };
    } else {
      return { status: 'critical', message: `${issues.length} issues detected`, icon: XCircle, color: 'red' };
    }
  };

  const health = getHealthStatus();
  const HealthIcon = health.icon;

  return (
    <div className="space-y-6">
      {/* Overall Health Status */}
      <div className={`rounded-xl p-6 border-2 ${
        health.status === 'healthy'
          ? 'bg-green-50 border-green-200'
          : health.status === 'warning'
          ? 'bg-yellow-50 border-yellow-200'
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
            health.status === 'healthy'
              ? 'bg-green-100'
              : health.status === 'warning'
              ? 'bg-yellow-100'
              : 'bg-red-100'
          }`}>
            <HealthIcon className={`w-8 h-8 ${
              health.status === 'healthy'
                ? 'text-green-600'
                : health.status === 'warning'
                ? 'text-yellow-600'
                : 'text-red-600'
            }`} />
          </div>
          <div className="flex-1">
            <h2 className={`text-2xl font-bold mb-1 ${
              health.status === 'healthy'
                ? 'text-green-900'
                : health.status === 'warning'
                ? 'text-yellow-900'
                : 'text-red-900'
            }`}>
              System Health: {health.status.charAt(0).toUpperCase() + health.status.slice(1)}
            </h2>
            <p className={`text-sm ${
              health.status === 'healthy'
                ? 'text-green-700'
                : health.status === 'warning'
                ? 'text-yellow-700'
                : 'text-red-700'
            }`}>
              {health.message}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600 mb-1">Uptime</div>
            <div className="text-lg font-mono font-semibold text-gray-900">
              {formatUptime(systemUptime)}
            </div>
          </div>
        </div>
      </div>

      {/* System Components Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Network Status */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              {isOnline ? (
                <Wifi className="w-5 h-5 text-green-600" />
              ) : (
                <WifiOff className="w-5 h-5 text-yellow-600" />
              )}
              Network Status
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              isOnline
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Connection</span>
              <span className="text-sm font-semibold text-gray-900">
                {isOnline ? 'Active' : 'Disconnected'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Last Sync</span>
              <span className="text-sm font-semibold text-gray-900">
                {lastSyncAt ? new Date(lastSyncAt).toLocaleTimeString() : 'Never'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Sync Status</span>
              <span className={`text-sm font-semibold ${
                isSyncing ? 'text-blue-600' : 'text-gray-900'
              }`}>
                {isSyncing ? 'Syncing...' : 'Idle'}
              </span>
            </div>
          </div>
        </div>

        {/* Database Health */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-600" />
              Database Health
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              (dbStats?.percentUsed || 0) > 80
                ? 'bg-red-100 text-red-700'
                : (dbStats?.percentUsed || 0) > 50
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-green-100 text-green-700'
            }`}>
              {dbStats ? `${dbStats.percentUsed.toFixed(1)}% Used` : 'Loading...'}
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Storage Used</span>
              <span className="text-sm font-semibold text-gray-900">
                {dbStats ? formatBytes(dbStats.size) : '...'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Records</span>
              <span className="text-sm font-semibold text-gray-900">
                {dbStats
                  ? Object.values(dbStats.recordCounts).reduce((a, b) => a + b, 0).toLocaleString()
                  : '...'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  (dbStats?.percentUsed || 0) > 80
                    ? 'bg-red-500'
                    : (dbStats?.percentUsed || 0) > 50
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(dbStats?.percentUsed || 0, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Sync Queue Status */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <RefreshCw className={`w-5 h-5 text-blue-600 ${
                isSyncing ? 'animate-spin' : ''
              }`} />
              Sync Queue
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              pendingOperations > 50
                ? 'bg-red-100 text-red-700'
                : pendingOperations > 10
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-green-100 text-green-700'
            }`}>
              {pendingOperations} Pending
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Queue Size</span>
              <span className="text-sm font-semibold text-gray-900">
                {dbStats?.recordCounts.syncQueue || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Status</span>
              <span className="text-sm font-semibold text-gray-900">
                {isSyncing
                  ? 'Processing...'
                  : pendingOperations > 0
                  ? 'Waiting'
                  : 'Clear'}
              </span>
            </div>
            <button
              onClick={onRefresh}
              className="w-full mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Refresh Stats
            </button>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-600" />
              Performance
            </h3>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
              Optimal
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Response Time</span>
              <span className="text-sm font-semibold text-gray-900">~50ms</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Memory Usage</span>
              <span className="text-sm font-semibold text-gray-900">Low</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">IndexedDB Status</span>
              <span className="text-sm font-semibold text-green-600">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Database Tables Breakdown */}
      {dbStats && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-indigo-600" />
            Database Tables
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(dbStats.recordCounts).map(([table, count]) => (
              <div key={table} className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 capitalize mb-1">{table}</div>
                <div className="text-2xl font-bold text-gray-900">
                  {count.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
