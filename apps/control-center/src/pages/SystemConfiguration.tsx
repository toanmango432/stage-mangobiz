import { useState, useEffect } from 'react';
import {
  Settings,
  Plus,
  Edit2,
  Trash2,
  RefreshCcw,
  DollarSign,
  Percent,
  Tag,
  Users,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Globe,
  Check
} from 'lucide-react';
import type {
  SystemConfig,
  TaxSetting,
  ServiceCategory,
  ServiceItem,
  EmployeeRole,
  PaymentMethod
} from '@/types';
import { systemConfigDB } from '@/db/database';

// Emoji options for categories
const EMOJI_OPTIONS = ['💅', '🦶', '✨', '🧖', '💇', '💆', '🪒', '💄', '🧴', '✂️', '🎨', '💎'];

// Color options for categories
const COLOR_OPTIONS = [
  '#FF6B9D', '#4ECDC4', '#95E1D3', '#F9ED69', '#FF8C42',
  '#6C5CE7', '#00B894', '#E17055', '#74B9FF', '#FDCB6E',
  '#A29BFE', '#55A3FF', '#FF7675', '#81ECEC', '#DFE6E9'
];

// Payment type options
const PAYMENT_TYPES = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Credit/Debit Card' },
  { value: 'check', label: 'Check' },
  { value: 'gift_card', label: 'Gift Card' },
  { value: 'other', label: 'Other' },
];

type Section = 'taxes' | 'categories' | 'items' | 'roles' | 'payments';

export function SystemConfiguration() {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedSection, setExpandedSection] = useState<Section | null>('taxes');

  // Edit modals state
  const [editingTax, setEditingTax] = useState<TaxSetting | null>(null);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [editingItem, setEditingItem] = useState<ServiceItem | null>(null);
  const [editingRole, setEditingRole] = useState<EmployeeRole | null>(null);
  const [editingPayment, setEditingPayment] = useState<PaymentMethod | null>(null);

  // New item forms
  const [showNewTax, setShowNewTax] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [showNewItem, setShowNewItem] = useState(false);
  const [showNewRole, setShowNewRole] = useState(false);
  const [showNewPayment, setShowNewPayment] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      let cfg = await systemConfigDB.get();
      if (!cfg) {
        await systemConfigDB.seedDefaults();
        cfg = await systemConfigDB.get();
      }
      setConfig(cfg || null);
    } catch (error) {
      console.error('Failed to load system config:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: Section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Tax handlers
  const handleAddTax = async (tax: Omit<TaxSetting, 'id'>) => {
    setSaving(true);
    try {
      const updated = await systemConfigDB.addTaxSetting(tax);
      setConfig(updated);
      setShowNewTax(false);
    } catch (error) {
      console.error('Failed to add tax:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTax = async (id: string, updates: Partial<TaxSetting>) => {
    setSaving(true);
    try {
      const updated = await systemConfigDB.updateTaxSetting(id, updates);
      setConfig(updated);
      setEditingTax(null);
    } catch (error) {
      console.error('Failed to update tax:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveTax = async (id: string) => {
    if (!confirm('Remove this tax setting?')) return;
    setSaving(true);
    try {
      const updated = await systemConfigDB.removeTaxSetting(id);
      setConfig(updated);
    } catch (error) {
      console.error('Failed to remove tax:', error);
    } finally {
      setSaving(false);
    }
  };

  // Category handlers
  const handleAddCategory = async (category: Omit<ServiceCategory, 'id'>) => {
    setSaving(true);
    try {
      const updated = await systemConfigDB.addCategory(category);
      setConfig(updated);
      setShowNewCategory(false);
    } catch (error) {
      console.error('Failed to add category:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCategory = async (id: string, updates: Partial<ServiceCategory>) => {
    setSaving(true);
    try {
      const updated = await systemConfigDB.updateCategory(id, updates);
      setConfig(updated);
      setEditingCategory(null);
    } catch (error) {
      console.error('Failed to update category:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveCategory = async (id: string) => {
    const itemsInCategory = config?.items.filter(i => i.categoryId === id).length || 0;
    if (!confirm(`Remove this category${itemsInCategory > 0 ? ` and its ${itemsInCategory} service(s)` : ''}?`)) return;
    setSaving(true);
    try {
      const updated = await systemConfigDB.removeCategory(id);
      setConfig(updated);
    } catch (error) {
      console.error('Failed to remove category:', error);
    } finally {
      setSaving(false);
    }
  };

  // Service item handlers
  const handleAddItem = async (item: Omit<ServiceItem, 'id'>) => {
    setSaving(true);
    try {
      const updated = await systemConfigDB.addItem(item);
      setConfig(updated);
      setShowNewItem(false);
    } catch (error) {
      console.error('Failed to add item:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateItem = async (id: string, updates: Partial<ServiceItem>) => {
    setSaving(true);
    try {
      const updated = await systemConfigDB.updateItem(id, updates);
      setConfig(updated);
      setEditingItem(null);
    } catch (error) {
      console.error('Failed to update item:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveItem = async (id: string) => {
    if (!confirm('Remove this service?')) return;
    setSaving(true);
    try {
      const updated = await systemConfigDB.removeItem(id);
      setConfig(updated);
    } catch (error) {
      console.error('Failed to remove item:', error);
    } finally {
      setSaving(false);
    }
  };

  // Employee role handlers
  const handleAddRole = async (role: Omit<EmployeeRole, 'id'>) => {
    setSaving(true);
    try {
      const updated = await systemConfigDB.addEmployeeRole(role);
      setConfig(updated);
      setShowNewRole(false);
    } catch (error) {
      console.error('Failed to add role:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRole = async (id: string, updates: Partial<EmployeeRole>) => {
    setSaving(true);
    try {
      const updated = await systemConfigDB.updateEmployeeRole(id, updates);
      setConfig(updated);
      setEditingRole(null);
    } catch (error) {
      console.error('Failed to update role:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveRole = async (id: string) => {
    if (!confirm('Remove this employee role?')) return;
    setSaving(true);
    try {
      const updated = await systemConfigDB.removeEmployeeRole(id);
      setConfig(updated);
    } catch (error) {
      console.error('Failed to remove role:', error);
    } finally {
      setSaving(false);
    }
  };

  // Payment method handlers
  const handleAddPayment = async (payment: Omit<PaymentMethod, 'id'>) => {
    setSaving(true);
    try {
      const updated = await systemConfigDB.addPaymentMethod(payment);
      setConfig(updated);
      setShowNewPayment(false);
    } catch (error) {
      console.error('Failed to add payment method:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePayment = async (id: string, updates: Partial<PaymentMethod>) => {
    setSaving(true);
    try {
      const updated = await systemConfigDB.updatePaymentMethod(id, updates);
      setConfig(updated);
      setEditingPayment(null);
    } catch (error) {
      console.error('Failed to update payment method:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePayment = async (id: string) => {
    if (!confirm('Remove this payment method?')) return;
    setSaving(true);
    try {
      const updated = await systemConfigDB.removePaymentMethod(id);
      setConfig(updated);
    } catch (error) {
      console.error('Failed to remove payment method:', error);
    } finally {
      setSaving(false);
    }
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

  if (!config) {
    return (
      <div className="p-8">
        <div className="text-center py-20">
          <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Failed to load system configuration</p>
          <button
            onClick={loadConfig}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">System Configuration</h1>
        <p className="text-gray-600 mt-1">
          Default settings applied to new stores on activation
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
        <div className="flex items-start gap-3">
          <Settings className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-blue-900 font-medium">Default Store Setup</p>
            <p className="text-blue-700 text-sm mt-1">
              These settings are automatically applied when a new store first activates their license.
              Changes here affect future activations, not existing stores.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Tax Settings Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <button
            onClick={() => toggleSection('taxes')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Percent className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Tax Settings</h3>
                <p className="text-sm text-gray-500">{config.taxSettings.length} tax rate(s) configured</p>
              </div>
            </div>
            {expandedSection === 'taxes' ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>

          {expandedSection === 'taxes' && (
            <div className="border-t border-gray-200 p-6">
              <div className="space-y-3">
                {config.taxSettings.map((tax) => (
                  <div key={tax.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="text-lg font-semibold text-gray-900">{tax.rate}%</div>
                      <div>
                        <p className="font-medium text-gray-700">{tax.name}</p>
                        {tax.isDefault && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Default</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingTax(tax)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveTax(tax.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {showNewTax ? (
                <TaxForm
                  onSave={handleAddTax}
                  onCancel={() => setShowNewTax(false)}
                  saving={saving}
                />
              ) : (
                <button
                  onClick={() => setShowNewTax(true)}
                  className="mt-4 flex items-center gap-2 text-purple-600 hover:text-purple-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Tax Rate
                </button>
              )}
            </div>
          )}
        </div>

        {/* Service Categories Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <button
            onClick={() => toggleSection('categories')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Tag className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Service Categories</h3>
                <p className="text-sm text-gray-500">{config.categories.length} categories configured</p>
              </div>
            </div>
            {expandedSection === 'categories' ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>

          {expandedSection === 'categories' && (
            <div className="border-t border-gray-200 p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {config.categories.sort((a, b) => a.sortOrder - b.sortOrder).map((cat) => (
                  <div
                    key={cat.id}
                    className="relative group p-4 rounded-xl border-2"
                    style={{ borderColor: cat.color, backgroundColor: `${cat.color}15` }}
                  >
                    <div className="text-center">
                      <span className="text-3xl">{cat.icon}</span>
                      <p className="font-medium text-gray-900 mt-2">{cat.name}</p>
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1">
                      <button
                        onClick={() => setEditingCategory(cat)}
                        className="p-1 bg-white rounded shadow hover:bg-gray-50"
                      >
                        <Edit2 className="w-3 h-3 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleRemoveCategory(cat.id)}
                        className="p-1 bg-white rounded shadow hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3 text-red-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {showNewCategory ? (
                <CategoryForm
                  categories={config.categories}
                  onSave={handleAddCategory}
                  onCancel={() => setShowNewCategory(false)}
                  saving={saving}
                />
              ) : (
                <button
                  onClick={() => setShowNewCategory(true)}
                  className="mt-4 flex items-center gap-2 text-purple-600 hover:text-purple-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Category
                </button>
              )}
            </div>
          )}
        </div>

        {/* Service Items Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <button
            onClick={() => toggleSection('items')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Default Services</h3>
                <p className="text-sm text-gray-500">{config.items.length} services configured</p>
              </div>
            </div>
            {expandedSection === 'items' ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>

          {expandedSection === 'items' && (
            <div className="border-t border-gray-200 p-6">
              <div className="space-y-2">
                {config.items.sort((a, b) => a.sortOrder - b.sortOrder).map((item) => {
                  const category = config.categories.find(c => c.id === item.categoryId);
                  return (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{category?.icon || '📦'}</span>
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-500">{item.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">${item.price}</p>
                          <p className="text-xs text-gray-500">{item.duration} min</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingItem(item)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {showNewItem ? (
                <ServiceItemForm
                  categories={config.categories}
                  items={config.items}
                  onSave={handleAddItem}
                  onCancel={() => setShowNewItem(false)}
                  saving={saving}
                />
              ) : (
                <button
                  onClick={() => setShowNewItem(true)}
                  className="mt-4 flex items-center gap-2 text-purple-600 hover:text-purple-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Service
                </button>
              )}
            </div>
          )}
        </div>

        {/* Employee Roles Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <button
            onClick={() => toggleSection('roles')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Employee Roles</h3>
                <p className="text-sm text-gray-500">{config.employeeRoles.length} roles configured</p>
              </div>
            </div>
            {expandedSection === 'roles' ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>

          {expandedSection === 'roles' && (
            <div className="border-t border-gray-200 p-6">
              <div className="space-y-3">
                {config.employeeRoles.sort((a, b) => a.sortOrder - b.sortOrder).map((role) => (
                  <div key={role.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: role.color }}
                      />
                      <div>
                        <p className="font-medium text-gray-900">{role.name}</p>
                        <p className="text-xs text-gray-500">
                          {role.permissions.includes('all') ? 'Full access' : role.permissions.join(', ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingRole(role)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveRole(role.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {showNewRole ? (
                <RoleForm
                  roles={config.employeeRoles}
                  onSave={handleAddRole}
                  onCancel={() => setShowNewRole(false)}
                  saving={saving}
                />
              ) : (
                <button
                  onClick={() => setShowNewRole(true)}
                  className="mt-4 flex items-center gap-2 text-purple-600 hover:text-purple-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Role
                </button>
              )}
            </div>
          )}
        </div>

        {/* Payment Methods Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <button
            onClick={() => toggleSection('payments')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CreditCard className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Payment Methods</h3>
                <p className="text-sm text-gray-500">{config.paymentMethods.filter(m => m.isActive).length} active method(s)</p>
              </div>
            </div>
            {expandedSection === 'payments' ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>

          {expandedSection === 'payments' && (
            <div className="border-t border-gray-200 p-6">
              <div className="space-y-3">
                {config.paymentMethods.sort((a, b) => a.sortOrder - b.sortOrder).map((method) => (
                  <div key={method.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={method.isActive}
                        onChange={(e) => handleUpdatePayment(method.id, { isActive: e.target.checked })}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{method.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{method.type.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingPayment(method)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemovePayment(method.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {showNewPayment ? (
                <PaymentForm
                  payments={config.paymentMethods}
                  onSave={handleAddPayment}
                  onCancel={() => setShowNewPayment(false)}
                  saving={saving}
                />
              ) : (
                <button
                  onClick={() => setShowNewPayment(true)}
                  className="mt-4 flex items-center gap-2 text-purple-600 hover:text-purple-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Payment Method
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modals */}
      {editingTax && (
        <TaxEditModal
          tax={editingTax}
          onSave={(updates) => handleUpdateTax(editingTax.id, updates)}
          onClose={() => setEditingTax(null)}
          saving={saving}
        />
      )}

      {editingCategory && (
        <CategoryEditModal
          category={editingCategory}
          onSave={(updates) => handleUpdateCategory(editingCategory.id, updates)}
          onClose={() => setEditingCategory(null)}
          saving={saving}
        />
      )}

      {editingItem && (
        <ServiceItemEditModal
          item={editingItem}
          categories={config.categories}
          onSave={(updates) => handleUpdateItem(editingItem.id, updates)}
          onClose={() => setEditingItem(null)}
          saving={saving}
        />
      )}

      {editingRole && (
        <RoleEditModal
          role={editingRole}
          onSave={(updates) => handleUpdateRole(editingRole.id, updates)}
          onClose={() => setEditingRole(null)}
          saving={saving}
        />
      )}

      {editingPayment && (
        <PaymentEditModal
          payment={editingPayment}
          onSave={(updates) => handleUpdatePayment(editingPayment.id, updates)}
          onClose={() => setEditingPayment(null)}
          saving={saving}
        />
      )}
    </div>
  );
}

// ==================== FORM COMPONENTS ====================

function TaxForm({ onSave, onCancel, saving }: {
  onSave: (tax: Omit<TaxSetting, 'id'>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState('');
  const [rate, setRate] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !rate) return;
    onSave({ name, rate: parseFloat(rate), isDefault });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Tax name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
          required
        />
        <input
          type="number"
          placeholder="Rate %"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          step="0.01"
          min="0"
          max="100"
          className="px-3 py-2 border border-gray-300 rounded-lg"
          required
        />
      </div>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
          className="w-4 h-4 text-purple-600 rounded"
        />
        <span className="text-sm text-gray-700">Set as default tax</span>
      </label>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Add'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function CategoryForm({ categories, onSave, onCancel, saving }: {
  categories: ServiceCategory[];
  onSave: (category: Omit<ServiceCategory, 'id'>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(EMOJI_OPTIONS[0]);
  const [color, setColor] = useState(COLOR_OPTIONS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    onSave({ name, icon, color, sortOrder: categories.length + 1 });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
      <input
        type="text"
        placeholder="Category name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        required
      />
      <div>
        <label className="text-sm text-gray-600 mb-1 block">Icon</label>
        <div className="flex flex-wrap gap-2">
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setIcon(emoji)}
              className={`w-10 h-10 text-xl rounded-lg border-2 ${icon === emoji ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm text-gray-600 mb-1 block">Color</label>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-lg border-2 ${color === c ? 'border-gray-900' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Add'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function ServiceItemForm({ categories, items, onSave, onCancel, saving }: {
  categories: ServiceCategory[];
  items: ServiceItem[];
  onSave: (item: Omit<ServiceItem, 'id'>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('30');
  const [price, setPrice] = useState('');
  const [commissionRate, setCommissionRate] = useState('50');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !categoryId || !price) return;
    onSave({
      name,
      categoryId,
      description,
      duration: parseInt(duration),
      price: parseFloat(price),
      commissionRate: parseFloat(commissionRate),
      sortOrder: items.length + 1,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Service name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
          required
        />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
          required
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
          ))}
        </select>
      </div>
      <input
        type="text"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
      />
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-gray-500">Duration (min)</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            min="5"
            step="5"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Price ($)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            required
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Commission %</label>
          <input
            type="number"
            value={commissionRate}
            onChange={(e) => setCommissionRate(e.target.value)}
            min="0"
            max="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Add'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function RoleForm({ roles, onSave, onCancel, saving }: {
  roles: EmployeeRole[];
  onSave: (role: Omit<EmployeeRole, 'id'>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLOR_OPTIONS[5]);
  const [fullAccess, setFullAccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    onSave({
      name,
      color,
      permissions: fullAccess ? ['all'] : ['create_ticket', 'checkout'],
      sortOrder: roles.length + 1,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
      <input
        type="text"
        placeholder="Role name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        required
      />
      <div>
        <label className="text-sm text-gray-600 mb-1 block">Color</label>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-lg border-2 ${color === c ? 'border-gray-900' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={fullAccess}
          onChange={(e) => setFullAccess(e.target.checked)}
          className="w-4 h-4 text-purple-600 rounded"
        />
        <span className="text-sm text-gray-700">Full access (all permissions)</span>
      </label>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Add'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function PaymentForm({ payments, onSave, onCancel, saving }: {
  payments: PaymentMethod[];
  onSave: (payment: Omit<PaymentMethod, 'id'>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<PaymentMethod['type']>('card');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    onSave({ name, type, isActive: true, sortOrder: payments.length + 1 });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Method name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
          required
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as PaymentMethod['type'])}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          {PAYMENT_TYPES.map((pt) => (
            <option key={pt.value} value={pt.value}>{pt.label}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Add'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ==================== EDIT MODAL COMPONENTS ====================

function TaxEditModal({ tax, onSave, onClose, saving }: {
  tax: TaxSetting;
  onSave: (updates: Partial<TaxSetting>) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState(tax.name);
  const [rate, setRate] = useState(tax.rate.toString());
  const [isDefault, setIsDefault] = useState(tax.isDefault);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 p-6">
        <h3 className="text-lg font-bold mb-4">Edit Tax Rate</h3>
        <div className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <input
            type="number"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded"
            />
            <span className="text-sm">Default tax</span>
          </label>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onSave({ name, rate: parseFloat(rate), isDefault })}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoryEditModal({ category, onSave, onClose, saving }: {
  category: ServiceCategory;
  onSave: (updates: Partial<ServiceCategory>) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState(category.name);
  const [icon, setIcon] = useState(category.icon);
  const [color, setColor] = useState(category.color);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 p-6">
        <h3 className="text-lg font-bold mb-4">Edit Category</h3>
        <div className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Icon</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`w-10 h-10 text-xl rounded-lg border-2 ${icon === emoji ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-lg border-2 ${color === c ? 'border-gray-900' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onSave({ name, icon, color })}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function ServiceItemEditModal({ item, categories, onSave, onClose, saving }: {
  item: ServiceItem;
  categories: ServiceCategory[];
  onSave: (updates: Partial<ServiceItem>) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState(item.name);
  const [categoryId, setCategoryId] = useState(item.categoryId);
  const [description, setDescription] = useState(item.description);
  const [duration, setDuration] = useState(item.duration.toString());
  const [price, setPrice] = useState(item.price.toString());
  const [commissionRate, setCommissionRate] = useState(item.commissionRate.toString());

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg mx-4 p-6">
        <h3 className="text-lg font-bold mb-4">Edit Service</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Service name"
            />
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="Description"
          />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500">Duration (min)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Price ($)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Commission %</label>
              <input
                type="number"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onSave({
              name,
              categoryId,
              description,
              duration: parseInt(duration),
              price: parseFloat(price),
              commissionRate: parseFloat(commissionRate),
            })}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function RoleEditModal({ role, onSave, onClose, saving }: {
  role: EmployeeRole;
  onSave: (updates: Partial<EmployeeRole>) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState(role.name);
  const [color, setColor] = useState(role.color);
  const [fullAccess, setFullAccess] = useState(role.permissions.includes('all'));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 p-6">
        <h3 className="text-lg font-bold mb-4">Edit Role</h3>
        <div className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-lg border-2 ${color === c ? 'border-gray-900' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={fullAccess}
              onChange={(e) => setFullAccess(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded"
            />
            <span className="text-sm">Full access</span>
          </label>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onSave({
              name,
              color,
              permissions: fullAccess ? ['all'] : ['create_ticket', 'checkout'],
            })}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function PaymentEditModal({ payment, onSave, onClose, saving }: {
  payment: PaymentMethod;
  onSave: (updates: Partial<PaymentMethod>) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState(payment.name);
  const [type, setType] = useState(payment.type);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 p-6">
        <h3 className="text-lg font-bold mb-4">Edit Payment Method</h3>
        <div className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as PaymentMethod['type'])}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            {PAYMENT_TYPES.map((pt) => (
              <option key={pt.value} value={pt.value}>{pt.label}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onSave({ name, type })}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
