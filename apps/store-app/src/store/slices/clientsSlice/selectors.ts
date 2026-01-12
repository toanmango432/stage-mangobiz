import type { RootState } from '../../index';

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
