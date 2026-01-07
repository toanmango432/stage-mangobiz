/**
 * System Configuration Component
 * Main component for managing system-wide default settings
 */

import { useState } from 'react';
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
} from 'lucide-react';
import type {
  TaxSetting,
  ServiceCategory,
  ServiceItem,
  EmployeeRole,
  PaymentMethod
} from '@/types';
import {
  useSystemConfig,
  useAddTax,
  useUpdateTax,
  useDeleteTax,
  useAddCategory,
  useUpdateCategory,
  useDeleteCategory,
  useAddServiceItem,
  useUpdateServiceItem,
  useDeleteServiceItem,
  useAddRole,
  useUpdateRole,
  useDeleteRole,
  useAddPaymentMethod,
  useUpdatePaymentMethod,
  useDeletePaymentMethod,
} from '@/hooks/queries';
import { TaxForm, CategoryForm, ServiceItemForm, RoleForm, PaymentForm } from './forms';
import {
  TaxEditModal,
  CategoryEditModal,
  ServiceItemEditModal,
  RoleEditModal,
  PaymentEditModal,
} from './modals';
import type { Section } from './constants';

export function SystemConfiguration() {
  // React Query hooks
  const { data: config, isLoading: loading, refetch } = useSystemConfig();

  // Mutation hooks
  const addTax = useAddTax();
  const updateTax = useUpdateTax();
  const deleteTax = useDeleteTax();
  const addCategory = useAddCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const addItem = useAddServiceItem();
  const updateItem = useUpdateServiceItem();
  const deleteItem = useDeleteServiceItem();
  const addRole = useAddRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();
  const addPayment = useAddPaymentMethod();
  const updatePayment = useUpdatePaymentMethod();
  const deletePayment = useDeletePaymentMethod();

  // Combined saving state
  const saving = addTax.isPending || updateTax.isPending || deleteTax.isPending ||
    addCategory.isPending || updateCategory.isPending || deleteCategory.isPending ||
    addItem.isPending || updateItem.isPending || deleteItem.isPending ||
    addRole.isPending || updateRole.isPending || deleteRole.isPending ||
    addPayment.isPending || updatePayment.isPending || deletePayment.isPending;

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

  const toggleSection = (section: Section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Tax handlers
  const handleAddTax = async (tax: Omit<TaxSetting, 'id'>) => {
    try {
      await addTax.mutateAsync({ tax });
      setShowNewTax(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleUpdateTax = async (id: string, updates: Partial<TaxSetting>) => {
    try {
      await updateTax.mutateAsync({ id, updates });
      setEditingTax(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleRemoveTax = async (id: string) => {
    if (!confirm('Remove this tax setting?')) return;
    try {
      await deleteTax.mutateAsync({ id });
    } catch (error) {
      // Error handled by hook
    }
  };

  // Category handlers
  const handleAddCategory = async (category: Omit<ServiceCategory, 'id'>) => {
    try {
      await addCategory.mutateAsync({ category });
      setShowNewCategory(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleUpdateCategory = async (id: string, updates: Partial<ServiceCategory>) => {
    try {
      await updateCategory.mutateAsync({ id, updates });
      setEditingCategory(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleRemoveCategory = async (id: string) => {
    const itemsInCategory = config?.items.filter(i => i.categoryId === id).length || 0;
    if (!confirm(`Remove this category${itemsInCategory > 0 ? ` and its ${itemsInCategory} service(s)` : ''}?`)) return;
    try {
      await deleteCategory.mutateAsync({ id });
    } catch (error) {
      // Error handled by hook
    }
  };

  // Service item handlers
  const handleAddItem = async (item: Omit<ServiceItem, 'id'>) => {
    try {
      await addItem.mutateAsync({ item });
      setShowNewItem(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleUpdateItem = async (id: string, updates: Partial<ServiceItem>) => {
    try {
      await updateItem.mutateAsync({ id, updates });
      setEditingItem(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleRemoveItem = async (id: string) => {
    if (!confirm('Remove this service?')) return;
    try {
      await deleteItem.mutateAsync({ id });
    } catch (error) {
      // Error handled by hook
    }
  };

  // Employee role handlers
  const handleAddRole = async (role: Omit<EmployeeRole, 'id'>) => {
    try {
      await addRole.mutateAsync({ role });
      setShowNewRole(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleUpdateRole = async (id: string, updates: Partial<EmployeeRole>) => {
    try {
      await updateRole.mutateAsync({ id, updates });
      setEditingRole(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleRemoveRole = async (id: string) => {
    if (!confirm('Remove this employee role?')) return;
    try {
      await deleteRole.mutateAsync({ id });
    } catch (error) {
      // Error handled by hook
    }
  };

  // Payment method handlers
  const handleAddPayment = async (payment: Omit<PaymentMethod, 'id'>) => {
    try {
      await addPayment.mutateAsync({ method: payment });
      setShowNewPayment(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleUpdatePayment = async (id: string, updates: Partial<PaymentMethod>) => {
    try {
      await updatePayment.mutateAsync({ id, updates });
      setEditingPayment(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleRemovePayment = async (id: string) => {
    if (!confirm('Remove this payment method?')) return;
    try {
      await deletePayment.mutateAsync({ id });
    } catch (error) {
      // Error handled by hook
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
            onClick={() => refetch()}
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
