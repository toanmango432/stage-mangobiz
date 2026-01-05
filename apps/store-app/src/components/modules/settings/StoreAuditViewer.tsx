/**
 * Store Audit Viewer
 *
 * Displays store-level audit logs for salon owners/managers.
 * Shows all significant actions performed within the store.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  User,
  CreditCard,
  Calendar,
  Ticket,
  UserCheck,
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  Clock,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { supabase } from '../../../services/supabase/client';
import { useAppSelector } from '../../../store/hooks';

// ============================================================================
// TYPES
// ============================================================================

// Database row type (matches actual schema)
interface StoreAuditLogRow {
  id: string;
  timestamp: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  context: {
    storeId?: string;
    userId?: string;
    userName?: string;
    ipAddress?: string;
    userAgent?: string;
    [key: string]: unknown;
  } | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changed_fields: string[] | null;
  metadata: Record<string, unknown> | null;
  success: boolean;
  error_message: string | null;
  store_id: string; // GENERATED column
  user_id: string | null; // GENERATED column
}

// Transformed type for display (with extracted fields)
interface StoreAuditLog {
  id: string;
  store_id: string;
  user_id: string | null;
  user_name: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  description: string | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  success: boolean;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  timestamp: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changed_fields: string[] | null;
}

// Transform database row to display format
function transformLogRow(row: StoreAuditLogRow): StoreAuditLog {
  return {
    id: row.id,
    store_id: row.store_id,
    user_id: row.user_id,
    user_name: row.context?.userName ?? null,
    action: row.action,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    description: row.description,
    severity: row.severity,
    success: row.success,
    error_message: row.error_message,
    metadata: row.metadata,
    ip_address: row.context?.ipAddress ?? null,
    user_agent: row.context?.userAgent ?? null,
    timestamp: row.timestamp,
    old_data: row.old_data,
    new_data: row.new_data,
    changed_fields: row.changed_fields,
  };
}

// ============================================================================
// CONFIG
// ============================================================================

// Action category colors and icons
const actionConfig: Record<string, { color: string; bgColor: string; icon: LucideIcon }> = {
  // Auth actions
  login: { color: 'text-green-700', bgColor: 'bg-green-100', icon: UserCheck },
  logout: { color: 'text-gray-700', bgColor: 'bg-gray-100', icon: UserCheck },

  // CRUD actions
  create: { color: 'text-blue-700', bgColor: 'bg-blue-100', icon: Sparkles },
  read: { color: 'text-gray-700', bgColor: 'bg-gray-100', icon: FileText },
  update: { color: 'text-amber-700', bgColor: 'bg-amber-100', icon: Settings },
  delete: { color: 'text-red-700', bgColor: 'bg-red-100', icon: XCircle },

  // Financial actions
  payment_process: { color: 'text-green-700', bgColor: 'bg-green-100', icon: CreditCard },
  refund: { color: 'text-orange-700', bgColor: 'bg-orange-100', icon: CreditCard },
  void: { color: 'text-red-700', bgColor: 'bg-red-100', icon: XCircle },

  // Other actions
  settings_change: { color: 'text-purple-700', bgColor: 'bg-purple-100', icon: Settings },
  permission_change: { color: 'text-indigo-700', bgColor: 'bg-indigo-100', icon: Shield },
  export: { color: 'text-cyan-700', bgColor: 'bg-cyan-100', icon: FileText },
  import: { color: 'text-cyan-700', bgColor: 'bg-cyan-100', icon: FileText },
};

const entityTypeConfig: Record<string, { label: string; icon: LucideIcon }> = {
  client: { label: 'Client', icon: User },
  appointment: { label: 'Appointment', icon: Calendar },
  ticket: { label: 'Ticket', icon: Ticket },
  transaction: { label: 'Transaction', icon: CreditCard },
  staff: { label: 'Staff', icon: UserCheck },
  service: { label: 'Service', icon: Sparkles },
  store: { label: 'Store', icon: Settings },
  member: { label: 'Team Member', icon: User },
  settings: { label: 'Settings', icon: Settings },
  user: { label: 'User', icon: User },
};

const severityConfig: Record<string, { color: string; bgColor: string; label: string }> = {
  low: { color: 'text-gray-600', bgColor: 'bg-gray-100', label: 'Low' },
  medium: { color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Medium' },
  high: { color: 'text-orange-600', bgColor: 'bg-orange-100', label: 'High' },
  critical: { color: 'text-red-600', bgColor: 'bg-red-100', label: 'Critical' },
};

const actionLabels: Record<string, string> = {
  login: 'Login',
  logout: 'Logout',
  create: 'Created',
  read: 'Viewed',
  update: 'Updated',
  delete: 'Deleted',
  payment_process: 'Payment Processed',
  refund: 'Refund Issued',
  void: 'Voided',
  settings_change: 'Settings Changed',
  permission_change: 'Permissions Changed',
  export: 'Exported',
  import: 'Imported',
};

// ============================================================================
// COMPONENT
// ============================================================================

interface StoreAuditViewerProps {
  onBack?: () => void;
}

export function StoreAuditViewer({ onBack }: StoreAuditViewerProps) {
  const storeId = useAppSelector((state) => state.auth.store?.storeId);

  const [logs, setLogs] = useState<StoreAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [availableUsers, setAvailableUsers] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [actionFilter, setActionFilter] = useState<string>('');
  const [entityFilter, setEntityFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [userFilter, setUserFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('today');

  // Fetch distinct users for filter dropdown
  const fetchUsers = useCallback(async () => {
    if (!storeId) return;

    try {
      const { data } = await supabase
        .from('store_audit_logs')
        .select('context')
        .eq('store_id', storeId)
        .not('context', 'is', null);

      if (data) {
        const users = [...new Set(
          data
            .map(row => (row.context as any)?.userName)
            .filter((name): name is string => !!name)
        )].sort();
        setAvailableUsers(users);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  }, [storeId]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Fetch logs - handles both filtered view and global search
  const fetchLogs = useCallback(async () => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('store_audit_logs')
        .select('*')
        .eq('store_id', storeId)
        .order('timestamp', { ascending: false })
        .limit(500);

      // If searching, ignore other filters and search all logs
      if (searchQuery.trim()) {
        setIsSearching(true);
        // Use ilike for case-insensitive search on description
        query = query.or(`description.ilike.%${searchQuery}%,action.ilike.%${searchQuery}%,entity_type.ilike.%${searchQuery}%`);
      } else {
        setIsSearching(false);

        // Apply date filter
        const now = new Date();
        if (dateFilter === 'today') {
          const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          query = query.gte('timestamp', startOfDay.toISOString());
        } else if (dateFilter === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          query = query.gte('timestamp', weekAgo.toISOString());
        } else if (dateFilter === 'month') {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          query = query.gte('timestamp', monthAgo.toISOString());
        }

        // Apply action filter
        if (actionFilter) {
          query = query.eq('action', actionFilter);
        }

        // Apply entity filter
        if (entityFilter) {
          query = query.eq('entity_type', entityFilter);
        }

        // Apply severity filter
        if (severityFilter) {
          query = query.eq('severity', severityFilter);
        }

        // Apply user filter (search in context JSONB)
        if (userFilter) {
          query = query.eq('context->>userName', userFilter);
        }
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      // Transform database rows to display format
      const transformedLogs = (data as StoreAuditLogRow[] || []).map(transformLogRow);
      setLogs(transformedLogs);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  }, [storeId, dateFilter, actionFilter, entityFilter, severityFilter, userFilter, searchQuery]);

  // Debounce search to avoid too many requests
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, searchQuery ? 300 : 0); // Debounce search, immediate for filter changes

    return () => clearTimeout(timer);
  }, [fetchLogs]);

  // Display logs (no client-side filtering needed since search is server-side now)
  const filteredLogs = logs;

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get action display info
  const getActionInfo = (action: string) => {
    return actionConfig[action] || { color: 'text-gray-700', bgColor: 'bg-gray-100', icon: FileText };
  };

  // Get entity display info
  const getEntityInfo = (entityType: string) => {
    return entityTypeConfig[entityType] || { label: entityType, icon: FileText };
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
          )}
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-900">Activity Log</h1>
            <p className="text-sm text-gray-500">View all store activity and actions</p>
          </div>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="mt-4 flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search all logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isSearching ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
              }`}
            />
          </div>

          {/* Date Filter - disabled when searching */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            disabled={isSearching}
            className={`px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isSearching ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>

          {/* Toggle Advanced Filters */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            disabled={isSearching}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${
              isSearching ? 'opacity-50 cursor-not-allowed border-gray-200 text-gray-400' :
              showFilters ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Search indicator */}
        {isSearching && (
          <div className="mt-2 text-sm text-blue-600 flex items-center gap-2">
            <Search className="w-4 h-4" />
            Searching all logs (filters disabled)
          </div>
        )}

        {/* Advanced Filters */}
        {showFilters && !isSearching && (
          <div className="mt-3 flex flex-wrap gap-3 pt-3 border-t border-gray-100">
            {/* User Filter */}
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Users</option>
              {availableUsers.map((user) => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>

            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Actions</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="payment_process">Payment</option>
              <option value="refund">Refund</option>
              <option value="void">Void</option>
            </select>

            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="client">Client</option>
              <option value="appointment">Appointment</option>
              <option value="ticket">Ticket</option>
              <option value="transaction">Transaction</option>
              <option value="staff">Staff</option>
              <option value="member">Team Member</option>
              <option value="store">Store</option>
            </select>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Severity</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>

            {(actionFilter || entityFilter || severityFilter || userFilter) && (
              <button
                onClick={() => {
                  setActionFilter('');
                  setEntityFilter('');
                  setSeverityFilter('');
                  setUserFilter('');
                }}
                className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {!storeId ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <AlertTriangle className="w-12 h-12 mb-4 text-amber-400" />
            <p className="text-lg font-medium">Store not available</p>
            <p className="text-sm">Please log in to view activity logs</p>
          </div>
        ) : error ? (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mb-4 text-gray-300" />
            <p className="text-lg font-medium">No activity logs found</p>
            <p className="text-sm">Activity will appear here as actions are performed</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredLogs.map((log) => {
              const actionInfo = getActionInfo(log.action);
              const entityInfo = getEntityInfo(log.entity_type);
              const severityInfo = severityConfig[log.severity] || severityConfig.low;
              const ActionIcon = actionInfo.icon;
              const EntityIcon = entityInfo.icon;
              const isExpanded = expandedLogId === log.id;

              return (
                <div
                  key={log.id}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors"
                >
                  {/* Main Row */}
                  <button
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    className="w-full p-4 flex items-center gap-4 text-left"
                  >
                    {/* Action Icon */}
                    <div className={`w-10 h-10 ${actionInfo.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <ActionIcon className={`w-5 h-5 ${actionInfo.color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900">
                          {actionLabels[log.action] || log.action}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 ${entityInfo.label ? 'bg-gray-100' : ''} rounded text-xs text-gray-600`}>
                          <EntityIcon className="w-3 h-3" />
                          {entityInfo.label}
                        </span>
                        {log.severity !== 'low' && (
                          <span className={`px-2 py-0.5 ${severityInfo.bgColor} ${severityInfo.color} rounded text-xs font-medium`}>
                            {severityInfo.label}
                          </span>
                        )}
                        {!log.success && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                            Failed
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate mt-0.5">
                        {log.description || `${actionLabels[log.action] || log.action} ${entityInfo.label}`}
                      </p>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                      {log.user_name && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                          <User className="w-4 h-4" />
                          <span>{log.user_name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-sm text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>{formatTimestamp(log.timestamp)}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">ID</span>
                          <p className="font-mono text-xs text-gray-700 truncate">{log.id}</p>
                        </div>
                        {log.entity_id && (
                          <div>
                            <span className="text-gray-500">Entity ID</span>
                            <p className="font-mono text-xs text-gray-700 truncate">{log.entity_id}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">Status</span>
                          <p className={`flex items-center gap-1 ${log.success ? 'text-green-600' : 'text-red-600'}`}>
                            {log.success ? (
                              <><CheckCircle className="w-4 h-4" /> Success</>
                            ) : (
                              <><XCircle className="w-4 h-4" /> Failed</>
                            )}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Timestamp</span>
                          <p className="text-gray-700">
                            {new Date(log.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {log.error_message && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <span className="text-sm font-medium text-red-700">Error:</span>
                          <p className="text-sm text-red-600 mt-1">{log.error_message}</p>
                        </div>
                      )}

                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="mt-3">
                          <span className="text-sm text-gray-500">Additional Details</span>
                          <pre className="mt-1 p-3 bg-gray-100 rounded-lg text-xs text-gray-700 overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Results Count */}
        {!loading && filteredLogs.length > 0 && (
          <div className="mt-4 text-center text-sm text-gray-500">
            Showing {filteredLogs.length} of {logs.length} logs
          </div>
        )}
      </div>
    </div>
  );
}

export default StoreAuditViewer;
