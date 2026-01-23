/**
 * Identity Lookup Edge Function
 *
 * Privacy-preserving lookup of Mango ecosystem identities by hashed phone/email.
 * Returns whether a matching identity exists and if link requests can be made.
 *
 * Part of: Client Module Phase 5 - Multi-Store Client Sharing (Tier 1)
 * Reference: docs/architecture/MULTI_STORE_CLIENT_SPEC.md
 *
 * Endpoint:
 * - POST /identity-lookup - Lookup ecosystem identity
 *
 * Request body:
 * {
 *   hashedPhone?: string  - SHA-256 hash of normalized phone
 *   hashedEmail?: string  - SHA-256 hash of normalized email
 * }
 *
 * Response:
 * {
 *   exists: boolean           - Whether a matching identity was found
 *   canRequest: boolean       - Whether link request can be made (opted in)
 *   identityId?: string       - Identity ID (only if canRequest is true)
 *   linkedStoresCount?: number - Number of linked stores (only if canRequest is true)
 * }
 *
 * Privacy:
 * - Does NOT return actual client data (name, contact, etc.)
 * - Only returns existence and opt-in status
 * - identityId only returned if client has opted into ecosystem sharing
 * - All lookups are logged for audit trail
 *
 * Deploy: supabase functions deploy identity-lookup
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ==================== TYPES ====================

interface LookupRequest {
  hashedPhone?: string;
  hashedEmail?: string;
}

interface LookupResponse {
  exists: boolean;
  canRequest: boolean;
  identityId?: string;
  linkedStoresCount?: number;
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

async function handleLookup(
  supabase: SupabaseClient,
  request: LookupRequest
): Promise<Response> {
  const { hashedPhone, hashedEmail } = request;

  // Validate that at least one identifier is provided
  if (!hashedPhone && !hashedEmail) {
    return jsonResponse(
      { error: 'Either hashedPhone or hashedEmail must be provided' },
      400
    );
  }

  console.log('[identity-lookup] Lookup request:', {
    hasPhone: !!hashedPhone,
    hasEmail: !!hashedEmail,
  });

  try {
    // Build query to find matching identity
    let query = supabase
      .from('mango_identities')
      .select('id, ecosystem_opt_in, hashed_phone, hashed_email');

    // Search by hashed_phone first (most common)
    if (hashedPhone) {
      query = query.eq('hashed_phone', hashedPhone);
    } else if (hashedEmail) {
      query = query.eq('hashed_email', hashedEmail);
    }

    const { data: identity, error: identityError } = await query.maybeSingle();

    if (identityError) {
      console.error('[identity-lookup] Error querying mango_identities:', identityError);
      return jsonResponse(
        { error: 'Database error during lookup' },
        500
      );
    }

    // No matching identity found
    if (!identity) {
      console.log('[identity-lookup] No matching identity found');
      return jsonResponse({
        exists: false,
        canRequest: false,
      } as LookupResponse);
    }

    console.log('[identity-lookup] Identity found:', {
      id: identity.id,
      ecosystemOptIn: identity.ecosystem_opt_in,
    });

    // Identity exists but not opted into ecosystem sharing
    if (!identity.ecosystem_opt_in) {
      console.log('[identity-lookup] Identity exists but not opted in');
      return jsonResponse({
        exists: true,
        canRequest: false,
      } as LookupResponse);
    }

    // Identity exists and opted in - count linked stores
    const { count: linkedStoresCount, error: countError } = await supabase
      .from('linked_stores')
      .select('id', { count: 'exact', head: true })
      .eq('mango_identity_id', identity.id);

    if (countError) {
      console.error('[identity-lookup] Error counting linked stores:', countError);
      // Continue anyway - this is not critical
    }

    console.log('[identity-lookup] Identity opted in, can request link:', {
      identityId: identity.id,
      linkedStoresCount: linkedStoresCount ?? 0,
    });

    // Return identity info (client has opted in)
    return jsonResponse({
      exists: true,
      canRequest: true,
      identityId: identity.id,
      linkedStoresCount: linkedStoresCount ?? 0,
    } as LookupResponse);

  } catch (error) {
    console.error('[identity-lookup] Unexpected error:', error);
    return jsonResponse({
      error: error instanceof Error ? error.message : 'Failed to lookup identity',
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
    const body: LookupRequest = await req.json();

    return await handleLookup(supabase, body);
  } catch (error) {
    console.error('[identity-lookup] Error parsing request:', error);
    return jsonResponse({
      error: error instanceof Error ? error.message : 'Invalid request body',
    }, 400);
  }
});
