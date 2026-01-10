import { createAsyncThunk } from '@reduxjs/toolkit';
import { clientsDB, patchTestsDB, formResponsesDB, referralsDB, clientReviewsDB, loyaltyRewardsDB, reviewRequestsDB, customSegmentsDB } from '../../../db/database';
import { dataService } from '../../../services/dataService';
import { auditLogger } from '../../../services/audit/auditLogger';
import type {
  Client,
  ClientFilters,
  ClientSortOptions,
  BlockReason,
  PatchTest,
  Referral,
  ClientReview,
  LoyaltyReward,
  ReviewRequest,
  CustomSegment,
  ClientSegment,
  SegmentAnalytics,
  SegmentFilterGroup,
} from '../../../types';
import type { EarnPointsInput, LoyaltyCalculationResult } from '../../../types/loyalty';
import {
  calculateLoyaltyEarnings,
  buildUpdatedLoyaltyInfo,
  buildLoyaltyInfoAfterRedemption,
} from '../../../utils/loyaltyCalculations';
import {
  generateReferralCode,
  calculateReferrerReward,
  calculateReferredDiscount,
  isReferralExpired,
  DEFAULT_REFERRAL_SETTINGS,
} from '../../../constants/referralConfig';
import {
  DEFAULT_REVIEW_SETTINGS,
  canRequestReview,
  calculateExpirationDate,
} from '../../../constants/reviewConfig';
import {
  DEFAULT_SEGMENT_THRESHOLDS,
  getSegmentAnalytics,
  filterClientsBySegment,
  filterClientsByCustomSegment,
  generateSegmentExportCsv,
} from '../../../constants/segmentationConfig';
import { initialFilters, initialSort } from './types';

// ==================== SUPABASE THUNKS (Phase 6) ====================

export const fetchClientsFromSupabase = createAsyncThunk(
  'clients/fetchFromSupabase',
  async () => {
    return await dataService.clients.getAll();
  }
);

export const searchClientsFromSupabase = createAsyncThunk(
  'clients/searchFromSupabase',
  async (query: string) => {
    return await dataService.clients.search(query);
  }
);

export const fetchClientByIdFromSupabase = createAsyncThunk(
  'clients/fetchByIdFromSupabase',
  async (clientId: string) => {
    const client = await dataService.clients.getById(clientId);
    if (!client) throw new Error('Client not found');
    return client;
  }
);

export const createClientInSupabase = createAsyncThunk(
  'clients/createInSupabase',
  async (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    const created = await dataService.clients.create(client);

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

export const updateClientInSupabase = createAsyncThunk(
  'clients/updateInSupabase',
  async ({ id, updates }: { id: string; updates: Partial<Client> }) => {
    const updated = await dataService.clients.update(id, updates);
    if (!updated) throw new Error('Failed to update client');

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

export const deleteClientInSupabase = createAsyncThunk(
  'clients/deleteInSupabase',
  async (id: string, { getState }) => {
    const state = getState() as { clients: { items: Client[] } };
    const client = state.clients.items.find(c => c.id === id);

    await dataService.clients.delete(id);

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

export const fetchClients = createAsyncThunk(
  'clients/fetchClients',
  async ({
    storeId,
    filters,
    sort,
    page = 1,
    pageSize = 50,
  }: {
    storeId: string;
    filters?: ClientFilters;
    sort?: ClientSortOptions;
    page?: number;
    pageSize?: number;
  }) => {
    const offset = (page - 1) * pageSize;
    const result = await clientsDB.getFiltered(
      storeId,
      filters || initialFilters,
      sort || initialSort,
      pageSize,
      offset
    );
    return result;
  }
);

export const searchClients = createAsyncThunk(
  'clients/search',
  async ({ storeId, query }: { storeId: string; query: string }) => {
    return await clientsDB.search(storeId, query);
  }
);

export const fetchClientStats = createAsyncThunk(
  'clients/fetchStats',
  async (storeId: string) => {
    return await clientsDB.getStats(storeId);
  }
);

export const fetchClientById = createAsyncThunk(
  'clients/fetchById',
  async (clientId: string) => {
    const client = await clientsDB.getById(clientId);
    if (!client) throw new Error('Client not found');
    return client;
  }
);

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

export const createClient = createAsyncThunk(
  'clients/create',
  async (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>) => {
    return await clientsDB.create(client);
  }
);

export const updateClient = createAsyncThunk(
  'clients/update',
  async ({ id, updates }: { id: string; updates: Partial<Client> }) => {
    const updated = await clientsDB.update(id, updates);
    if (!updated) throw new Error('Failed to update client');
    return updated;
  }
);

export const deleteClient = createAsyncThunk(
  'clients/delete',
  async (id: string) => {
    const success = await clientsDB.delete(id);
    if (!success) throw new Error('Failed to delete client');
    return id;
  }
);

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

export const unblockClient = createAsyncThunk(
  'clients/unblock',
  async (id: string) => {
    const updated = await clientsDB.unblock(id);
    if (!updated) throw new Error('Failed to unblock client');

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

export const clearClientStaffAlert = createAsyncThunk(
  'clients/clearStaffAlert',
  async (id: string) => {
    const updated = await clientsDB.clearStaffAlert(id);
    if (!updated) throw new Error('Failed to clear staff alert');
    return updated;
  }
);

export const setClientVipStatus = createAsyncThunk(
  'clients/setVipStatus',
  async ({ id, isVip }: { id: string; isVip: boolean }) => {
    const updated = await clientsDB.setVipStatus(id, isVip);
    if (!updated) throw new Error('Failed to update VIP status');

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

export const bulkUpdateClients = createAsyncThunk(
  'clients/bulkUpdate',
  async ({ ids, updates }: { ids: string[]; updates: Partial<Client> }) => {
    const result = await clientsDB.bulkUpdate(ids, updates);

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

export const bulkDeleteClients = createAsyncThunk(
  'clients/bulkDelete',
  async (ids: string[]) => {
    const result = await clientsDB.bulkDelete(ids);

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

export const earnLoyaltyPoints = createAsyncThunk<
  { client: Client; result: LoyaltyCalculationResult },
  EarnPointsInput
>(
  'clients/earnLoyaltyPoints',
  async (input: EarnPointsInput) => {
    const client = await clientsDB.getById(input.clientId);
    if (!client) {
      throw new Error('Client not found');
    }

    const result = calculateLoyaltyEarnings(client, input);

    if (result.pointsEarned === 0) {
      return { client, result };
    }

    const updatedLoyaltyInfo = buildUpdatedLoyaltyInfo(client.loyaltyInfo, result);

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

export const redeemLoyaltyPoints = createAsyncThunk<
  Client,
  { clientId: string; pointsToRedeem: number; transactionId?: string }
>(
  'clients/redeemLoyaltyPoints',
  async ({ clientId, pointsToRedeem }) => {
    const client = await clientsDB.getById(clientId);
    if (!client) {
      throw new Error('Client not found');
    }

    const availablePoints = client.loyaltyInfo?.pointsBalance || 0;
    if (pointsToRedeem > availablePoints) {
      throw new Error(`Insufficient points. Available: ${availablePoints}, Requested: ${pointsToRedeem}`);
    }

    const updatedLoyaltyInfo = buildLoyaltyInfoAfterRedemption(client.loyaltyInfo, pointsToRedeem);

    const updatedClient = await clientsDB.update(clientId, {
      loyaltyInfo: updatedLoyaltyInfo,
    });

    if (!updatedClient) {
      throw new Error('Failed to update client after points redemption');
    }

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

    if (client.loyaltyInfo?.referralCode) {
      return client;
    }

    const code = generateReferralCode(
      DEFAULT_REFERRAL_SETTINGS.codeFormat,
      DEFAULT_REFERRAL_SETTINGS.codeLength,
      DEFAULT_REFERRAL_SETTINGS.codePrefix,
      client.name
    );

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

export const applyReferralCode = createAsyncThunk<
  { referral: Referral; referrer: Client; newClient: Client },
  { newClientId: string; referralCode: string }
>(
  'clients/applyReferralCode',
  async ({ newClientId, referralCode }) => {
    const allClients = await clientsDB.getAll('');
    const referrer = allClients.find(c => c.loyaltyInfo?.referralCode === referralCode);

    if (!referrer) {
      throw new Error('Invalid referral code');
    }

    const newClient = await clientsDB.getById(newClientId);
    if (!newClient) {
      throw new Error('New client not found');
    }

    if (newClient.loyaltyInfo?.referredBy) {
      throw new Error('Client has already been referred');
    }

    const referral = await referralsDB.create({
      referrerClientId: referrer.id,
      referredClientId: newClientId,
      referredClientName: newClient.name,
      referralLinkCode: referralCode,
      referrerRewardIssued: false,
      referredRewardIssued: false,
    });

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

export const completeReferral = createAsyncThunk<
  { referral: Referral; referrer: Client; referredClient: Client },
  { referralId: string; appointmentId: string; transactionAmount: number }
>(
  'clients/completeReferral',
  async ({ referralId, appointmentId, transactionAmount }) => {
    const referral = await referralsDB.getById(referralId);
    if (!referral) {
      throw new Error('Referral not found');
    }

    if (referral.completedAt) {
      throw new Error('Referral already completed');
    }

    if (isReferralExpired(referral.createdAt, DEFAULT_REFERRAL_SETTINGS.expirationDays)) {
      throw new Error('Referral has expired');
    }

    if (DEFAULT_REFERRAL_SETTINGS.minimumSpend && transactionAmount < DEFAULT_REFERRAL_SETTINGS.minimumSpend) {
      throw new Error(`Minimum spend of $${DEFAULT_REFERRAL_SETTINGS.minimumSpend} required`);
    }

    const referrer = await clientsDB.getById(referral.referrerClientId);
    const referredClient = await clientsDB.getById(referral.referredClientId);

    if (!referrer || !referredClient) {
      throw new Error('Referrer or referred client not found');
    }

    const completedReferral = await referralsDB.completeReferral(referralId, appointmentId);
    if (!completedReferral) {
      throw new Error('Failed to complete referral');
    }

    const reward = calculateReferrerReward(DEFAULT_REFERRAL_SETTINGS);

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
        await loyaltyRewardsDB.create({
          clientId: referrer.id,
          storeId: referrer.storeId,
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

      await referralsDB.update(referralId, { referrerRewardIssued: true });
    }

    return {
      referral: { ...completedReferral, referrerRewardIssued: true },
      referrer: updatedReferrer,
      referredClient,
    };
  }
);

export const getReferralDiscount = createAsyncThunk<
  { discountPercent: number; discountAmount: number; finalAmount: number } | null,
  { clientId: string; originalAmount: number }
>(
  'clients/getReferralDiscount',
  async ({ clientId, originalAmount }) => {
    const referral = await referralsDB.getByReferredId(clientId);
    if (!referral) {
      return null;
    }

    if (referral.completedAt) {
      return null;
    }

    if (isReferralExpired(referral.createdAt, DEFAULT_REFERRAL_SETTINGS.expirationDays)) {
      return null;
    }

    return calculateReferredDiscount(originalAmount, DEFAULT_REFERRAL_SETTINGS);
  }
);

// ==================== REVIEW REQUEST THUNKS (PRD 2.3.9) ====================

export const createReviewRequest = createAsyncThunk<
  ReviewRequest,
  {
    storeId: string;
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
    const recentRequests = await reviewRequestsDB.getByClientId(params.clientId);
    if (!canRequestReview(recentRequests, DEFAULT_REVIEW_SETTINGS)) {
      throw new Error('Client has received maximum review requests this month');
    }

    if (params.appointmentId) {
      const existing = await reviewRequestsDB.getByAppointmentId(params.appointmentId);
      if (existing) {
        throw new Error('Review request already exists for this appointment');
      }
    }

    const expiresAt = calculateExpirationDate(new Date()).toISOString();
    const request = await reviewRequestsDB.create({
      storeId: params.storeId,
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
    const request = await reviewRequestsDB.getById(requestId);
    if (!request) {
      throw new Error('Review request not found');
    }

    const review = await clientReviewsDB.create({
      clientId: request.clientId,
      appointmentId: request.appointmentId,
      staffId: request.staffId,
      rating,
      comment,
      platform: 'internal',
    });

    const completedRequest = await reviewRequestsDB.markCompleted(requestId, review.id);
    if (!completedRequest) {
      throw new Error('Failed to complete review request');
    }

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

    if (request.reminderCount >= DEFAULT_REVIEW_SETTINGS.maxReminders) {
      throw new Error('Maximum reminders already sent');
    }

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

export const fetchReviewRequests = createAsyncThunk<
  ReviewRequest[],
  { storeId: string; status?: 'pending' | 'sent' | 'opened' | 'completed' | 'expired' }
>(
  'clients/fetchReviewRequests',
  async ({ storeId, status }) => {
    if (status) {
      return await reviewRequestsDB.getByStatus(storeId, status);
    }
    return await reviewRequestsDB.getBySalonId(storeId);
  }
);

export const processExpiredReviewRequests = createAsyncThunk<
  number,
  { storeId: string }
>(
  'clients/processExpiredReviewRequests',
  async ({ storeId }) => {
    const expired = await reviewRequestsDB.getExpired(storeId);
    let count = 0;

    for (const request of expired) {
      await reviewRequestsDB.markExpired(request.id);
      count++;
    }

    return count;
  }
);

// ==================== SEGMENTATION THUNKS (PRD 2.3.10) ====================

export const fetchSegmentAnalytics = createAsyncThunk<
  SegmentAnalytics,
  { storeId: string }
>(
  'clients/fetchSegmentAnalytics',
  async ({ storeId }) => {
    const clients = await clientsDB.getAll(storeId);
    const customSegments = await customSegmentsDB.getActive(storeId);

    const analytics = getSegmentAnalytics(clients, DEFAULT_SEGMENT_THRESHOLDS);

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

export const fetchClientsBySegment = createAsyncThunk<
  Client[],
  { storeId: string; segment: ClientSegment }
>(
  'clients/fetchClientsBySegment',
  async ({ storeId, segment }) => {
    const clients = await clientsDB.getAll(storeId);
    return filterClientsBySegment(clients, segment, DEFAULT_SEGMENT_THRESHOLDS);
  }
);

export const fetchClientsByCustomSegment = createAsyncThunk<
  Client[],
  { storeId: string; segmentId: string }
>(
  'clients/fetchClientsByCustomSegment',
  async ({ storeId, segmentId }) => {
    const segment = await customSegmentsDB.getById(segmentId);
    if (!segment) {
      throw new Error('Custom segment not found');
    }

    const clients = await clientsDB.getAll(storeId);
    return filterClientsByCustomSegment(clients, segment);
  }
);

export const createCustomSegment = createAsyncThunk<
  CustomSegment,
  {
    storeId: string;
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
    const existing = await customSegmentsDB.getByName(params.storeId, params.name);
    if (existing) {
      throw new Error('A segment with this name already exists');
    }

    return await customSegmentsDB.create({
      storeId: params.storeId,
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

export const fetchCustomSegments = createAsyncThunk<
  CustomSegment[],
  { storeId: string; activeOnly?: boolean }
>(
  'clients/fetchCustomSegments',
  async ({ storeId, activeOnly = true }) => {
    return await customSegmentsDB.getBySalonId(storeId, activeOnly);
  }
);

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

export const exportSegmentClients = createAsyncThunk<
  string,
  { storeId: string; segment?: ClientSegment; customSegmentId?: string }
>(
  'clients/exportSegmentClients',
  async ({ storeId, segment, customSegmentId }) => {
    const allClients = await clientsDB.getAll(storeId);
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
