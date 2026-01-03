import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { clientsDB, patchTestsDB, formResponsesDB, referralsDB, clientReviewsDB, loyaltyRewardsDB, reviewRequestsDB, customSegmentsDB } from '../../db/database';
import { dataService } from '../../services/dataService';
import { auditLogger } from '../../services/audit/auditLogger';
// toClient/toClients/etc not needed - dataService returns converted types
import type {
  Client,
  ClientFilters,
  ClientSortOptions,
  BlockReason,
  PatchTest,
  ClientFormResponse,
  Referral,
  ClientReview,
  LoyaltyReward,
  ReviewRequest,
  CustomSegment,
  ClientSegment,
  SegmentAnalytics,
  SegmentFilterGroup,
} from '../../types';
import type { EarnPointsInput, LoyaltyCalculationResult } from '../../types/loyalty';
import {
  calculateLoyaltyEarnings,
  buildUpdatedLoyaltyInfo,
  buildLoyaltyInfoAfterRedemption,
} from '../../utils/loyaltyCalculations';
import {
  generateReferralCode,
  calculateReferrerReward,
  calculateReferredDiscount,
  isReferralExpired,
  DEFAULT_REFERRAL_SETTINGS,
} from '../../constants/referralConfig';
import {
  DEFAULT_REVIEW_SETTINGS,
  canRequestReview,
  calculateExpirationDate,
} from '../../constants/reviewConfig';
import {
  DEFAULT_SEGMENT_THRESHOLDS,
  getSegmentAnalytics,
  filterClientsBySegment,
  filterClientsByCustomSegment,
  generateSegmentExportCsv,
} from '../../constants/segmentationConfig';
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

// ==================== SUPABASE THUNKS (Phase 6) ====================

/**
 * Fetch all clients from Supabase via dataService
 * Uses type adapters to convert Supabase rows to app types
 * Note: storeId is obtained internally from Redux auth state
 */
export const fetchClientsFromSupabase = createAsyncThunk(
  'clients/fetchFromSupabase',
  async () => {
    // dataService already returns Client[] (converted)
    return await dataService.clients.getAll();
  }
);

/**
 * Search clients from Supabase
 * Note: storeId is obtained internally from Redux auth state
 */
export const searchClientsFromSupabase = createAsyncThunk(
  'clients/searchFromSupabase',
  async (query: string) => {
    // dataService already returns Client[] (converted)
    return await dataService.clients.search(query);
  }
);

/**
 * Fetch single client by ID from Supabase
 */
export const fetchClientByIdFromSupabase = createAsyncThunk(
  'clients/fetchByIdFromSupabase',
  async (clientId: string) => {
    // dataService already returns Client (converted)
    const client = await dataService.clients.getById(clientId);
    if (!client) throw new Error('Client not found');
    return client;
  }
);

/**
 * Create client in Supabase via dataService
 * Note: storeId is obtained internally from Redux auth state
 */
export const createClientInSupabase = createAsyncThunk(
  'clients/createInSupabase',
  async (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    // dataService.clients.create returns Client directly
    const created = await dataService.clients.create(client);

    // Audit log client creation
    auditLogger.log({
      action: 'create',
      entityType: 'client',
      entityId: created.id,
      description: `Created client: ${created.firstName} ${created.lastName}`,
      severity: 'low',
      success: true,
      newData: { firstName: created.firstName, lastName: created.lastName, phone: created.phone, email: created.email },
    }).catch(console.warn);

    return created;
  }
);

/**
 * Update client in Supabase via dataService
 */
export const updateClientInSupabase = createAsyncThunk(
  'clients/updateInSupabase',
  async ({ id, updates }: { id: string; updates: Partial<Client> }) => {
    // dataService.clients.update returns Client directly
    const updated = await dataService.clients.update(id, updates);
    if (!updated) throw new Error('Failed to update client');

    // Audit log client update
    auditLogger.log({
      action: 'update',
      entityType: 'client',
      entityId: id,
      description: `Updated client: ${updated.firstName} ${updated.lastName}`,
      severity: 'low',
      success: true,
      changedFields: Object.keys(updates),
      newData: updates,
    }).catch(console.warn);

    return updated;
  }
);

/**
 * Delete client in Supabase via dataService
 */
export const deleteClientInSupabase = createAsyncThunk(
  'clients/deleteInSupabase',
  async (id: string, { getState }) => {
    // Get client info before deletion for audit log
    const state = getState() as { clients: { items: Client[] } };
    const client = state.clients.items.find(c => c.id === id);

    await dataService.clients.delete(id);

    // Audit log client deletion
    auditLogger.log({
      action: 'delete',
      entityType: 'client',
      entityId: id,
      description: client ? `Deleted client: ${client.firstName} ${client.lastName}` : `Deleted client: ${id}`,
      severity: 'medium',
      success: true,
      oldData: client ? { firstName: client.firstName, lastName: client.lastName } : undefined,
    }).catch(console.warn);

    return id;
  }
);

// ==================== LEGACY ASYNC THUNKS (IndexedDB) ====================

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

    // Audit log client blocked (high severity)
    auditLogger.log({
      action: 'update',
      entityType: 'client',
      entityId: id,
      description: `Client ${updated.firstName} ${updated.lastName} blocked: ${reason}`,
      severity: 'high',
      success: true,
      metadata: { reason, blockedBy, note },
    }).catch(console.warn);

    return updated;
  }
);

// Unblock client
export const unblockClient = createAsyncThunk(
  'clients/unblock',
  async (id: string) => {
    const updated = await clientsDB.unblock(id);
    if (!updated) throw new Error('Failed to unblock client');

    // Audit log client unblocked
    auditLogger.log({
      action: 'update',
      entityType: 'client',
      entityId: id,
      description: `Client ${updated.firstName} ${updated.lastName} unblocked`,
      severity: 'medium',
      success: true,
    }).catch(console.warn);

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

    // Audit log VIP status change
    auditLogger.log({
      action: 'update',
      entityType: 'client',
      entityId: id,
      description: `Client ${updated.firstName} ${updated.lastName} VIP status ${isVip ? 'enabled' : 'removed'}`,
      severity: 'medium',
      success: true,
      metadata: { isVip },
    }).catch(console.warn);

    return updated;
  }
);

// Bulk update clients
export const bulkUpdateClients = createAsyncThunk(
  'clients/bulkUpdate',
  async ({ ids, updates }: { ids: string[]; updates: Partial<Client> }) => {
    const result = await clientsDB.bulkUpdate(ids, updates);

    // Audit log bulk update
    auditLogger.log({
      action: 'update',
      entityType: 'client',
      description: `Bulk updated ${ids.length} clients`,
      severity: 'medium',
      success: true,
      metadata: { clientIds: ids, updateFields: Object.keys(updates) },
    }).catch(console.warn);

    return result;
  }
);

// Bulk delete clients
export const bulkDeleteClients = createAsyncThunk(
  'clients/bulkDelete',
  async (ids: string[]) => {
    const result = await clientsDB.bulkDelete(ids);

    // Audit log bulk delete (high severity - destructive operation)
    auditLogger.log({
      action: 'delete',
      entityType: 'client',
      description: `Bulk deleted ${ids.length} clients`,
      severity: 'high',
      success: true,
      metadata: { clientIds: ids },
    }).catch(console.warn);

    return result;
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

// ==================== LOYALTY THUNKS ====================

/**
 * Earn loyalty points after a completed transaction
 * Calculates points based on tier multiplier and updates client
 */
export const earnLoyaltyPoints = createAsyncThunk<
  { client: Client; result: LoyaltyCalculationResult },
  EarnPointsInput
>(
  'clients/earnLoyaltyPoints',
  async (input: EarnPointsInput) => {
    // Fetch the client
    const client = await clientsDB.getById(input.clientId);
    if (!client) {
      throw new Error('Client not found');
    }

    // Calculate points earned and tier changes
    const result = calculateLoyaltyEarnings(client, input);

    // If no points earned (excluded or disabled), return early
    if (result.pointsEarned === 0) {
      return { client, result };
    }

    // Build updated loyalty info
    const updatedLoyaltyInfo = buildUpdatedLoyaltyInfo(client.loyaltyInfo, result);

    // Update client with new loyalty info and visit summary
    const currentTotalSpent = client.visitSummary?.totalSpent || 0;
    const currentVisits = client.visitSummary?.totalVisits || 0;

    const updates: Partial<Client> = {
      loyaltyInfo: updatedLoyaltyInfo,
      visitSummary: {
        ...client.visitSummary,
        totalSpent: currentTotalSpent + input.subtotal,
        totalVisits: currentVisits + 1,
        lastVisitDate: new Date().toISOString(),
        averageTicket: (currentTotalSpent + input.subtotal) / (currentVisits + 1),
        noShowCount: client.visitSummary?.noShowCount || 0,
        lateCancelCount: client.visitSummary?.lateCancelCount || 0,
      },
    };

    const updatedClient = await clientsDB.update(input.clientId, updates);
    if (!updatedClient) {
      throw new Error('Failed to update client loyalty');
    }

    // Audit log loyalty points earned
    auditLogger.log({
      action: 'update',
      entityType: 'client',
      entityId: input.clientId,
      description: `Client ${updatedClient.firstName} ${updatedClient.lastName} earned ${result.pointsEarned} loyalty points`,
      severity: 'low',
      success: true,
      metadata: {
        pointsEarned: result.pointsEarned,
        newBalance: updatedLoyaltyInfo.pointsBalance,
        tierChanged: result.tierChanged,
        transactionId: input.transactionId,
      },
    }).catch(console.warn);

    return { client: updatedClient, result };
  }
);

/**
 * Redeem loyalty points during checkout
 * Deducts points from client balance
 */
export const redeemLoyaltyPoints = createAsyncThunk<
  Client,
  { clientId: string; pointsToRedeem: number; transactionId?: string }
>(
  'clients/redeemLoyaltyPoints',
  async ({ clientId, pointsToRedeem }) => {
    // Fetch the client
    const client = await clientsDB.getById(clientId);
    if (!client) {
      throw new Error('Client not found');
    }

    // Check if client has enough points
    const availablePoints = client.loyaltyInfo?.pointsBalance || 0;
    if (pointsToRedeem > availablePoints) {
      throw new Error(`Insufficient points. Available: ${availablePoints}, Requested: ${pointsToRedeem}`);
    }

    // Build updated loyalty info
    const updatedLoyaltyInfo = buildLoyaltyInfoAfterRedemption(client.loyaltyInfo, pointsToRedeem);

    // Update client
    const updatedClient = await clientsDB.update(clientId, {
      loyaltyInfo: updatedLoyaltyInfo,
    });

    if (!updatedClient) {
      throw new Error('Failed to update client after points redemption');
    }

    // Audit log loyalty points redemption
    auditLogger.log({
      action: 'update',
      entityType: 'client',
      entityId: clientId,
      description: `Client ${updatedClient.firstName} ${updatedClient.lastName} redeemed ${pointsToRedeem} loyalty points`,
      severity: 'medium',
      success: true,
      metadata: {
        pointsRedeemed: pointsToRedeem,
        previousBalance: availablePoints,
        newBalance: updatedLoyaltyInfo.pointsBalance,
      },
    }).catch(console.warn);

    return updatedClient;
  }
);

// ==================== REFERRAL THUNKS ====================

/**
 * Generate a referral code for a client
 */
export const generateClientReferralCode = createAsyncThunk<
  Client,
  { clientId: string }
>(
  'clients/generateReferralCode',
  async ({ clientId }) => {
    const client = await clientsDB.getById(clientId);
    if (!client) {
      throw new Error('Client not found');
    }

    // Check if client already has a code
    if (client.loyaltyInfo?.referralCode) {
      return client; // Already has a code
    }

    // Generate unique code
    const code = generateReferralCode(
      DEFAULT_REFERRAL_SETTINGS.codeFormat,
      DEFAULT_REFERRAL_SETTINGS.codeLength,
      DEFAULT_REFERRAL_SETTINGS.codePrefix,
      client.name
    );

    // Update client with referral code
    const updatedClient = await clientsDB.update(clientId, {
      loyaltyInfo: {
        tier: client.loyaltyInfo?.tier || 'bronze',
        pointsBalance: client.loyaltyInfo?.pointsBalance || 0,
        lifetimePoints: client.loyaltyInfo?.lifetimePoints || 0,
        referralCount: client.loyaltyInfo?.referralCount || 0,
        rewardsRedeemed: client.loyaltyInfo?.rewardsRedeemed || 0,
        ...client.loyaltyInfo,
        referralCode: code,
      },
    });

    if (!updatedClient) {
      throw new Error('Failed to update client with referral code');
    }

    return updatedClient;
  }
);

/**
 * Apply a referral code when a new client signs up
 */
export const applyReferralCode = createAsyncThunk<
  { referral: Referral; referrer: Client; newClient: Client },
  { newClientId: string; referralCode: string }
>(
  'clients/applyReferralCode',
  async ({ newClientId, referralCode }) => {
    // Find the referrer by their referral code
    const allClients = await clientsDB.getAll(''); // Get all clients to search
    const referrer = allClients.find(c => c.loyaltyInfo?.referralCode === referralCode);

    if (!referrer) {
      throw new Error('Invalid referral code');
    }

    // Get the new client
    const newClient = await clientsDB.getById(newClientId);
    if (!newClient) {
      throw new Error('New client not found');
    }

    // Check if new client was already referred
    if (newClient.loyaltyInfo?.referredBy) {
      throw new Error('Client has already been referred');
    }

    // Create the referral record
    const referral = await referralsDB.create({
      referrerClientId: referrer.id,
      referredClientId: newClientId,
      referredClientName: newClient.name,
      referralLinkCode: referralCode,
      referrerRewardIssued: false,
      referredRewardIssued: false,
    });

    // Update new client with referredBy info
    const updatedNewClient = await clientsDB.update(newClientId, {
      loyaltyInfo: {
        tier: newClient.loyaltyInfo?.tier || 'bronze',
        pointsBalance: newClient.loyaltyInfo?.pointsBalance || 0,
        lifetimePoints: newClient.loyaltyInfo?.lifetimePoints || 0,
        referralCount: newClient.loyaltyInfo?.referralCount || 0,
        rewardsRedeemed: newClient.loyaltyInfo?.rewardsRedeemed || 0,
        ...newClient.loyaltyInfo,
        referredBy: referrer.id,
      },
      source: 'referral',
      sourceDetails: `Referred by ${referrer.name}`,
    });

    if (!updatedNewClient) {
      throw new Error('Failed to update new client');
    }

    return { referral, referrer, newClient: updatedNewClient };
  }
);

/**
 * Complete a referral after the referred client's first appointment
 * Issues rewards to both referrer and referred client
 */
export const completeReferral = createAsyncThunk<
  { referral: Referral; referrer: Client; referredClient: Client },
  { referralId: string; appointmentId: string; transactionAmount: number }
>(
  'clients/completeReferral',
  async ({ referralId, appointmentId, transactionAmount }) => {
    // Get the referral
    const referral = await referralsDB.getById(referralId);
    if (!referral) {
      throw new Error('Referral not found');
    }

    // Check if already completed
    if (referral.completedAt) {
      throw new Error('Referral already completed');
    }

    // Check if expired
    if (isReferralExpired(referral.createdAt, DEFAULT_REFERRAL_SETTINGS.expirationDays)) {
      throw new Error('Referral has expired');
    }

    // Check minimum spend requirement
    if (DEFAULT_REFERRAL_SETTINGS.minimumSpend && transactionAmount < DEFAULT_REFERRAL_SETTINGS.minimumSpend) {
      throw new Error(`Minimum spend of $${DEFAULT_REFERRAL_SETTINGS.minimumSpend} required`);
    }

    // Get both clients
    const referrer = await clientsDB.getById(referral.referrerClientId);
    const referredClient = await clientsDB.getById(referral.referredClientId);

    if (!referrer || !referredClient) {
      throw new Error('Referrer or referred client not found');
    }

    // Complete the referral
    const completedReferral = await referralsDB.completeReferral(referralId, appointmentId);
    if (!completedReferral) {
      throw new Error('Failed to complete referral');
    }

    // Calculate and issue rewards
    const reward = calculateReferrerReward(DEFAULT_REFERRAL_SETTINGS);

    // Update referrer - add reward (as credit or points)
    let updatedReferrer = referrer;
    if (DEFAULT_REFERRAL_SETTINGS.autoIssueRewards) {
      const referrerLoyaltyInfo = referrer.loyaltyInfo || {
        tier: 'bronze' as const,
        pointsBalance: 0,
        lifetimePoints: 0,
        referralCount: 0,
        rewardsRedeemed: 0,
      };

      if (reward.type === 'points' && reward.points) {
        // Add points
        updatedReferrer = await clientsDB.update(referrer.id, {
          loyaltyInfo: {
            ...referrerLoyaltyInfo,
            tier: referrerLoyaltyInfo.tier || 'bronze',
            pointsBalance: (referrerLoyaltyInfo.pointsBalance || 0) + reward.points,
            lifetimePoints: (referrerLoyaltyInfo.lifetimePoints || 0) + reward.points,
            referralCount: (referrerLoyaltyInfo.referralCount || 0) + 1,
          },
        }) || referrer;
      } else {
        // Add credit (store as a reward to be redeemed)
        await loyaltyRewardsDB.create({
          clientId: referrer.id,
          salonId: referrer.salonId,
          type: 'amount_discount',
          description: `$${reward.amount} credit for referring ${referredClient.name}`,
          value: reward.amount,
          earnedFrom: 'referral',
        });

        updatedReferrer = await clientsDB.update(referrer.id, {
          loyaltyInfo: {
            ...referrerLoyaltyInfo,
            tier: referrerLoyaltyInfo.tier || 'bronze',
            referralCount: (referrerLoyaltyInfo.referralCount || 0) + 1,
          },
        }) || referrer;
      }

      // Mark referrer reward as issued
      await referralsDB.update(referralId, { referrerRewardIssued: true });
    }

    return {
      referral: { ...completedReferral, referrerRewardIssued: true },
      referrer: updatedReferrer,
      referredClient,
    };
  }
);

/**
 * Get referral discount for a new client
 */
export const getReferralDiscount = createAsyncThunk<
  { discountPercent: number; discountAmount: number; finalAmount: number } | null,
  { clientId: string; originalAmount: number }
>(
  'clients/getReferralDiscount',
  async ({ clientId, originalAmount }) => {
    // Check if client was referred
    const referral = await referralsDB.getByReferredId(clientId);
    if (!referral) {
      return null; // No referral, no discount
    }

    // Check if this is their first appointment (discount only applies to first)
    if (referral.completedAt) {
      return null; // Already used their first-time discount
    }

    // Check if expired
    if (isReferralExpired(referral.createdAt, DEFAULT_REFERRAL_SETTINGS.expirationDays)) {
      return null; // Referral expired
    }

    // Calculate discount
    return calculateReferredDiscount(originalAmount, DEFAULT_REFERRAL_SETTINGS);
  }
);

// ==================== REVIEW REQUEST THUNKS (PRD 2.3.9) ====================

/**
 * Create a review request for a client after checkout
 */
export const createReviewRequest = createAsyncThunk<
  ReviewRequest,
  {
    salonId: string;
    clientId: string;
    clientName: string;
    clientEmail?: string;
    clientPhone?: string;
    appointmentId?: string;
    staffId?: string;
    staffName?: string;
  }
>(
  'clients/createReviewRequest',
  async (params) => {
    // Check if client can receive a review request
    const recentRequests = await reviewRequestsDB.getByClientId(params.clientId);
    if (!canRequestReview(recentRequests, DEFAULT_REVIEW_SETTINGS)) {
      throw new Error('Client has received maximum review requests this month');
    }

    // Check if a request already exists for this appointment
    if (params.appointmentId) {
      const existing = await reviewRequestsDB.getByAppointmentId(params.appointmentId);
      if (existing) {
        throw new Error('Review request already exists for this appointment');
      }
    }

    // Create review request
    const expiresAt = calculateExpirationDate(new Date()).toISOString();
    const request = await reviewRequestsDB.create({
      salonId: params.salonId,
      clientId: params.clientId,
      clientName: params.clientName,
      clientEmail: params.clientEmail,
      clientPhone: params.clientPhone,
      appointmentId: params.appointmentId,
      staffId: params.staffId,
      staffName: params.staffName,
      status: 'pending',
      sentVia: 'email',
      reminderCount: 0,
      expiresAt,
    });

    return request;
  }
);

/**
 * Send a review request (mark as sent)
 */
export const sendReviewRequest = createAsyncThunk<
  ReviewRequest,
  { requestId: string; sentVia: 'email' | 'sms' | 'both' }
>(
  'clients/sendReviewRequest',
  async ({ requestId, sentVia }) => {
    const request = await reviewRequestsDB.markSent(requestId, sentVia);
    if (!request) {
      throw new Error('Review request not found');
    }
    return request;
  }
);

/**
 * Mark review request as opened
 */
export const markReviewRequestOpened = createAsyncThunk<
  ReviewRequest,
  { requestId: string }
>(
  'clients/markReviewRequestOpened',
  async ({ requestId }) => {
    const request = await reviewRequestsDB.markOpened(requestId);
    if (!request) {
      throw new Error('Review request not found');
    }
    return request;
  }
);

/**
 * Complete a review request (when client submits review)
 */
export const completeReviewRequest = createAsyncThunk<
  { request: ReviewRequest; review: ClientReview },
  {
    requestId: string;
    rating: number;
    comment?: string;
  }
>(
  'clients/completeReviewRequest',
  async ({ requestId, rating, comment }) => {
    // Get the request
    const request = await reviewRequestsDB.getById(requestId);
    if (!request) {
      throw new Error('Review request not found');
    }

    // Create the review
    const review = await clientReviewsDB.create({
      clientId: request.clientId,
      appointmentId: request.appointmentId,
      staffId: request.staffId,
      rating,
      comment,
      platform: 'internal',
    });

    // Mark request as completed
    const completedRequest = await reviewRequestsDB.markCompleted(requestId, review.id);
    if (!completedRequest) {
      throw new Error('Failed to complete review request');
    }

    // Update client's review stats
    const client = await clientsDB.getById(request.clientId);
    if (client) {
      const allReviews = await clientReviewsDB.getByClientId(request.clientId);
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

      await clientsDB.update(request.clientId, {
        averageRating: Math.round(avgRating * 10) / 10,
        totalReviews: allReviews.length,
      });
    }

    return { request: completedRequest, review };
  }
);

/**
 * Send a reminder for an outstanding review request
 */
export const sendReviewReminder = createAsyncThunk<
  ReviewRequest,
  { requestId: string }
>(
  'clients/sendReviewReminder',
  async ({ requestId }) => {
    const request = await reviewRequestsDB.getById(requestId);
    if (!request) {
      throw new Error('Review request not found');
    }

    // Check if max reminders reached
    if (request.reminderCount >= DEFAULT_REVIEW_SETTINGS.maxReminders) {
      throw new Error('Maximum reminders already sent');
    }

    // Check if request is still active
    if (request.status === 'completed' || request.status === 'expired') {
      throw new Error('Review request is no longer active');
    }

    const updatedRequest = await reviewRequestsDB.addReminder(requestId);
    if (!updatedRequest) {
      throw new Error('Failed to add reminder');
    }

    return updatedRequest;
  }
);

/**
 * Fetch review requests for a salon
 */
export const fetchReviewRequests = createAsyncThunk<
  ReviewRequest[],
  { salonId: string; status?: 'pending' | 'sent' | 'opened' | 'completed' | 'expired' }
>(
  'clients/fetchReviewRequests',
  async ({ salonId, status }) => {
    if (status) {
      return await reviewRequestsDB.getByStatus(salonId, status);
    }
    return await reviewRequestsDB.getBySalonId(salonId);
  }
);

/**
 * Process expired review requests
 */
export const processExpiredReviewRequests = createAsyncThunk<
  number,
  { salonId: string }
>(
  'clients/processExpiredReviewRequests',
  async ({ salonId }) => {
    const expired = await reviewRequestsDB.getExpired(salonId);
    let count = 0;

    for (const request of expired) {
      await reviewRequestsDB.markExpired(request.id);
      count++;
    }

    return count;
  }
);

// ==================== SEGMENTATION THUNKS (PRD 2.3.10) ====================

/**
 * Get segment analytics for all clients
 */
export const fetchSegmentAnalytics = createAsyncThunk<
  SegmentAnalytics,
  { salonId: string }
>(
  'clients/fetchSegmentAnalytics',
  async ({ salonId }) => {
    const clients = await clientsDB.getAll(salonId);
    const customSegments = await customSegmentsDB.getActive(salonId);

    // Get analytics for default segments
    const analytics = getSegmentAnalytics(clients, DEFAULT_SEGMENT_THRESHOLDS);

    // Add custom segment counts
    for (const segment of customSegments) {
      const matchingClients = filterClientsByCustomSegment(clients, segment);
      analytics.customSegmentCounts.push({
        segment: segment.id,
        name: segment.name,
        count: matchingClients.length,
        percentage: clients.length > 0 ? (matchingClients.length / clients.length) * 100 : 0,
        color: segment.color,
      });
    }

    return analytics;
  }
);

/**
 * Filter clients by a default segment
 */
export const fetchClientsBySegment = createAsyncThunk<
  Client[],
  { salonId: string; segment: ClientSegment }
>(
  'clients/fetchClientsBySegment',
  async ({ salonId, segment }) => {
    const clients = await clientsDB.getAll(salonId);
    return filterClientsBySegment(clients, segment, DEFAULT_SEGMENT_THRESHOLDS);
  }
);

/**
 * Filter clients by a custom segment
 */
export const fetchClientsByCustomSegment = createAsyncThunk<
  Client[],
  { salonId: string; segmentId: string }
>(
  'clients/fetchClientsByCustomSegment',
  async ({ salonId, segmentId }) => {
    const segment = await customSegmentsDB.getById(segmentId);
    if (!segment) {
      throw new Error('Custom segment not found');
    }

    const clients = await clientsDB.getAll(salonId);
    return filterClientsByCustomSegment(clients, segment);
  }
);

/**
 * Create a new custom segment
 */
export const createCustomSegment = createAsyncThunk<
  CustomSegment,
  {
    salonId: string;
    name: string;
    description?: string;
    color: string;
    icon?: string;
    filters: SegmentFilterGroup;
    createdBy: string;
  }
>(
  'clients/createCustomSegment',
  async (params) => {
    // Check if segment name already exists
    const existing = await customSegmentsDB.getByName(params.salonId, params.name);
    if (existing) {
      throw new Error('A segment with this name already exists');
    }

    return await customSegmentsDB.create({
      salonId: params.salonId,
      name: params.name,
      description: params.description,
      color: params.color,
      icon: params.icon,
      filters: params.filters,
      isActive: true,
      createdBy: params.createdBy,
    });
  }
);

/**
 * Update a custom segment
 */
export const updateCustomSegment = createAsyncThunk<
  CustomSegment,
  { segmentId: string; updates: Partial<CustomSegment> }
>(
  'clients/updateCustomSegment',
  async ({ segmentId, updates }) => {
    const segment = await customSegmentsDB.update(segmentId, updates);
    if (!segment) {
      throw new Error('Custom segment not found');
    }
    return segment;
  }
);

/**
 * Delete a custom segment
 */
export const deleteCustomSegment = createAsyncThunk<
  string,
  { segmentId: string }
>(
  'clients/deleteCustomSegment',
  async ({ segmentId }) => {
    const success = await customSegmentsDB.delete(segmentId);
    if (!success) {
      throw new Error('Failed to delete custom segment');
    }
    return segmentId;
  }
);

/**
 * Fetch all custom segments for a salon
 */
export const fetchCustomSegments = createAsyncThunk<
  CustomSegment[],
  { salonId: string; activeOnly?: boolean }
>(
  'clients/fetchCustomSegments',
  async ({ salonId, activeOnly = true }) => {
    return await customSegmentsDB.getBySalonId(salonId, activeOnly);
  }
);

/**
 * Duplicate an existing custom segment
 */
export const duplicateCustomSegment = createAsyncThunk<
  CustomSegment,
  { segmentId: string; newName: string; createdBy: string }
>(
  'clients/duplicateCustomSegment',
  async ({ segmentId, newName, createdBy }) => {
    const segment = await customSegmentsDB.duplicate(segmentId, newName, createdBy);
    if (!segment) {
      throw new Error('Failed to duplicate segment');
    }
    return segment;
  }
);

/**
 * Export clients from a segment as CSV
 */
export const exportSegmentClients = createAsyncThunk<
  string,
  { salonId: string; segment?: ClientSegment; customSegmentId?: string }
>(
  'clients/exportSegmentClients',
  async ({ salonId, segment, customSegmentId }) => {
    const allClients = await clientsDB.getAll(salonId);
    let clientsToExport: Client[];

    if (customSegmentId) {
      const customSegment = await customSegmentsDB.getById(customSegmentId);
      if (!customSegment) {
        throw new Error('Custom segment not found');
      }
      clientsToExport = filterClientsByCustomSegment(allClients, customSegment);
    } else if (segment) {
      clientsToExport = filterClientsBySegment(allClients, segment, DEFAULT_SEGMENT_THRESHOLDS);
    } else {
      throw new Error('Either segment or customSegmentId must be provided');
    }

    return generateSegmentExportCsv(clientsToExport);
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

        // Update referrer in state
        const referrerIndex = state.items.findIndex(c => c.id === referrer.id);
        if (referrerIndex !== -1) {
          state.items[referrerIndex] = referrer;
        }

        // Update referred client in state
        const referredIndex = state.items.findIndex(c => c.id === referredClient.id);
        if (referredIndex !== -1) {
          state.items[referredIndex] = referredClient;
        }

        // Update selected client referrals if viewing either client
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
