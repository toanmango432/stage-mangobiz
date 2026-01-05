import { useState, useEffect } from 'react';
import {
  FileText,
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  User,
  Store,
  Shield,
  Users,
  Smartphone,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  Globe,
  Monitor
} from 'lucide-react';
import { auditLogsDB } from '../db/supabaseDatabase';
import type { AuditLog } from '../types';

// Action category colors and icons
const actionConfig: Record<string, { color: string; bgColor: string; icon: typeof User }> = {
  // Tenant actions
  tenant_created: { color: 'text-green-700', bgColor: 'bg-green-100', icon: Users },
  tenant_updated: { color: 'text-blue-700', bgColor: 'bg-blue-100', icon: Users },
  tenant_deleted: { color: 'text-red-700', bgColor: 'bg-red-100', icon: Users },
  tenant_suspended: { color: 'text-orange-700', bgColor: 'bg-orange-100', icon: Users },

  // License actions
  license_created: { color: 'text-green-700', bgColor: 'bg-green-100', icon: Shield },
  license_updated: { color: 'text-blue-700', bgColor: 'bg-blue-100', icon: Shield },
  license_revoked: { color: 'text-red-700', bgColor: 'bg-red-100', icon: Shield },
  license_activated: { color: 'text-green-700', bgColor: 'bg-green-100', icon: Shield },
  license_validated: { color: 'text-gray-700', bgColor: 'bg-gray-100', icon: Shield },
  license_validation_failed: { color: 'text-red-700', bgColor: 'bg-red-100', icon: Shield },

  // Store actions
  store_created: { color: 'text-green-700', bgColor: 'bg-green-100', icon: Store },
  store_updated: { color: 'text-blue-700', bgColor: 'bg-blue-100', icon: Store },
  store_deleted: { color: 'text-red-700', bgColor: 'bg-red-100', icon: Store },
  store_suspended: { color: 'text-orange-700', bgColor: 'bg-orange-100', icon: Store },
  store_login: { color: 'text-green-700', bgColor: 'bg-green-100', icon: Store },
  store_login_failed: { color: 'text-red-700', bgColor: 'bg-red-100', icon: Store },

  // Member actions
  member_login: { color: 'text-green-700', bgColor: 'bg-green-100', icon: User },
  member_login_failed: { color: 'text-red-700', bgColor: 'bg-red-100', icon: User },

  // PIN actions
  pin_login: { color: 'text-green-700', bgColor: 'bg-green-100', icon: User },
  pin_login_failed: { color: 'text-red-700', bgColor: 'bg-red-100', icon: User },

  // Device actions
  device_registered: { color: 'text-green-700', bgColor: 'bg-green-100', icon: Smartphone },
  device_blocked: { color: 'text-red-700', bgColor: 'bg-red-100', icon: Smartphone },
  device_unblocked: { color: 'text-green-700', bgColor: 'bg-green-100', icon: Smartphone },

  // Admin actions
  admin_login: { color: 'text-green-700', bgColor: 'bg-green-100', icon: Settings },
  admin_logout: { color: 'text-gray-700', bgColor: 'bg-gray-100', icon: Settings },
  admin_created: { color: 'text-green-700', bgColor: 'bg-green-100', icon: Settings },
  admin_updated: { color: 'text-blue-700', bgColor: 'bg-blue-100', icon: Settings },
  admin_deleted: { color: 'text-red-700', bgColor: 'bg-red-100', icon: Settings },
};

const entityTypeLabels: Record<string, string> = {
  tenant: 'Tenant',
  license: 'License',
  store: 'Store',
  member: 'Member',
  device: 'Device',
  admin_user: 'Admin User',
  system: 'System',
};

const actionLabels: Record<string, string> = {
  tenant_created: 'Tenant Created',
  tenant_updated: 'Tenant Updated',
  tenant_deleted: 'Tenant Deleted',
  tenant_suspended: 'Tenant Suspended',
  license_created: 'License Created',
  license_updated: 'License Updated',
  license_revoked: 'License Revoked',
  license_activated: 'License Activated',
  license_validated: 'License Validated',
  license_validation_failed: 'License Validation Failed',
  store_created: 'Store Created',
  store_updated: 'Store Updated',
  store_deleted: 'Store Deleted',
  store_suspended: 'Store Suspended',
  store_login: 'Store Login',
  store_login_failed: 'Store Login Failed',
  member_login: 'Member Login',
  member_login_failed: 'Member Login Failed',
  pin_login: 'PIN Login',
  pin_login_failed: 'PIN Login Failed',
  device_registered: 'Device Registered',
  device_blocked: 'Device Blocked',
  device_unblocked: 'Device Unblocked',
  admin_login: 'Admin Login',
  admin_logout: 'Admin Logout',
  admin_created: 'Admin Created',
  admin_updated: 'Admin Updated',
  admin_deleted: 'Admin Deleted',
};

export function AuditLogsViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterEntityType, setFilterEntityType] = useState<string>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 50;

  useEffect(() => {
    loadLogs();
  }, [page]);

  async function loadLogs() {
    setLoading(true);
    try {
      const [allLogs, count] = await Promise.all([
        auditLogsDB.getAll(pageSize, page * pageSize),
        auditLogsDB.count(),
      ]);
      setLogs(allLogs);
      setTotalCount(count);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  }

  // Filter logs based on search and filters
  const filteredLogs = logs.filter(log => {
    // Action filter
    if (filterAction !== 'all' && log.action !== filterAction) {
      return false;
    }

    // Entity type filter
    if (filterEntityType !== 'all' && log.entityType !== filterEntityType) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const actionLabel = actionLabels[log.action]?.toLowerCase() || log.action.toLowerCase();
      const entityLabel = entityTypeLabels[log.entityType]?.toLowerCase() || log.entityType.toLowerCase();
      const details = JSON.stringify(log.details || {}).toLowerCase();
      const ip = log.ipAddress?.toLowerCase() || '';
      const email = log.adminUserEmail?.toLowerCase() || '';

      return (
        actionLabel.includes(query) ||
        entityLabel.includes(query) ||
        details.includes(query) ||
        ip.includes(query) ||
        email.includes(query) ||
        log.entityId?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const uniqueActions = [...new Set(logs.map(l => l.action))];

  function formatTimestamp(date: Date) {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  function formatTimeAgo(date: Date) {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }

  function getActionIcon(action: string) {
    const config = actionConfig[action];
    if (!config) return FileText;
    return config.icon;
  }

  function getActionStyle(action: string) {
    return actionConfig[action] || { color: 'text-gray-700', bgColor: 'bg-gray-100' };
  }

  function isSuccessAction(action: string) {
    return !action.includes('failed') && !action.includes('deleted') && !action.includes('revoked') && !action.includes('blocked') && !action.includes('suspended');
  }

  if (loading && logs.length === 0) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading audit logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Audit Logs</h1>
            <p className="text-gray-600">
              Track all administrative actions and system events ({totalCount.toLocaleString()} total)
            </p>
          </div>
          <button
            onClick={loadLogs}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
          <div className="p-4 flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search logs (action, IP, email, details...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Action Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">All Actions</option>
                {uniqueActions.map(action => (
                  <option key={action} value={action}>
                    {actionLabels[action] || action}
                  </option>
                ))}
              </select>
            </div>

            {/* Entity Type Filter */}
            <select
              value={filterEntityType}
              onChange={(e) => setFilterEntityType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">All Entities</option>
              <option value="tenant">Tenants</option>
              <option value="license">Licenses</option>
              <option value="store">Stores</option>
              <option value="member">Members</option>
              <option value="device">Devices</option>
              <option value="admin_user">Admin Users</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
                <p className="text-sm text-gray-600">Total Events</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {logs.filter(l => isSuccessAction(l.action)).length}
                </p>
                <p className="text-sm text-gray-600">Success (page)</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {logs.filter(l => l.action.includes('failed')).length}
                </p>
                <p className="text-sm text-gray-600">Failed (page)</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Store className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {logs.filter(l => l.action.includes('login')).length}
                </p>
                <p className="text-sm text-gray-600">Logins (page)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {filteredLogs.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredLogs.map((log) => {
                const Icon = getActionIcon(log.action);
                const style = getActionStyle(log.action);
                const isExpanded = expandedLogId === log.id;

                return (
                  <div key={log.id} className="hover:bg-gray-50 transition-colors">
                    {/* Main Row */}
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    >
                      <div className="flex items-center gap-4">
                        {/* Icon */}
                        <div className={`w-10 h-10 ${style.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-5 h-5 ${style.color}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-sm font-semibold ${style.color}`}>
                              {actionLabels[log.action] || log.action}
                            </span>
                            <span className="text-xs text-gray-400">|</span>
                            <span className="text-xs font-medium text-gray-500 px-2 py-0.5 bg-gray-100 rounded">
                              {entityTypeLabels[log.entityType] || log.entityType}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            {log.adminUserEmail && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {log.adminUserEmail}
                              </span>
                            )}
                            {log.ipAddress && (
                              <span className="flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                {log.ipAddress}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Timestamp */}
                        <div className="text-right flex-shrink-0">
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(log.createdAt)}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {formatTimestamp(log.createdAt)}
                          </div>
                        </div>

                        {/* Expand Arrow */}
                        <div className="flex-shrink-0">
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-0">
                        <div className="bg-gray-50 rounded-lg p-4 ml-14">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500 font-medium mb-1">Event ID</p>
                              <p className="text-gray-900 font-mono text-xs">{log.id}</p>
                            </div>
                            {log.entityId && (
                              <div>
                                <p className="text-gray-500 font-medium mb-1">Entity ID</p>
                                <p className="text-gray-900 font-mono text-xs">{log.entityId}</p>
                              </div>
                            )}
                            {log.userAgent && (
                              <div className="col-span-2">
                                <p className="text-gray-500 font-medium mb-1 flex items-center gap-1">
                                  <Monitor className="w-3 h-3" />
                                  User Agent
                                </p>
                                <p className="text-gray-900 text-xs truncate">{log.userAgent}</p>
                              </div>
                            )}
                            {log.details && Object.keys(log.details).length > 0 && (
                              <div className="col-span-2">
                                <p className="text-gray-500 font-medium mb-1">Details</p>
                                <pre className="text-xs bg-white p-2 rounded border border-gray-200 overflow-x-auto">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No audit logs found</p>
              <p className="text-sm text-gray-400 mt-1">
                {searchQuery || filterAction !== 'all' || filterEntityType !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Audit logs will appear here as actions occur'}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalCount > pageSize && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {page * pageSize + 1} - {Math.min((page + 1) * pageSize, totalCount)} of {totalCount}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={(page + 1) * pageSize >= totalCount}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
