import {
  Users,
  Shield,
  Store,
  UserCog,
  CheckCircle,
  Clock,
  Activity,
  RefreshCw
} from 'lucide-react';
import {
  useTenants,
  useLicenses,
  useStores,
  useMembers,
  useDevices,
  useExpiringLicenses,
} from '@/hooks/queries';

export function AdminDashboard() {
  // React Query hooks for all data
  const { data: tenants = [], isLoading: tenantsLoading, refetch: refetchTenants } = useTenants();
  const { data: licenses = [], isLoading: licensesLoading, refetch: refetchLicenses } = useLicenses();
  const { data: stores = [], isLoading: storesLoading, refetch: refetchStores } = useStores();
  const { data: members = [], isLoading: membersLoading, refetch: refetchMembers } = useMembers();
  const { data: devices = [], isLoading: devicesLoading } = useDevices();
  const { data: expiringLicenses = [] } = useExpiringLicenses(30);

  const loading = tenantsLoading || licensesLoading || storesLoading || membersLoading || devicesLoading;

  const stats = {
    tenants: tenants.length,
    licenses: {
      total: licenses.length,
      active: licenses.filter(l => l.status === 'active').length,
      expired: licenses.filter(l => l.status === 'expired').length,
      revoked: licenses.filter(l => l.status === 'revoked').length,
    },
    stores: stores.length,
    members: members.length,
    devices: devices.length,
  };

  const recentTenants = [...tenants]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const recentStores = [...stores]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const handleRefresh = () => {
    refetchTenants();
    refetchLicenses();
    refetchStores();
    refetchMembers();
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Control Center Dashboard</h1>
            <p className="text-gray-600">Overview of all Mango POS tenants, stores, and members</p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.tenants}</h3>
            <p className="text-sm text-gray-600">Total Tenants</p>
            <p className="text-xs text-gray-500 mt-2">Customers using Mango POS</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              {stats.licenses.active > 0 && (
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">
                  {stats.licenses.active} active
                </span>
              )}
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.licenses.total}</h3>
            <p className="text-sm text-gray-600">Total Licenses</p>
            <p className="text-xs text-gray-500 mt-2">
              {stats.licenses.expired} expired, {stats.licenses.revoked} revoked
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Store className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.stores}</h3>
            <p className="text-sm text-gray-600">Total Stores</p>
            <p className="text-xs text-gray-500 mt-2">POS terminals deployed</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <UserCog className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.members}</h3>
            <p className="text-sm text-gray-600">Total Members</p>
            <p className="text-xs text-gray-500 mt-2">Staff with POS access</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Tenants */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Recent Tenants</h2>
              {recentTenants.length === 0 && (
                <span className="text-sm text-gray-500">No tenants yet</span>
              )}
            </div>
            {recentTenants.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentTenants.map((tenant) => (
                      <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900">{tenant.name}</div>
                            <div className="text-sm text-gray-500">{tenant.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${
                            tenant.status === 'active' ? 'bg-green-100 text-green-700' :
                            tenant.status === 'suspended' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {tenant.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(tenant.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No tenants created yet</p>
                <p className="text-sm text-gray-400 mt-1">Tenants will appear here when created</p>
              </div>
            )}
          </div>

          {/* Expiring Licenses / Quick Stats */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                Expiring Licenses
              </h2>
            </div>
            <div className="p-6">
              {expiringLicenses.length > 0 ? (
                <div className="space-y-4">
                  {expiringLicenses.slice(0, 5).map((license) => {
                    const daysLeft = license.expiresAt
                      ? Math.ceil((new Date(license.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                      : 0;
                    return (
                      <div key={license.id} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="text-xs text-gray-600 font-mono">{license.licenseKey.slice(0, 20)}...</p>
                            <p className="text-sm font-medium text-gray-900 mt-1 capitalize">{license.tier} Plan</p>
                          </div>
                          <span className="text-xs font-bold text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                            {daysLeft}d
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-4" />
                  <p className="text-gray-500">No licenses expiring soon</p>
                  <p className="text-sm text-gray-400 mt-1">All licenses are in good standing</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Stores */}
        {recentStores.length > 0 && (
          <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Recent Stores</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Store</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Login ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentStores.map((store) => (
                    <tr key={store.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Store className="w-4 h-4 text-orange-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{store.name}</div>
                            {store.address && (
                              <div className="text-sm text-gray-500">{store.address}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {store.storeLoginId}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          store.status === 'active' ? 'bg-green-100 text-green-700' :
                          store.status === 'suspended' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {store.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {store.lastSeenAt
                          ? new Date(store.lastSeenAt).toLocaleDateString()
                          : 'Never'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* System Health */}
        <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-green-900">System Status: All Systems Operational</h3>
              <p className="text-sm text-green-700 mt-1">
                Database: Supabase • Mode: {process.env.NODE_ENV || 'development'} • Auth: Active
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">{stats.devices}</div>
              <div className="text-xs text-green-600">Devices Tracked</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
