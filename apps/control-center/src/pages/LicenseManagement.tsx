import { useState, useEffect } from 'react';
import {
  Shield,
  Plus,
  Key,
  Calendar,
  Store,
  CheckCircle,
  XCircle,
  Edit2,
  RefreshCw,
  X,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { licensesDB, tenantsDB, storesDB } from '@/db/supabaseDatabase';
import type { License, CreateLicenseInput, Tenant, LicenseTier } from '@/types';
import { LICENSE_TIER_CONFIG } from '../types/license';

interface LicenseWithTenant extends License {
  tenant?: Tenant;
  storeCount: number;
}

export function LicenseManagement() {
  const [licenses, setLicenses] = useState<LicenseWithTenant[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTier, setFilterTier] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLicense, setEditingLicense] = useState<LicenseWithTenant | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    expiringSoon: 0,
  });

  useEffect(() => {
    loadLicenses();
  }, []);

  async function loadLicenses() {
    setLoading(true);
    try {
      const [allLicenses, allTenants] = await Promise.all([
        licensesDB.getAll(100),
        tenantsDB.getAll(100),
      ]);

      setTenants(allTenants);

      // Map tenants to licenses and get store counts
      const licensesWithTenants: LicenseWithTenant[] = await Promise.all(
        allLicenses.map(async (license) => {
          const tenant = allTenants.find(t => t.id === license.tenantId);
          const storeCount = await storesDB.countByLicense(license.id);
          return { ...license, tenant, storeCount };
        })
      );

      setLicenses(licensesWithTenants);

      // Calculate stats
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      setStats({
        total: licensesWithTenants.length,
        active: licensesWithTenants.filter(l => l.status === 'active').length,
        expired: licensesWithTenants.filter(l => l.status === 'expired').length,
        expiringSoon: licensesWithTenants.filter(l =>
          l.status === 'active' &&
          l.expiresAt &&
          new Date(l.expiresAt) > now &&
          new Date(l.expiresAt) <= thirtyDaysFromNow
        ).length,
      });
    } catch (error) {
      console.error('Failed to load licenses:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredLicenses = licenses.filter((license) => {
    const matchesStatus = filterStatus === 'all' || license.status === filterStatus;
    const matchesTier = filterTier === 'all' || license.tier === filterTier;
    return matchesStatus && matchesTier;
  });

  const getTierBadge = (tier: string) => {
    const colors: Record<string, string> = {
      free: 'bg-gray-100 text-gray-700',
      basic: 'bg-blue-100 text-blue-700',
      professional: 'bg-purple-100 text-purple-700',
      enterprise: 'bg-orange-100 text-orange-700',
    };
    return colors[tier] || 'bg-gray-100 text-gray-700';
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      expired: 'bg-red-100 text-red-700',
      revoked: 'bg-yellow-100 text-yellow-700',
      suspended: 'bg-orange-100 text-orange-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getDaysUntilExpiry = (expiresAt?: Date) => {
    if (!expiresAt) return null;
    const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading licenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">License Management</h1>
            <p className="text-gray-600">Issue and manage customer licenses</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadLicenses}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Issue License
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">{stats.total}</span>
            </div>
            <p className="text-sm text-gray-600">Total Licenses</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <span className="text-2xl font-bold text-gray-900">{stats.active}</span>
            </div>
            <p className="text-sm text-gray-600">Active</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
              <span className="text-2xl font-bold text-gray-900">{stats.expired}</span>
            </div>
            <p className="text-sm text-gray-600">Expired</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
              <span className="text-2xl font-bold text-gray-900">{stats.expiringSoon}</span>
            </div>
            <p className="text-sm text-gray-600">Expiring Soon</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="revoked">Revoked</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tier</label>
              <select
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">All Tiers</option>
                <option value="free">Free</option>
                <option value="basic">Basic</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>
        </div>

        {/* License List */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {filteredLicenses.length === 0 ? (
            <div className="p-12 text-center">
              <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No licenses found</p>
              <p className="text-sm text-gray-400 mt-1">Issue a new license to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">License Key</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLicenses.map((license) => {
                    const daysLeft = getDaysUntilExpiry(license.expiresAt);
                    return (
                      <tr key={license.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Key className="w-4 h-4 text-gray-400" />
                            <span className="font-mono text-xs text-gray-900">{license.licenseKey}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {license.tenant ? (
                            <div>
                              <div className="font-medium text-gray-900">{license.tenant.name}</div>
                              {license.tenant.company && (
                                <div className="text-sm text-gray-500">{license.tenant.company}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">Unknown tenant</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-semibold rounded capitalize ${getTierBadge(license.tier)}`}>
                            {license.tier}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-semibold rounded capitalize ${getStatusBadge(license.status)}`}>
                            {license.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {license.expiresAt ? (
                            <div>
                              <div className="text-sm text-gray-900">
                                {new Date(license.expiresAt).toLocaleDateString()}
                              </div>
                              {daysLeft !== null && (
                                <div className={`text-xs ${
                                  daysLeft <= 0 ? 'text-red-600' :
                                  daysLeft <= 30 ? 'text-yellow-600' :
                                  'text-gray-500'
                                }`}>
                                  {daysLeft <= 0 ? 'Expired' : `${daysLeft} days left`}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">Never</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Store className="w-3 h-3" />
                              {license.storeCount}/{license.maxStores} stores
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingLicense(license);
                                setShowEditModal(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {license.status === 'expired' && (
                              <button
                                onClick={async () => {
                                  if (confirm(`Reactivate license for ${license.tenant?.name || 'this tenant'}?`)) {
                                    await licensesDB.activate(license.id);
                                    loadLicenses();
                                  }
                                }}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Reactivate"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                            )}
                            {license.status === 'active' && (
                              <button
                                onClick={async () => {
                                  if (confirm(`Revoke license for ${license.tenant?.name || 'this tenant'}?`)) {
                                    await licensesDB.revoke(license.id);
                                    loadLicenses();
                                  }
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Revoke"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create License Modal */}
        {showCreateModal && (
          <LicenseFormModal
            title="Issue New License"
            tenants={tenants}
            onClose={() => setShowCreateModal(false)}
            onSave={async (data) => {
              await licensesDB.create(data);
              setShowCreateModal(false);
              loadLicenses();
            }}
          />
        )}

        {/* Edit License Modal */}
        {showEditModal && editingLicense && (
          <LicenseFormModal
            title="Edit License"
            license={editingLicense}
            tenants={tenants}
            onClose={() => {
              setShowEditModal(false);
              setEditingLicense(null);
            }}
            onSave={async (data) => {
              await licensesDB.update(editingLicense.id, data);
              setShowEditModal(false);
              setEditingLicense(null);
              loadLicenses();
            }}
            onDelete={async () => {
              if (confirm(`Delete this license? This cannot be undone.`)) {
                await licensesDB.delete(editingLicense.id);
                setShowEditModal(false);
                setEditingLicense(null);
                loadLicenses();
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

// License Form Modal Component
interface LicenseFormModalProps {
  title: string;
  license?: License;
  tenants: Tenant[];
  onClose: () => void;
  onSave: (data: CreateLicenseInput) => Promise<void>;
  onDelete?: () => Promise<void>;
}

function LicenseFormModal({ title, license, tenants, onClose, onSave, onDelete }: LicenseFormModalProps) {
  const [formData, setFormData] = useState({
    tenantId: license?.tenantId || '',
    tier: license?.tier || 'basic' as LicenseTier,
    maxStores: license?.maxStores || LICENSE_TIER_CONFIG.basic.maxStores,
    maxDevicesPerStore: license?.maxDevicesPerStore || LICENSE_TIER_CONFIG.basic.maxDevicesPerStore,
    expiresAt: license?.expiresAt
      ? new Date(license.expiresAt).toISOString().split('T')[0]
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: license?.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update max stores/devices when tier changes
  const handleTierChange = (tier: LicenseTier) => {
    const config = LICENSE_TIER_CONFIG[tier];
    setFormData({
      ...formData,
      tier,
      maxStores: config.maxStores,
      maxDevicesPerStore: config.maxDevicesPerStore,
    });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.tenantId && !license) newErrors.tenantId = 'Tenant is required';
    if (!formData.tier) newErrors.tier = 'Tier is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const tierConfig = LICENSE_TIER_CONFIG[formData.tier];
      await onSave({
        tenantId: formData.tenantId,
        tier: formData.tier,
        maxStores: formData.maxStores,
        maxDevicesPerStore: formData.maxDevicesPerStore,
        features: tierConfig.features,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt) : undefined,
        notes: formData.notes || undefined,
      });
    } catch (error) {
      console.error('Failed to save license:', error);
      alert('Failed to save license');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Tenant Selection - only for new licenses */}
          {!license && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tenant <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.tenantId}
                onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  errors.tenantId ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select a tenant...</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name} {tenant.company ? `(${tenant.company})` : ''}
                  </option>
                ))}
              </select>
              {errors.tenantId && <p className="text-red-500 text-xs mt-1">{errors.tenantId}</p>}
            </div>
          )}

          {/* License Key (read-only for existing licenses) */}
          {license && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">License Key</label>
              <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm">
                {license.licenseKey}
              </div>
            </div>
          )}

          {/* Tier Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              License Tier <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(LICENSE_TIER_CONFIG) as LicenseTier[]).map((tier) => {
                const config = LICENSE_TIER_CONFIG[tier];
                const isSelected = formData.tier === tier;
                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => handleTierChange(tier)}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900 capitalize">{tier}</div>
                    <div className="text-sm text-gray-500">
                      ${config.price}/mo
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {config.maxStores} store{config.maxStores !== 1 ? 's' : ''} •
                      {config.maxDevicesPerStore} device{config.maxDevicesPerStore !== 1 ? 's' : ''}/store
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Limits */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Stores</label>
              <input
                type="number"
                min="1"
                value={formData.maxStores}
                onChange={(e) => setFormData({ ...formData, maxStores: parseInt(e.target.value) || 1 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Devices/Store</label>
              <input
                type="number"
                min="1"
                value={formData.maxDevicesPerStore}
                onChange={(e) => setFormData({ ...formData, maxDevicesPerStore: parseInt(e.target.value) || 1 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Expiry Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Leave empty for a license that never expires</p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Internal notes about this license..."
            />
          </div>

          {/* Features preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Included Features</label>
            <div className="flex flex-wrap gap-1">
              {LICENSE_TIER_CONFIG[formData.tier].features.map((feature) => (
                <span key={feature} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                  {feature.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50"
            >
              {saving ? 'Saving...' : license ? 'Save Changes' : 'Issue License'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
