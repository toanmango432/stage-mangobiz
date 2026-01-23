/**
 * Identity Request Link Edge Function
 *
 * Creates a profile link request between stores with 24-hour expiration.
 * Sends notification to the client for approval.
 *
 * Part of: Client Module Phase 5 - Multi-Store Client Sharing (Tier 1)
 * Reference: docs/architecture/MULTI_STORE_CLIENT_SPEC.md
 *
 * Endpoint:
 * - POST /identity-request-link - Request profile link
 *
 * Request body:
 * {
 *   requestingStoreId: string     - UUID of store making the request
 *   requestingStoreName: string   - Name of requesting store (for display)
 *   requestingStaffId?: string    - UUID of staff member (optional)
 *   mangoIdentityId: string       - Identity ID from lookup response
 *   notificationMethod?: 'sms' | 'email' | 'both' - Default: 'sms'
 * }
 *
 * Response:
 * {
 *   success: boolean
 *   requestId: string        - UUID of the created request
 *   expiresAt: string        - ISO timestamp of expiration (24 hours)
 * }
 *
 * Notes:
 * - Prevents duplicate pending requests
 * - Automatically sets 24-hour expiration
 * - Generates secure approval token for client link
 * - Notifies client via SMS/email (future implementation)
 *
 * Deploy: supabase functions deploy identity-request-link
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ==================== TYPES ====================

interface RequestLinkRequest {
  requestingStoreId: string;
  requestingStoreName: string;
  requestingStaffId?: string;
  mangoIdentityId: string;
  notificationMethod?: 'sms' | 'email' | 'both';
}

interface RequestLinkResponse {
  success: boolean;
  requestId: string;
  expiresAt: string;
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
 * Generate secure random token for approval link
 */
function generateApprovalToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Calculate expiration timestamp (24 hours from now)
 */
function getExpirationTimestamp(): string {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24 hours
  return expiresAt.toISOString();
}

// ==================== MAIN HANDLER ====================

async function handleRequestLink(
  supabase: SupabaseClient,
  request: RequestLinkRequest
): Promise<Response> {
  const {
    requestingStoreId,
    requestingStoreName,
    requestingStaffId,
    mangoIdentityId,
    notificationMethod = 'sms',
  } = request;

  // Validate required fields
  if (!requestingStoreId || !requestingStoreName || !mangoIdentityId) {
    return jsonResponse(
      { error: 'requestingStoreId, requestingStoreName, and mangoIdentityId are required' },
      400
    );
  }

  console.log('[identity-request-link] Creating link request:', {
    requestingStoreId,
    requestingStoreName,
    mangoIdentityId,
  });

  try {
    // 1. Verify the identity exists and is opted in
    const { data: identity, error: identityError } = await supabase
      .from('mango_identities')
      .select('id, ecosystem_opt_in')
      .eq('id', mangoIdentityId)
      .single();

    if (identityError || !identity) {
      console.error('[identity-request-link] Identity not found:', identityError);
      return jsonResponse({ error: 'Identity not found' }, 404);
    }

    if (!identity.ecosystem_opt_in) {
      console.log('[identity-request-link] Identity not opted into ecosystem');
      return jsonResponse(
        { error: 'Identity has not opted into ecosystem sharing' },
        403
      );
    }

    // 2. Check if store is already linked
    const { data: existingLink, error: linkCheckError } = await supabase
      .from('linked_stores')
      .select('id')
      .eq('mango_identity_id', mangoIdentityId)
      .eq('store_id', requestingStoreId)
      .maybeSingle();

    if (linkCheckError) {
      console.error('[identity-request-link] Error checking existing link:', linkCheckError);
      return jsonResponse({ error: 'Database error' }, 500);
    }

    if (existingLink) {
      console.log('[identity-request-link] Store already linked');
      return jsonResponse(
        { error: 'Store is already linked to this identity' },
        409
      );
    }

    // 3. Check for duplicate pending requests
    const { data: pendingRequest, error: pendingCheckError } = await supabase
      .from('profile_link_requests')
      .select('id, status, expires_at')
      .eq('mango_identity_id', mangoIdentityId)
      .eq('requesting_store_id', requestingStoreId)
      .eq('status', 'pending')
      .maybeSingle();

    if (pendingCheckError) {
      console.error('[identity-request-link] Error checking pending requests:', pendingCheckError);
      return jsonResponse({ error: 'Database error' }, 500);
    }

    if (pendingRequest) {
      // Check if existing request has expired
      const now = new Date();
      const expiresAt = new Date(pendingRequest.expires_at);

      if (expiresAt > now) {
        console.log('[identity-request-link] Duplicate pending request exists');
        return jsonResponse(
          {
            error: 'A pending request already exists for this identity',
            existingRequestId: pendingRequest.id,
            expiresAt: pendingRequest.expires_at,
          },
          409
        );
      } else {
        // Auto-expire the old request
        await supabase
          .from('profile_link_requests')
          .update({ status: 'expired' })
          .eq('id', pendingRequest.id);
      }
    }

    // 4. Generate approval token and expiration
    const approvalToken = generateApprovalToken();
    const expiresAt = getExpirationTimestamp();

    // 5. Create the link request
    const { data: newRequest, error: createError } = await supabase
      .from('profile_link_requests')
      .insert({
        requesting_store_id: requestingStoreId,
        requesting_store_name: requestingStoreName,
        requesting_staff_id: requestingStaffId || null,
        mango_identity_id: mangoIdentityId,
        status: 'pending',
        approval_token: approvalToken,
        notification_method: notificationMethod,
        expires_at: expiresAt,
      })
      .select('id, expires_at')
      .single();

    if (createError || !newRequest) {
      console.error('[identity-request-link] Error creating request:', createError);
      return jsonResponse(
        { error: 'Failed to create link request' },
        500
      );
    }

    console.log('[identity-request-link] Link request created:', {
      requestId: newRequest.id,
      expiresAt: newRequest.expires_at,
    });

    // 6. TODO: Send notification to client
    // This would integrate with Twilio (SMS) or SendGrid (email)
    // For now, we just mark notification as sent
    const { error: notifyError } = await supabase
      .from('profile_link_requests')
      .update({
        notification_sent_at: new Date().toISOString(),
      })
      .eq('id', newRequest.id);

    if (notifyError) {
      console.error('[identity-request-link] Error updating notification status:', notifyError);
      // Non-critical error, continue anyway
    }

    console.log('[identity-request-link] Link request completed successfully');

    return jsonResponse({
      success: true,
      requestId: newRequest.id,
      expiresAt: newRequest.expires_at,
      approvalUrl: `${Deno.env.get('APPROVAL_BASE_URL') || 'https://mango.com'}/approve-link/${approvalToken}`,
    } as RequestLinkResponse & { approvalUrl: string });

  } catch (error) {
    console.error('[identity-request-link] Unexpected error:', error);
    return jsonResponse({
      error: error instanceof Error ? error.message : 'Failed to create link request',
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
    const body: RequestLinkRequest = await req.json();

    return await handleRequestLink(supabase, body);
  } catch (error) {
    console.error('[identity-request-link] Error parsing request:', error);
    return jsonResponse({
      error: error instanceof Error ? error.message : 'Invalid request body',
    }, 400);
  }
});
