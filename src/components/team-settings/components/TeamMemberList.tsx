import React, { useState, useMemo } from 'react';
import type { TeamMemberSettings, StaffRole } from '../types';
import { roleLabels, teamSettingsTokens } from '../constants';
import { Avatar, Badge, Button } from './SharedComponents';

interface TeamMemberListProps {
  members: TeamMemberSettings[];
  selectedMemberId: string | null;
  onSelectMember: (memberId: string) => void;
  onAddMember: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterRole: StaffRole | 'all';
  onFilterRoleChange: (role: StaffRole | 'all') => void;
  filterStatus: 'all' | 'active' | 'inactive';
  onFilterStatusChange: (status: 'all' | 'active' | 'inactive') => void;
  loading?: boolean;
}

// Loading skeleton component
const MemberSkeleton: React.FC = () => (
  <div className="p-4 animate-pulse">
    <div className="flex items-start gap-3">
      <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
        <div className="h-5 bg-gray-200 rounded w-16" />
      </div>
      <div className="w-5 h-5 bg-gray-200 rounded" />
    </div>
  </div>
);

export const TeamMemberList: React.FC<TeamMemberListProps> = ({
  members,
  selectedMemberId,
  onSelectMember,
  onAddMember,
  searchQuery,
  onSearchChange,
  filterRole,
  onFilterRoleChange,
  filterStatus,
  onFilterStatusChange,
  loading = false,
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        member.profile.firstName.toLowerCase().includes(searchLower) ||
        member.profile.lastName.toLowerCase().includes(searchLower) ||
        member.profile.email.toLowerCase().includes(searchLower) ||
        member.profile.displayName.toLowerCase().includes(searchLower);

      // Role filter
      const matchesRole = filterRole === 'all' || member.permissions.role === filterRole;

      // Status filter
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && member.isActive) ||
        (filterStatus === 'inactive' && !member.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [members, searchQuery, filterRole, filterStatus]);

  const getRoleColor = (role: StaffRole) => {
    return teamSettingsTokens.roleColors[role] || teamSettingsTokens.roleColors.stylist;
  };

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
            <p className="text-sm text-gray-500">{members.length} members</p>
          </div>
          <Button onClick={onAddMember} size="sm" icon={<PlusIcon />}>
            Add
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search team members..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 mt-3 text-sm text-gray-600 hover:text-gray-900"
        >
          <FilterIcon className="w-4 h-4" />
          <span>Filters</span>
          {(filterRole !== 'all' || filterStatus !== 'all') && (
            <Badge variant="info" size="sm">Active</Badge>
          )}
          <ChevronIcon className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Role</label>
              <select
                value={filterRole}
                onChange={(e) => onFilterRoleChange(e.target.value as StaffRole | 'all')}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="all">All Roles</option>
                {Object.entries(roleLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => onFilterStatusChange(e.target.value as 'all' | 'active' | 'inactive')}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            {(filterRole !== 'all' || filterStatus !== 'all') && (
              <button
                onClick={() => {
                  onFilterRoleChange('all');
                  onFilterStatusChange('all');
                }}
                className="text-xs text-cyan-600 hover:text-cyan-700"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Member List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          // Loading skeleton
          <div className="divide-y divide-gray-100">
            {[1, 2, 3, 4].map((i) => (
              <MemberSkeleton key={i} />
            ))}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <UsersIcon className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No team members found</p>
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="text-sm text-cyan-600 hover:text-cyan-700 mt-2"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredMembers.map((member) => {
              const roleColor = getRoleColor(member.permissions.role);
              const isSelected = selectedMemberId === member.id;

              return (
                <button
                  key={member.id}
                  onClick={() => onSelectMember(member.id)}
                  className={`
                    w-full p-4 text-left transition-all duration-200
                    ${isSelected
                      ? 'bg-cyan-50 border-l-4 border-cyan-500'
                      : 'hover:bg-gray-50 border-l-4 border-transparent'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <Avatar
                      src={member.profile.avatar}
                      name={`${member.profile.firstName} ${member.profile.lastName}`}
                      size="lg"
                      status={member.isActive ? 'online' : 'offline'}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 truncate">
                          {member.profile.firstName} {member.profile.lastName}
                        </h3>
                        {!member.isActive && (
                          <Badge variant="error" size="sm">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate mt-0.5">
                        {member.profile.title || member.profile.displayName}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: roleColor.bg,
                            color: roleColor.text,
                          }}
                        >
                          {roleLabels[member.permissions.role]}
                        </span>
                        {member.onlineBooking.isBookableOnline && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <GlobeIcon className="w-3 h-3" />
                            Online
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRightIcon className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-cyan-500' : 'text-gray-300'}`} />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Stats Footer */}
      <div className="p-4 border-t border-gray-100 bg-gray-50">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-lg font-semibold text-gray-900">
              {members.filter((m) => m.isActive).length}
            </p>
            <p className="text-xs text-gray-500">Active</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">
              {members.filter((m) => m.onlineBooking.isBookableOnline).length}
            </p>
            <p className="text-xs text-gray-500">Online</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">
              {new Set(members.map((m) => m.permissions.role)).size}
            </p>
            <p className="text-xs text-gray-500">Roles</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Icons
const PlusIcon: React.FC = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const FilterIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const ChevronIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const UsersIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const GlobeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default TeamMemberList;
