import { useState } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Eye,
  MapPin,
  Shield,
  Store,
  UserCog,
  RefreshCw,
  X,
  Trash2
} from 'lucide-react';
import {
  useTenants,
  useTenant,
  useCreateTenant,
  useUpdateTenant,
  useDeleteTenant,
  useSuspendTenant,
  useActivateTenant,
  useLicensesByTenant,
  useStoresByTenant,
  useMembersByTenant,
} from '@/hooks/queries';
import type { Tenant, CreateTenantInput, License, Store as StoreType } from '@/types';

interface TenantWithStats extends Tenant {
  licenseCount: number;
  storeCount: number;
  memberCount: number;
  activeLicense?: License;
}

export function CustomerManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

  // React Query hooks
  const { data: tenants = [], isLoading, refetch } = useTenants();

  // Filter tenants
  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch =
      tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tenant.company?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    const matchesStatus = filterStatus === 'all' || tenant.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      suspended: 'bg-red-100 text-red-700',
      inactive: 'bg-gray-100 text-gray-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getTierBadge = (tier?: string) => {
    if (!tier) return 'bg-gray-100 text-gray-700';
    const colors: Record<string, string> = {
      free: 'bg-gray-100 text-gray-700',
      basic: 'bg-blue-100 text-blue-700',
      professional: 'bg-purple-100 text-purple-700',
      enterprise: 'bg-orange-100 text-orange-700',
    };
    return colors[tier] || 'bg-gray-100 text-gray-700';
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading tenants...</p>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Tenant Management</h1>
            <p className="text-gray-600">{filteredTenants.length} tenants found</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => refetch()}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Tenant
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, or company..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tenant List */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {filteredTenants.length === 0 ? (
            <div className="p-12 text-center">
              <UserCog className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No tenants found</p>
              <p className="text-sm text-gray-400 mt-1">Create a new tenant to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{tenant.name}</div>
                          {tenant.company && (
                            <div className="text-sm text-gray-500">{tenant.company}</div>
                          )}
                          {tenant.address && (
                            <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              {tenant.address}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm text-gray-900">{tenant.email}</div>
                          {tenant.phone && (
                            <div className="text-sm text-gray-500">{tenant.phone}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded capitalize ${getStatusBadge(tenant.status)}`}>
                          {tenant.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedTenantId(tenant.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingTenant(tenant);
                              setShowEditModal(true);
                            }}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Tenant Detail Modal */}
        {selectedTenantId && (
          <TenantDetailModal
            tenantId={selectedTenantId}
            onClose={() => setSelectedTenantId(null)}
            onEdit={(tenant) => {
              setEditingTenant(tenant);
              setShowEditModal(true);
              setSelectedTenantId(null);
            }}
            getStatusBadge={getStatusBadge}
            getTierBadge={getTierBadge}
          />
        )}

        {/* Create Tenant Modal */}
        {showCreateModal && (
          <TenantFormModal
            title="Create New Tenant"
            onClose={() => setShowCreateModal(false)}
          />
        )}

        {/* Edit Tenant Modal */}
        {showEditModal && editingTenant && (
          <TenantFormModal
            title="Edit Tenant"
            tenant={editingTenant}
            onClose={() => {
              setShowEditModal(false);
              setEditingTenant(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

// Tenant Detail Modal Component
interface TenantDetailModalProps {
  tenantId: string;
  onClose: () => void;
  onEdit: (tenant: Tenant) => void;
  getStatusBadge: (status: string) => string;
  getTierBadge: (tier?: string) => string;
}

function TenantDetailModal({
  tenantId,
  onClose,
  onEdit,
  getStatusBadge,
  getTierBadge,
}: TenantDetailModalProps) {
  const { data: tenant, isLoading: tenantLoading } = useTenant(tenantId);
  const { data: licenses = [] } = useLicensesByTenant(tenantId);
  const { data: stores = [] } = useStoresByTenant(tenantId);
  const { data: members = [] } = useMembersByTenant(tenantId);

  const suspendTenant = useSuspendTenant();
  const activateTenant = useActivateTenant();

  const activeLicense = licenses.find(l => l.status === 'active');

  if (tenantLoading || !tenant) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-8">
          <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  const handleSuspendToggle = async () => {
    if (confirm(`${tenant.status === 'suspended' ? 'Activate' : 'Suspend'} ${tenant.name}?`)) {
      if (tenant.status === 'suspended') {
        activateTenant.mutate(tenant.id);
      } else {
        suspendTenant.mutate(tenant.id);
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">{tenant.name}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Badges */}
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 text-sm font-semibold rounded capitalize ${getStatusBadge(tenant.status)}`}>
              {tenant.status}
            </span>
            {activeLicense && (
              <span className={`px-3 py-1 text-sm font-semibold rounded capitalize ${getTierBadge(activeLicense.tier)}`}>
                {activeLicense.tier} Plan
              </span>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-500" />
                <span className="text-2xl font-bold">{licenses.length}</span>
              </div>
              <p className="text-sm text-gray-600">Licenses</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-orange-500" />
                <span className="text-2xl font-bold">{stores.length}</span>
              </div>
              <p className="text-sm text-gray-600">Stores</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <UserCog className="w-5 h-5 text-purple-500" />
                <span className="text-2xl font-bold">{members.length}</span>
              </div>
              <p className="text-sm text-gray-600">Members</p>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Name</p>
                <p className="text-sm font-medium text-gray-900">{tenant.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Email</p>
                <p className="text-sm font-medium text-gray-900">{tenant.email}</p>
              </div>
              {tenant.phone && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Phone</p>
                  <p className="text-sm font-medium text-gray-900">{tenant.phone}</p>
                </div>
              )}
              {tenant.company && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Company</p>
                  <p className="text-sm font-medium text-gray-900">{tenant.company}</p>
                </div>
              )}
              {tenant.address && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 mb-1">Address</p>
                  <p className="text-sm font-medium text-gray-900">{tenant.address}</p>
                </div>
              )}
            </div>
          </div>

          {/* Licenses */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Licenses ({licenses.length})</h3>
            {licenses.length > 0 ? (
              <div className="space-y-2">
                {licenses.map((license) => (
                  <div key={license.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 font-mono">{license.licenseKey}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded capitalize ${getTierBadge(license.tier)}`}>
                          {license.tier}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded capitalize ${
                          license.status === 'active' ? 'bg-green-100 text-green-700' :
                          license.status === 'expired' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {license.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <p>Max {license.maxStores} stores</p>
                      {license.expiresAt && (
                        <p>Expires {new Date(license.expiresAt).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No licenses assigned</p>
            )}
          </div>

          {/* Stores */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Stores ({stores.length})</h3>
            {stores.length > 0 ? (
              <div className="space-y-2">
                {stores.map((store) => (
                  <div key={store.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{store.name}</p>
                      <p className="text-xs text-gray-500">Login: {store.storeLoginId}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded capitalize ${
                      store.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {store.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No stores created</p>
            )}
          </div>

          {/* Notes */}
          {tenant.notes && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Notes</h3>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{tenant.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => onEdit(tenant)}
              className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              Edit Tenant
            </button>
            <button
              onClick={handleSuspendToggle}
              disabled={suspendTenant.isPending || activateTenant.isPending}
              className={`px-4 py-2 border rounded-lg transition-colors font-medium ${
                tenant.status === 'suspended'
                  ? 'border-green-300 text-green-600 hover:bg-green-50'
                  : 'border-red-300 text-red-600 hover:bg-red-50'
              } disabled:opacity-50`}
            >
              {tenant.status === 'suspended' ? 'Activate' : 'Suspend'}
            </button>
          </div>

          {/* Metadata */}
          <div className="text-xs text-gray-400 pt-4 border-t border-gray-100">
            Created: {new Date(tenant.createdAt).toLocaleString()} •
            Updated: {new Date(tenant.updatedAt).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}

// Tenant Form Modal Component
interface TenantFormModalProps {
  title: string;
  tenant?: Tenant;
  onClose: () => void;
}

function TenantFormModal({ title, tenant, onClose }: TenantFormModalProps) {
  const [formData, setFormData] = useState<CreateTenantInput>({
    name: tenant?.name || '',
    email: tenant?.email || '',
    phone: tenant?.phone || '',
    company: tenant?.company || '',
    address: tenant?.address || '',
    notes: tenant?.notes || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createTenant = useCreateTenant();
  const updateTenant = useUpdateTenant();
  const deleteTenant = useDeleteTenant();

  const saving = createTenant.isPending || updateTenant.isPending;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (tenant) {
        await updateTenant.mutateAsync({ id: tenant.id, data: formData });
      } else {
        await createTenant.mutateAsync(formData);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save tenant:', error);
    }
  };

  const handleDelete = async () => {
    if (!tenant) return;
    if (confirm(`Delete ${tenant.name}? This cannot be undone.`)) {
      await deleteTenant.mutateAsync(tenant.id);
      onClose();
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="John Smith"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="john@example.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="(555) 123-4567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company/Business Name</label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Luxury Nails & Spa"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="123 Main St, City, State"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Internal notes about this tenant..."
            />
          </div>

          <div className="flex gap-3 mt-6">
            {tenant && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteTenant.isPending}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
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
              {saving ? 'Saving...' : tenant ? 'Save Changes' : 'Create Tenant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
