import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { clientsDB, patchTestsDB, formResponsesDB, referralsDB, clientReviewsDB, loyaltyRewardsDB } from '../../db/database';
import type {
  Client,
  ClientFilters,
  ClientSortOptions,
  BulkOperationResult,
  BlockReason,
  PatchTest,
  ClientFormResponse,
  Referral,
  ClientReview,
  LoyaltyReward,
} from '../../types';
import type { RootState } from '../index';

// ==================== STATE INTERFACE ====================

interface ClientsState {
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

const initialFilters: ClientFilters = {
  searchQuery: '',
  status: 'all',
  loyaltyTier: 'all',
};

const initialSort: ClientSortOptions = {
  field: 'name',
  order: 'asc',
};

const initialState: ClientsState = {
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

// ==================== ASYNC THUNKS ====================

// Fetch clients with filters
export const fetchClients = createAsyncThunk(
  'clients/fetchClients',
  async ({
    salonId,
    filters,
    sort,
    page = 1,
    pageSize = 50,
  }: {
    salonId: string;
    filters?: ClientFilters;
    sort?: ClientSortOptions;
    page?: number;
    pageSize?: number;
  }) => {
    const offset = (page - 1) * pageSize;
    const result = await clientsDB.getFiltered(
      salonId,
      filters || initialFilters,
      sort || initialSort,
      pageSize,
      offset
    );
    return result;
  }
);

// Search clients (quick search)
export const searchClients = createAsyncThunk(
  'clients/search',
  async ({ salonId, query }: { salonId: string; query: string }) => {
    return await clientsDB.search(salonId, query);
  }
);

// Fetch client statistics
export const fetchClientStats = createAsyncThunk(
  'clients/fetchStats',
  async (salonId: string) => {
    return await clientsDB.getStats(salonId);
  }
);

// Fetch single client by ID
export const fetchClientById = createAsyncThunk(
  'clients/fetchById',
  async (clientId: string) => {
    const client = await clientsDB.getById(clientId);
    if (!client) throw new Error('Client not found');
    return client;
  }
);

// Fetch all related data for selected client
export const fetchClientRelatedData = createAsyncThunk(
  'clients/fetchRelatedData',
  async (clientId: string) => {
    const [patchTests, formResponses, referrals, reviews, rewards] = await Promise.all([
      patchTestsDB.getByClientId(clientId),
      formResponsesDB.getByClientId(clientId),
      referralsDB.getByReferrerId(clientId),
      clientReviewsDB.getByClientId(clientId),
      loyaltyRewardsDB.getByClientId(clientId, true),
    ]);
    return { patchTests, formResponses, referrals, reviews, rewards };
  }
);

// Create client
export const createClient = createAsyncThunk(
  'clients/create',
  async (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>) => {
    return await clientsDB.create(client);
  }
);

// Update client
export const updateClient = createAsyncThunk(
  'clients/update',
  async ({ id, updates }: { id: string; updates: Partial<Client> }) => {
    const updated = await clientsDB.update(id, updates);
    if (!updated) throw new Error('Failed to update client');
    return updated;
  }
);

// Delete client
export const deleteClient = createAsyncThunk(
  'clients/delete',
  async (id: string) => {
    const success = await clientsDB.delete(id);
    if (!success) throw new Error('Failed to delete client');
    return id;
  }
);

// Block client
export const blockClient = createAsyncThunk(
  'clients/block',
  async ({
    id,
    reason,
    blockedBy,
    note,
  }: {
    id: string;
    reason: BlockReason;
    blockedBy: string;
    note?: string;
  }) => {
    const updated = await clientsDB.block(id, reason, blockedBy, note);
    if (!updated) throw new Error('Failed to block client');
    return updated;
  }
);

// Unblock client
export const unblockClient = createAsyncThunk(
  'clients/unblock',
  async (id: string) => {
    const updated = await clientsDB.unblock(id);
    if (!updated) throw new Error('Failed to unblock client');
    return updated;
  }
);

// Set staff alert
export const setClientStaffAlert = createAsyncThunk(
  'clients/setStaffAlert',
  async ({
    id,
    message,
    createdBy,
    createdByName,
  }: {
    id: string;
    message: string;
    createdBy: string;
    createdByName?: string;
  }) => {
    const updated = await clientsDB.setStaffAlert(id, message, createdBy, createdByName);
    if (!updated) throw new Error('Failed to set staff alert');
    return updated;
  }
);

// Clear staff alert
export const clearClientStaffAlert = createAsyncThunk(
  'clients/clearStaffAlert',
  async (id: string) => {
    const updated = await clientsDB.clearStaffAlert(id);
    if (!updated) throw new Error('Failed to clear staff alert');
    return updated;
  }
);

// Set VIP status
export const setClientVipStatus = createAsyncThunk(
  'clients/setVipStatus',
  async ({ id, isVip }: { id: string; isVip: boolean }) => {
    const updated = await clientsDB.setVipStatus(id, isVip);
    if (!updated) throw new Error('Failed to update VIP status');
    return updated;
  }
);

// Bulk update clients
export const bulkUpdateClients = createAsyncThunk(
  'clients/bulkUpdate',
  async ({ ids, updates }: { ids: string[]; updates: Partial<Client> }) => {
    return await clientsDB.bulkUpdate(ids, updates);
  }
);

// Bulk delete clients
export const bulkDeleteClients = createAsyncThunk(
  'clients/bulkDelete',
  async (ids: string[]) => {
    return await clientsDB.bulkDelete(ids);
  }
);

// ==================== PATCH TEST THUNKS ====================

export const createPatchTest = createAsyncThunk(
  'clients/createPatchTest',
  async (patchTest: Omit<PatchTest, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>) => {
    return await patchTestsDB.create(patchTest);
  }
);

export const updatePatchTest = createAsyncThunk(
  'clients/updatePatchTest',
  async ({ id, updates }: { id: string; updates: Partial<PatchTest> }) => {
    const updated = await patchTestsDB.update(id, updates);
    if (!updated) throw new Error('Failed to update patch test');
    return updated;
  }
);

// ==================== SLICE ====================

const clientsSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {
    // Set filters
    setFilters(state, action: PayloadAction<Partial<ClientFilters>>) {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1; // Reset to first page on filter change
    },

    // Reset filters
    resetFilters(state) {
      state.filters = initialFilters;
      state.pagination.page = 1;
    },

    // Set sort
    setSort(state, action: PayloadAction<ClientSortOptions>) {
      state.sort = action.payload;
    },

    // Set page
    setPage(state, action: PayloadAction<number>) {
      state.pagination.page = action.payload;
    },

    // Set page size
    setPageSize(state, action: PayloadAction<number>) {
      state.pagination.pageSize = action.payload;
      state.pagination.page = 1;
    },

    // Select client
    selectClient(state, action: PayloadAction<Client | null>) {
      state.selectedClient = action.payload;
      if (!action.payload) {
        state.selectedClientPatchTests = [];
        state.selectedClientFormResponses = [];
        state.selectedClientReferrals = [];
        state.selectedClientReviews = [];
        state.selectedClientRewards = [];
      }
    },

    // Clear search results
    clearSearchResults(state) {
      state.searchResults = [];
    },

    // Clear error
    clearError(state) {
      state.error = null;
    },

    // Optimistic update for client in list
    optimisticUpdateClient(state, action: PayloadAction<Client>) {
      const index = state.items.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
      if (state.selectedClient?.id === action.payload.id) {
        state.selectedClient = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch clients
    builder
      .addCase(fetchClients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.clients;
        state.total = action.payload.total;
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch clients';
      });

    // Search clients
    builder
      .addCase(searchClients.pending, (state) => {
        state.loading = true;
      })
      .addCase(searchClients.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchClients.rejected, (state) => {
        state.loading = false;
      });

    // Fetch stats
    builder
      .addCase(fetchClientStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });

    // Fetch client by ID
    builder
      .addCase(fetchClientById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClientById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedClient = action.payload;
      })
      .addCase(fetchClientById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch client';
      });

    // Fetch related data
    builder
      .addCase(fetchClientRelatedData.fulfilled, (state, action) => {
        state.selectedClientPatchTests = action.payload.patchTests;
        state.selectedClientFormResponses = action.payload.formResponses;
        state.selectedClientReferrals = action.payload.referrals;
        state.selectedClientReviews = action.payload.reviews;
        state.selectedClientRewards = action.payload.rewards;
      });

    // Create client
    builder
      .addCase(createClient.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createClient.fulfilled, (state, action) => {
        state.saving = false;
        state.items.unshift(action.payload);
        state.total += 1;
        state.stats.total += 1;
        state.stats.newThisMonth += 1;
      })
      .addCase(createClient.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message || 'Failed to create client';
      });

    // Update client
    builder
      .addCase(updateClient.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateClient.fulfilled, (state, action) => {
        state.saving = false;
        const index = state.items.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.selectedClient?.id === action.payload.id) {
          state.selectedClient = action.payload;
        }
      })
      .addCase(updateClient.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message || 'Failed to update client';
      });

    // Delete client
    builder
      .addCase(deleteClient.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(deleteClient.fulfilled, (state, action) => {
        state.saving = false;
        state.items = state.items.filter(c => c.id !== action.payload);
        state.total -= 1;
        if (state.selectedClient?.id === action.payload) {
          state.selectedClient = null;
        }
      })
      .addCase(deleteClient.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message || 'Failed to delete client';
      });

    // Block client
    builder
      .addCase(blockClient.fulfilled, (state, action) => {
        const index = state.items.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.selectedClient?.id === action.payload.id) {
          state.selectedClient = action.payload;
        }
        state.stats.blocked += 1;
      });

    // Unblock client
    builder
      .addCase(unblockClient.fulfilled, (state, action) => {
        const index = state.items.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.selectedClient?.id === action.payload.id) {
          state.selectedClient = action.payload;
        }
        state.stats.blocked = Math.max(0, state.stats.blocked - 1);
      });

    // Set staff alert
    builder
      .addCase(setClientStaffAlert.fulfilled, (state, action) => {
        const index = state.items.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.selectedClient?.id === action.payload.id) {
          state.selectedClient = action.payload;
        }
      });

    // Clear staff alert
    builder
      .addCase(clearClientStaffAlert.fulfilled, (state, action) => {
        const index = state.items.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.selectedClient?.id === action.payload.id) {
          state.selectedClient = action.payload;
        }
      });

    // Set VIP status
    builder
      .addCase(setClientVipStatus.fulfilled, (state, action) => {
        const index = state.items.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.selectedClient?.id === action.payload.id) {
          state.selectedClient = action.payload;
        }
        // Update VIP count
        if (action.payload.isVip) {
          state.stats.vip += 1;
        } else {
          state.stats.vip = Math.max(0, state.stats.vip - 1);
        }
      });

    // Bulk operations
    builder
      .addCase(bulkUpdateClients.pending, (state) => {
        state.saving = true;
      })
      .addCase(bulkUpdateClients.fulfilled, (state) => {
        state.saving = false;
        // Refetch will update the list
      })
      .addCase(bulkUpdateClients.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message || 'Bulk update failed';
      });

    builder
      .addCase(bulkDeleteClients.pending, (state) => {
        state.saving = true;
      })
      .addCase(bulkDeleteClients.fulfilled, (state, action) => {
        state.saving = false;
        const deletedIds = new Set(
          action.meta.arg.filter((_, i) => i < action.payload.processedCount)
        );
        state.items = state.items.filter(c => !deletedIds.has(c.id));
        state.total -= action.payload.processedCount;
      })
      .addCase(bulkDeleteClients.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message || 'Bulk delete failed';
      });

    // Patch test operations
    builder
      .addCase(createPatchTest.fulfilled, (state, action) => {
        if (state.selectedClient?.id === action.payload.clientId) {
          state.selectedClientPatchTests.unshift(action.payload);
        }
      });

    builder
      .addCase(updatePatchTest.fulfilled, (state, action) => {
        const index = state.selectedClientPatchTests.findIndex(pt => pt.id === action.payload.id);
        if (index !== -1) {
          state.selectedClientPatchTests[index] = action.payload;
        }
      });
  },
});

// ==================== ACTIONS ====================

export const {
  setFilters,
  resetFilters,
  setSort,
  setPage,
  setPageSize,
  selectClient,
  clearSearchResults,
  clearError,
  optimisticUpdateClient,
} = clientsSlice.actions;

// ==================== SELECTORS ====================

export const selectClients = (state: RootState) => state.clients.items;
export const selectClientsTotal = (state: RootState) => state.clients.total;
export const selectSearchResults = (state: RootState) => state.clients.searchResults;
export const selectSelectedClient = (state: RootState) => state.clients.selectedClient;
export const selectSelectedClientPatchTests = (state: RootState) => state.clients.selectedClientPatchTests;
export const selectSelectedClientFormResponses = (state: RootState) => state.clients.selectedClientFormResponses;
export const selectSelectedClientReferrals = (state: RootState) => state.clients.selectedClientReferrals;
export const selectSelectedClientReviews = (state: RootState) => state.clients.selectedClientReviews;
export const selectSelectedClientRewards = (state: RootState) => state.clients.selectedClientRewards;
export const selectClientFilters = (state: RootState) => state.clients.filters;
export const selectClientSort = (state: RootState) => state.clients.sort;
export const selectClientPagination = (state: RootState) => state.clients.pagination;
export const selectClientStats = (state: RootState) => state.clients.stats;
export const selectClientsLoading = (state: RootState) => state.clients.loading;
export const selectClientsSaving = (state: RootState) => state.clients.saving;
export const selectClientsError = (state: RootState) => state.clients.error;

// Computed selectors
export const selectBlockedClients = (state: RootState) =>
  state.clients.items.filter(c => c.isBlocked);

export const selectVipClients = (state: RootState) =>
  state.clients.items.filter(c => c.isVip);

export const selectClientsWithAlerts = (state: RootState) =>
  state.clients.items.filter(c => c.staffAlert);

export default clientsSlice.reducer;
