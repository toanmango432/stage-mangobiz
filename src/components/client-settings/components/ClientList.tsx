import React, { useMemo } from 'react';
import type { EnhancedClient, LoyaltyTier } from '../types';
import { tierLabels, clientSettingsTokens } from '../constants';
import {
  SearchInput,
  Button,
  Avatar,
  PlusIcon,
  PhoneIcon,
  StarIcon,
} from './SharedComponents';

interface ClientListProps {
  clients: EnhancedClient[];
  selectedClientId: string | null;
  onSelectClient: (clientId: string) => void;
  onAddClient: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterTier: LoyaltyTier | 'all';
  onFilterTierChange: (tier: LoyaltyTier | 'all') => void;
  filterStatus: 'all' | 'active' | 'blocked' | 'vip';
  onFilterStatusChange: (status: 'all' | 'active' | 'blocked' | 'vip') => void;
}

export const ClientList: React.FC<ClientListProps> = ({
  clients,
  selectedClientId,
  onSelectClient,
  onAddClient,
  searchQuery,
  onSearchChange,
  filterTier,
  onFilterTierChange,
  filterStatus,
  onFilterStatusChange,
}) => {
  // Filter and search clients
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        client.firstName.toLowerCase().includes(searchLower) ||
        client.lastName.toLowerCase().includes(searchLower) ||
        client.contact.phone.includes(searchQuery) ||
        client.contact.email?.toLowerCase().includes(searchLower);

      // Tier filter
      const matchesTier =
        filterTier === 'all' || client.loyaltyInfo.tier === filterTier;

      // Status filter
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'vip' && client.isVip) ||
        (filterStatus === 'blocked' && client.isBlocked) ||
        (filterStatus === 'active' && !client.isBlocked);

      return matchesSearch && matchesTier && matchesStatus;
    });
  }, [clients, searchQuery, filterTier, filterStatus]);

  // Sort by last visit date (most recent first)
  const sortedClients = useMemo(() => {
    return [...filteredClients].sort((a, b) => {
      const dateA = a.visitSummary.lastVisitDate || a.createdAt;
      const dateB = b.visitSummary.lastVisitDate || b.createdAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }, [filteredClients]);

  const getTierBadgeStyle = (tier: LoyaltyTier) => {
    const colors = clientSettingsTokens.tierColors[tier];
    return {
      backgroundColor: colors.bg,
      color: colors.text,
      borderColor: colors.border,
    };
  };

  const formatLastVisit = (dateStr?: string) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Clients</h2>
            <p className="text-sm text-gray-500">
              {filteredClients.length} of {clients.length} clients
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={onAddClient}>
            <PlusIcon className="w-4 h-4" />
            Add Client
          </Button>
        </div>

        {/* Search */}
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search by name, phone, or email..."
          className="mb-3"
        />

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => onFilterStatusChange(e.target.value as typeof filterStatus)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="vip">VIP</option>
            <option value="blocked">Blocked</option>
          </select>

          {/* Tier Filter */}
          <select
            value={filterTier}
            onChange={(e) => onFilterTierChange(e.target.value as LoyaltyTier | 'all')}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="all">All Tiers</option>
            <option value="bronze">Bronze</option>
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
            <option value="platinum">Platinum</option>
            <option value="vip">VIP</option>
          </select>
        </div>
      </div>

      {/* Client List */}
      <div className="flex-1 overflow-y-auto">
        {sortedClients.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <SearchInput value="" onChange={() => {}} className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No clients found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sortedClients.map((client) => (
              <button
                key={client.id}
                onClick={() => onSelectClient(client.id)}
                className={`
                  w-full p-4 text-left transition-colors duration-150
                  hover:bg-gray-50 focus:outline-none focus:bg-gray-50
                  ${selectedClientId === client.id ? 'bg-cyan-50 border-l-4 border-cyan-500' : ''}
                `}
              >
                <div className="flex items-start gap-3">
                  <Avatar
                    src={client.avatar}
                    name={`${client.firstName} ${client.lastName}`}
                    size="md"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-gray-900 truncate">
                        {client.firstName} {client.lastName}
                      </span>
                      {client.isVip && (
                        <StarIcon className="w-4 h-4 text-amber-500" filled />
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <PhoneIcon className="w-3.5 h-3.5" />
                      <span className="truncate">{client.contact.phone}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full border"
                        style={getTierBadgeStyle(client.loyaltyInfo.tier)}
                      >
                        {tierLabels[client.loyaltyInfo.tier]}
                      </span>
                      <span className="text-xs text-gray-400">
                        {client.visitSummary.totalVisits} visits
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">Last visit</p>
                    <p className="text-sm text-gray-600">
                      {formatLastVisit(client.visitSummary.lastVisitDate)}
                    </p>
                  </div>
                </div>

                {/* Tags */}
                {client.tags && client.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2 ml-13">
                    {client.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag.id}
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: `${tag.color}20`,
                          color: tag.color,
                        }}
                      >
                        {tag.name}
                      </span>
                    ))}
                    {client.tags.length > 3 && (
                      <span className="text-xs text-gray-400">
                        +{client.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientList;
