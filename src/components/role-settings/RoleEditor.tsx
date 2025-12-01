/**
 * Role Editor Component
 * Edit role settings including name, description, and permissions
 */

import React, { useState } from 'react';
import type { RoleDefinition, QuickAccessPermissions, LocationScope, RoleHierarchy, PermissionLevel } from './types';
import {
  roleColors,
  quickAccessLabels,
  roleTemplates,
  permissionCategories,
  defaultDetailedPermissions,
} from './constants';

// Icons
const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const CopyIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const StarIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const ShieldIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const UsersIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const MapPinIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

interface RoleEditorProps {
  role: RoleDefinition | null;
  isNew: boolean;
  allRoles: RoleDefinition[];
  onUpdate?: (updates: Partial<RoleDefinition>) => void;
  onCreate?: (role: Omit<RoleDefinition, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDelete?: (roleId: string, reassignToRoleId: string) => void;
  onDuplicate?: (roleId: string) => void;
  onSetDefault?: (roleId: string) => void;
  onCancel?: () => void;
}

export const RoleEditor: React.FC<RoleEditorProps> = ({
  role,
  isNew,
  allRoles,
  onUpdate,
  onCreate,
  onDelete,
  onDuplicate,
  onSetDefault,
  onCancel,
}) => {
  // Local state for new role creation
  const [newRole, setNewRole] = useState<Partial<RoleDefinition>>({
    name: '',
    description: '',
    color: roleColors.custom,
    hierarchy: 2,
    isSystem: false,
    isDefault: false,
    isServiceProvider: true,
    locationScope: 'all_locations',
    quickAccessPermissions: {
      canAccessAdminPortal: false,
      canAccessReports: false,
      canModifyPrices: false,
      canProcessRefunds: false,
      canDeleteRecords: false,
      canManageTeam: false,
      canViewOthersCalendar: true,
      canBookForOthers: false,
      canEditOthersAppointments: false,
    },
    detailedPermissions: defaultDetailedPermissions,
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reassignRoleId, setReassignRoleId] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['appointments', 'clients']);

  // Current role data (either existing or new)
  const currentRole = isNew ? newRole : role;
  if (!currentRole) return null;

  // Handle field updates
  const handleUpdate = (field: keyof RoleDefinition, value: any) => {
    if (isNew) {
      setNewRole(prev => ({ ...prev, [field]: value }));
    } else {
      onUpdate?.({ [field]: value });
    }
  };

  // Handle permission toggle
  const handlePermissionToggle = (key: keyof QuickAccessPermissions) => {
    const current = currentRole.quickAccessPermissions?.[key] ?? false;
    const newPermissions = {
      ...currentRole.quickAccessPermissions,
      [key]: !current,
    };
    handleUpdate('quickAccessPermissions', newPermissions);
  };

  // Handle detailed permission change
  const handleDetailedPermissionChange = (permissionId: string, level: PermissionLevel) => {
    const newDetailedPermissions = (currentRole.detailedPermissions || []).map(p =>
      p.id === permissionId ? { ...p, level } : p
    );
    handleUpdate('detailedPermissions', newDetailedPermissions);
  };

  // Handle create
  const handleCreate = () => {
    if (!newRole.name?.trim()) return;
    onCreate?.(newRole as Omit<RoleDefinition, 'id' | 'createdAt' | 'updatedAt'>);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (!role || !reassignRoleId) return;
    onDelete?.(role.id, reassignRoleId);
    setShowDeleteModal(false);
  };

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Color options
  const colorOptions = Object.entries(roleColors);

  // Hierarchy labels
  const hierarchyLabels: Record<RoleHierarchy, string> = {
    1: 'Entry Level (1)',
    2: 'Standard (2)',
    3: 'Senior (3)',
    4: 'Management (4)',
    5: 'Owner (5)',
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header with Actions */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {isNew ? 'Create New Role' : `Edit ${role?.name}`}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {isNew ? 'Define a new role with custom permissions' : 'Modify role settings and permissions'}
          </p>
        </div>

        {!isNew && role && (
          <div className="flex items-center gap-2">
            {!role.isDefault && (
              <button
                onClick={() => onSetDefault?.(role.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                title="Set as default role for new team members"
              >
                <StarIcon className="w-4 h-4" />
                Set Default
              </button>
            )}
            <button
              onClick={() => onDuplicate?.(role.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <CopyIcon className="w-4 h-4" />
              Duplicate
            </button>
            {!role.isSystem && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {/* System Role Badge */}
      {role?.isSystem && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <ShieldIcon className="w-5 h-5 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-800">System Role</p>
            <p className="text-xs text-amber-600">This is a built-in role and cannot be deleted. Some settings may be restricted.</p>
          </div>
        </div>
      )}

      {/* Affected Staff Notification */}
      {!isNew && role && (role.memberCount ?? 0) > 0 && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <UsersIcon className="w-5 h-5 text-blue-600" />
          <div>
            <p className="text-sm font-medium text-blue-800">
              {role.memberCount} team member{role.memberCount === 1 ? '' : 's'} assigned
            </p>
            <p className="text-xs text-blue-600">Changes to this role will affect all assigned team members.</p>
          </div>
        </div>
      )}

      {/* Role Templates (for new roles) */}
      {isNew && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Start from a template</h3>
          <div className="grid grid-cols-2 gap-3">
            {roleTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  setNewRole(prev => ({
                    ...prev,
                    name: template.name,
                    description: template.description,
                    quickAccessPermissions: template.suggestedPermissions,
                    isServiceProvider: template.category === 'service_provider' || template.category === 'specialty',
                  }));
                }}
                className="p-3 text-left border border-gray-200 rounded-lg hover:border-teal-300 hover:bg-teal-50 transition-colors"
              >
                <p className="font-medium text-gray-900 text-sm">{template.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{template.description}</p>
                {template.isPopular && (
                  <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium bg-teal-100 text-teal-700 rounded">Popular</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Basic Info Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Basic Information</h3>

        {/* Role Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
          <input
            type="text"
            value={currentRole.name || ''}
            onChange={(e) => handleUpdate('name', e.target.value)}
            disabled={role?.isSystem}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
            placeholder="Enter role name"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={currentRole.description || ''}
            onChange={(e) => handleUpdate('description', e.target.value)}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="Describe this role's responsibilities"
          />
        </div>

        {/* Color Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Role Color</label>
          <div className="flex flex-wrap gap-2">
            {colorOptions.map(([key, color]) => (
              <button
                key={key}
                onClick={() => handleUpdate('color', color)}
                className={`w-8 h-8 rounded-lg ${color.bg} border-2 transition-all ${
                  currentRole.color?.bg === color.bg
                    ? `${color.border} ring-2 ring-offset-1 ring-teal-400`
                    : 'border-transparent hover:scale-110'
                }`}
                title={key.charAt(0).toUpperCase() + key.slice(1)}
              />
            ))}
          </div>
        </div>

        {/* Role Type */}
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={currentRole.isServiceProvider || false}
              onChange={(e) => handleUpdate('isServiceProvider', e.target.checked)}
              className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
            />
            <span className="text-sm text-gray-700">Service Provider</span>
          </label>
        </div>

        {/* Hierarchy Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hierarchy Level</label>
          <select
            value={currentRole.hierarchy || 2}
            onChange={(e) => handleUpdate('hierarchy', Number(e.target.value) as RoleHierarchy)}
            disabled={role?.isSystem}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100"
          >
            {([1, 2, 3, 4, 5] as RoleHierarchy[]).map((level) => (
              <option key={level} value={level}>
                {hierarchyLabels[level]}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Higher levels have more permissions in the hierarchy</p>
        </div>
      </div>

      {/* Location Scope Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <MapPinIcon className="w-5 h-5 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Location Scope</h3>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="locationScope"
              checked={currentRole.locationScope === 'all_locations'}
              onChange={() => handleUpdate('locationScope', 'all_locations' as LocationScope)}
              className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
            />
            <div>
              <p className="font-medium text-gray-900">All Locations</p>
              <p className="text-xs text-gray-500">This role applies across all business locations</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="locationScope"
              checked={currentRole.locationScope === 'specific_locations'}
              onChange={() => handleUpdate('locationScope', 'specific_locations' as LocationScope)}
              className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
            />
            <div>
              <p className="font-medium text-gray-900">Specific Locations</p>
              <p className="text-xs text-gray-500">This role only applies to selected locations</p>
            </div>
          </label>
        </div>

        {currentRole.locationScope === 'specific_locations' && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Location selection will be available when locations are configured.</p>
          </div>
        )}
      </div>

      {/* Quick Access Permissions Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Quick Access Permissions</h3>
        <p className="text-sm text-gray-500">Toggle key permissions for this role</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(quickAccessLabels).map(([key, { label, description }]) => {
            const permKey = key as keyof QuickAccessPermissions;
            const isEnabled = currentRole.quickAccessPermissions?.[permKey] ?? false;

            return (
              <label
                key={key}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  isEnabled
                    ? 'bg-teal-50 border-teal-200'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={() => handlePermissionToggle(permKey)}
                  className="mt-0.5 w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
                <div>
                  <p className={`font-medium text-sm ${isEnabled ? 'text-teal-700' : 'text-gray-900'}`}>
                    {label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Detailed Permissions Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Detailed Permissions</h3>
        <p className="text-sm text-gray-500">Fine-tune permissions by category</p>

        <div className="space-y-2">
          {permissionCategories.map((category) => {
            const categoryPermissions = (currentRole.detailedPermissions || []).filter(
              p => p.category === category.id
            );
            const isExpanded = expandedCategories.includes(category.id);

            return (
              <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <span className="font-medium text-gray-900">{category.name}</span>
                  <ChevronDownIcon
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isExpanded && (
                  <div className="p-3 space-y-2">
                    {categoryPermissions.map((permission) => (
                      <div
                        key={permission.id}
                        className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">{permission.name}</p>
                          <p className="text-xs text-gray-500">{permission.description}</p>
                        </div>
                        <select
                          value={permission.level}
                          onChange={(e) => handleDetailedPermissionChange(permission.id, e.target.value as PermissionLevel)}
                          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        >
                          <option value="full">Full</option>
                          <option value="limited">Limited</option>
                          <option value="view_only">View Only</option>
                          <option value="none">None</option>
                        </select>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons for New Role */}
      {isNew && (
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!newRole.name?.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Role
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && role && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Delete Role</h3>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete <strong>{role.name}</strong>?
              {(role.memberCount ?? 0) > 0 && (
                <span> {role.memberCount} team member(s) will be reassigned.</span>
              )}
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reassign members to:
              </label>
              <select
                value={reassignRoleId}
                onChange={(e) => setReassignRoleId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="">Select a role...</option>
                {allRoles
                  .filter(r => r.id !== role.id)
                  .map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={!reassignRoleId}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleEditor;
