import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Client, ClientFilters, ClientSortOptions } from '../../../types';
import { initialState, initialFilters } from './types';
import {
  fetchClientsFromSupabase,
  searchClientsFromSupabase,
  fetchClientByIdFromSupabase,
  createClientInSupabase,
  updateClientInSupabase,
  deleteClientInSupabase,
  mergeClientsInSupabase,
  checkPatchTestRequired,
  fetchClients,
  searchClients,
  fetchClientStats,
  fetchClientById,
  fetchClientRelatedData,
  createClient,
  updateClient,
  deleteClient,
  blockClient,
  unblockClient,
  setClientStaffAlert,
  clearClientStaffAlert,
  setClientVipStatus,
  bulkUpdateClients,
  bulkDeleteClients,
  createPatchTest,
  updatePatchTest,
  earnLoyaltyPoints,
  redeemLoyaltyPoints,
  generateClientReferralCode,
  applyReferralCode,
  completeReferral,
} from './thunks';

// ==================== SLICE ====================

export const clientsSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {
    setFilters(state, action: PayloadAction<Partial<ClientFilters>>) {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1;
    },

    resetFilters(state) {
      state.filters = initialFilters;
      state.pagination.page = 1;
    },

    setSort(state, action: PayloadAction<ClientSortOptions>) {
      state.sort = action.payload;
    },

    setPage(state, action: PayloadAction<number>) {
      state.pagination.page = action.payload;
    },

    setPageSize(state, action: PayloadAction<number>) {
      state.pagination.pageSize = action.payload;
      state.pagination.page = 1;
    },

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

    clearSearchResults(state) {
      state.searchResults = [];
    },

    clearError(state) {
      state.error = null;
    },

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

    // ==================== SUPABASE THUNKS REDUCERS (Phase 6) ====================

    // Fetch clients from Supabase
    builder
      .addCase(fetchClientsFromSupabase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClientsFromSupabase.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.total = action.payload.length;
      })
      .addCase(fetchClientsFromSupabase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch clients from Supabase';
      });

    // Search clients from Supabase
    builder
      .addCase(searchClientsFromSupabase.pending, (state) => {
        state.loading = true;
      })
      .addCase(searchClientsFromSupabase.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchClientsFromSupabase.rejected, (state) => {
        state.loading = false;
      });

    // Fetch client by ID from Supabase
    builder
      .addCase(fetchClientByIdFromSupabase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClientByIdFromSupabase.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedClient = action.payload;
      })
      .addCase(fetchClientByIdFromSupabase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch client from Supabase';
      });

    // Create client in Supabase
    builder
      .addCase(createClientInSupabase.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createClientInSupabase.fulfilled, (state, action) => {
        state.saving = false;
        state.items.unshift(action.payload);
        state.total += 1;
        state.stats.total += 1;
        state.stats.newThisMonth += 1;
      })
      .addCase(createClientInSupabase.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message || 'Failed to create client in Supabase';
      });

    // Update client in Supabase
    builder
      .addCase(updateClientInSupabase.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateClientInSupabase.fulfilled, (state, action) => {
        state.saving = false;
        const index = state.items.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.selectedClient?.id === action.payload.id) {
          state.selectedClient = action.payload;
        }
      })
      .addCase(updateClientInSupabase.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message || 'Failed to update client in Supabase';
      });

    // Delete client in Supabase
    builder
      .addCase(deleteClientInSupabase.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(deleteClientInSupabase.fulfilled, (state, action) => {
        state.saving = false;
        state.items = state.items.filter(c => c.id !== action.payload);
        state.total -= 1;
        if (state.selectedClient?.id === action.payload) {
          state.selectedClient = null;
        }
      })
      .addCase(deleteClientInSupabase.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message || 'Failed to delete client in Supabase';
      });

    // Merge clients in Supabase
    builder
      .addCase(mergeClientsInSupabase.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(mergeClientsInSupabase.fulfilled, (state, action) => {
        state.saving = false;
        const { primaryClient, secondaryClientId } = action.payload;

        // Update the primary client in the items array
        const primaryIndex = state.items.findIndex(c => c.id === primaryClient.id);
        if (primaryIndex !== -1) {
          state.items[primaryIndex] = primaryClient;
        }

        // Remove the secondary client from the items array (it's now merged/archived)
        state.items = state.items.filter(c => c.id !== secondaryClientId);
        state.total -= 1;

        // Update selected client if it was the primary
        if (state.selectedClient?.id === primaryClient.id) {
          state.selectedClient = primaryClient;
        }

        // Clear selected client if it was the secondary
        if (state.selectedClient?.id === secondaryClientId) {
          state.selectedClient = null;
        }
      })
      .addCase(mergeClientsInSupabase.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message || 'Failed to merge clients';
      });

    // Check patch test required (validation thunk)
    // Note: This thunk is primarily used for immediate validation feedback.
    // The component awaits the result directly. These handlers provide
    // loading state tracking if needed for UI indicators.
    builder
      .addCase(checkPatchTestRequired.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkPatchTestRequired.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(checkPatchTestRequired.rejected, (state) => {
        state.loading = false;
        // Error is handled by the component directly via the rejected promise
        // No need to set state.error as this would override other error messages
      });

    // ==================== LOYALTY THUNKS REDUCERS ====================

    // Earn loyalty points
    builder
      .addCase(earnLoyaltyPoints.fulfilled, (state, action) => {
        const { client } = action.payload;
        const index = state.items.findIndex(c => c.id === client.id);
        if (index !== -1) {
          state.items[index] = client;
        }
        if (state.selectedClient?.id === client.id) {
          state.selectedClient = client;
        }
      })
      .addCase(earnLoyaltyPoints.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to earn loyalty points';
      });

    // Redeem loyalty points
    builder
      .addCase(redeemLoyaltyPoints.fulfilled, (state, action) => {
        const client = action.payload;
        const index = state.items.findIndex(c => c.id === client.id);
        if (index !== -1) {
          state.items[index] = client;
        }
        if (state.selectedClient?.id === client.id) {
          state.selectedClient = client;
        }
      })
      .addCase(redeemLoyaltyPoints.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to redeem loyalty points';
      });

    // Generate referral code
    builder
      .addCase(generateClientReferralCode.fulfilled, (state, action) => {
        const client = action.payload;
        const index = state.items.findIndex(c => c.id === client.id);
        if (index !== -1) {
          state.items[index] = client;
        }
        if (state.selectedClient?.id === client.id) {
          state.selectedClient = client;
        }
      })
      .addCase(generateClientReferralCode.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to generate referral code';
      });

    // Apply referral code
    builder
      .addCase(applyReferralCode.fulfilled, (state, action) => {
        const { newClient } = action.payload;
        const index = state.items.findIndex(c => c.id === newClient.id);
        if (index !== -1) {
          state.items[index] = newClient;
        }
        if (state.selectedClient?.id === newClient.id) {
          state.selectedClient = newClient;
        }
      })
      .addCase(applyReferralCode.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to apply referral code';
      });

    // Complete referral
    builder
      .addCase(completeReferral.fulfilled, (state, action) => {
        const { referrer, referredClient, referral } = action.payload;

        const referrerIndex = state.items.findIndex(c => c.id === referrer.id);
        if (referrerIndex !== -1) {
          state.items[referrerIndex] = referrer;
        }

        const referredIndex = state.items.findIndex(c => c.id === referredClient.id);
        if (referredIndex !== -1) {
          state.items[referredIndex] = referredClient;
        }

        if (state.selectedClient?.id === referrer.id || state.selectedClient?.id === referredClient.id) {
          const existingIndex = state.selectedClientReferrals.findIndex(r => r.id === referral.id);
          if (existingIndex !== -1) {
            state.selectedClientReferrals[existingIndex] = referral;
          } else {
            state.selectedClientReferrals.push(referral);
          }
        }
      })
      .addCase(completeReferral.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to complete referral';
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

export default clientsSlice.reducer;
