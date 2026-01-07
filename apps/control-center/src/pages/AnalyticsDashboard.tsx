import { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Shield,
  Store,
  RefreshCcw,
  Activity,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download
} from 'lucide-react';
import {
  useTenants,
  useLicenses,
  useStores,
  useMembers,
  useDevices,
  useAuditLogs,
} from '@/hooks/queries';
import type { Tenant, License, AuditLog } from '@/types';

interface AnalyticsData {
  // Counts
  totalTenants: number;
  totalLicenses: number;
  totalStores: number;
  totalMembers: number;
  totalDevices: number;

  // License breakdown
  licensesByTier: { tier: string; count: number; color: string }[];
  licensesByStatus: { status: string; count: number; color: string }[];

  // Tenant breakdown
  tenantsByStatus: { status: string; count: number; color: string }[];

  // Growth (simulated for demo)
  recentTenants: Tenant[];
  recentLicenses: License[];
  recentActivity: AuditLog[];

  // Time-based metrics
  tenantsThisMonth: number;
  tenantsLastMonth: number;
  licensesThisMonth: number;
  licensesLastMonth: number;
}

const TIER_COLORS: Record<string, string> = {
  free: '#9CA3AF',
  basic: '#3B82F6',
  professional: '#8B5CF6',
  enterprise: '#F59E0B',
};

const STATUS_COLORS: Record<string, string> = {
  active: '#10B981',
  suspended: '#EF4444',
  churned: '#6B7280',
  expired: '#F59E0B',
  revoked: '#DC2626',
  pending: '#F59E0B',
};

export function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // React Query hooks
  const { data: tenants = [], isLoading: tenantsLoading, refetch: refetchTenants } = useTenants();
  const { data: licenses = [], isLoading: licensesLoading, refetch: refetchLicenses } = useLicenses(1000);
  const { data: stores = [], isLoading: storesLoading, refetch: refetchStores } = useStores();
  const { data: members = [], isLoading: membersLoading, refetch: refetchMembers } = useMembers();
  const { data: devices = [], isLoading: devicesLoading, refetch: refetchDevices } = useDevices();
  const { data: recentLogs = [], isLoading: logsLoading, refetch: refetchLogs } = useAuditLogs(20);

  const loading = tenantsLoading || licensesLoading || storesLoading || membersLoading || devicesLoading || logsLoading;

  const loadAnalytics = () => {
    refetchTenants();
    refetchLicenses();
    refetchStores();
    refetchMembers();
    refetchDevices();
    refetchLogs();
  };

  // Compute analytics data with useMemo
  const data = useMemo<AnalyticsData | null>(() => {
    if (loading) return null;

    // Calculate date ranges
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // License by tier
    const tierCounts = licenses.reduce((acc, l) => {
      acc[l.tier] = (acc[l.tier] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const licensesByTier = Object.entries(tierCounts).map(([tier, count]) => ({
      tier: tier.charAt(0).toUpperCase() + tier.slice(1),
      count,
      color: TIER_COLORS[tier] || '#6B7280',
    }));

    // License by status
    const statusCounts = licenses.reduce((acc, l) => {
      acc[l.status] = (acc[l.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const licensesByStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count,
      color: STATUS_COLORS[status] || '#6B7280',
    }));

    // Tenant by status
    const tenantStatusCounts = tenants.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const tenantsByStatus = Object.entries(tenantStatusCounts).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count,
      color: STATUS_COLORS[status] || '#6B7280',
    }));

    // This month vs last month
    const tenantsThisMonth = tenants.filter(t => new Date(t.createdAt) >= thisMonthStart).length;
    const tenantsLastMonth = tenants.filter(t => {
      const created = new Date(t.createdAt);
      return created >= lastMonthStart && created <= lastMonthEnd;
    }).length;

    const licensesThisMonth = licenses.filter(l => new Date(l.createdAt) >= thisMonthStart).length;
    const licensesLastMonth = licenses.filter(l => {
      const created = new Date(l.createdAt);
      return created >= lastMonthStart && created <= lastMonthEnd;
    }).length;

    return {
      totalTenants: tenants.length,
      totalLicenses: licenses.length,
      totalStores: stores.length,
      totalMembers: members.length,
      totalDevices: devices.length,
      licensesByTier,
      licensesByStatus,
      tenantsByStatus,
      recentTenants: tenants.slice(0, 5),
      recentLicenses: licenses.slice(0, 5),
      recentActivity: recentLogs,
      tenantsThisMonth,
      tenantsLastMonth,
      licensesThisMonth,
      licensesLastMonth,
    };
  }, [tenants, licenses, stores, members, devices, recentLogs, loading]);

  const calculateGrowth = (current: number, previous: number): { value: number; isPositive: boolean } => {
    if (previous === 0) return { value: current > 0 ? 100 : 0, isPositive: current > 0 };
    const growth = ((current - previous) / previous) * 100;
    return { value: Math.abs(Math.round(growth)), isPositive: growth >= 0 };
  };

  const exportData = () => {
    if (!data) return;

    const csvContent = [
      ['Metric', 'Value'],
      ['Total Tenants', data.totalTenants],
      ['Total Licenses', data.totalLicenses],
      ['Total Stores', data.totalStores],
      ['Total Members', data.totalMembers],
      ['Total Devices', data.totalDevices],
      [''],
      ['License Tier', 'Count'],
      ...data.licensesByTier.map(t => [t.tier, t.count]),
      [''],
      ['License Status', 'Count'],
      ...data.licensesByStatus.map(s => [s.status, s.count]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mango-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCcw className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8">
        <div className="text-center py-20">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Failed to load analytics</p>
        </div>
      </div>
    );
  }

  const tenantGrowth = calculateGrowth(data.tenantsThisMonth, data.tenantsLastMonth);
  const licenseGrowth = calculateGrowth(data.licensesThisMonth, data.licensesLastMonth);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600 mt-1">Platform performance and growth metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={loadAnalytics}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <RefreshCcw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <MetricCard
          title="Total Tenants"
          value={data.totalTenants}
          icon={Users}
          color="blue"
          growth={tenantGrowth}
          subtitle={`${data.tenantsThisMonth} this month`}
        />
        <MetricCard
          title="Total Licenses"
          value={data.totalLicenses}
          icon={Shield}
          color="green"
          growth={licenseGrowth}
          subtitle={`${data.licensesThisMonth} this month`}
        />
        <MetricCard
          title="Total Stores"
          value={data.totalStores}
          icon={Store}
          color="orange"
          subtitle="Active POS terminals"
        />
        <MetricCard
          title="Total Members"
          value={data.totalMembers}
          icon={Users}
          color="purple"
          subtitle="Staff accounts"
        />
        <MetricCard
          title="Total Devices"
          value={data.totalDevices}
          icon={Activity}
          color="gray"
          subtitle="Registered devices"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Licenses by Tier */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-purple-600" />
            Licenses by Tier
          </h3>
          <div className="space-y-3">
            {data.licensesByTier.length > 0 ? (
              data.licensesByTier.map((tier) => (
                <div key={tier.tier} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tier.color }}
                    />
                    <span className="text-gray-700">{tier.tier}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{tier.count}</span>
                    <span className="text-xs text-gray-500">
                      ({data.totalLicenses > 0 ? Math.round((tier.count / data.totalLicenses) * 100) : 0}%)
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No licenses yet</p>
            )}
          </div>
          {/* Simple bar visualization */}
          {data.licensesByTier.length > 0 && (
            <div className="mt-4 h-4 rounded-full overflow-hidden bg-gray-100 flex">
              {data.licensesByTier.map((tier) => (
                <div
                  key={tier.tier}
                  className="h-full transition-all"
                  style={{
                    backgroundColor: tier.color,
                    width: `${(tier.count / data.totalLicenses) * 100}%`,
                  }}
                  title={`${tier.tier}: ${tier.count}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Licenses by Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            License Status
          </h3>
          <div className="space-y-3">
            {data.licensesByStatus.length > 0 ? (
              data.licensesByStatus.map((status) => (
                <div key={status.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    <span className="text-gray-700">{status.status}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{status.count}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No licenses yet</p>
            )}
          </div>
        </div>

        {/* Tenants by Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Tenant Status
          </h3>
          <div className="space-y-3">
            {data.tenantsByStatus.length > 0 ? (
              data.tenantsByStatus.map((status) => (
                <div key={status.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {status.status === 'Active' && <CheckCircle className="w-4 h-4 text-green-500" />}
                    {status.status === 'Suspended' && <XCircle className="w-4 h-4 text-red-500" />}
                    {status.status === 'Churned' && <AlertCircle className="w-4 h-4 text-gray-500" />}
                    <span className="text-gray-700">{status.status}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{status.count}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No tenants yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-2 gap-6">
        {/* Recent Signups */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Recent Tenant Signups
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {data.recentTenants.length > 0 ? (
              data.recentTenants.map((tenant) => (
                <div key={tenant.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">{tenant.name}</p>
                    <p className="text-sm text-gray-500">{tenant.email}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      tenant.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {tenant.status}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">No tenants yet</div>
            )}
          </div>
        </div>

        {/* Audit Log Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Recent Activity
            </h3>
          </div>
          <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
            {data.recentActivity.length > 0 ? (
              data.recentActivity.map((log) => (
                <div key={log.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      log.action.includes('created') ? 'bg-green-500' :
                      log.action.includes('updated') ? 'bg-blue-500' :
                      log.action.includes('deleted') ? 'bg-red-500' :
                      'bg-gray-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium capitalize">{log.action}</span>
                        {' '}{log.entityType}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">No activity recorded</div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-8 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-purple-900">Platform Summary</h3>
            <p className="text-purple-700 mt-1">
              {data.totalTenants} businesses trust Mango POS with {data.totalStores} active stores
            </p>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">
                {data.totalLicenses > 0 ? (data.totalStores / data.totalLicenses).toFixed(1) : 0}
              </p>
              <p className="text-xs text-purple-600">Avg stores/license</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">
                {data.totalTenants > 0 ? (data.totalMembers / data.totalTenants).toFixed(1) : 0}
              </p>
              <p className="text-xs text-purple-600">Avg members/tenant</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({
  title,
  value,
  icon: Icon,
  color,
  growth,
  subtitle,
}: {
  title: string;
  value: number;
  icon: typeof Users;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'gray';
  growth?: { value: number; isPositive: boolean };
  subtitle?: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600',
    gray: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {growth && (
          <div className={`flex items-center gap-1 text-sm ${growth.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {growth.isPositive ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            <span>{growth.value}%</span>
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
      <p className="text-sm text-gray-600 mt-1">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}
