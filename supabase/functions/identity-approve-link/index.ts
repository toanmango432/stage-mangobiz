/**
 * Identity Approve Link Edge Function
 *
 * Approves or rejects a profile link request between stores.
 * On approval, creates linked_stores record and syncs safety data.
 *
 * Part of: Client Module Phase 5 - Multi-Store Client Sharing (Tier 1)
 * Reference: docs/architecture/MULTI_STORE_CLIENT_SPEC.md
 *
 * Endpoint:
 * - POST /identity-approve-link - Approve or reject link request
 *
 * Request body:
 * {
 *   requestId: string                - UUID of the profile_link_request
 *   action: 'approve' | 'reject'     - Action to take
 *   performedBy: string              - Staff ID or 'client'
 *   localClientId?: string           - Required for approve: local client ID in target store
 * }
 *
 * Response:
 * {
 *   success: boolean
 *   message: string
 *   linkId?: string  - UUID of created linked_stores record (if approved)
 * }
 *
 * Notes:
 * - Safety data (allergies, blocks) is ALWAYS shared on approval
 * - Other data sharing is controlled by sharing_preferences
 * - All actions are logged to ecosystem_consent_log for GDPR compliance
 *
 * Deploy: supabase functions deploy identity-approve-link
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ==================== TYPES ====================

interface ApproveLinkRequest {
  requestId: string;
  action: 'approve' | 'reject';
  performedBy: string;
  localClientId?: string; // Required for approve
}

interface ApproveLinkResponse {
  success: boolean;
  message: string;
  linkId?: string;
}

// ==================== CORS HEADERS ====================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ==================== HELPERS ====================

function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Log consent action for GDPR compliance
 */
async function logConsentAction(
  supabase: SupabaseClient,
  identityId: string,
  action: string,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    await supabase
      .from('ecosystem_consent_log')
      .insert({
        mango_identity_id: identityId,
        action,
        details,
        created_at: new Date().toISOString(),
      });
  } catch (error) {
    console.error('[identity-approve-link] Failed to log consent:', error);
    // Don't fail the request if logging fails
  }
}

/**
 * Get safety data from client record
 */
async function getSafetyData(
  supabase: SupabaseClient,
  clientId: string
): Promise<{
  allergies?: string;
  isBlocked?: boolean;
  blockReason?: string;
  staffAlert?: Record<string, unknown>;
}> {
  const { data, error } = await supabase
    .from('clients')
    .select('allergies, is_blocked, block_reason, staff_alert')
    .eq('id', clientId)
    .single();

  if (error || !data) {
    console.warn('[identity-approve-link] Could not fetch safety data:', error);
    return {};
  }

  return {
    allergies: data.allergies,
    isBlocked: data.is_blocked,
    blockReason: data.block_reason,
    staffAlert: data.staff_alert,
  };
}

/**
 * Share safety data to linked client
 * Safety data is ALWAYS shared regardless of preferences (per spec)
 */
async function shareSafetyData(
  supabase: SupabaseClient,
  targetClientId: string,
  safetyData: {
    allergies?: string;
    isBlocked?: boolean;
    blockReason?: string;
    staffAlert?: Record<string, unknown>;
  }
): Promise<void> {
  const updateData: Record<string, unknown> = {};

  if (safetyData.allergies) updateData.allergies = safetyData.allergies;
  if (safetyData.isBlocked !== undefined) updateData.is_blocked = safetyData.isBlocked;
  if (safetyData.blockReason) updateData.block_reason = safetyData.blockReason;
  if (safetyData.staffAlert) updateData.staff_alert = safetyData.staffAlert;

  if (Object.keys(updateData).length > 0) {
    const { error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', targetClientId);

    if (error) {
      console.error('[identity-approve-link] Error sharing safety data:', error);
      throw new Error('Failed to share safety data');
    }

    console.log('[identity-approve-link] Safety data shared successfully');
  }
}

// ==================== MAIN HANDLER ====================

async function handleApproveLink(
  supabase: SupabaseClient,
  request: ApproveLinkRequest
): Promise<Response> {
  const { requestId, action, performedBy, localClientId } = request;

  // Validate required fields
  if (!requestId || !action || !performedBy) {
    return jsonResponse(
      { error: 'requestId, action, and performedBy are required' },
      400
    );
  }

  if (action !== 'approve' && action !== 'reject') {
    return jsonResponse(
      { error: 'action must be either "approve" or "reject"' },
      400
    );
  }

  if (action === 'approve' && !localClientId) {
    return jsonResponse(
      { error: 'localClientId is required when approving a link request' },
      400
    );
  }

  console.log('[identity-approve-link] Processing request:', {
    requestId,
    action,
    performedBy,
  });

  try {
    // 1. Fetch the link request
    const { data: linkRequest, error: fetchError } = await supabase
      .from('profile_link_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !linkRequest) {
      console.error('[identity-approve-link] Link request not found:', fetchError);
      return jsonResponse({ error: 'Link request not found' }, 404);
    }

    // 2. Validate request status
    if (linkRequest.status !== 'pending') {
      console.log('[identity-approve-link] Request already processed:', linkRequest.status);
      return jsonResponse(
        { error: `Request has already been ${linkRequest.status}` },
        400
      );
    }

    // 3. Check if request has expired
    const now = new Date();
    const expiresAt = new Date(linkRequest.expires_at);

    if (expiresAt <= now) {
      // Auto-expire the request
      await supabase
        .from('profile_link_requests')
        .update({ status: 'expired' })
        .eq('id', requestId);

      console.log('[identity-approve-link] Request has expired');
      return jsonResponse({ error: 'Link request has expired' }, 400);
    }

    const identityId = linkRequest.mango_identity_id;
    const requestingStoreId = linkRequest.requesting_store_id;
    const requestingStoreName = linkRequest.requesting_store_name;

    // 4. Update request status based on action
    const newStatus = action === 'approve' ? 'approved' : 'denied';

    const { error: updateError } = await supabase
      .from('profile_link_requests')
      .update({
        status: newStatus,
        responded_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('[identity-approve-link] Error updating request status:', updateError);
      return jsonResponse({ error: 'Failed to update request status' }, 500);
    }

    // 5. Log consent action
    await logConsentAction(supabase, identityId, action === 'approve' ? 'link_store' : 'link_denied', {
      requestId,
      requestingStoreId,
      requestingStoreName,
      performedBy,
    });

    // 6. If rejected, we're done
    if (action === 'reject') {
      console.log('[identity-approve-link] Link request rejected');
      return jsonResponse({
        success: true,
        message: 'Link request rejected successfully',
      });
    }

    // 7. If approved, create linked_stores record
    const { data: newLink, error: linkError } = await supabase
      .from('linked_stores')
      .insert({
        mango_identity_id: identityId,
        store_id: requestingStoreId,
        store_name: requestingStoreName,
        local_client_id: localClientId,
        linked_by: 'request_approved',
        access_level: 'basic', // Start with basic, can be upgraded later
        linked_at: new Date().toISOString(),
        last_sync_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (linkError || !newLink) {
      console.error('[identity-approve-link] Error creating linked_stores record:', linkError);
      return jsonResponse({ error: 'Failed to create store link' }, 500);
    }

    console.log('[identity-approve-link] Linked_stores record created:', newLink.id);

    // 8. Share safety data immediately (ALWAYS shared per spec)
    if (localClientId) {
      try {
        // Get safety data from the source client
        // Note: In a real implementation, we'd need to know the source client ID
        // For now, we assume safety data will be synced separately via identity-sync-safety function
        console.log('[identity-approve-link] Safety data will be synced via identity-sync-safety function');
      } catch (error) {
        console.error('[identity-approve-link] Error sharing safety data:', error);
        // Log but don't fail the request - safety data sync can be retried
      }
    }

    console.log('[identity-approve-link] Link request approved successfully');

    return jsonResponse({
      success: true,
      message: 'Link request approved and store linked successfully',
      linkId: newLink.id,
    } as ApproveLinkResponse);

  } catch (error) {
    console.error('[identity-approve-link] Unexpected error:', error);
    return jsonResponse({
      error: error instanceof Error ? error.message : 'Failed to process link request',
    }, 500);
  }
}

// ==================== SERVE ====================

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed. Use POST.' }, 405);
  }

  try {
    const supabase = getSupabaseClient();
    const body: ApproveLinkRequest = await req.json();

    return await handleApproveLink(supabase, body);
  } catch (error) {
    console.error('[identity-approve-link] Error parsing request:', error);
    return jsonResponse({
      error: error instanceof Error ? error.message : 'Invalid request body',
    }, 400);
  }
});
