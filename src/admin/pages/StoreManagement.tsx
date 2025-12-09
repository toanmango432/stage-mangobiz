import { useState, useEffect } from 'react';
import {
  Store,
  Plus,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  Power,
  Eye,
  EyeOff,
  RefreshCw,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import { storesDB, tenantsDB, licensesDB } from '../db/supabaseDatabase';
import type { Store as StoreType, CreateStoreInput, Tenant, License } from '../types';

export function StoreManagement() {
  const [stores, setStores] = useState<StoreType[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreType | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [storesData, tenantsData, licensesData] = await Promise.all([
        storesDB.getAll(),
        tenantsDB.getAll(),
        licensesDB.getAll(),
      ]);
      setStores(storesData);
      setTenants(tenantsData);
      setLicenses(licensesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredStores = stores.filter(store =>
    store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.storeLoginId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTenantName = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant?.name || 'Unknown';
  };

  const getLicenseTier = (licenseId: string) => {
    const license = licenses.find(l => l.id === licenseId);
    return license?.tier || 'Unknown';
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this store?')) {
      await storesDB.delete(id);
      await loadData();
    }
    setActionMenuOpen(null);
  };

  const handleToggleStatus = async (store: StoreType) => {
    const newStatus = store.status === 'active' ? 'suspended' : 'active';
    await storesDB.update(store.id, { status: newStatus });
    await loadData();
    setActionMenuOpen(null);
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Store Management</h1>
            <p className="text-gray-600">Manage POS store instances and their login credentials</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Store
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stores..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Store className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stores.length}</p>
                <p className="text-sm text-gray-600">Total Stores</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stores.filter(s => s.status === 'active').length}
                </p>
                <p className="text-sm text-gray-600">Active</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Power className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stores.filter(s => s.status === 'suspended').length}
                </p>
                <p className="text-sm text-gray-600">Suspended</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stores Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading stores...</p>
            </div>
          ) : filteredStores.length === 0 ? (
            <div className="p-12 text-center">
              <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No stores found</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 text-orange-600 hover:text-orange-700 font-medium"
              >
                Create your first store
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Store
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Login ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    License Tier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Last Active
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStores.map((store) => (
                  <tr key={store.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Store className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{store.name}</p>
                          {store.address && (
                            <p className="text-sm text-gray-500">{store.address}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {store.storeLoginId}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {getTenantName(store.tenantId)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {getLicenseTier(store.licenseId)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        store.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : store.status === 'suspended'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {store.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {store.lastSeenAt
                        ? new Date(store.lastSeenAt).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative">
                        <button
                          onClick={() => setActionMenuOpen(actionMenuOpen === store.id ? null : store.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                          <MoreVertical className="w-5 h-5 text-gray-400" />
                        </button>
                        {actionMenuOpen === store.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                            <button
                              onClick={() => {
                                setEditingStore(store);
                                setActionMenuOpen(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Edit2 className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleStatus(store)}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Power className="w-4 h-4" />
                              {store.status === 'active' ? 'Suspend' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDelete(store.id)}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingStore) && (
        <StoreModal
          store={editingStore}
          tenants={tenants}
          licenses={licenses}
          onClose={() => {
            setShowCreateModal(false);
            setEditingStore(null);
          }}
          onSave={async () => {
            await loadData();
            setShowCreateModal(false);
            setEditingStore(null);
          }}
        />
      )}
    </div>
  );
}

// Store Modal Component
interface StoreModalProps {
  store: StoreType | null;
  tenants: Tenant[];
  licenses: License[];
  onClose: () => void;
  onSave: () => void;
}

function StoreModal({ store, tenants, licenses, onClose, onSave }: StoreModalProps) {
  const [formData, setFormData] = useState({
    name: store?.name || '',
    storeEmail: '',
    password: '',
    address: store?.address || '',
    phone: store?.phone || '',
    tenantId: store?.tenantId || '',
    licenseId: store?.licenseId || '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const filteredLicenses = formData.tenantId
    ? licenses.filter(l => l.tenantId === formData.tenantId)
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (store) {
        // Update existing store
        await storesDB.update(store.id, {
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          ...(formData.password ? { password: formData.password } : {}),
        });
      } else {
        // Create new store
        if (!formData.tenantId || !formData.licenseId) {
          setError('Please select a tenant and license');
          setSaving(false);
          return;
        }
        if (!formData.password) {
          setError('Password is required for new stores');
          setSaving(false);
          return;
        }

        const input: CreateStoreInput = {
          tenantId: formData.tenantId,
          licenseId: formData.licenseId,
          name: formData.name,
          storeEmail: formData.storeEmail || undefined,
          password: formData.password,
          address: formData.address || undefined,
          phone: formData.phone || undefined,
        };

        await storesDB.create(input);
      }

      onSave();
    } catch (err: any) {
      setError(err.message || 'Failed to save store');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {store ? 'Edit Store' : 'Create New Store'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Store Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
          </div>

          {!store && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tenant *
                </label>
                <select
                  value={formData.tenantId}
                  onChange={(e) => setFormData({ ...formData, tenantId: e.target.value, licenseId: '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a tenant...</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name} ({tenant.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License *
                </label>
                <select
                  value={formData.licenseId}
                  onChange={(e) => setFormData({ ...formData, licenseId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                  disabled={!formData.tenantId}
                >
                  <option value="">Select a license...</option>
                  {filteredLicenses.map((license) => (
                    <option key={license.id} value={license.id}>
                      {license.tier} - {license.licenseKey.slice(0, 15)}...
                    </option>
                  ))}
                </select>
                {formData.tenantId && filteredLicenses.length === 0 && (
                  <p className="text-sm text-orange-600 mt-1">
                    No licenses found for this tenant. Create a license first.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Store Email (optional)
                </label>
                <input
                  type="email"
                  value={formData.storeEmail}
                  onChange={(e) => setFormData({ ...formData, storeEmail: e.target.value })}
                  placeholder="store@example.com (or auto-generate ID)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to auto-generate a store login ID
                </p>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password {store ? '(leave empty to keep current)' : '*'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required={!store}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
            >
              {saving ? 'Saving...' : store ? 'Update Store' : 'Create Store'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
