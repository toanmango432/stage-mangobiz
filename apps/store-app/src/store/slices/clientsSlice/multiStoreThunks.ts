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
