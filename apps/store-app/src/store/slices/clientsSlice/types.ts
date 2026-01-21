import type {
  Client,
  ClientFilters,
  ClientSortOptions,
  PatchTest,
  ClientFormResponse,
  Referral,
  ClientReview,
  LoyaltyReward,
} from '../../../types';

// ==================== MERGE OPERATION TYPES ====================

/** Options for merging two clients */
export interface MergeClientOptions {
  /** Whether to merge notes from secondary client into primary */
  mergeNotes: boolean;
  /** Whether to combine loyalty points from both clients */
  mergeLoyalty: boolean;
  /** Whether to merge preferences from secondary client */
  mergePreferences: boolean;
  /** Whether to merge alerts from secondary client */
  mergeAlerts: boolean;
}

/** Parameters for the merge clients operation */
export interface MergeClientParams {
  /** The client ID to keep (primary) */
  primaryClientId: string;
  /** The client ID to merge into primary and archive */
  secondaryClientId: string;
  /** Merge options controlling what data to combine */
  options: MergeClientOptions;
  /** Staff ID performing the merge */
  mergedBy: string;
}

// ==================== STATE INTERFACE ====================

export interface ClientsState {
  // Client list
  items: Client[];
  total: number;
  searchResults: Client[];

  // Selected client and related data
  selectedClient: Client | null;
  selectedClientPatchTests: PatchTest[];
  selectedClientFormResponses: ClientFormResponse[];
  selectedClientReferrals: Referral[];
  selectedClientReviews: ClientReview[];
  selectedClientRewards: LoyaltyReward[];

  // Filters, sorting, pagination
  filters: ClientFilters;
  sort: ClientSortOptions;
  pagination: {
    page: number;
    pageSize: number;
  };

  // Statistics
  stats: {
    total: number;
    blocked: number;
    vip: number;
    newThisMonth: number;
  };

  // UI state
  loading: boolean;
  saving: boolean;
  error: string | null;
}

export const initialFilters: ClientFilters = {
  searchQuery: '',
  status: 'all',
  loyaltyTier: 'all',
};

export const initialSort: ClientSortOptions = {
  field: 'name',
  order: 'asc',
};

export const initialState: ClientsState = {
  items: [],
  total: 0,
  searchResults: [],
  selectedClient: null,
  selectedClientPatchTests: [],
  selectedClientFormResponses: [],
  selectedClientReferrals: [],
  selectedClientReviews: [],
  selectedClientRewards: [],
  filters: initialFilters,
  sort: initialSort,
  pagination: {
    page: 1,
    pageSize: 50,
  },
  stats: {
    total: 0,
    blocked: 0,
    vip: 0,
    newThisMonth: 0,
  },
  loading: false,
  saving: false,
  error: null,
};
