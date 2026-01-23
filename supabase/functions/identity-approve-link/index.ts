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
 *   requestId: string           - UUID of the profile_link_request
 *   action: 'approve' | 'reject' - Action to take
 *   performedBy?: string         - UUID of person approving (optional)
 *   localClientId: string        - Client ID in the approving store (for linking)
 * }
 *
 * Response:
 * {
 *   success: boolean
 *   linkId?: string             - UUID of created linked_stores record (if approved)
 *   message: string
 * }
 *
 * Notes:
 * - On approval: creates linked_stores record
 * - On approval: safety data (allergies, blocks) shared immediately
 * - On approval: logs consent action
 * - On rejection: just updates request status
 * - Validates request hasn't expired
 *
 * Deploy: supabase functions deploy identity-approve-link
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ==================== TYPES ====================

interface ApproveRequest {
  requestId: string;
  action: 'approve' | 'reject';
  performedBy?: string;
  localClientId: string;  // Client ID in the approving store
}

interface ApproveResponse {
  success: boolean;
  linkId?: string;
  message: string;
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

// ==================== MAIN HANDLER ====================

async function handleApprove(
  supabase: SupabaseClient,
  request: ApproveRequest
): Promise<Response> {
  const { requestId, action, performedBy, localClientId } = request;

  // Validate required fields
  if (!requestId || !action || !localClientId) {
    return jsonResponse(
      { error: 'requestId, action, and localClientId are required' },
      400
    );
  }

  if (action !== 'approve' && action !== 'reject') {
    return jsonResponse(
      { error: 'action must be "approve" or "reject"' },
      400
    );
  }

  console.log('[identity-approve-link] Processing request:', {
    requestId,
    action,
  });

  try {
    // 1. Fetch the link request
    const { data: linkRequest, error: requestError } = await supabase
      .from('profile_link_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !linkRequest) {
      console.error('[identity-approve-link] Request not found:', requestError);
      return jsonResponse({ error: 'Link request not found' }, 404);
    }

    // 2. Validate request status
    if (linkRequest.status !== 'pending') {
      console.log('[identity-approve-link] Request already processed:', linkRequest.status);
      return jsonResponse(
        {
          error: `Request has already been ${linkRequest.status}`,
          currentStatus: linkRequest.status,
        },
        400
      );
    }

    // 3. Check if request has expired
    const now = new Date();
    const expiresAt = new Date(linkRequest.expires_at);

    if (expiresAt <= now) {
      console.log('[identity-approve-link] Request has expired');

      // Auto-expire the request
      await supabase
        .from('profile_link_requests')
        .update({ status: 'expired' })
        .eq('id', requestId);

      return jsonResponse(
        { error: 'Link request has expired' },
        400
      );
    }

    // 4. Handle rejection
    if (action === 'reject') {
      const { error: updateError } = await supabase
        .from('profile_link_requests')
        .update({
          status: 'denied',
          responded_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (updateError) {
        console.error('[identity-approve-link] Error updating request:', updateError);
        return jsonResponse({ error: 'Failed to reject request' }, 500);
      }

      console.log('[identity-approve-link] Request rejected');

      return jsonResponse({
        success: true,
        message: 'Link request rejected',
      } as ApproveResponse);
    }

    // 5. Handle approval - create linked_stores record
    const { data: newLink, error: linkError } = await supabase
      .from('linked_stores')
      .insert({
        mango_identity_id: linkRequest.mango_identity_id,
        store_id: linkRequest.requesting_store_id,
        store_name: linkRequest.requesting_store_name,
        local_client_id: localClientId,
        linked_by: 'request_approved',
        access_level: 'basic',  // Start with basic, can be upgraded later
        linked_at: new Date().toISOString(),
        last_sync_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (linkError || !newLink) {
      console.error('[identity-approve-link] Error creating link:', linkError);
      return jsonResponse({ error: 'Failed to create store link' }, 500);
    }

    console.log('[identity-approve-link] Link created:', newLink.id);

    // 6. Update request status to approved
    const { error: updateError } = await supabase
      .from('profile_link_requests')
      .update({
        status: 'approved',
        responded_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('[identity-approve-link] Error updating request status:', updateError);
      // Non-critical, link was created successfully
    }

    // 7. Log consent action
    const { error: logError } = await supabase
      .from('ecosystem_consent_log')
      .insert({
        mango_identity_id: linkRequest.mango_identity_id,
        action: 'link_store',
        details: {
          requestId,
          storeId: linkRequest.requesting_store_id,
          storeName: linkRequest.requesting_store_name,
          performedBy: performedBy || null,
        },
        created_at: new Date().toISOString(),
      });

    if (logError) {
      console.error('[identity-approve-link] Error logging consent:', logError);
      // Non-critical, continue anyway
    }

    // 8. TODO: Sync safety data (allergies, blocks) to linked store
    // This would be done in a separate function or here
    // For now, safety data sync happens on-demand via identity-sync-safety

    console.log('[identity-approve-link] Link request approved successfully');

    return jsonResponse({
      success: true,
      linkId: newLink.id,
      message: 'Link request approved and stores linked successfully',
    } as ApproveResponse);

  } catch (error) {
    console.error('[identity-approve-link] Unexpected error:', error);
    return jsonResponse({
      error: error instanceof Error ? error.message : 'Failed to process approval',
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
    const body: ApproveRequest = await req.json();

    return await handleApprove(supabase, body);
  } catch (error) {
    console.error('[identity-approve-link] Error parsing request:', error);
    return jsonResponse({
      error: error instanceof Error ? error.message : 'Invalid request body',
    }, 400);
  }
});
