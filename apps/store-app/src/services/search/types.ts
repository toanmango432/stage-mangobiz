/**
 * Global Search Engine Types
 *
 * Core types for the universal search feature that searches across
 * all entities: Clients, Staff, Services, Appointments, Tickets, Transactions
 */

import type { Client } from '@/types/client';
import type { Staff } from '@/types/staff';
import type { Service } from '@/types/service';
import type { LocalAppointment } from '@/types/appointment';
import type { Ticket } from '@/types/Ticket';
import type { Transaction } from '@/types/transaction';

// ============================================================================
// Entity Types
// ============================================================================

export type SearchEntityType =
  | 'client'
  | 'staff'
  | 'service'
  | 'appointment'
  | 'ticket'
  | 'transaction'
  | 'setting'
  | 'giftcard'
  | 'page';

export type SearchPrefix =
  | ''           // General search
  | '#'          // Ticket number
  | '@'          // Client name
  | '$'          // Transaction amount
  | 'date:'      // Date filter
  | 'staff:'     // Staff name
  | 'status:'    // Status filter
  | 'service:'   // Service name
  | 'set:'       // Settings
  | 'go:';       // Go to page/navigation

// ============================================================================
// Search Result Types
// ============================================================================

export interface SearchBadge {
  label: string;
  color: 'green' | 'red' | 'orange' | 'blue' | 'purple' | 'gray' | 'amber' | 'emerald' | 'pink' | 'slate' | 'indigo';
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string; // Lucide icon name (e.g., 'Calendar', 'Phone', 'Eye')
  action: () => void | Promise<void>;
  variant?: 'default' | 'primary' | 'danger';
}

export interface SearchResult {
  /** Unique identifier (entity id) */
  id: string;
  /** Entity type for categorization and styling */
  type: SearchEntityType;
  /** Primary display text (e.g., "Emily Chen") */
  title: string;
  /** Secondary display text (e.g., "(555) 123-4567") */
  subtitle: string;
  /** Avatar URL or undefined for icon fallback */
  avatar?: string;
  /** Status/info badges to display */
  badges?: SearchBadge[];
  /** Relevance score (0-1, higher is better) */
  score: number;
  /** Which field matched the query */
  matchedField: string;
  /** Quick actions available for this result */
  actions: QuickAction[];
  /** Display data for rendering (actions use entityId, not this data) */
  data: Record<string, unknown>;
}

/** Union of all entity types that can appear in search results */
export type SearchResultData =
  | Client
  | Staff
  | Service
  | LocalAppointment
  | Ticket
  | Transaction;

// ============================================================================
// Search Options & Configuration
// ============================================================================

export interface SearchOptions {
  /** Maximum results to return (default: 20) */
  limit?: number;
  /** Filter to specific entity types */
  entityTypes?: SearchEntityType[];
  /** Minimum score threshold (default: 0.5) */
  minScore?: number;
  /** Include recent/recent items boost */
  boostRecent?: boolean;
}

export interface FuzzyMatchOptions {
  /** Score threshold for match (0-1, default: 0.6) */
  threshold?: number;
  /** Case sensitive matching (default: false) */
  caseSensitive?: boolean;
  /** Boost score for prefix/start matches */
  prefixBoost?: number;
}

export interface FuzzyMatchResult {
  /** Whether the match meets the threshold */
  isMatch: boolean;
  /** Match score (0-1) */
  score: number;
  /** Which part of target matched */
  matchedPortion?: string;
}

// ============================================================================
// Query Parser Types
// ============================================================================

export interface ParsedQuery {
  /** Type of query (general or prefix-filtered) */
  type: 'general' | 'prefix';
  /** Active prefix if any */
  prefix: SearchPrefix;
  /** Original query string */
  rawQuery: string;
  /** Normalized query (lowercase, trimmed) */
  normalizedQuery: string;
  /** Whether query looks like a phone number */
  isPhoneSearch: boolean;
  /** Extracted digits for phone search */
  phoneDigits?: string;
  /** Date filter if prefix is date: */
  dateFilter?: DateFilter;
  /** Amount filter if prefix is $ */
  amountFilter?: AmountFilter;
  /** Status filter if prefix is status: */
  statusFilter?: string;
}

export interface DateFilter {
  type: 'today' | 'tomorrow' | 'week' | 'month' | 'custom';
  start?: Date;
  end?: Date;
}

export interface AmountFilter {
  /** Minimum amount */
  min: number;
  /** Maximum amount */
  max: number;
}

// ============================================================================
// Search Index Types
// ============================================================================

export interface IndexedEntity {
  /** Unique key: "{type}:{id}" */
  key: string;
  /** Entity ID */
  id: string;
  /** Entity type */
  type: SearchEntityType;
  /** Normalized searchable text fields */
  searchableText: string[];
  /** Normalized phone numbers for phone search */
  phoneNumbers: string[];
  /** Data needed for display and actions */
  displayData: SearchResultDisplayData;
  /** Timestamp for recency ranking */
  timestamp: number;
}

export interface SearchResultDisplayData {
  title: string;
  subtitle: string;
  avatar?: string;
  badges?: SearchBadge[];
  // Entity-specific fields
  isVip?: boolean;
  isBlocked?: boolean;
  status?: string;
  phone?: string;
  email?: string;
  role?: string;
  category?: string;
  price?: number;
  duration?: number;
  total?: number;
  number?: number;
}

// ============================================================================
// Search State Types (for Redux/hooks)
// ============================================================================

export interface SearchState {
  /** Whether search modal is open */
  isOpen: boolean;
  /** Current search query */
  query: string;
  /** Active prefix filter */
  activePrefix: SearchPrefix;
  /** Search results grouped by entity type */
  results: SearchResultGroup[];
  /** Total result count across all groups */
  totalCount: number;
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Recently searched queries (max 10) */
  recentSearches: RecentSearch[];
  /** Whether search index is ready */
  indexReady: boolean;
}

export interface SearchResultGroup {
  type: SearchEntityType;
  label: string;
  icon: string; // Lucide icon name
  color: string;
  bgColor: string;
  results: SearchResult[];
}

export interface RecentSearch {
  id: string;
  query: string;
  timestamp: number;
  resultCount: number;
  /** First result type for icon hint */
  primaryResultType?: SearchEntityType;
}

// ============================================================================
// Entity Searcher Interface
// ============================================================================

export interface EntitySearcher<T = unknown> {
  /** Entity type this searcher handles */
  readonly entityType: SearchEntityType;

  /** Extract searchable fields from entity */
  getSearchableFields(entity: T): string[];

  /** Extract phone numbers from entity */
  getPhoneNumbers(entity: T): string[];

  /** Convert entity to IndexedEntity */
  toIndexedEntity(entity: T): IndexedEntity;

  /** Convert IndexedEntity to SearchResult */
  toSearchResult(indexed: IndexedEntity, score: number, matchedField: string): SearchResult;

  /** Get quick actions for this entity type */
  getQuickActions(entity: T): QuickAction[];
}

// ============================================================================
// Constants
// ============================================================================

export const ENTITY_CONFIG: Record<SearchEntityType, {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
}> = {
  client: {
    label: 'Clients',
    icon: 'UserCircle',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  staff: {
    label: 'Staff',
    icon: 'Users',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  service: {
    label: 'Services',
    icon: 'Scissors',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  appointment: {
    label: 'Appointments',
    icon: 'Calendar',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
  },
  ticket: {
    label: 'Tickets',
    icon: 'FileText',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  transaction: {
    label: 'Transactions',
    icon: 'DollarSign',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  setting: {
    label: 'Settings',
    icon: 'Settings',
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
  },
  giftcard: {
    label: 'Gift Cards',
    icon: 'Gift',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
  },
  page: {
    label: 'Pages',
    icon: 'Navigation',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
};

export const PREFIX_CONFIG: Record<SearchPrefix, {
  label: string;
  description: string;
  icon: string;
  targetEntities: SearchEntityType[];
}> = {
  '': {
    label: 'Search All',
    description: 'Search everything',
    icon: 'Search',
    targetEntities: ['client', 'staff', 'service', 'appointment', 'ticket', 'transaction', 'setting'],
  },
  '#': {
    label: 'Ticket #',
    description: 'Find by ticket number',
    icon: 'Hash',
    targetEntities: ['ticket'],
  },
  '@': {
    label: 'Client',
    description: 'Find by client name',
    icon: 'AtSign',
    targetEntities: ['client'],
  },
  '$': {
    label: 'Amount',
    description: 'Find by amount',
    icon: 'DollarSign',
    targetEntities: ['ticket', 'transaction'],
  },
  'date:': {
    label: 'Date',
    description: 'Filter by date',
    icon: 'Calendar',
    targetEntities: ['appointment', 'ticket', 'transaction'],
  },
  'staff:': {
    label: 'Staff',
    description: 'Find by staff name',
    icon: 'User',
    targetEntities: ['staff', 'appointment', 'ticket'],
  },
  'status:': {
    label: 'Status',
    description: 'Filter by status',
    icon: 'Filter',
    targetEntities: ['appointment', 'ticket', 'transaction'],
  },
  'service:': {
    label: 'Service',
    description: 'Find by service name',
    icon: 'Scissors',
    targetEntities: ['service', 'appointment', 'ticket'],
  },
  'set:': {
    label: 'Settings',
    description: 'Find app settings',
    icon: 'Settings',
    targetEntities: ['setting'],
  },
  'go:': {
    label: 'Go to',
    description: 'Navigate to a page',
    icon: 'Navigation',
    targetEntities: ['page'],
  },
};

// Default search options
export const DEFAULT_SEARCH_OPTIONS: Required<SearchOptions> = {
  limit: 20,
  entityTypes: ['client', 'staff', 'service', 'appointment', 'ticket', 'transaction', 'setting', 'page'],
  minScore: 0.4,
  boostRecent: true,
};

// Default fuzzy match options
export const DEFAULT_FUZZY_OPTIONS: Required<FuzzyMatchOptions> = {
  threshold: 0.5,
  caseSensitive: false,
  prefixBoost: 0.15,
};
