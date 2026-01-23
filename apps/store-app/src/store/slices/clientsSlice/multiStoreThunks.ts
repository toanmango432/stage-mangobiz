/**
 * Multi-Store Client Sharing Thunks
 *
 * Redux thunks for multi-store client identity and ecosystem linking.
 * Integrates with Supabase Edge Functions for privacy-preserving operations.
 *
 * Part of: Client Module Phase 5 - Multi-Store Client Sharing
 * Reference: docs/architecture/MULTI_STORE_CLIENT_SPEC.md
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../../services/supabase/client';
import { hashPhone, hashEmail } from '../../../utils/identityHash';
import type {
  MangoIdentity,
  LinkedStore,
  ProfileLinkRequest,
  EcosystemLookupResult,
} from '../../../types/client';
import type { RootState } from '../../index';

// ==================== TYPES ====================

interface LookupEcosystemIdentityParams {
  phone?: string;
  email?: string;
}

interface RequestProfileLinkParams {
  identityId: string;
  notificationMethod?: 'sms' | 'email' | 'both';
}

interface RespondToLinkRequestParams {
  requestId: string;
  action: 'approve' | 'reject';
  localClientId?: string; // Required for approve
}

interface FetchLinkedStoresParams {
  clientId: string;
}

interface FetchSafetyProfileParams {
  identityId: string;
}

interface OptIntoEcosystemParams {
  clientId: string;
  phone: string;
  email?: string;
  sharingPreferences?: {
    basicInfo?: boolean;
    preferences?: boolean;
    visitHistory?: boolean;
    loyaltyData?: boolean;
  };
}

interface FetchLinkRequestsParams {
  type: 'incoming' | 'outgoing' | 'all';
}

interface FetchCrossLocationVisitsParams {
  clientId: string;
}

interface FetchOrgClientSharingParams {
  organizationId?: string; // If not provided, uses current store's org
}

interface UpdateOrgClientSharingParams {
  organizationId: string;
  settings: OrgClientSharingSettings;
}

interface GetOrgWideLoyaltyParams {
  clientId: string;
}

interface OrgClientSharingSettings {
  sharingMode: 'full' | 'selective' | 'isolated';
  sharedCategories: {
    profiles: boolean;
    safetyData: boolean;
    visitHistory: boolean;
    staffNotes: boolean;
    loyaltyData: boolean;
    walletData: boolean;
  };
  loyaltyScope: 'location' | 'organization';
  giftCardScope: 'location' | 'organization';
  membershipScope: 'location' | 'organization';
  allowCrossLocationBooking: boolean;
}

interface CrossLocationVisit {
  id: string;
  clientId: string;
  organizationId: string;
  homeStoreId: string;
  homeStoreName: string;
  visitingStoreId: string;
  visitingStoreName: string;
  visitDate: string;
  servicesPerformed: string[];
  totalAmount: number;
  appointmentId?: string;
  ticketId?: string;
  createdAt: string;
}

interface OrgWideLoyaltyResult {
  totalPoints: number;
  breakdown: Array<{
    storeId: string;
    storeName: string;
    points: number;
    lastEarned?: string;
  }>;
}

interface SafetyData {
  allergies: string[];
  isBlocked: boolean;
  blockReasons: string[];
  staffAlerts: Array<{
    message: string;
    createdAt: string;
    createdBy: string;
    createdByName?: string;
  }>;
  sources: Array<{
    storeId: string;
    storeName: string;
    hasAllergies: boolean;
    isBlocked: boolean;
    hasStaffAlert: boolean;
  }>;
}

// ==================== THUNKS ====================

/**
 * Lookup ecosystem identity by hashed phone/email
 * Privacy-preserving - returns only existence and opt-in status
 */
export const lookupEcosystemIdentity = createAsyncThunk<
  EcosystemLookupResult,
  LookupEcosystemIdentityParams,
  { rejectValue: string }
>(
  'clients/lookupEcosystemIdentity',
  async (params, { rejectWithValue }) => {
    try {
      const { phone, email } = params;

      // Validate at least one identifier is provided
      if (!phone && !email) {
        throw new Error('Either phone or email must be provided');
      }

      // Hash identifiers before sending to Edge Function
      const hashedPhone = phone ? await hashPhone(phone) : undefined;
      const hashedEmail = email ? await hashEmail(email) : undefined;

      // Call Edge Function
      const { data, error } = await supabase.functions.invoke('identity-lookup', {
        body: { hashedPhone, hashedEmail },
      });

      if (error) {
        console.error('[lookupEcosystemIdentity] Error:', error);
        throw error;
      }

      return data as EcosystemLookupResult;
    } catch (error) {
      console.error('[lookupEcosystemIdentity] Unexpected error:', error);
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to lookup ecosystem identity'
      );
    }
  }
);

/**
 * Request profile link between stores
 * Creates a link request with 24-hour expiration
 */
export const requestProfileLink = createAsyncThunk<
  { requestId: string; expiresAt: string },
  RequestProfileLinkParams,
  { rejectValue: string; state: RootState }
>(
  'clients/requestProfileLink',
  async (params, { getState, rejectWithValue }) => {
    try {
      const { identityId, notificationMethod = 'sms' } = params;
      const state = getState();

      // Get current store info from auth state
      const storeId = state.auth.store?.storeId;
      const storeName = state.auth.store?.storeName;
      const staffId = state.auth.member?.memberId;

      if (!storeId || !storeName) {
        throw new Error('Store information not available');
      }

      // Call Edge Function
      const { data, error } = await supabase.functions.invoke('identity-request-link', {
        body: {
          requestingStoreId: storeId,
          requestingStoreName: storeName,
          requestingStaffId: staffId,
          mangoIdentityId: identityId,
          notificationMethod,
        },
      });

      if (error) {
        console.error('[requestProfileLink] Error:', error);
        throw error;
      }

      return {
        requestId: data.requestId,
        expiresAt: data.expiresAt,
      };
    } catch (error) {
      console.error('[requestProfileLink] Unexpected error:', error);
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to request profile link'
      );
    }
  }
);

/**
 * Respond to a link request (approve or reject)
 * On approval, creates linked_stores record and syncs safety data
 */
export const respondToLinkRequest = createAsyncThunk<
  { success: boolean; linkId?: string },
  RespondToLinkRequestParams,
  { rejectValue: string; state: RootState }
>(
  'clients/respondToLinkRequest',
  async (params, { getState, rejectWithValue }) => {
    try {
      const { requestId, action, localClientId } = params;
      const state = getState();

      // Get current user (performer)
      const staffId = state.auth.member?.memberId || 'unknown';

      // Call Edge Function
      const { data, error } = await supabase.functions.invoke('identity-approve-link', {
        body: {
          requestId,
          action,
          performedBy: staffId,
          localClientId,
        },
      });

      if (error) {
        console.error('[respondToLinkRequest] Error:', error);
        throw error;
      }

      return {
        success: data.success,
        linkId: data.linkId,
      };
    } catch (error) {
      console.error('[respondToLinkRequest] Unexpected error:', error);
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to respond to link request'
      );
    }
  }
);

/**
 * Fetch all stores linked to a client's identity
 */
export const fetchLinkedStores = createAsyncThunk<
  LinkedStore[],
  FetchLinkedStoresParams,
  { rejectValue: string }
>(
  'clients/fetchLinkedStores',
  async (params, { rejectWithValue }) => {
    try {
      const { clientId } = params;

      // First, get the client's mango_identity_id
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('mango_identity_id')
        .eq('id', clientId)
        .single();

      if (clientError || !client || !client.mango_identity_id) {
        console.error('[fetchLinkedStores] Client not found or not linked to ecosystem');
        return [];
      }

      // Fetch linked stores
      const { data, error } = await supabase
        .from('linked_stores')
        .select('*')
        .eq('mango_identity_id', client.mango_identity_id);

      if (error) {
        console.error('[fetchLinkedStores] Error:', error);
        throw error;
      }

      // Convert snake_case to camelCase
      return (data || []).map((row: any) => ({
        id: row.id,
        mangoIdentityId: row.mango_identity_id,
        storeId: row.store_id,
        storeName: row.store_name,
        localClientId: row.local_client_id,
        linkedAt: row.linked_at,
        linkedBy: row.linked_by,
        accessLevel: row.access_level,
        lastSyncAt: row.last_sync_at,
      }));
    } catch (error) {
      console.error('[fetchLinkedStores] Unexpected error:', error);
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch linked stores'
      );
    }
  }
);

/**
 * Fetch unified safety profile across all linked stores
 * Safety data is ALWAYS accessible regardless of sharing preferences
 */
export const fetchSafetyProfile = createAsyncThunk<
  SafetyData,
  FetchSafetyProfileParams,
  { rejectValue: string }
>(
  'clients/fetchSafetyProfile',
  async (params, { rejectWithValue }) => {
    try {
      const { identityId } = params;

      // Call Edge Function
      const { data, error } = await supabase.functions.invoke('identity-sync-safety', {
        body: { identityId },
      });

      if (error) {
        console.error('[fetchSafetyProfile] Error:', error);
        throw error;
      }

      return data.safetyData as SafetyData;
    } catch (error) {
      console.error('[fetchSafetyProfile] Unexpected error:', error);
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch safety profile'
      );
    }
  }
);

/**
 * Opt a client into the Mango ecosystem
 * Creates mango_identity record with hashed identifiers
 */
export const optIntoEcosystem = createAsyncThunk<
  { identityId: string },
  OptIntoEcosystemParams,
  { rejectValue: string; state: RootState }
>(
  'clients/optIntoEcosystem',
  async (params, { getState, rejectWithValue }) => {
    try {
      const {
        clientId,
        phone,
        email,
        sharingPreferences = {
          basicInfo: true,
          preferences: true,
          visitHistory: false,
          loyaltyData: false,
        },
      } = params;

      const state = getState();
      const storeId = state.auth.store?.storeId;
      const storeName = state.auth.store?.storeName;

      if (!storeId || !storeName) {
        throw new Error('Store information not available');
      }

      // Hash identifiers
      const hashedPhone = await hashPhone(phone);
      const hashedEmail = email ? await hashEmail(email) : undefined;

      // Create mango_identity
      const { data: identity, error: identityError } = await supabase
        .from('mango_identities')
        .insert({
          hashed_phone: hashedPhone,
          hashed_email: hashedEmail,
          ecosystem_opt_in: true,
          opt_in_date: new Date().toISOString(),
          sharing_preferences: {
            ...sharingPreferences,
            safetyData: true, // Always true
          },
        })
        .select('id')
        .single();

      if (identityError || !identity) {
        console.error('[optIntoEcosystem] Error creating identity:', identityError);
        throw identityError || new Error('Failed to create identity');
      }

      const identityId = identity.id;

      // Create linked_stores record for current store
      const { error: linkError } = await supabase
        .from('linked_stores')
        .insert({
          mango_identity_id: identityId,
          store_id: storeId,
          store_name: storeName,
          local_client_id: clientId,
          linked_by: 'client',
          access_level: 'full',
          linked_at: new Date().toISOString(),
        });

      if (linkError) {
        console.error('[optIntoEcosystem] Error creating linked_stores:', linkError);
        throw linkError;
      }

      // Update client with mango_identity_id
      const { error: updateError } = await supabase
        .from('clients')
        .update({ mango_identity_id: identityId })
        .eq('id', clientId);

      if (updateError) {
        console.error('[optIntoEcosystem] Error updating client:', updateError);
        // Non-critical - the link still exists
      }

      // Log consent action
      await supabase
        .from('ecosystem_consent_log')
        .insert({
          mango_identity_id: identityId,
          action: 'opt_in',
          details: {
            clientId,
            storeId,
            storeName,
            sharingPreferences,
          },
          created_at: new Date().toISOString(),
        });

      return { identityId };
    } catch (error) {
      console.error('[optIntoEcosystem] Unexpected error:', error);
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to opt into ecosystem'
      );
    }
  }
);

/**
 * Fetch pending link requests for the current store
 * Returns both incoming (requests TO this store) and outgoing (requests FROM this store)
 */
export const fetchLinkRequests = createAsyncThunk<
  ProfileLinkRequest[],
  FetchLinkRequestsParams,
  { rejectValue: string; state: RootState }
>(
  'clients/fetchLinkRequests',
  async (params, { getState, rejectWithValue }) => {
    try {
      const { type } = params;
      const state = getState();
      const storeId = state.auth.store?.storeId;

      if (!storeId) {
        throw new Error('Store information not available');
      }

      let query = supabase
        .from('profile_link_requests')
        .select('*')
        .in('status', ['pending', 'approved', 'rejected']);

      // Filter by request type
      if (type === 'incoming') {
        // Requests where we need to approve - requests targeting identities linked to our store
        // We need to join with linked_stores to find which identities are linked to our store
        const { data: linkedIdentities } = await supabase
          .from('linked_stores')
          .select('mango_identity_id')
          .eq('store_id', storeId);

        const identityIds = linkedIdentities?.map(l => l.mango_identity_id) || [];

        if (identityIds.length === 0) {
          return [];
        }

        query = query
          .in('mango_identity_id', identityIds)
          .neq('requesting_store_id', storeId);
      } else if (type === 'outgoing') {
        // Requests we made to other stores
        query = query.eq('requesting_store_id', storeId);
      }
      // 'all' - no additional filter needed

      query = query.order('requested_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('[fetchLinkRequests] Error:', error);
        throw error;
      }

      // Convert snake_case to camelCase
      return (data || []).map((row: any) => ({
        id: row.id,
        requestingStoreId: row.requesting_store_id,
        requestingStoreName: row.requesting_store_name,
        requestingStaffId: row.requesting_staff_id,
        mangoIdentityId: row.mango_identity_id,
        status: row.status,
        requestedAt: row.requested_at,
        respondedAt: row.responded_at,
        expiresAt: row.expires_at,
        approvalToken: row.approval_token,
        notificationSentAt: row.notification_sent_at,
        notificationMethod: row.notification_method,
      }));
    } catch (error) {
      console.error('[fetchLinkRequests] Unexpected error:', error);
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch link requests'
      );
    }
  }
);

// ==================== ORGANIZATION-LEVEL THUNKS ====================

/**
 * Fetch cross-location visits for a client
 * Returns visits to other org locations
 */
export const fetchCrossLocationVisits = createAsyncThunk<
  CrossLocationVisit[],
  FetchCrossLocationVisitsParams,
  { rejectValue: string; state: RootState }
>(
  'clients/fetchCrossLocationVisits',
  async (params, { getState, rejectWithValue }) => {
    try {
      const { clientId } = params;
      const state = getState();
      const storeId = state.auth.store?.storeId;

      if (!storeId) {
        throw new Error('Store information not available');
      }

      // Get client's organization
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('organization_id')
        .eq('id', clientId)
        .single();

      if (clientError || !clientData?.organization_id) {
        console.error('[fetchCrossLocationVisits] Client not in organization');
        return [];
      }

      // Fetch cross-location visits
      const { data, error } = await supabase
        .from('cross_location_visits')
        .select('*')
        .eq('client_id', clientId)
        .eq('organization_id', clientData.organization_id)
        .order('visit_date', { ascending: false })
        .limit(100);

      if (error) {
        console.error('[fetchCrossLocationVisits] Error:', error);
        throw error;
      }

      // Get store names
      const storeIds = new Set<string>();
      (data || []).forEach(v => {
        storeIds.add(v.home_store_id);
        storeIds.add(v.visiting_store_id);
      });

      const { data: stores } = await supabase
        .from('stores')
        .select('id, name')
        .in('id', Array.from(storeIds));

      const storeNames: Record<string, string> = {};
      (stores || []).forEach(s => {
        storeNames[s.id] = s.name;
      });

      // Convert to camelCase
      return (data || []).map((row) => ({
        id: row.id,
        clientId: row.client_id,
        organizationId: row.organization_id,
        homeStoreId: row.home_store_id,
        homeStoreName: storeNames[row.home_store_id] || 'Unknown',
        visitingStoreId: row.visiting_store_id,
        visitingStoreName: storeNames[row.visiting_store_id] || 'Unknown',
        visitDate: row.visit_date,
        servicesPerformed: row.services_performed || [],
        totalAmount: row.total_amount || 0,
        appointmentId: row.appointment_id,
        ticketId: row.ticket_id,
        createdAt: row.created_at,
      }));
    } catch (error) {
      console.error('[fetchCrossLocationVisits] Unexpected error:', error);
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch cross-location visits'
      );
    }
  }
);

/**
 * Fetch organization client sharing settings
 */
export const fetchOrgClientSharing = createAsyncThunk<
  OrgClientSharingSettings | null,
  FetchOrgClientSharingParams,
  { rejectValue: string; state: RootState }
>(
  'clients/fetchOrgClientSharing',
  async (params, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const storeId = state.auth.store?.storeId;
      let { organizationId } = params;

      // If no org ID provided, get it from the store
      if (!organizationId) {
        if (!storeId) {
          throw new Error('Store information not available');
        }

        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select('organization_id')
          .eq('id', storeId)
          .single();

        if (storeError || !storeData?.organization_id) {
          console.log('[fetchOrgClientSharing] Store not in organization');
          return null;
        }

        organizationId = storeData.organization_id;
      }

      // Fetch organization settings
      const { data, error } = await supabase
        .from('organizations')
        .select('client_sharing_settings')
        .eq('id', organizationId)
        .single();

      if (error) {
        console.error('[fetchOrgClientSharing] Error:', error);
        throw error;
      }

      // Return settings with defaults for any missing fields
      const settings = data?.client_sharing_settings as Partial<OrgClientSharingSettings> || {};
      return {
        sharingMode: settings.sharingMode || 'isolated',
        sharedCategories: {
          profiles: settings.sharedCategories?.profiles ?? false,
          safetyData: true, // Always true
          visitHistory: settings.sharedCategories?.visitHistory ?? false,
          staffNotes: settings.sharedCategories?.staffNotes ?? false,
          loyaltyData: settings.sharedCategories?.loyaltyData ?? false,
          walletData: settings.sharedCategories?.walletData ?? false,
        },
        loyaltyScope: settings.loyaltyScope || 'location',
        giftCardScope: settings.giftCardScope || 'location',
        membershipScope: settings.membershipScope || 'location',
        allowCrossLocationBooking: settings.allowCrossLocationBooking ?? false,
      };
    } catch (error) {
      console.error('[fetchOrgClientSharing] Unexpected error:', error);
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch org client sharing settings'
      );
    }
  }
);

/**
 * Update organization client sharing settings
 * Requires owner or admin role
 */
export const updateOrgClientSharing = createAsyncThunk<
  { success: boolean },
  UpdateOrgClientSharingParams,
  { rejectValue: string; state: RootState }
>(
  'clients/updateOrgClientSharing',
  async (params, { getState, rejectWithValue }) => {
    try {
      const { organizationId, settings } = params;
      const state = getState();
      const memberRole = state.auth.member?.role;

      // Check permissions
      if (memberRole !== 'owner' && memberRole !== 'admin') {
        throw new Error('Only organization owners and admins can update sharing settings');
      }

      // Ensure safety data is always shared
      const settingsToSave = {
        ...settings,
        sharedCategories: {
          ...settings.sharedCategories,
          safetyData: true,
        },
      };

      // Update organization
      const { error } = await supabase
        .from('organizations')
        .update({ client_sharing_settings: settingsToSave })
        .eq('id', organizationId);

      if (error) {
        console.error('[updateOrgClientSharing] Error:', error);
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('[updateOrgClientSharing] Unexpected error:', error);
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to update org client sharing settings'
      );
    }
  }
);

/**
 * Get organization-wide loyalty points for a client
 * Aggregates points from all org locations
 */
export const getOrgWideLoyalty = createAsyncThunk<
  OrgWideLoyaltyResult,
  GetOrgWideLoyaltyParams,
  { rejectValue: string; state: RootState }
>(
  'clients/getOrgWideLoyalty',
  async (params, { getState, rejectWithValue }) => {
    try {
      const { clientId } = params;
      const state = getState();
      const storeId = state.auth.store?.storeId;

      if (!storeId) {
        throw new Error('Store information not available');
      }

      // Get client's organization and mango identity
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('organization_id, mango_identity_id')
        .eq('id', clientId)
        .single();

      if (clientError || !clientData) {
        throw new Error('Client not found');
      }

      // Check if org-wide loyalty is enabled
      if (clientData.organization_id) {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('client_sharing_settings')
          .eq('id', clientData.organization_id)
          .single();

        const settings = orgData?.client_sharing_settings as Partial<OrgClientSharingSettings> || {};

        if (settings.loyaltyScope !== 'organization') {
          // Return only this store's points
          const { data: localLoyalty } = await supabase
            .from('loyalty_balances')
            .select('points')
            .eq('client_id', clientId)
            .single();

          return {
            totalPoints: localLoyalty?.points || 0,
            breakdown: [{
              storeId,
              storeName: state.auth.store?.storeName || 'This Store',
              points: localLoyalty?.points || 0,
            }],
          };
        }
      }

      // Get all linked clients for this identity
      if (!clientData.mango_identity_id) {
        // Not linked to ecosystem, return local points
        const { data: localLoyalty } = await supabase
          .from('loyalty_balances')
          .select('points')
          .eq('client_id', clientId)
          .single();

        return {
          totalPoints: localLoyalty?.points || 0,
          breakdown: [{
            storeId,
            storeName: state.auth.store?.storeName || 'This Store',
            points: localLoyalty?.points || 0,
          }],
        };
      }

      // Get linked stores
      const { data: linkedStores } = await supabase
        .from('linked_stores')
        .select('store_id, store_name, local_client_id')
        .eq('mango_identity_id', clientData.mango_identity_id);

      if (!linkedStores || linkedStores.length === 0) {
        return { totalPoints: 0, breakdown: [] };
      }

      // Get loyalty balances for all linked clients
      const clientIds = linkedStores.map(ls => ls.local_client_id).filter(Boolean);

      const { data: loyaltyData } = await supabase
        .from('loyalty_balances')
        .select('client_id, points, last_earned_at')
        .in('client_id', clientIds);

      // Build breakdown
      const clientToPoints: Record<string, { points: number; lastEarned?: string }> = {};
      (loyaltyData || []).forEach(l => {
        clientToPoints[l.client_id] = {
          points: l.points || 0,
          lastEarned: l.last_earned_at,
        };
      });

      const breakdown = linkedStores.map(ls => ({
        storeId: ls.store_id,
        storeName: ls.store_name,
        points: ls.local_client_id ? (clientToPoints[ls.local_client_id]?.points || 0) : 0,
        lastEarned: ls.local_client_id ? clientToPoints[ls.local_client_id]?.lastEarned : undefined,
      }));

      const totalPoints = breakdown.reduce((sum, b) => sum + b.points, 0);

      return { totalPoints, breakdown };
    } catch (error) {
      console.error('[getOrgWideLoyalty] Unexpected error:', error);
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to get org-wide loyalty'
      );
    }
  }
);
