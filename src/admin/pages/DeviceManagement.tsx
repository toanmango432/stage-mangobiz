import { useState, useEffect } from 'react';
import {
  Smartphone,
  RefreshCw,
  Search,
  Filter,
  MoreVertical,
  Ban,
  CheckCircle,
  Trash2,
  Monitor,
  Globe,
  Clock,
  Store,
  Shield,
  X,
  AlertTriangle
} from 'lucide-react';
import { devicesDB, storesDB, licensesDB } from '../db/database';
import type { Device, Store as StoreType, License } from '../types';

export function DeviceManagement() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [stores, setStores] = useState<Map<string, StoreType>>(new Map());
  const [licenses, setLicenses] = useState<Map<string, License>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterStore, setFilterStore] = useState<string>('all');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [allDevices, allStores, allLicenses] = await Promise.all([
        devicesDB.getAll(200),
        storesDB.getAll(200),
        licensesDB.getAll(200),
      ]);

      setDevices(allDevices);

      const storeMap = new Map<string, StoreType>();
      allStores.forEach(s => storeMap.set(s.id, s));
      setStores(storeMap);

      const licenseMap = new Map<string, License>();
      allLicenses.forEach(l => licenseMap.set(l.id, l));
      setLicenses(licenseMap);
    } catch (error) {
      console.error('Failed to load devices:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleBlock(device: Device) {
    try {
      await devicesDB.block(device.id);
      await loadData();
      setActiveMenu(null);
    } catch (error) {
      console.error('Failed to block device:', error);
    }
  }

  async function handleUnblock(device: Device) {
    try {
      await devicesDB.unblock(device.id);
      await loadData();
      setActiveMenu(null);
    } catch (error) {
      console.error('Failed to unblock device:', error);
    }
  }

  async function handleDelete(device: Device) {
    try {
      await devicesDB.delete(device.id);
      await loadData();
      setShowDeleteConfirm(false);
      setSelectedDevice(null);
    } catch (error) {
      console.error('Failed to delete device:', error);
    }
  }

  // Filter devices
  const filteredDevices = devices.filter(device => {
    // Status filter
    if (filterStatus !== 'all' && device.status !== filterStatus) {
      return false;
    }

    // Store filter
    if (filterStore !== 'all' && device.storeId !== filterStore) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const store = stores.get(device.storeId);
      const storeName = store?.name?.toLowerCase() || '';
      const deviceName = device.name?.toLowerCase() || '';
      const platform = device.deviceInfo?.platform?.toLowerCase() || '';
      const fingerprint = device.deviceFingerprint?.toLowerCase() || '';
      const ip = device.ipAddress?.toLowerCase() || '';

      return (
        deviceName.includes(query) ||
        storeName.includes(query) ||
        platform.includes(query) ||
        fingerprint.includes(query) ||
        ip.includes(query)
      );
    }

    return true;
  });

  // Get unique stores for filter
  const uniqueStoreIds = [...new Set(devices.map(d => d.storeId))];

  // Stats
  const stats = {
    total: devices.length,
    active: devices.filter(d => d.status === 'active').length,
    blocked: devices.filter(d => d.status === 'blocked').length,
    inactive: devices.filter(d => d.status === 'inactive').length,
  };

  function formatDate(date: Date) {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function formatTimeAgo(date: Date) {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'blocked':
        return 'bg-red-100 text-red-700';
      case 'inactive':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  function getPlatformIcon(platform: string) {
    const p = platform?.toLowerCase() || '';
    if (p.includes('win')) return 'Windows';
    if (p.includes('mac')) return 'macOS';
    if (p.includes('linux')) return 'Linux';
    if (p.includes('android')) return 'Android';
    if (p.includes('ios') || p.includes('iphone') || p.includes('ipad')) return 'iOS';
    return platform || 'Unknown';
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading devices...</p>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Device Management</h1>
            <p className="text-gray-600">Monitor and manage registered POS devices</p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600">Total Devices</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                <p className="text-sm text-gray-600">Active</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Ban className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.blocked}</p>
                <p className="text-sm text-gray-600">Blocked</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
                <p className="text-sm text-gray-600">Inactive</p>
              </div>
            </div>
          </div>
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
                  placeholder="Search devices (name, store, platform, IP...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Store Filter */}
            <select
              value={filterStore}
              onChange={(e) => setFilterStore(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">All Stores</option>
              {uniqueStoreIds.map(storeId => {
                const store = stores.get(storeId);
                return (
                  <option key={storeId} value={storeId}>
                    {store?.name || storeId}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Devices Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {filteredDevices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Store</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platform</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Seen</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredDevices.map((device) => {
                    const store = stores.get(device.storeId);
                    const license = licenses.get(device.licenseId);

                    return (
                      <tr key={device.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Monitor className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {device.name || `Device ${device.id.slice(0, 8)}`}
                              </div>
                              <div className="text-xs text-gray-500 font-mono">
                                {device.deviceFingerprint.slice(0, 16)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Store className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{store?.name || 'Unknown'}</span>
                          </div>
                          {license && (
                            <div className="flex items-center gap-1 mt-1">
                              <Shield className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500 capitalize">{license.tier}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900">
                            {getPlatformIcon(device.deviceInfo?.platform)}
                          </span>
                          {device.deviceInfo?.screenResolution && (
                            <div className="text-xs text-gray-500">
                              {device.deviceInfo.screenResolution}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(device.status)}`}>
                            {device.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(device.lastSeenAt)}
                          </div>
                          <div className="text-xs text-gray-400">
                            {formatDate(device.lastSeenAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {device.ipAddress ? (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Globe className="w-3 h-3" />
                              {device.ipAddress}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="relative">
                            <button
                              onClick={() => setActiveMenu(activeMenu === device.id ? null : device.id)}
                              className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                              <MoreVertical className="w-4 h-4 text-gray-500" />
                            </button>
                            {activeMenu === device.id && (
                              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                                {device.status === 'blocked' ? (
                                  <button
                                    onClick={() => handleUnblock(device)}
                                    className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Unblock Device
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleBlock(device)}
                                    className="w-full px-4 py-2 text-left text-sm text-orange-600 hover:bg-orange-50 flex items-center gap-2"
                                  >
                                    <Ban className="w-4 h-4" />
                                    Block Device
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setSelectedDevice(device);
                                    setShowDeleteConfirm(true);
                                    setActiveMenu(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete Device
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <Smartphone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No devices found</p>
              <p className="text-sm text-gray-400 mt-1">
                {searchQuery || filterStatus !== 'all' || filterStore !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Devices will appear here when they connect to the POS'}
              </p>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && selectedDevice && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Delete Device</h3>
                    <p className="text-sm text-gray-600">This action cannot be undone</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-6">
                  Are you sure you want to delete device "{selectedDevice.name || `Device ${selectedDevice.id.slice(0, 8)}`}"?
                  The device will need to re-register to access the POS.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setSelectedDevice(null);
                    }}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(selectedDevice)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete Device
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close menu */}
      {activeMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setActiveMenu(null)}
        />
      )}
    </div>
  );
}
