/**
 * Role List Component
 * Displays a searchable, filterable list of roles
 */

import React from 'react';
import type { RoleDefinition } from './types';

// Icons
const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
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

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

interface RoleListProps {
  roles: RoleDefinition[];
  selectedRoleId: string | null;
  searchQuery: string;
  filterCategory: 'all' | 'system' | 'custom' | 'service_provider';
  onSelectRole: (roleId: string) => void;
  onSearchChange: (query: string) => void;
  onFilterChange: (category: 'all' | 'system' | 'custom' | 'service_provider') => void;
}

export const RoleList: React.FC<RoleListProps> = ({
  roles,
  selectedRoleId,
  searchQuery,
  filterCategory,
  onSelectRole,
  onSearchChange,
  onFilterChange,
}) => {
  const filterOptions = [
    { id: 'all', label: 'All Roles' },
    { id: 'system', label: 'System' },
    { id: 'custom', label: 'Custom' },
    { id: 'service_provider', label: 'Service Providers' },
  ] as const;

  // Group roles by hierarchy for display
  const groupedRoles = {
    management: roles.filter(r => r.hierarchy >= 4),
    serviceProviders: roles.filter(r => r.hierarchy < 4 && r.isServiceProvider),
    support: roles.filter(r => !r.isServiceProvider && r.hierarchy < 4),
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search roles..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 mt-3">
          {filterOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => onFilterChange(option.id)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                filterCategory === option.id
                  ? 'bg-brand-100 text-brand-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Role List */}
      <div className="flex-1 overflow-y-auto">
        {/* Management Roles */}
        {groupedRoles.management.length > 0 && (
          <RoleGroup
            title="Management"
            roles={groupedRoles.management}
            selectedRoleId={selectedRoleId}
            onSelectRole={onSelectRole}
          />
        )}

        {/* Service Provider Roles */}
        {groupedRoles.serviceProviders.length > 0 && (
          <RoleGroup
            title="Service Providers"
            roles={groupedRoles.serviceProviders}
            selectedRoleId={selectedRoleId}
            onSelectRole={onSelectRole}
          />
        )}

        {/* Support Roles */}
        {groupedRoles.support.length > 0 && (
          <RoleGroup
            title="Support Staff"
            roles={groupedRoles.support}
            selectedRoleId={selectedRoleId}
            onSelectRole={onSelectRole}
          />
        )}

        {/* Empty State */}
        {roles.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <UsersIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No roles found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500">
          <span className="font-medium">{roles.length}</span> roles
        </div>
      </div>
    </div>
  );
};

// Role Group Component
interface RoleGroupProps {
  title: string;
  roles: RoleDefinition[];
  selectedRoleId: string | null;
  onSelectRole: (roleId: string) => void;
}

const RoleGroup: React.FC<RoleGroupProps> = ({
  title,
  roles,
  selectedRoleId,
  onSelectRole,
}) => {
  return (
    <div className="py-2">
      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
        {title}
      </div>
      {roles.map((role) => (
        <RoleListItem
          key={role.id}
          role={role}
          isSelected={role.id === selectedRoleId}
          onClick={() => onSelectRole(role.id)}
        />
      ))}
    </div>
  );
};

// Role List Item Component
interface RoleListItemProps {
  role: RoleDefinition;
  isSelected: boolean;
  onClick: () => void;
}

const RoleListItem: React.FC<RoleListItemProps> = ({ role, isSelected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-3 flex items-center gap-3 transition-colors text-left ${
        isSelected
          ? 'bg-brand-50 border-l-4 border-l-brand-500'
          : 'hover:bg-gray-50 border-l-4 border-l-transparent'
      }`}
    >
      {/* Color Badge */}
      <div className={`w-10 h-10 rounded-lg ${role.color.bg} flex items-center justify-center`}>
        <span className={`text-sm font-bold ${role.color.text}`}>
          {role.name.charAt(0).toUpperCase()}
        </span>
      </div>

      {/* Role Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-medium truncate ${isSelected ? 'text-brand-700' : 'text-gray-900'}`}>
            {role.name}
          </span>
          {role.isSystem && (
            <span title="System Role">
              <ShieldIcon className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            </span>
          )}
          {role.isDefault && (
            <span title="Default Role">
              <CheckIcon className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate mt-0.5">
          {role.description}
        </p>
      </div>

      {/* Member Count */}
      {role.memberCount !== undefined && role.memberCount > 0 && (
        <div className="text-xs text-gray-400 flex-shrink-0">
          {role.memberCount}
        </div>
      )}
    </button>
  );
};

export default RoleList;
