/**
 * Role Settings Module
 * Main container for role management with list + editor layout
 */

import React, { useState, useCallback, useEffect } from 'react';
import type { RoleDefinition } from './types';
import { allDefaultRoles } from './constants';
import { RoleList } from './RoleList';
import { RoleEditor } from './RoleEditor';

// Icons
const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

interface RoleSettingsProps {
  onBack?: () => void;
}

export const RoleSettings: React.FC<RoleSettingsProps> = ({ onBack }) => {
  // State management
  const [roles, setRoles] = useState<RoleDefinition[]>(allDefaultRoles);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'system' | 'custom' | 'service_provider'>('all');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Get selected role
  const selectedRole = roles.find(r => r.id === selectedRoleId) || null;

  // Filter roles based on search and category
  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    switch (filterCategory) {
      case 'system':
        return role.isSystem;
      case 'custom':
        return !role.isSystem && !role.isServiceProvider;
      case 'service_provider':
        return role.isServiceProvider;
      default:
        return true;
    }
  });

  // Select first role on mount if none selected
  useEffect(() => {
    if (!selectedRoleId && roles.length > 0) {
      setSelectedRoleId(roles[0].id);
    }
  }, [roles, selectedRoleId]);

  // Show toast helper
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Handle role selection
  const handleSelectRole = useCallback((roleId: string) => {
    if (hasUnsavedChanges) {
      if (!confirm('You have unsaved changes. Discard and continue?')) {
        return;
      }
    }
    setSelectedRoleId(roleId);
    setIsAddingNew(false);
    setHasUnsavedChanges(false);
  }, [hasUnsavedChanges]);

  // Handle role update
  const handleUpdateRole = useCallback((updates: Partial<RoleDefinition>) => {
    if (!selectedRoleId) return;

    setRoles(prev => prev.map(role =>
      role.id === selectedRoleId
        ? { ...role, ...updates, updatedAt: new Date().toISOString() }
        : role
    ));
    setHasUnsavedChanges(true);
  }, [selectedRoleId]);

  // Handle save
  const handleSave = useCallback(() => {
    // TODO: Persist to database
    setHasUnsavedChanges(false);
    showToast('Role saved successfully', 'success');
  }, [showToast]);

  // Handle discard changes
  const handleDiscard = useCallback(() => {
    // Reset to original data
    setRoles(allDefaultRoles);
    setHasUnsavedChanges(false);
    showToast('Changes discarded', 'success');
  }, [showToast]);

  // Handle add new role
  const handleAddRole = useCallback(() => {
    setIsAddingNew(true);
    setSelectedRoleId(null);
  }, []);

  // Handle create role
  const handleCreateRole = useCallback((newRole: Omit<RoleDefinition, 'id' | 'createdAt' | 'updatedAt'>) => {
    const role: RoleDefinition = {
      ...newRole,
      id: `custom_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setRoles(prev => [...prev, role]);
    setSelectedRoleId(role.id);
    setIsAddingNew(false);
    showToast('Role created successfully', 'success');
  }, [showToast]);

  // Handle delete role
  const handleDeleteRole = useCallback((roleId: string, reassignToRoleId: string) => {
    const roleToDelete = roles.find(r => r.id === roleId);
    if (!roleToDelete || roleToDelete.isSystem) {
      showToast('Cannot delete system roles', 'error');
      return;
    }

    setRoles(prev => prev.filter(r => r.id !== roleId));
    setSelectedRoleId(reassignToRoleId);
    showToast('Role deleted successfully', 'success');
  }, [roles, showToast]);

  // Handle duplicate role
  const handleDuplicateRole = useCallback((roleId: string) => {
    const roleToDuplicate = roles.find(r => r.id === roleId);
    if (!roleToDuplicate) return;

    const newRole: RoleDefinition = {
      ...roleToDuplicate,
      id: `custom_${Date.now()}`,
      name: `${roleToDuplicate.name} (Copy)`,
      isSystem: false,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setRoles(prev => [...prev, newRole]);
    setSelectedRoleId(newRole.id);
    showToast('Role duplicated successfully', 'success');
  }, [roles, showToast]);

  // Handle set as default
  const handleSetDefault = useCallback((roleId: string) => {
    setRoles(prev => prev.map(role => ({
      ...role,
      isDefault: role.id === roleId,
    })));
    showToast('Default role updated', 'success');
  }, [showToast]);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Role Settings</h1>
              <p className="text-sm text-gray-500">Manage roles and permissions for your team</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasUnsavedChanges && (
              <>
                <button
                  onClick={handleDiscard}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors"
                >
                  Save Changes
                </button>
              </>
            )}
            <button
              onClick={handleAddRole}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              Add Role
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Role List Panel */}
        <div className="w-80 border-r border-gray-200 bg-white overflow-y-auto">
          <RoleList
            roles={filteredRoles}
            selectedRoleId={selectedRoleId}
            searchQuery={searchQuery}
            filterCategory={filterCategory}
            onSelectRole={handleSelectRole}
            onSearchChange={setSearchQuery}
            onFilterChange={setFilterCategory}
          />
        </div>

        {/* Role Editor Panel */}
        <div className="flex-1 overflow-y-auto">
          {isAddingNew ? (
            <RoleEditor
              role={null}
              isNew={true}
              allRoles={roles}
              onCreate={handleCreateRole}
              onCancel={() => setIsAddingNew(false)}
            />
          ) : selectedRole ? (
            <RoleEditor
              role={selectedRole}
              isNew={false}
              allRoles={roles}
              onUpdate={handleUpdateRole}
              onDelete={handleDeleteRole}
              onDuplicate={handleDuplicateRole}
              onSetDefault={handleSetDefault}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <p>Select a role to edit</p>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default RoleSettings;
